import React, { useEffect, useRef, useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Volume2, VolumeX, Sparkles, Sword, Cake, Heart, Flame, Wind, RotateCcw } from 'lucide-react';
import { soundManager } from '../audio/soundEffects';

interface Stage2Game2DProps {
  isCuttingMode: boolean;
  knivesCollected: number;
  totalKnives: number;
  onKnifeCollected: (count: number) => void;
  onReadyToCut: () => void;
  onCutComplete: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type?: 'sparkle' | 'heart' | 'star' | 'cream' | 'smoke' | 'confetti' | 'blow';
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  alpha: number;
  color: string;
}

export interface KnifeObject {
  id: number;
  relX: number;
  relY: number;
  collected: boolean;
}

export interface CandleObject {
  id: number;
  relX: number;
  relY: number;
  collected: boolean;
  color: string;
  stripeColor: string;
}

// Generate completely randomized, well-spaced positions for 1 knife & 3 candles across the dance room
export const createRandomStage2Items = (): { knife: KnifeObject; candles: CandleObject[] } => {
  // Safe boundaries of the playable dance floor area
  const minX = 0.16;
  const maxX = 0.84;
  const minY = 0.24;
  const maxY = 0.80;

  // Avoid spawning right on top of pig spawn point at bottom-right (~0.82, 0.78)
  const pigSpawn = { relX: 0.82, relY: 0.78 };
  // Avoid spawning directly on the cake table at center top (~0.50, 0.28)
  const cakeTable = { relX: 0.50, relY: 0.28 };

  const points: { relX: number; relY: number }[] = [];

  for (let i = 0; i < 4; i++) {
    let bestPoint = { relX: 0.5, relY: 0.5 };
    let placed = false;
    let minDist = 0.22;

    for (let attempt = 0; attempt < 160; attempt++) {
      const rx = minX + Math.random() * (maxX - minX);
      const ry = minY + Math.random() * (maxY - minY);

      // Distance from pig spawn
      if (Math.hypot(rx - pigSpawn.relX, ry - pigSpawn.relY) < 0.16) continue;
      // Distance from cake table
      if (Math.hypot(rx - cakeTable.relX, ry - cakeTable.relY) < 0.16) continue;

      // Distance from other items already placed
      const isTooClose = points.some((p) => Math.hypot(rx - p.relX, ry - p.relY) < minDist);
      if (!isTooClose) {
        bestPoint = { relX: rx, relY: ry };
        placed = true;
        break;
      }

      // Slightly reduce minimum distance if needed
      if (attempt > 100) minDist = 0.16;
    }

    if (!placed) {
      bestPoint = {
        relX: minX + Math.random() * (maxX - minX),
        relY: minY + Math.random() * (maxY - minY),
      };
    }
    points.push(bestPoint);
  }

  // Shuffle which spot gets the knife vs candles
  const shuffled = [...points].sort(() => Math.random() - 0.5);

  const knife: KnifeObject = {
    id: 1,
    relX: shuffled[0].relX,
    relY: shuffled[0].relY,
    collected: false,
  };

  const candleColors = [
    { color: '#fb7185', stripeColor: '#ffe4e6' }, // Rose Pink
    { color: '#38bdf8', stripeColor: '#e0f2fe' }, // Sky Blue
    { color: '#facc15', stripeColor: '#fef9c3' }, // Golden Yellow
  ];

  const candles: CandleObject[] = candleColors.map((col, idx) => ({
    id: idx + 1,
    relX: shuffled[idx + 1].relX,
    relY: shuffled[idx + 1].relY,
    collected: false,
    color: col.color,
    stripeColor: col.stripeColor,
  }));

  return { knife, candles };
};

interface BalloonObstacle {
  id: number;
  baseRelX: number;
  baseRelY: number;
  ampX: number;
  ampY: number;
  speed: number;
  color: string;
  accentColor: string;
  radius: number;
  active: boolean;
  respawnTimer: number;
}

interface BananaObstacle {
  id: number;
  relX: number;
  relY: number;
  active: boolean;
  respawnTimer: number;
}

export const Stage2Game2D: React.FC<Stage2Game2DProps> = ({
  isCuttingMode,
  knivesCollected,
  totalKnives,
  onKnifeCollected,
  onReadyToCut,
  onCutComplete,
  isMuted,
  onToggleMute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Ceremony Sub-state: 'none' (exploring in dark), 'blowing' (candle blow step), 'cutting' (cake slice step), 'sliced'
  const [ceremonyStep, setCeremonyStep] = useState<'none' | 'blowing' | 'cutting' | 'sliced'>('none');
  const [candlesBlown, setCandlesBlown] = useState<boolean>(false);

  // Initial random placement
  const initialItems = useRef(createRandomStage2Items());
  const knifeRef = useRef<KnifeObject>(initialItems.current.knife);
  const candlesRef = useRef<CandleObject[]>(initialItems.current.candles);

  // React state for HUD
  const [hasKnife, setHasKnife] = useState<boolean>(false);
  const [candlesCollectedCount, setCandlesCollectedCount] = useState<number>(0);
  const [playerLives, setPlayerLives] = useState(3);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const isGameOverRef = useRef(false);
  isGameOverRef.current = isGameOver;

  // Virtual D-Pad movement controller state & ref
  const dpadRef = useRef({ up: false, down: false, left: false, right: false });
  const [dpadState, setDpadState] = useState({ up: false, down: false, left: false, right: false });

  const handleDpadPress = useCallback((dir: 'up' | 'down' | 'left' | 'right', e: React.PointerEvent) => {
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore if pointer capture fails
    }
    dpadRef.current[dir] = true;
    setDpadState((prev) => ({ ...prev, [dir]: true }));
  }, []);

  const handleDpadRelease = useCallback((dir: 'up' | 'down' | 'left' | 'right', e: React.PointerEvent) => {
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore if pointer release fails
    }
    dpadRef.current[dir] = false;
    setDpadState((prev) => ({ ...prev, [dir]: false }));
  }, []);

  // Global pointer release to ensure D-Pad buttons never get stuck
  useEffect(() => {
    const handleGlobalRelease = () => {
      dpadRef.current = { up: false, down: false, left: false, right: false };
      setDpadState({ up: false, down: false, left: false, right: false });
    };
    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('pointercancel', handleGlobalRelease);
    window.addEventListener('blur', handleGlobalRelease);
    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
      window.removeEventListener('blur', handleGlobalRelease);
    };
  }, []);

  // Pig player state with flashlight cone vision (spawns at bottom-right corner facing left)
  const playerRef = useRef({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    facing: -1, // starts facing left into room from bottom-right corner
    tilt: 0,
    targetTilt: 0,
    isMoving: false,
    walkTimer: 0,
    blinkTimer: 0,
    isBlinking: false,
    // Flashlight cone angle & smoothing (points towards room center)
    lightAngle: Math.PI,
    targetLightAngle: Math.PI,
    // States & Reactions
    isDizzy: false,
    dizzyTimer: 0,
    isSlipping: false,
    slipTimer: 0,
    slipAngle: 0,
    invulnerableTimer: 0,
    isBlowingAction: false,
    lives: 3,
  });

  // Obstacles: 3 Patrolling party bomb balloons (giảm bớt bóng bay, bao quát không gian vừa phải)
  const balloonsRef = useRef<BalloonObstacle[]>([
    // Balloon 1: Patrolling North horizontal corridor
    {
      id: 1,
      baseRelX: 0.50,
      baseRelY: 0.38,
      ampX: 0.18,
      ampY: 0.04,
      speed: 1.8,
      color: '#38bdf8',
      accentColor: '#0284c7',
      radius: 18,
      active: true,
      respawnTimer: 0,
    },
    // Balloon 2: Patrolling West vertical corridor
    {
      id: 2,
      baseRelX: 0.28,
      baseRelY: 0.58,
      ampX: 0.04,
      ampY: 0.14,
      speed: 1.6,
      color: '#c084fc',
      accentColor: '#a855f7',
      radius: 18,
      active: true,
      respawnTimer: 0,
    },
    // Balloon 3: Patrolling Center-East vertical corridor
    {
      id: 3,
      baseRelX: 0.68,
      baseRelY: 0.50,
      ampX: 0.05,
      ampY: 0.14,
      speed: 1.7,
      color: '#fb7185',
      accentColor: '#f43f5e',
      radius: 18,
      active: true,
      respawnTimer: 0,
    },
  ]);

  // Obstacles: 4 Slippery banana peels placed on strategic crossing paths
  const bananasRef = useRef<BananaObstacle[]>([
    { id: 1, relX: 0.35, relY: 0.46, active: true, respawnTimer: 0 },
    { id: 2, relX: 0.65, relY: 0.46, active: true, respawnTimer: 0 },
    { id: 3, relX: 0.36, relY: 0.68, active: true, respawnTimer: 0 },
    { id: 4, relX: 0.52, relY: 0.58, active: true, respawnTimer: 0 },
  ]);

  // Visual effects
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  // Cake cutting animation state
  const cuttingStateRef = useRef({
    zoom: 1.0,
    targetZoom: 1.0,
    hasSliced: false,
    slashLine: null as { x1: number; y1: number; x2: number; y2: number } | null,
    cakeSplitOffset: 0,
  });

  // Touch detection for cutting slice
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const keysDownRef = useRef<{ [key: string]: boolean }>({});

  // Reset & replay Stage 2 when losing all 3 lives
  const handleRestartStage2 = useCallback(() => {
    // 1. Reset lives
    playerRef.current.lives = 3;
    setPlayerLives(3);
    setIsGameOver(false);
    isGameOverRef.current = false;

    // 2. Randomize items positions
    const freshItems = createRandomStage2Items();
    knifeRef.current = freshItems.knife;
    candlesRef.current = freshItems.candles;
    setHasKnife(false);
    setCandlesCollectedCount(0);
    onKnifeCollected(0);

    // 3. Reset player position & states (góc dưới bên phải)
    const canvas = canvasRef.current;
    if (canvas) {
      playerRef.current.x = canvas.clientWidth * 0.82;
      playerRef.current.y = canvas.clientHeight * 0.78;
    }
    playerRef.current.vx = 0;
    playerRef.current.vy = 0;
    playerRef.current.facing = -1;
    playerRef.current.isDizzy = false;
    playerRef.current.dizzyTimer = 0;
    playerRef.current.isSlipping = false;
    playerRef.current.slipTimer = 0;
    playerRef.current.invulnerableTimer = 1.0;
    playerRef.current.lightAngle = Math.PI;
    playerRef.current.targetLightAngle = Math.PI;

    // Reset D-pad
    dpadRef.current = { up: false, down: false, left: false, right: false };
    setDpadState({ up: false, down: false, left: false, right: false });

    // 4. Reset ceremony state
    setCeremonyStep('none');
    setCandlesBlown(false);
    cuttingStateRef.current.hasSliced = false;
    cuttingStateRef.current.slashLine = null;
    cuttingStateRef.current.cakeSplitOffset = 0;

    // 5. Reset obstacles
    bananasRef.current.forEach((b) => {
      b.active = true;
      b.respawnTimer = 0;
    });
    balloonsRef.current.forEach((b) => {
      b.active = true;
      b.respawnTimer = 0;
    });

    // 6. Clear particles & notifications
    particlesRef.current = [];
    floatingTextsRef.current = [];

    floatingTextsRef.current.push({
      id: Date.now() + 10,
      text: '💪 CHƠI LẠI MÀN 2: DÙNG NÚT ĐIỀU HƯỚNG TÌM ĐỒ NÀO! 🔦🐷✨',
      x: canvas ? canvas.clientWidth * 0.5 : 200,
      y: canvas ? canvas.clientHeight * 0.55 : 300,
      alpha: 1,
      color: '#38bdf8',
    });

    soundManager.init();
    soundManager.playCatchPositive(50);
  }, [onKnifeCollected]);

  useEffect(() => {
    if (isCuttingMode && ceremonyStep === 'none') {
      setCeremonyStep('blowing');
    }
  }, [isCuttingMode, ceremonyStep]);

  const initDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (playerRef.current.x === 0 && playerRef.current.y === 0) {
      // Heo xuất hiện từ góc dưới bên phải
      playerRef.current.x = w * 0.82;
      playerRef.current.y = h * 0.78;
      playerRef.current.facing = -1;
      playerRef.current.lightAngle = Math.PI;
      playerRef.current.targetLightAngle = Math.PI;
    }
  }, []);

  // Spawn starburst particles
  const spawnCollectBurst = (x: number, y: number, colorArr?: string[]) => {
    const colors = colorArr || ['#facc15', '#fef08a', '#ec4899', '#f43f5e', '#ffffff'];
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24 + Math.random() * 0.2;
      const speed = 2.5 + Math.random() * 4.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 0,
        maxLife: 28,
        type: i % 2 === 0 ? 'star' : 'sparkle',
      });
    }
  };



  // Start Birthday Ceremony when player has found 1 knife and 3 candles
  const handleStartCeremony = () => {
    if (ceremonyStep !== 'none') return;
    setCeremonyStep('blowing');
    cuttingStateRef.current.targetZoom = 1.35;
    soundManager.playMilestone();

    const canvas = canvasRef.current;
    if (canvas) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.4 },
        colors: ['#facc15', '#ec4899', '#38bdf8'],
      });
    }
  };

  // STEP 1: Blow Birthday Candles Action
  const handleBlowCandles = () => {
    if (candlesBlown) return;
    setCandlesBlown(true);
    soundManager.playBlowCandles();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const cakeX = canvas.clientWidth * 0.5;
    const cakeY = canvas.clientHeight * 0.48;

    // Blow smoke & wind particles
    for (let i = 0; i < 35; i++) {
      particlesRef.current.push({
        x: cakeX + (Math.random() - 0.5) * 50,
        y: cakeY - 60 + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 80,
        vy: -40 - Math.random() * 90,
        size: 5 + Math.random() * 6,
        color: i % 2 === 0 ? '#94a3b8' : '#e2e8f0',
        alpha: 0.85,
        life: 0,
        maxLife: 45,
        type: 'smoke',
      });
    }

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.45 },
      colors: ['#38bdf8', '#fb7185', '#facc15'],
    });

    floatingTextsRef.current.push({
      id: Date.now(),
      text: '✨ THỔI TẮT NẾN THÀNH CÔNG! CHUẨN BỊ CẮT BÁNH 🎂✨',
      x: cakeX,
      y: cakeY - 105,
      alpha: 1,
      color: '#38bdf8',
    });

    setTimeout(() => {
      setCeremonyStep('cutting');
      onReadyToCut();
    }, 1200);
  };

  // STEP 2: Execute Cake Slice Action
  const executeSlice = (startX?: number, startY?: number, endX?: number, endY?: number) => {
    if (cuttingStateRef.current.hasSliced) return;
    cuttingStateRef.current.hasSliced = true;
    setCeremonyStep('sliced');

    const canvas = canvasRef.current;
    if (!canvas) return;
    const cakeX = canvas.clientWidth * 0.5;
    const cakeY = canvas.clientHeight * 0.48;

    const x1 = startX ?? cakeX;
    const y1 = startY ?? cakeY - 80;
    const x2 = endX ?? cakeX;
    const y2 = endY ?? cakeY + 50;

    cuttingStateRef.current.slashLine = { x1, y1, x2, y2 };

    soundManager.playCakeSlice();
    soundManager.playCheer();

    // Spawn cream & cake crumbs burst
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40;
      const speed = 70 + Math.random() * 120;
      particlesRef.current.push({
        x: cakeX,
        y: cakeY - 10,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 5,
        color: i % 3 === 0 ? '#f43f5e' : i % 3 === 1 ? '#ffe4e6' : '#facc15',
        alpha: 1,
        life: 0,
        maxLife: 35,
        type: 'cream',
      });
    }

    confetti({
      particleCount: 120,
      spread: 95,
      origin: { y: 0.55 },
      colors: ['#f43f5e', '#ec4899', '#facc15', '#38bdf8', '#10b981'],
    });

    floatingTextsRef.current.push({
      id: Date.now() + 1,
      text: '🎉 CẮT BÁNH KEM THÀNH CÔNG! ĐANG MỞ HỘP QUÀ... 🎁',
      x: cakeX,
      y: cakeY - 110,
      alpha: 1,
      color: '#f43f5e',
    });

    setTimeout(() => {
      onCutComplete();
    }, 1300);
  };

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const resize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      initDimensions();
    };

    resize();
    window.addEventListener('resize', resize);

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const time = now * 0.001;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const cState = cuttingStateRef.current;

      // Smooth camera zoom for ceremony
      cState.zoom += (cState.targetZoom - cState.zoom) * (dt * 4);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Zoom transform centered around cake in ceremony mode
      const isCeremony = ceremonyStep !== 'none';
      const cakeX = width * 0.5;
      const cakeY = isCeremony ? height * 0.48 : height * 0.24;

      if (cState.zoom > 1.01) {
        ctx.translate(cakeX, cakeY);
        ctx.scale(cState.zoom, cState.zoom);
        ctx.translate(-cakeX, -cakeY);
      }

      // 1. Dance Floor Background with party disco tiles
      const grad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height)
      );
      grad.addColorStop(0, '#1a0d30');
      grad.addColorStop(0.6, '#0d061c');
      grad.addColorStop(1, '#060210');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Party Rug / Arena Center
      const rugW = Math.min(width * 0.92, 800);
      const rugH = Math.min(height * 0.90, 720);
      const rugX = width * 0.5 - rugW * 0.5;
      const rugY = height * 0.5 - rugH * 0.5 + 15;

      // Rug Drop Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(rugX + 10, rugY + 12, rugW, rugH, 32);
      ctx.fill();

      // Rug Base
      const rugGrad = ctx.createLinearGradient(rugX, rugY, rugX, rugY + rugH);
      rugGrad.addColorStop(0, '#22103f');
      rugGrad.addColorStop(1, '#130826');
      ctx.fillStyle = rugGrad;
      ctx.beginPath();
      ctx.roundRect(rugX, rugY, rugW, rugH, 32);
      ctx.fill();

      // Neon Border with glow
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Disco Grid
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(rugX, rugY, rugW, rugH, 32);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 44;
      for (let x = rugX; x < rugX + rugW; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, rugY);
        ctx.lineTo(x, rugY + rugH);
        ctx.stroke();
      }
      for (let y = rugY; y < rugY + rugH; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(rugX, y);
        ctx.lineTo(rugX + rugW, y);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Birthday Cake Table & 2D Birthday Cake (Positioned in center during ceremony so text does NOT overlap)
      const cakeT = time;
      const allItemsCollected = hasKnife && candlesRef.current.every((c) => c.collected);

      // Pathway to cake when all items (1 knife & 3 candles) are collected
      if (allItemsCollected && ceremonyStep === 'none') {
        ctx.save();
        const px = playerRef.current.x;
        const py = playerRef.current.y;
        const pathGrad = ctx.createLinearGradient(px, py, cakeX, cakeY + 30);
        pathGrad.addColorStop(0, 'rgba(250, 204, 21, 0.4)');
        pathGrad.addColorStop(1, 'rgba(244, 63, 94, 0.6)');
        ctx.strokeStyle = pathGrad;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.setLineDash([12, 14]);
        ctx.lineDashOffset = -time * 30;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(cakeX, cakeY + 30);
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      // Table pedestal
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(cakeX, cakeY + 38, 95, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Party Table Mat
      ctx.fillStyle = '#831843';
      ctx.beginPath();
      ctx.ellipse(cakeX, cakeY + 28, 90, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#facc15';
      ctx.stroke();

      // Golden Plate
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(cakeX, cakeY + 12, 75, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura if all items collected
      if (allItemsCollected) {
        ctx.save();
        ctx.translate(cakeX, cakeY - 20);
        ctx.rotate(time * 0.6);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.16)';
        for (let r = 0; r < 12; r++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, 115, (r * Math.PI * 2) / 12, ((r + 0.5) * Math.PI * 2) / 12);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Draw Cake Halves (supports slicing split)
      const splitOffset = cState.hasSliced ? Math.min(30, cState.cakeSplitOffset + dt * 45) : 0;
      cState.cakeSplitOffset = splitOffset;

      const drawCakeHalf = (isLeft: boolean) => {
        ctx.save();
        const dir = isLeft ? -1 : 1;
        ctx.translate(cakeX + dir * splitOffset, cakeY);

        ctx.beginPath();
        if (isLeft) {
          ctx.rect(-110, -100, 110, 140);
        } else {
          ctx.rect(0, -100, 110, 140);
        }
        ctx.clip();

        // Tier 1 (Vanilla & Strawberry Cake)
        ctx.fillStyle = '#fdf2f8';
        ctx.beginPath();
        ctx.roundRect(-60, -18, 120, 32, 6);
        ctx.fill();

        // Chocolate ganache layer
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.roundRect(-60, -22, 120, 12, 4);
        ctx.fill();

        // Strawberry band
        ctx.fillStyle = '#fb7185';
        ctx.fillRect(-58, -6, 116, 6);

        // Tier 2 (Top tier)
        ctx.fillStyle = '#ffe4e6';
        ctx.beginPath();
        ctx.roundRect(-42, -48, 84, 28, 6);
        ctx.fill();

        // Frosting swirls top
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(-40, -48, 80, 5);

        // Strawberries on tier 2
        ctx.fillStyle = '#e11d48';
        [-24, 0, 24].forEach((sx) => {
          ctx.beginPath();
          ctx.arc(sx, -53, 5.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // 3 Candles on top: Placed during ceremony or after finding candles
        const showCandlesOnCake = ceremonyStep !== 'none' || allItemsCollected;
        [-20, 0, 20].forEach((cx, idx) => {
          if (showCandlesOnCake) {
            // Candle stick
            ctx.fillStyle = idx === 0 ? '#fb7185' : idx === 1 ? '#38bdf8' : '#facc15';
            ctx.fillRect(cx - 2.5, -68, 5, 18);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx, -68);
            ctx.lineTo(cx, -72);
            ctx.stroke();

            // Candle Flames (Burning if not candlesBlown and not sliced!)
            if (!candlesBlown && !cState.hasSliced) {
              const flicker = Math.sin(cakeT * 4 + idx * 2) * 2;
              // Warm outer glow
              ctx.fillStyle = 'rgba(251, 191, 36, 0.45)';
              ctx.beginPath();
              ctx.arc(cx, -76 + flicker, 8.5, 0, Math.PI * 2);
              ctx.fill();

              // Orange teardrop
              ctx.fillStyle = '#f97316';
              ctx.beginPath();
              ctx.ellipse(cx, -76 + flicker, 3.8, 6.5, 0, 0, Math.PI * 2);
              ctx.fill();

              // Yellow flame core
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.ellipse(cx, -75 + flicker, 2.2, 4, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            // Empty candle holders waiting for candles
            ctx.fillStyle = 'rgba(254, 205, 211, 0.6)';
            ctx.beginPath();
            ctx.arc(cx, -48, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        ctx.restore();
      };

      drawCakeHalf(true);
      drawCakeHalf(false);
      ctx.restore();

      // In Ceremony Step 2: Floating Golden Knife Above Cake
      if (ceremonyStep === 'cutting' && !cState.hasSliced) {
        ctx.save();
        const knifeFloat = Math.sin(time * 5) * 6;
        ctx.translate(cakeX, cakeY - 95 + knifeFloat);
        ctx.rotate(Math.PI / 4 + Math.sin(time * 3) * 0.15);
        ctx.scale(0.85, 0.85);

        // Blade glow
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(0, -32);
        ctx.lineTo(8, -10);
        ctx.lineTo(6, 8);
        ctx.lineTo(-6, 8);
        ctx.lineTo(-8, -10);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#f59e0b';
        ctx.roundRect(-14, 8, 28, 5, 2);
        ctx.fill();

        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-4, 13, 8, 14);
        ctx.restore();
      }

      // 3. Draw Obstacles: Slippery Banana Peels 🍌
      if (ceremonyStep === 'none') {
        bananasRef.current.forEach((banana) => {
          if (!banana.active) {
            banana.respawnTimer -= dt;
            if (banana.respawnTimer <= 0) banana.active = true;
            return;
          }

          const bx = banana.relX * width;
          const by = banana.relY * height;

          ctx.save();
          ctx.translate(bx, by);

          // Floor shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.ellipse(0, 4, 14, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Banana peel curves
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1;

          [-0.6, 0.3, 1.2].forEach((ang) => {
            ctx.save();
            ctx.rotate(ang);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.quadraticCurveTo(8, -8, 14, 0);
            ctx.quadraticCurveTo(8, 2, 0, 0);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(14, 0, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });

          ctx.font = '10px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          ctx.fillText('🍌 TRƠN', 0, -12);

          ctx.restore();
        });

        // 4. Draw & Update Obstacles: Patrolling Balloons 🎈 (Chỉ hoạt động khi CHƯA nhặt đủ vật phẩm)
        if (!allItemsCollected) {
          balloonsRef.current.forEach((balloon) => {
            if (!balloon.active) {
              balloon.respawnTimer -= dt;
              if (balloon.respawnTimer <= 0) balloon.active = true;
              return;
            }

            const currentX = (balloon.baseRelX + Math.sin(time * balloon.speed + balloon.id) * balloon.ampX) * width;
            const currentY = (balloon.baseRelY + Math.cos(time * balloon.speed * 0.7 + balloon.id) * balloon.ampY) * height;

            ctx.save();
            ctx.translate(currentX, currentY);

            // Shadow on ground
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(0, 26, 12, 6, 0, 0, Math.PI * 2);
            ctx.fill();

            // Balloon string
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(0, 16);
            ctx.quadraticCurveTo(Math.sin(time * 4) * 6, 22, 0, 28);
            ctx.stroke();

            // Balloon body
            const bGrad = ctx.createRadialGradient(-5, -6, 3, 0, 0, balloon.radius);
            bGrad.addColorStop(0, '#ffffff');
            bGrad.addColorStop(0.3, balloon.color);
            bGrad.addColorStop(1, balloon.accentColor);

            ctx.fillStyle = bGrad;
            ctx.beginPath();
            ctx.ellipse(0, 0, balloon.radius * 0.9, balloon.radius * 1.1, 0, 0, Math.PI * 2);
            ctx.fill();

            // Knot
            ctx.fillStyle = balloon.accentColor;
            ctx.beginPath();
            ctx.moveTo(-3, balloon.radius * 1.05);
            ctx.lineTo(3, balloon.radius * 1.05);
            ctx.lineTo(0, balloon.radius * 1.18);
            ctx.closePath();
            ctx.fill();

            // Warning hazard symbol
            ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText('💣 NỔ', 0, 3);

            // Subtle pulsing hazard light on top of balloon
            const bPulse = Math.sin(time * 6 + balloon.id) * 0.5 + 0.5;
            ctx.fillStyle = `rgba(239, 68, 68, ${0.45 + bPulse * 0.45})`;
            ctx.beginPath();
            ctx.arc(0, -balloon.radius * 1.15, 3.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          });
        }

        // 5. Draw Collectible 1 Knife (Dao Vàng ở 1 góc phòng, KHÔNG phát sáng ngọn hải đăng trước khi rọi đèn) 🗡️
        const knife = knifeRef.current;
        if (!knife.collected) {
          const curKx = knife.relX * width;
          const curKy = knife.relY * height;
          const bob = Math.sin(time * 3.8) * 4;

          ctx.save();
          ctx.translate(curKx, curKy + bob);

          // Scaled Down Knife graphic (scale 0.62)
          ctx.save();
          ctx.scale(0.62, 0.62);

          const bladeGrad = ctx.createLinearGradient(-15, -35, 15, 10);
          bladeGrad.addColorStop(0, '#ffffff');
          bladeGrad.addColorStop(0.3, '#facc15');
          bladeGrad.addColorStop(1, '#eab308');

          ctx.fillStyle = bladeGrad;
          ctx.beginPath();
          ctx.moveTo(0, -32);
          ctx.lineTo(8, -12);
          ctx.lineTo(7, 6);
          ctx.lineTo(-7, 6);
          ctx.lineTo(-8, -12);
          ctx.closePath();
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#ca8a04';
          ctx.stroke();

          // Crossguard
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.roundRect(-14, 6, 28, 5, 2);
          ctx.fill();

          // Handle
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(-4, 11, 8, 14);

          // Pommel Gem
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, 27, 4.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore(); // finish scale

          // Label (subtle)
          ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fef08a';
          ctx.fillText('🗡️ DAO VÀNG', 0, -24);

          ctx.restore();
        }

        // 6. Draw 3 Collectible Candles in the dark 🕯️ (KHÔNG phát sáng hào quang trong tối, phải rọi đèn mới thấy)
        candlesRef.current.forEach((candle) => {
          if (candle.collected) return;
          const curCx = candle.relX * width;
          const curCy = candle.relY * height;
          const cBob = Math.sin(time * 3.5 + candle.id * 1.5) * 3;

          ctx.save();
          ctx.translate(curCx, curCy + cBob);

          // Ground shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(0, 15 - cBob, 10, 4, 0, 0, Math.PI * 2);
          ctx.fill();

          // Candle stick body
          ctx.fillStyle = candle.color;
          ctx.beginPath();
          ctx.roundRect(-4.5, -4, 9, 18, 2.5);
          ctx.fill();

          // Decorative stripes
          ctx.strokeStyle = candle.stripeColor;
          ctx.lineWidth = 1.5;
          [-1, 4, 9].forEach((sy) => {
            ctx.beginPath();
            ctx.moveTo(-4, sy);
            ctx.lineTo(4, sy + 3);
            ctx.stroke();
          });

          // Wick
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, -4);
          ctx.lineTo(0, -8);
          ctx.stroke();

          // Small Candle Flame (KHÔNG có hào quang tỏa sáng trong bóng tối)
          const flameFlicker = Math.sin(time * 6 + candle.id * 2) * 1.2;

          // Orange flame teardrop
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.ellipse(0, -11 + flameFlicker, 2.8, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Yellow inner flame core
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.ellipse(0, -10 + flameFlicker, 1.5, 2.8, 0, 0, Math.PI * 2);
          ctx.fill();

          // Label
          ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          ctx.fillText(`🕯️ NẾN #${candle.id}`, 0, -20);

          ctx.restore();
        });
      }

      // 7. Update & Draw Chú Heo Player
      const player = playerRef.current;

      // Update player timers
      if (player.dizzyTimer > 0) {
        player.dizzyTimer -= dt;
        if (player.dizzyTimer <= 0) player.isDizzy = false;
      }
      if (player.slipTimer > 0) {
        player.slipTimer -= dt;
        player.slipAngle += dt * 20;
        if (player.slipTimer <= 0) {
          player.isSlipping = false;
          player.slipAngle = 0;
        }
      }
      if (player.invulnerableTimer > 0) player.invulnerableTimer -= dt;

      // Smooth Movement physics (Nút di chuyển D-Pad trên màn hình + Bàn phím WASD / Mũi tên)
      let moveX = 0;
      let moveY = 0;
      if (ceremonyStep === 'none' && !isGameOverRef.current) {
        if (!player.isDizzy && !player.isSlipping) {
          // Virtual D-Pad buttons
          if (dpadRef.current.up) moveY -= 1;
          if (dpadRef.current.down) moveY += 1;
          if (dpadRef.current.left) moveX -= 1;
          if (dpadRef.current.right) moveX += 1;

          // Keyboard input support
          if (keysDownRef.current['ArrowUp'] || keysDownRef.current['KeyW']) moveY -= 1;
          if (keysDownRef.current['ArrowDown'] || keysDownRef.current['KeyS']) moveY += 1;
          if (keysDownRef.current['ArrowLeft'] || keysDownRef.current['KeyA']) moveX -= 1;
          if (keysDownRef.current['ArrowRight'] || keysDownRef.current['KeyD']) moveX += 1;
        }

        const moveLen = Math.hypot(moveX, moveY);
        if (moveLen > 0) {
          moveX /= moveLen;
          moveY /= moveLen;
        }

        // Determine Flashlight Cone Angle (points forward in direction of movement and keeps angle when stopped)
        if (moveLen > 0) {
          player.targetLightAngle = Math.atan2(moveY, moveX);
        }

        // Smooth shortest-arc rotation for the flashlight beam
        let diff = player.targetLightAngle - player.lightAngle;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        player.lightAngle += diff * Math.min(1, dt * 14);

        // Balanced walking speed (không lướt nhanh)
        const currentSpeed = 230;

        if (player.isSlipping) {
          player.x += player.facing * 180 * dt;
        } else if (!player.isDizzy) {
          const targetVx = moveX * currentSpeed;
          const targetVy = moveY * currentSpeed;
          player.vx += (targetVx - player.vx) * Math.min(1, dt * 16);
          player.vy += (targetVy - player.vy) * Math.min(1, dt * 16);

          player.x += player.vx * dt;
          player.y += player.vy * dt;
        }

        if (Math.abs(player.vx) > 20) {
          player.targetTilt = (player.vx / currentSpeed) * 0.15;
        } else {
          player.targetTilt = 0;
        }
        player.tilt += (player.targetTilt - player.tilt) * (dt * 12);

        // Arena boundaries
        const minX = rugX + 25;
        const maxX = rugX + rugW - 25;
        const minY = rugY + 35;
        const maxY = rugY + rugH - 35;
        player.x = Math.max(minX, Math.min(maxX, player.x));
        player.y = Math.max(minY, Math.min(maxY, player.y));

        player.isMoving = moveLen > 0 && !player.isDizzy && !player.isSlipping;
        if (player.isMoving) {
          player.walkTimer += dt * 15;
          if (moveX !== 0) player.facing = moveX > 0 ? 1 : -1;
        } else {
          player.walkTimer = 0;
        }
      } else {
        // In ceremony: place pig right beside cake, facing cake
        const targetCakePigX = cakeX - 70;
        const targetCakePigY = cakeY + 15;
        player.x += (targetCakePigX - player.x) * (dt * 5);
        player.y += (targetCakePigY - player.y) * (dt * 5);
        player.facing = 1;
        player.isMoving = false;
      }

      // Blinking eyes
      player.blinkTimer += dt;
      if (player.blinkTimer > 3.2) {
        player.isBlinking = true;
        if (player.blinkTimer > 3.35) {
          player.isBlinking = false;
          player.blinkTimer = 0;
        }
      }

      // --- Collisions in exploring mode ---
      if (ceremonyStep === 'none' && !isGameOverRef.current) {
        // Banana Collision (Quick 0.35s comical spin - chỉ khi chưa nhặt đủ đồ)
        if (!allItemsCollected && !player.isSlipping && player.invulnerableTimer <= 0) {
          bananasRef.current.forEach((banana) => {
            if (!banana.active) return;
            const bx = banana.relX * width;
            const by = banana.relY * height;
            if (Math.hypot(player.x - bx, player.y - by) < 26) {
              banana.active = false;
              banana.respawnTimer = 4.0;
              player.isSlipping = true;
              player.slipTimer = 0.35;
              player.invulnerableTimer = 1.4;
              soundManager.playSlip();
              soundManager.playPigOink();

              floatingTextsRef.current.push({
                id: Date.now() + Math.random(),
                text: 'TRƯỢT VỎ CHUỐI! 🍌 OINK!',
                x: player.x,
                y: player.y - 35,
                alpha: 1,
                color: '#facc15',
              });
            }
          });
        }

        // Balloon Collision (Pop & cute bounce - CHỈ HOẠT ĐỘNG KHI CHƯA NHẶT ĐỦ ĐỒ)
        if (!allItemsCollected && player.invulnerableTimer <= 0) {
          balloonsRef.current.forEach((balloon) => {
            if (!balloon.active) return;
            const currentX = (balloon.baseRelX + Math.sin(time * balloon.speed + balloon.id) * balloon.ampX) * width;
            const currentY = (balloon.baseRelY + Math.cos(time * balloon.speed * 0.7 + balloon.id) * balloon.ampY) * height;
            if (Math.hypot(player.x - currentX, player.y - currentY) < balloon.radius + 18) {
              balloon.active = false;
              balloon.respawnTimer = 3.5;
              player.isDizzy = true;
              player.dizzyTimer = 0.45;
              player.invulnerableTimer = 1.6;

              const knockAngle = Math.atan2(player.y - currentY, player.x - currentX);
              player.x += Math.cos(knockAngle) * 45;
              player.y += Math.sin(knockAngle) * 45;

              soundManager.playBalloonPop();
              soundManager.playPigOink();

              const nextLives = Math.max(0, player.lives - 1);
              player.lives = nextLives;
              setPlayerLives(nextLives);

              if (nextLives <= 0) {
                setIsGameOver(true);
                soundManager.playBomb();
                soundManager.playLevelFail();
                soundManager.playPigOink();

                for (let i = 0; i < 24; i++) {
                  particlesRef.current.push({
                    x: player.x,
                    y: player.y,
                    vx: (Math.random() - 0.5) * 160,
                    vy: (Math.random() - 0.5) * 160,
                    size: 5 + Math.random() * 5,
                    color: i % 2 === 0 ? '#fb7185' : '#94a3b8',
                    alpha: 1,
                    life: 0,
                    maxLife: 35,
                    type: 'smoke',
                  });
                }

                floatingTextsRef.current.push({
                  id: Date.now() + 888,
                  text: '💥 HẾT 3 MẠNG RỒI! THỬ LẠI NÀO 🔄',
                  x: player.x,
                  y: player.y - 40,
                  alpha: 1,
                  color: '#f43f5e',
                });
              } else {
                floatingTextsRef.current.push({
                  id: Date.now() + Math.random(),
                  text: `💥 BÙM! CÒN ${nextLives} TIM!`,
                  x: player.x,
                  y: player.y - 35,
                  alpha: 1,
                  color: '#fb7185',
                });
              }
            }
          });
        }

        // 1 Knife Collection (Direct touch, KHÔNG HÚT)
        if (!knifeRef.current.collected) {
          const k = knifeRef.current;
          const kx = k.relX * width;
          const ky = k.relY * height;
          if (Math.hypot(player.x - kx, player.y - ky) < 32) {
            k.collected = true;
            setHasKnife(true);
            onKnifeCollected(1);
            soundManager.playKnifePickup();
            spawnCollectBurst(kx, ky);

            floatingTextsRef.current.push({
              id: Date.now() + 101,
              text: '🗡️ ĐÃ TÌM THẤY DAO CẮT BÁNH! ✨',
              x: kx,
              y: ky - 20,
              alpha: 1,
              color: '#facc15',
            });

            if (candlesRef.current.every((c) => c.collected)) {
              // Vô hiệu hóa toàn bộ bóng nổ khi đã nhặt đủ đồ
              balloonsRef.current.forEach((b) => {
                if (b.active) {
                  b.active = false;
                  spawnCollectBurst(b.baseRelX * width, b.baseRelY * height, [b.color, '#facc15', '#ffffff']);
                }
              });
              soundManager.playMilestone();
              floatingTextsRef.current.push({
                id: Date.now() + 999,
                text: '🎉 ĐÃ TÌM ĐỦ DAO & 3 CÂY NẾN! TIẾN ĐẾN BÀN BÁNH ĐỂ THỔI NẾN! 🎂🕯️',
                x: width * 0.5,
                y: height * 0.44,
                alpha: 1,
                color: '#fde047',
              });
            }
          }
        }

        // 3 Candles Collection (Direct touch)
        candlesRef.current.forEach((candle) => {
          if (candle.collected) return;
          const cx = candle.relX * width;
          const cy = candle.relY * height;
          if (Math.hypot(player.x - cx, player.y - cy) < 30) {
            candle.collected = true;
            const newCount = candlesRef.current.filter((c) => c.collected).length;
            setCandlesCollectedCount(newCount);
            soundManager.playCandlePickup(newCount);
            spawnCollectBurst(cx, cy, [candle.color, '#fef08a', '#ffffff']);

            floatingTextsRef.current.push({
              id: Date.now() + candle.id * 10,
              text: `🕯️ ĐÃ TÌM THẤY NẾN #${candle.id} (${newCount}/3)!`,
              x: cx,
              y: cy - 20,
              alpha: 1,
              color: candle.color,
            });

            if (newCount === 3 && knifeRef.current.collected) {
              // Vô hiệu hóa toàn bộ bóng nổ khi đã nhặt đủ đồ
              balloonsRef.current.forEach((b) => {
                if (b.active) {
                  b.active = false;
                  spawnCollectBurst(b.baseRelX * width, b.baseRelY * height, [b.color, '#facc15', '#ffffff']);
                }
              });
              soundManager.playMilestone();
              floatingTextsRef.current.push({
                id: Date.now() + 999,
                text: '🎉 ĐÃ TÌM ĐỦ DAO & 3 CÂY NẾN! TIẾN ĐẾN BÀN BÁNH ĐỂ THỔI NẾN! 🎂🕯️',
                x: width * 0.5,
                y: height * 0.44,
                alpha: 1,
                color: '#fde047',
              });
            }
          }
        });

        // Proximity to Cake trigger (if both knife and 3 candles collected)
        if (
          knifeRef.current.collected &&
          candlesRef.current.every((c) => c.collected) &&
          Math.hypot(player.x - cakeX, player.y - cakeY) < 85
        ) {
          handleStartCeremony();
        }
      }



      // 9. DRAW BEAUTIFUL, FULLY EXPRESSIVE CHIBI CHÚ HEO 2D
      ctx.save();
      const px = player.x;
      const hop = player.isMoving ? Math.abs(Math.sin(player.walkTimer)) * 5 : Math.sin(time * 3) * 1.5;
      const py = player.y - hop;

      // Invulnerability flashing
      if (player.invulnerableTimer > 0 && Math.sin(time * 30) > 0) {
        ctx.globalAlpha = 0.5;
      }

      // Soft ground contact shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      const shadowW = 32 - hop * 1.5;
      ctx.ellipse(px, player.y + 18, Math.max(12, shadowW), 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.translate(px, py);
      if (player.isSlipping) {
        ctx.rotate(player.slipAngle);
      } else {
        ctx.scale(player.facing, 1);
        ctx.rotate(player.tilt);
      }

      // Curly Wiggling Tail
      ctx.save();
      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const tailWag = Math.sin(time * 9) * 4;
      ctx.moveTo(-24, 2);
      ctx.quadraticCurveTo(-34, -2 + tailWag, -30, -10 + tailWag);
      ctx.quadraticCurveTo(-24, -14 + tailWag, -27, -6 + tailWag);
      ctx.stroke();
      ctx.restore();

      // Back Trotting Feet (Left and Right)
      const legStep = Math.sin(player.walkTimer) * 5;
      ctx.fillStyle = '#db2777'; // Hooves
      ctx.beginPath();
      ctx.ellipse(-12 + legStep, 17, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(12 - legStep, 17, 5, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main Chubby Round Piggy Body
      const bodyGrad = ctx.createRadialGradient(-4, -6, 6, 0, 0, 28);
      bodyGrad.addColorStop(0, '#fff1f2');
      bodyGrad.addColorStop(0.4, '#fbcfe8');
      bodyGrad.addColorStop(0.85, '#f472b6');
      bodyGrad.addColorStop(1, '#db2777');

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, 27, 23, 0, 0, Math.PI * 2);
      ctx.fill();

      // Fluffy Left Ear
      ctx.save();
      ctx.translate(-14, -19);
      ctx.rotate(-0.35 + (player.isMoving ? Math.sin(player.walkTimer * 1.5) * 0.15 : 0));
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(-9, -13, 0, -18);
      ctx.quadraticCurveTo(8, -13, 5, 0);
      ctx.fill();
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.ellipse(1, -9, 3.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Fluffy Right Ear
      ctx.save();
      ctx.translate(14, -19);
      ctx.rotate(0.35 - (player.isMoving ? Math.sin(player.walkTimer * 1.5) * 0.15 : 0));
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(9, -13, 0, -18);
      ctx.quadraticCurveTo(-8, -13, -5, 0);
      ctx.fill();
      ctx.fillStyle = '#fda4af';
      ctx.beginPath();
      ctx.ellipse(-1, -9, 3.5, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Rosy Pink Cheeks
      ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-15, 3, 5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(15, 3, 5, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Chubby Cute Snout
      const snoutGrad = ctx.createRadialGradient(0, -1, 3, 0, 2, 12);
      snoutGrad.addColorStop(0, '#fbcfe8');
      snoutGrad.addColorStop(1, '#ec4899');
      ctx.fillStyle = snoutGrad;
      ctx.strokeStyle = '#db2777';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-10, -2, 20, 13, 6);
      ctx.fill();
      ctx.stroke();

      // Nostrils
      ctx.fillStyle = '#9d174d';
      ctx.beginPath();
      ctx.ellipse(-4.2, 4.5, 2.2, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(4.2, 4.5, 2.2, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Expressive Anime Eyes
      if (player.isDizzy) {
        ctx.strokeStyle = '#831843';
        ctx.lineWidth = 1.8;
        [-10, 10].forEach((ex) => {
          ctx.beginPath();
          ctx.arc(ex, -6, 4.5, 0, Math.PI * 1.8);
          ctx.stroke();
        });
      } else if (player.isBlinking) {
        ctx.strokeStyle = '#831843';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(-10, -5, 4, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(10, -5, 4, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      } else {
        [-10, 10].forEach((ex) => {
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.ellipse(ex, -6, 4.5, 5.5, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(ex + 1.2, -7.5, 1.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.beginPath();
          ctx.arc(ex - 1.5, -4.5, 0.9, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Party Cone Hat
      ctx.save();
      ctx.translate(0, -22);
      ctx.rotate(0.08);

      const hatGrad = ctx.createLinearGradient(-10, 0, 10, -24);
      hatGrad.addColorStop(0, '#facc15');
      hatGrad.addColorStop(0.5, '#ec4899');
      hatGrad.addColorStop(1, '#38bdf8');
      ctx.fillStyle = hatGrad;
      ctx.beginPath();
      ctx.moveTo(0, -24);
      ctx.lineTo(9, 2);
      ctx.lineTo(-9, 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -25, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.fillRect(-9.5, 0, 19, 3);
      ctx.restore();

      ctx.restore(); // Finish drawing pig

      // 10. DIRECT NATIVE DARKNESS MASK & FLASHLIGHT VISION CONE 🔦
      // Vẽ trực tiếp lên context chính bằng thuật toán Even-Odd rule, không phụ thuộc vào offscreen canvas
      // Khắc phục 100% lỗi WebKit/Safari/Mobile không hỗ trợ destination-out trên offscreen canvas khi build đưa lên GitHub Pages.
      if (ceremonyStep === 'none') {
        const plX = player.x;
        const plY = player.y - 2;
        const lightAng = player.lightAngle;
        // Focused realistic flashlight cone (requires player to explore actively and steer with D-pad)
        const visionDist = Math.max(185, Math.min(width, height) * 0.32);
        const halfFov = 0.40; // ~46 degrees focused flashlight beam
        const ambientRadius = 38;

        ctx.save();
        ctx.beginPath();
        // 1. Phủ kín toàn bộ màn hình canvas
        ctx.rect(0, 0, width, height);

        // 2. Cắt lỗ vòng tròn ánh sáng quanh chú heo (counter-clockwise: true)
        ctx.arc(plX, plY, ambientRadius, 0, Math.PI * 2, true);

        // 3. Cắt lỗ hình quạt chùm đèn pin rọi phía trước (counter-clockwise: true)
        ctx.moveTo(plX, plY);
        ctx.arc(plX, plY, visionDist, lightAng + halfFov, lightAng - halfFov, true);
        ctx.closePath();

        // 4. Nếu đã tìm đủ đồ, cắt thêm lỗ sáng quanh bàn bánh kem ở trung tâm
        if (allItemsCollected) {
          ctx.moveTo(cakeX + 135, cakeY);
          ctx.arc(cakeX, cakeY, 135, 0, Math.PI * 2, true);
        }

        // Tô màu bóng tối đêm tiệc bao trùm toàn bộ không gian ngoài tầm đèn rọi
        ctx.fillStyle = 'rgba(6, 2, 16, 0.97)';
        ctx.fill('evenodd');
        ctx.restore();

        // 5. Viền mờ gradient mềm mại quanh vòng sáng chú heo (Soft ambient shadow edge)
        ctx.save();
        const ambEdge = ctx.createRadialGradient(plX, plY, ambientRadius - 10, plX, plY, ambientRadius + 14);
        ambEdge.addColorStop(0, 'rgba(6, 2, 16, 0)');
        ambEdge.addColorStop(1, 'rgba(6, 2, 16, 0.97)');
        ctx.fillStyle = ambEdge;
        ctx.beginPath();
        ctx.arc(plX, plY, ambientRadius + 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 6. Luồng ánh sáng vàng rực của đèn pin chiếu xuyên màn đêm (Volumetric flashlight beam)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(plX, plY);
        ctx.arc(plX, plY, visionDist, lightAng - halfFov, lightAng + halfFov);
        ctx.closePath();
        const rayGrad = ctx.createRadialGradient(plX, plY, 15, plX, plY, visionDist);
        rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.22)');
        rayGrad.addColorStop(0.5, 'rgba(250, 204, 21, 0.10)');
        rayGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = rayGrad;
        ctx.fill();

        // Flashlight edge beam lines
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.20)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.restore();
      }

      // 11. UPDATE & DRAW PARTICLES (Drawn on top of darkness for brilliant vivid glow)
      for (let pIdx = particlesRef.current.length - 1; pIdx >= 0; pIdx--) {
        const pt = particlesRef.current[pIdx];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life += 1;
        pt.alpha = 1 - pt.life / pt.maxLife;

        if (pt.type === 'smoke') {
          pt.size += dt * 8;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, pt.alpha);
        ctx.fillStyle = pt.color;

        if (pt.type === 'star') {
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.life * 0.1);
          ctx.beginPath();
          for (let s = 0; s < 5; s++) {
            ctx.lineTo(
              Math.cos(((18 + s * 72) * Math.PI) / 180) * pt.size,
              -Math.sin(((18 + s * 72) * Math.PI) / 180) * pt.size
            );
            ctx.lineTo(
              Math.cos(((54 + s * 72) * Math.PI) / 180) * (pt.size * 0.5),
              -Math.sin(((54 + s * 72) * Math.PI) / 180) * (pt.size * 0.5)
            );
          }
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, Math.max(1, pt.size), 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        if (pt.life >= pt.maxLife) {
          particlesRef.current.splice(pIdx, 1);
        }
      }

      // 12. Floating Text Notifications
      for (let fIdx = floatingTextsRef.current.length - 1; fIdx >= 0; fIdx--) {
        const ft = floatingTextsRef.current[fIdx];
        ft.y -= dt * 35;
        ft.alpha -= dt * 0.9;

        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = ft.color;
        ctx.shadowColor = 'rgba(0,0,0,0.9)';
        ctx.shadowBlur = 6;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();

        if (ft.alpha <= 0) {
          floatingTextsRef.current.splice(fIdx, 1);
        }
      }

      // 13. Slash laser line in Cake Cutting Mode
      if (cState.slashLine) {
        const sl = cState.slashLine;
        ctx.save();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.moveTo(sl.x1, sl.y1);
        ctx.lineTo(sl.x2, sl.y2);
        ctx.stroke();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(sl.x1, sl.y1);
        ctx.lineTo(sl.x2, sl.y2);
        ctx.stroke();
        ctx.restore();
      }

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [ceremonyStep, candlesBlown, hasKnife, candlesCollectedCount, isGameOver]);

  // Keyboard events for Desktop players
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOverRef.current) return;
      keysDownRef.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDownRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Pointer / Touch events (Only used for candle blowing click and cake cutting slice swipe)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isGameOverRef.current || (e.target as HTMLElement).closest('button')) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now();

    touchStartRef.current = { x, y, time: now };

    if (ceremonyStep === 'blowing') {
      handleBlowCandles();
    }
  };

  const handlePointerMove = (_e: React.PointerEvent<HTMLCanvasElement>) => {
    // Screen click / drag to move is removed as requested - player steers via D-Pad
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (ceremonyStep === 'cutting' && touchStartRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;
        const dist = Math.hypot(endX - touchStartRef.current.x, endY - touchStartRef.current.y);
        // Fast swipe cuts cake
        if (dist > 30) {
          executeSlice(touchStartRef.current.x, touchStartRef.current.y, endX, endY);
        }
      }
    }
    touchStartRef.current = null;
  };

  const allItemsCollected = hasKnife && candlesCollectedCount >= 3;

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* 2D Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute inset-0 w-full h-full touch-none z-0 block cursor-default"
      />

      {/* Top HUD Overlay - Compact & Optimized (Only shown during exploration) */}
      {ceremonyStep === 'none' && (
        <div className="absolute top-0 inset-x-0 pointer-events-none z-20 flex flex-col items-center p-2.5 sm:p-4">
          <div className="w-full max-w-2xl flex flex-col items-center gap-1.5 pointer-events-auto">
            {/* Main Top Row: Stage Badge + Item Tracker + Lives + Audio */}
            <div className="w-full flex items-center justify-between gap-1.5 sm:gap-3">
              {/* Stage Title Pill */}
              <div className="px-3 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/50 backdrop-blur-md shadow-md flex items-center gap-1.5 text-amber-300 font-extrabold text-[11px] sm:text-xs shrink-0">
                <span className="text-sm">🔦</span>
                <span className="hidden sm:inline">MÀN 2:</span>
                <span>TÌM DAO &amp; 3 NẾN</span>
              </div>

              {/* Compact Items Tracker Pill */}
              <div className={`flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-full backdrop-blur-md shadow-md transition-all duration-300 ${
                allItemsCollected
                  ? 'bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-amber-950/90 border-2 border-emerald-400/80 shadow-emerald-500/20'
                  : 'bg-slate-900/90 border border-amber-400/50'
              }`}>
                {/* Knife Slot */}
                <div className="flex items-center gap-1 text-[11px] sm:text-xs font-black">
                  <span className="text-sm">🗡️</span>
                  <span className={`tabular-nums ${hasKnife ? 'text-amber-300 font-black' : 'text-slate-400 font-semibold'}`}>
                    {hasKnife ? '1/1' : '0/1'}
                  </span>
                  {hasKnife && <span className="text-emerald-400 text-[10px]">✓</span>}
                </div>

                <div className="w-px h-3.5 bg-slate-700" />

                {/* Candles Slots */}
                <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black">
                  <span className="text-sm">🕯️</span>
                  <div className="flex items-center gap-1">
                    {candlesRef.current.map((c, idx) => {
                      const isFilled = c.collected;
                      return (
                        <div
                          key={idx}
                          className={`w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-md flex items-center justify-center text-[10px] border transition-all duration-300 ${
                            isFilled
                              ? 'bg-gradient-to-br from-rose-500 to-amber-500 border-yellow-200 shadow-sm shadow-pink-500/40 scale-105'
                              : 'bg-slate-800/80 border-slate-700 opacity-40'
                          }`}
                        >
                          {isFilled ? '🔥' : '•'}
                        </div>
                      );
                    })}
                  </div>
                  <span className={`tabular-nums ${candlesCollectedCount >= 3 ? 'text-pink-300 font-black' : 'text-slate-400 font-semibold'}`}>
                    {candlesCollectedCount}/3
                  </span>
                  {candlesCollectedCount >= 3 && <span className="text-emerald-400 text-[10px]">✓</span>}
                </div>
              </div>

              {/* Lives and Mute button */}
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-900/90 border border-pink-500/40 backdrop-blur-md shadow-md">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300 ${
                        i < playerLives ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>

                <button
                  onClick={onToggleMute}
                  className="p-1.5 sm:p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-pink-300 border border-pink-500/30 backdrop-blur-md transition-all active:scale-95 shadow-md cursor-pointer"
                  title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sub Guidance Pill while exploring in the dark */}
            {!allItemsCollected && (
              <div className="px-3.5 py-1.5 rounded-full bg-purple-950/90 border border-purple-500/50 text-[10px] sm:text-[11px] text-pink-200 font-medium text-center shadow-md backdrop-blur-md max-w-lg">
                <span>
                  🔦 Dùng nút điều hướng ◀️ ▲ ▼ ▶️ để rọi đèn tìm dao &amp; 3 nến • Né <strong>bóng nổ 🎈💣</strong> &amp; <strong>vỏ chuối 🍌</strong>!
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Mute Button during ceremony */}
      {ceremonyStep !== 'none' && (
        <button
          onClick={onToggleMute}
          className="absolute top-3.5 right-3.5 z-40 p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-pink-300 border border-pink-500/30 backdrop-blur-md transition-all active:scale-95 shadow-md cursor-pointer pointer-events-auto"
          title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}

      {/* On-Screen D-Pad Movement Controller (Trong suốt, không che sàn game) */}
      {ceremonyStep === 'none' && !isGameOver && (
        <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 z-30 pointer-events-auto flex flex-col items-center select-none">
          <div className="grid grid-cols-3 gap-1.5 p-2 rounded-3xl bg-slate-950/20 backdrop-blur-[2px] border border-white/10 shadow-lg">
            {/* Row 1 */}
            <div />
            <button
              type="button"
              onPointerDown={(e) => handleDpadPress('up', e)}
              onPointerUp={(e) => handleDpadRelease('up', e)}
              onPointerLeave={(e) => handleDpadRelease('up', e)}
              onPointerCancel={(e) => handleDpadRelease('up', e)}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl transition-all border active:scale-90 touch-none select-none cursor-pointer ${
                dpadState.up
                  ? 'bg-pink-500/40 text-white border-pink-400 shadow-md shadow-pink-500/40 scale-95'
                  : 'bg-black/15 text-white/70 border-white/20 hover:bg-white/10 hover:text-white hover:border-white/40'
              }`}
              aria-label="Đi Lên"
            >
              ▲
            </button>
            <div />

            {/* Row 2 */}
            <button
              type="button"
              onPointerDown={(e) => handleDpadPress('left', e)}
              onPointerUp={(e) => handleDpadRelease('left', e)}
              onPointerLeave={(e) => handleDpadRelease('left', e)}
              onPointerCancel={(e) => handleDpadRelease('left', e)}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl transition-all border active:scale-90 touch-none select-none cursor-pointer ${
                dpadState.left
                  ? 'bg-pink-500/40 text-white border-pink-400 shadow-md shadow-pink-500/40 scale-95'
                  : 'bg-black/15 text-white/70 border-white/20 hover:bg-white/10 hover:text-white hover:border-white/40'
              }`}
              aria-label="Sang Trái"
            >
              ◀
            </button>

            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-black/10 border border-white/10 flex items-center justify-center text-lg sm:text-xl opacity-60">
              🐷
            </div>

            <button
              type="button"
              onPointerDown={(e) => handleDpadPress('right', e)}
              onPointerUp={(e) => handleDpadRelease('right', e)}
              onPointerLeave={(e) => handleDpadRelease('right', e)}
              onPointerCancel={(e) => handleDpadRelease('right', e)}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl transition-all border active:scale-90 touch-none select-none cursor-pointer ${
                dpadState.right
                  ? 'bg-pink-500/40 text-white border-pink-400 shadow-md shadow-pink-500/40 scale-95'
                  : 'bg-black/15 text-white/70 border-white/20 hover:bg-white/10 hover:text-white hover:border-white/40'
              }`}
              aria-label="Sang Phải"
            >
              ▶
            </button>

            {/* Row 3 */}
            <div />
            <button
              type="button"
              onPointerDown={(e) => handleDpadPress('down', e)}
              onPointerUp={(e) => handleDpadRelease('down', e)}
              onPointerLeave={(e) => handleDpadRelease('down', e)}
              onPointerCancel={(e) => handleDpadRelease('down', e)}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl transition-all border active:scale-90 touch-none select-none cursor-pointer ${
                dpadState.down
                  ? 'bg-pink-500/40 text-white border-pink-400 shadow-md shadow-pink-500/40 scale-95'
                  : 'bg-black/15 text-white/70 border-white/20 hover:bg-white/10 hover:text-white hover:border-white/40'
              }`}
              aria-label="Đi Xuống"
            >
              ▼
            </button>
            <div />
          </div>

          {/* Desktop keyboard hint */}
          <div className="hidden sm:block mt-1.5 px-2 py-0.5 rounded-full bg-black/20 border border-white/10 text-[10px] text-white/50 font-medium">
            WASD hoặc Phím mũi tên
          </div>
        </div>
      )}

      {/* Alert Banner & Action Button when all items collected - ĐẶT Ở CHÍNH GIỮA MÀN HÌNH THEO YÊU CẦU */}
      {allItemsCollected && ceremonyStep === 'none' && !isGameOver && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-auto max-w-sm w-[90%] sm:w-full px-3 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-full rounded-3xl bg-slate-950/85 backdrop-blur-md border-2 border-amber-400/80 p-4 sm:p-5 shadow-2xl shadow-amber-500/30 text-center flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase shadow-md shadow-pink-500/30">
              <span className="text-base animate-bounce">🎂</span>
              <span>ĐÃ ĐỦ 1 DAO &amp; 3 CÂY NẾN! ✨</span>
            </div>

            <p className="text-xs sm:text-sm text-pink-100/90 font-medium leading-relaxed">
              Tuyệt vời! Bạn đã tìm đủ đồ trong bóng tối. Bấm nút bên dưới để bắt đầu nghi thức sinh nhật:
            </p>

            <button
              onClick={handleStartCeremony}
              className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 hover:from-yellow-300 hover:to-amber-300 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider shadow-xl shadow-amber-500/50 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2.5 animate-pulse"
            >
              <Cake className="w-5 h-5 text-rose-600" />
              <span>Thổi Nến &amp; Cắt Bánh! 🎂🕯️</span>
            </button>
          </div>
        </div>
      )}


      {/* Game Over Modal when player loses all 3 lives */}
      {isGameOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 border-2 border-rose-500/60 p-6 shadow-2xl shadow-rose-500/30 text-center flex flex-col items-center pointer-events-auto">
            <div className="w-20 h-20 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-4xl mb-3 shadow-inner animate-bounce">
              🐷💫
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black tracking-wider uppercase mb-2">
              <span>💥 BỊ NỔ HẾT 3 MẠNG</span>
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-pink-200 to-amber-200">
              CHÚ HEO BỊ BÙM RỒI!
            </h3>

            <p className="text-xs sm:text-sm text-pink-200/80 mt-2 mb-6 leading-relaxed">
              Bạn đã va trúng 3 quả bóng nổ. Vị trí dao và nến sẽ được sắp xếp ngẫu nhiên lại trong bóng tối, cùng thử lại nào!
            </p>

            {/* Retry Button */}
            <button
              onClick={handleRestartStage2}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-pink-500/50 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5 animate-spin" />
              <span>Chơi Lại Màn 2 (Làm Mới Dao &amp; Nến) 🔄</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 1: CEREMONY - THỔI NẾN SINH NHẬT (Đặt trên cùng, không che bánh) */}
      {ceremonyStep === 'blowing' && (
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 sm:p-5 animate-in fade-in duration-300">
          {/* Header Card placed high up at the top with NO overlap over the cake in center */}
          <div className="w-full max-w-lg mx-auto text-center pt-2 sm:pt-4 pointer-events-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-lg shadow-pink-500/30">
              <Flame className="w-3.5 h-3.5 text-yellow-300 fill-current animate-pulse" />
              BƯỚC 1: THỔI NẾN SINH NHẬT
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-pink-200 to-yellow-300 mt-1.5 drop-shadow-md">
              🎂 ƯỚC MỘT ĐIỀU ƯỚC VÀ THỔI NẾN! ✨
            </h2>
            <p className="text-xs sm:text-sm text-pink-200/90 font-medium mt-1 max-w-md mx-auto">
              {candlesBlown
                ? '✨ Đã thổi tắt nến! Chuẩn bị cầm dao cắt bánh...'
                : 'Nhắm mắt ước một điều ước thật đẹp rồi chạm vào bánh hoặc bấm nút bên dưới!'}
            </p>
          </div>

          {/* Blow Candles Action Button at Bottom */}
          <div className="w-full max-w-md mx-auto mb-4 sm:mb-6 pointer-events-auto">
            <button
              onClick={handleBlowCandles}
              disabled={candlesBlown}
              className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider shadow-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                candlesBlown
                  ? 'bg-emerald-600 text-white opacity-90'
                  : 'bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 hover:from-amber-300 hover:to-pink-400 text-slate-950 shadow-pink-500/50 active:scale-95 animate-pulse'
              }`}
            >
              <Wind className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
              <span>
                {candlesBlown
                  ? '✨ NẾN ĐÃ TẮT! ĐANG CHUYỂN QUA CẮT BÁNH...'
                  : 'THỔI TẮT NẾN SINH NHẬT 🎂💨'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: CEREMONY - CẮT BÁNH KEM (Đặt trên cùng, không che bánh) */}
      {(ceremonyStep === 'cutting' || ceremonyStep === 'sliced') && (
        <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 sm:p-5 animate-in fade-in duration-300">
          {/* Header Card placed high up at the top with NO overlap over the cake in center */}
          <div className="w-full max-w-lg mx-auto text-center pt-2 sm:pt-4 pointer-events-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-lg shadow-pink-500/30">
              <Sword className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              BƯỚC 2: CẮT BÁNH KEM 2D
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-pink-200 to-yellow-300 mt-1.5 drop-shadow-md">
              🗡️ VUNG DAO CẮT ĐÔI BÁNH KEM! 🔪
            </h2>
            <p className="text-xs sm:text-sm text-pink-200/90 font-medium mt-1 max-w-md mx-auto">
              {cuttingStateRef.current.hasSliced
                ? '✨ Cắt bánh thành công! Đang mở hộp quà bí mật...'
                : 'Vuốt ngang màn hình qua chiếc bánh hoặc bấm nút bên dưới!'}
            </p>
          </div>

          {/* Bottom Slicing Action Button */}
          <div className="w-full max-w-md mx-auto mb-4 sm:mb-6 pointer-events-auto">
            <button
              onClick={() => executeSlice()}
              disabled={cuttingStateRef.current.hasSliced}
              className={`w-full py-3.5 sm:py-4 px-6 rounded-2xl font-black text-sm sm:text-base uppercase tracking-wider shadow-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                cuttingStateRef.current.hasSliced
                  ? 'bg-emerald-600 text-white opacity-90'
                  : 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white shadow-pink-500/50 active:scale-95 animate-pulse'
              }`}
            >
              <Sword className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-yellow-200" />
              <span>
                {cuttingStateRef.current.hasSliced
                  ? '✨ ĐÃ CẮT BÁNH! ĐANG MỞ HỘP QUÀ...'
                  : 'VUNG DAO CẮT ĐÔI BÁNH KEM 🗡️✨'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
