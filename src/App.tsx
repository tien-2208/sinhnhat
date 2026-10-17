import { useEffect, useRef, useState } from 'react';
import { GameSceneManager } from './game/threeScene';
import { GameState, FloatingText, ItemType } from './types/game';
import { GAME_ITEMS, STAGE2_REQUIRED_KNIVES } from './game/constants';
import { soundManager } from './audio/soundEffects';
import { HUD } from './components/HUD';
import { TitleScreen } from './components/TitleScreen';
import { StageTransitionModal } from './components/StageTransitionModal';
import { Stage2Game2D } from './components/Stage2Game2D';
import { BirthdayModal } from './components/BirthdayModal';
import { ItemsGuideModal } from './components/ItemsGuideModal';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const stage1ManagerRef = useRef<GameSceneManager | null>(null);

  // React State
  const [gameState, setGameState] = useState<GameState>('title');
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  // Stage 2 state
  const [knivesCollected, setKnivesCollected] = useState<number>(0);
  const totalKnives = STAGE2_REQUIRED_KNIVES;

  // Cleanup helper for Stage 1 Three.js instance
  const destroyStage1Scene = () => {
    if (stage1ManagerRef.current) {
      stage1ManagerRef.current.destroy();
      stage1ManagerRef.current = null;
    }
  };

  // 1. Initialize Stage 1 Scene Manager when in title, stage1 or stage1_clear
  useEffect(() => {
    if (!canvasMountRef.current) return;

    if (gameState === 'title' || gameState === 'stage1' || gameState === 'stage1_clear') {
      if (!stage1ManagerRef.current) {
        destroyStage1Scene();

        const handleScoreUpdate = (
          newScore: number,
          itemType: ItemType,
          points: number,
          xRatio: number
        ) => {
          setScore(newScore);

          const config = GAME_ITEMS[itemType];
          if (config.isPositive) {
            setCombo((prev) => prev + 1);
          } else {
            setCombo(0);
          }

          // Add floating feedback text: item name first, points after text
          const ptsStr = points > 0 ? `+${points}` : `${points}`;
          const newFt: FloatingText = {
            id: Date.now() + Math.random(),
            text: `${config.shortLabel} ${ptsStr}`,
            x: Math.max(0.15, Math.min(0.85, xRatio)),
            y: 65,
            color: config.color,
            isPositive: config.isPositive,
          };

          setFloatingTexts((prev) => [...prev.slice(-4), newFt]);

          setTimeout(() => {
            setFloatingTexts((prev) => prev.filter((item) => item.id !== newFt.id));
          }, 1200);
        };

        const handleStage1Victory = () => {
          setGameState('stage1_clear');
        };

        const manager = new GameSceneManager(
          canvasMountRef.current,
          handleScoreUpdate,
          handleStage1Victory
        );
        stage1ManagerRef.current = manager;
      }
    } else {
      // Free WebGL resources when leaving Stage 1
      destroyStage1Scene();
    }
  }, [gameState]);

  // Overall cleanup on unmount
  useEffect(() => {
    return () => {
      destroyStage1Scene();
    };
  }, []);

  // Stage 1 Keyboard controls listener
  useEffect(() => {
    const stage1Keys = { left: false, right: false };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Space or Enter to start from title
      if (gameState === 'title' && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        handleStartStage1();
        return;
      }

      // Stage 1 controls
      if (gameState === 'stage1') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          stage1Keys.left = true;
          stage1ManagerRef.current?.setKeyInput(true, stage1Keys.right);
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          stage1Keys.right = true;
          stage1ManagerRef.current?.setKeyInput(stage1Keys.left, true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameState === 'stage1') {
        if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
          stage1Keys.left = false;
          stage1ManagerRef.current?.setKeyInput(false, stage1Keys.right);
        }
        if (e.code === 'ArrowRight' || e.code === 'KeyD') {
          stage1Keys.right = false;
          stage1ManagerRef.current?.setKeyInput(stage1Keys.left, false);
        }
      }
    };

    const handleBlur = () => {
      stage1Keys.left = false;
      stage1Keys.right = false;
      stage1ManagerRef.current?.setKeyInput(false, false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState]);

  // Stage 1 Pointer / Touch tracking
  useEffect(() => {
    if (gameState === 'stage1') {
      const handlePointerMove = (e: PointerEvent) => {
        const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
        stage1ManagerRef.current?.setPointerTarget(normalizedX);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerdown', handlePointerMove);

      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerdown', handlePointerMove);
      };
    }
  }, [gameState]);

  // Game action triggers
  const handleStartStage1 = () => {
    setScore(0);
    setCombo(0);
    setGameState('stage1');
    soundManager.init();
    soundManager.playCatchPositive(20);
    stage1ManagerRef.current?.start();
  };

  const handleEnterStage2 = () => {
    destroyStage1Scene();
    setKnivesCollected(0);
    setGameState('stage2');
    soundManager.init();
    soundManager.playKnifePickup();
  };

  const handleRestartStage1 = () => {
    destroyStage1Scene();
    setScore(0);
    setCombo(0);
    setGameState('stage1');
  };

  const handleRestartStage2 = () => {
    destroyStage1Scene();
    setKnivesCollected(0);
    setGameState('stage2');
  };

  const handleBackToHome = () => {
    destroyStage1Scene();
    setScore(0);
    setCombo(0);
    setKnivesCollected(0);
    setGameState('title');
  };

  const handleAddTestPoints = () => {
    soundManager.init();
    soundManager.playCatchPositive(250);
    if (stage1ManagerRef.current) {
      stage1ManagerRef.current.addPoints(250);
    } else {
      const nextScore = Math.min(1000, score + 250);
      setScore(nextScore);
      if (nextScore >= 1000) {
        setGameState('stage1_clear');
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-['Plus_Jakarta_Sans',sans-serif] select-none">
      {/* 1. Stage 1 Three.js WebGL Mount Container (active during title, stage1, stage1_clear) */}
      {(gameState === 'title' || gameState === 'stage1' || gameState === 'stage1_clear') && (
        <div
          ref={canvasMountRef}
          className="absolute inset-0 z-0 touch-none w-full h-full"
        />
      )}

      {/* 2. Stage 1 HUD (Score, Progress, Milestones, Combo, Top Controls) */}
      {gameState === 'stage1' && (
        <HUD
          score={score}
          floatingTexts={floatingTexts}
          isMuted={isMuted}
          onToggleMute={() => {
            soundManager.isMuted = !isMuted;
            setIsMuted(!isMuted);
          }}
          combo={combo}
          onOpenGuide={() => setShowGuide(true)}
          onAddTestPoints={handleAddTestPoints}
        />
      )}

      {/* 3. Stage 2 2D Game (Collecting Knives & Cake Slicing in 2D) */}
      {(gameState === 'stage2' || gameState === 'stage2_cutting') && (
        <Stage2Game2D
          isCuttingMode={gameState === 'stage2_cutting'}
          knivesCollected={knivesCollected}
          totalKnives={totalKnives}
          onKnifeCollected={(count) => setKnivesCollected(count)}
          onReadyToCut={() => setGameState('stage2_cutting')}
          onCutComplete={() => setGameState('victory')}
          isMuted={isMuted}
          onToggleMute={() => {
            soundManager.isMuted = !isMuted;
            setIsMuted(!isMuted);
          }}
        />
      )}

      {/* 4. Title Screen */}
      {gameState === 'title' && <TitleScreen onStart={handleStartStage1} />}

      {/* 5. Stage 1 Completion Modal (Transition to Stage 2) */}
      {gameState === 'stage1_clear' && (
        <StageTransitionModal
          score={score}
          onEnterStage2={handleEnterStage2}
        />
      )}

      {/* 6. Birthday Celebration Victory Modal (Single button: Quay Về Trang Đầu Tiên) */}
      {gameState === 'victory' && (
        <BirthdayModal
          score={score}
          onBackToHome={handleBackToHome}
        />
      )}

      {/* 7. Scoring Guide Modal */}
      {showGuide && <ItemsGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
