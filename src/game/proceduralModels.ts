import * as THREE from 'three';
import { ItemType } from '../types/game';
import { GAME_ITEMS } from './constants';

/**
 * Creates an ultra-clear, high-contrast 2D Game Card texture for falling items.
 * 100% 2D, crystal clear, easy to read, with bold illustrations and score tags.
 */
export function create2DItemCardTexture(itemType: ItemType): THREE.CanvasTexture {
  const item = GAME_ITEMS[itemType];
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const w = canvas.width;
  const h = canvas.height;
  const r = 36;

  ctx.clearRect(0, 0, w, h);

  ctx.save();

  // 1. Outer Glow Card
  ctx.beginPath();
  ctx.roundRect(14, 14, w - 28, h - 28, r);

  // Gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  if (item.isPositive) {
    bgGrad.addColorStop(0, '#1a102f');
    bgGrad.addColorStop(0.5, '#120d22');
    bgGrad.addColorStop(1, '#231238');
  } else {
    bgGrad.addColorStop(0, '#2d0a12');
    bgGrad.addColorStop(0.5, '#19060b');
    bgGrad.addColorStop(1, '#2b0910');
  }
  ctx.fillStyle = bgGrad;
  ctx.fill();

  // Vibrant neon border
  ctx.lineWidth = 10;
  ctx.strokeStyle = item.color;
  ctx.stroke();

  // Inner subtle border
  ctx.beginPath();
  ctx.roundRect(24, 24, w - 48, h - 48, r - 10);
  ctx.lineWidth = 2;
  ctx.strokeStyle = item.isPositive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 100, 100, 0.3)';
  ctx.stroke();

  // 2. Top Score Pill
  const pillW = 340;
  const pillH = 56;
  const pillX = w / 2 - pillW / 2;
  const pillY = 32;

  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 28);
  const pillGrad = ctx.createLinearGradient(pillX, 0, pillX + pillW, 0);
  if (item.isPositive) {
    pillGrad.addColorStop(0, '#10b981'); // emerald
    pillGrad.addColorStop(0.5, item.color);
    pillGrad.addColorStop(1, '#f43f5e');
  } else {
    pillGrad.addColorStop(0, '#ef4444'); // red danger
    pillGrad.addColorStop(1, '#991b1b');
  }
  ctx.fillStyle = pillGrad;
  ctx.fill();

  // Top Score Text
  const ptsText = item.points > 0 ? `+${item.points} ĐIỂM` : `${item.points} ĐIỂM`;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(ptsText, w / 2, pillY + pillH / 2);

  // 3. Center Illustration Area
  // Draw an inner glowing disc for the illustration
  const circleRadius = 110;
  const circleY = 220;
  ctx.beginPath();
  ctx.arc(w / 2, circleY, circleRadius, 0, Math.PI * 2);
  const discGrad = ctx.createRadialGradient(w / 2, circleY, 20, w / 2, circleY, circleRadius);
  discGrad.addColorStop(0, item.isPositive ? 'rgba(236, 72, 153, 0.3)' : 'rgba(239, 68, 68, 0.3)');
  discGrad.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
  ctx.fillStyle = discGrad;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = item.color;
  ctx.stroke();

  // Draw Specific 2D Cartoon Illustration based on Item Type
  drawItemIllustration(ctx, itemType, w / 2, circleY);

  // 4. Main Item Name with points placed after text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 34px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const nameWithScore = `${item.shortLabel} ${item.points > 0 ? '+' : ''}${item.points}`;
  ctx.fillText(nameWithScore, w / 2, 380);

  // 5. Bottom Guidance Footer Bar
  const footW = 380;
  const footH = 46;
  const footX = w / 2 - footW / 2;
  const footY = 422;

  ctx.beginPath();
  ctx.roundRect(footX, footY, footW, footH, 23);
  ctx.fillStyle = item.isPositive ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = item.isPositive ? '#10b981' : '#ef4444';
  ctx.stroke();

  ctx.font = 'bold 20px Plus Jakarta Sans, sans-serif';
  if (item.isPositive) {
    ctx.fillStyle = '#34d399';
    ctx.fillText('✨ HỨNG VÀO GIỎ NGAY!', w / 2, footY + footH / 2);
  } else {
    ctx.fillStyle = '#f87171';
    ctx.fillText('⚠️ NÉ RA, ĐỪNG HỨNG!', w / 2, footY + footH / 2);
  }

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

/**
 * Draws crisp, clear 2D cartoon graphics for each item
 */
function drawItemIllustration(ctx: CanvasRenderingContext2D, type: ItemType, cx: number, cy: number) {
  ctx.save();

  switch (type) {
    case 'anh_top_khoai_to': {
      // Crown + Muscles + Sunglasses
      ctx.font = '96px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑', cx, cy - 35);
      ctx.fillText('💪', cx, cy + 38);
      // Small gold badge
      ctx.font = 'bold 24px Fredoka, sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.fillText('TOP 1M85', cx, cy + 85);
      break;
    }

    case 'chuoi_18cm': {
      // Huge Golden Banana with 18cm ruler marker
      ctx.font = '115px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍌', cx, cy - 5);

      // 18cm ruler ribbon
      ctx.beginPath();
      ctx.roundRect(cx - 70, cy + 50, 140, 36, 18);
      ctx.fillStyle = '#facc15';
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 22px Fredoka, sans-serif';
      ctx.fillText('📏 18 CM', cx, cy + 68);
      break;
    }

    case 'dep_trai_khoai_to': {
      // Handsome Guy + Eggplant
      ctx.font = '90px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('✨', cx - 55, cy - 40);
      ctx.fillText('👨‍🎤', cx, cy - 20);
      ctx.fillText('🍆', cx, cy + 45);
      break;
    }

    case 'trai_6_mui': {
      // Gym Dumbbell + 6-pack
      ctx.font = '100px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💪', cx, cy - 15);
      ctx.fillText('🏋️', cx, cy + 50);
      break;
    }

    case 'nyc': {
      // Giant Red Flag + Broken Heart
      ctx.font = '95px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🚩', cx - 25, cy - 15);
      ctx.fillText('💔', cx + 30, cy + 30);
      break;
    }

    case 'anh_da_den': {
      // Cool Silhouette + Sunglasses + Gold Chain
      ctx.font = '95px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🕶️', cx, cy - 15);
      ctx.fillText('⛓️', cx, cy + 45);
      break;
    }

    case 'chuoi_9cm': {
      // Tiny Sad Banana + Tear + 9cm
      ctx.font = '80px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🤏', cx - 40, cy - 15);
      ctx.fillText('🍌', cx + 15, cy - 10);
      ctx.fillText('💧', cx + 55, cy + 20);

      ctx.beginPath();
      ctx.roundRect(cx - 60, cy + 50, 120, 34, 17);
      ctx.fillStyle = '#84cc16';
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Fredoka, sans-serif';
      ctx.fillText('9 CM (HẺO)', cx, cy + 67);
      break;
    }

    case 'be_bot': {
      // Crying Baby Bot + Pacifier + "ĐỤNG HÀNG"
      ctx.font = '95px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👶', cx, cy - 20);
      ctx.fillText('🙅', cx, cy + 45);
      break;
    }
  }

  ctx.restore();
}

/**
 * Creates 2D Falling Item Sprite (always faces front, easy to read, zero 3D distortion)
 */
export function create3DItemMesh(itemType: ItemType): THREE.Group {
  const group = new THREE.Group();
  group.name = `Item_${itemType}`;

  // 1. High-Res 2D Billboard Sprite - compact, elegant mobile-friendly size
  const texture = create2DItemCardTexture(itemType);
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  // Compact, mobile-friendly size (1.5 x 1.5 units)
  sprite.scale.set(1.5, 1.5, 1.0);
  sprite.position.y = 0.35;
  group.add(sprite);

  // 2. Subtle drop shadow on the ground
  const shadowGeo = new THREE.PlaneGeometry(0.9, 0.4);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.position.y = 0.02;
  group.add(shadow);

  return group;
}

/**
 * Procedural 3D Piggy Character with Basket
 * Assembled from 12+ distinct parts (head, body, ears, snout, eyes, cheeks, hat, legs, tail, basket)
 */
export function createPiggyCharacter(): {
  group: THREE.Group;
  basket: THREE.Mesh;
  head: THREE.Group;
  tail: THREE.Group;
  ears: THREE.Group[];
  hat: THREE.Group;
} {
  const pigGroup = new THREE.Group();
  pigGroup.name = 'PiggyHero';

  // Materials
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xffa4c0, // cute soft baby pink
    roughness: 0.35,
    metalness: 0.05,
  });

  const skinDarkMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6, // hot pink accent for snout and ears
    roughness: 0.4,
    metalness: 0.05,
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.1,
    metalness: 0.1,
  });

  const eyePupilMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.1,
    metalness: 0.2,
  });

  const cheekMat = new THREE.MeshStandardMaterial({
    color: 0xfb7185,
    roughness: 0.5,
  });

  // 1. Body (curved egg/capsule)
  const bodyGeo = new THREE.SphereGeometry(0.75, 24, 20);
  bodyGeo.scale(1.0, 0.9, 1.15);
  const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
  bodyMesh.position.set(0, 0.85, 0);
  bodyMesh.castShadow = true;
  bodyMesh.receiveShadow = true;
  pigGroup.add(bodyMesh);

  // 2. Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.25, 0.55);

  const headGeo = new THREE.SphereGeometry(0.62, 24, 20);
  headGeo.scale(1.05, 0.95, 1.0);
  const headMesh = new THREE.Mesh(headGeo, skinMat);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // 3. Snout
  const snoutGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.18, 20);
  snoutGeo.rotateX(Math.PI / 2);
  const snoutMesh = new THREE.Mesh(snoutGeo, skinDarkMat);
  snoutMesh.position.set(0, -0.05, 0.58);
  snoutMesh.castShadow = true;
  headGroup.add(snoutMesh);

  // Nostrils
  const nostrilGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 12);
  nostrilGeo.rotateX(Math.PI / 2);
  const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x9d174d });
  const nostrilL = new THREE.Mesh(nostrilGeo, nostrilMat);
  nostrilL.position.set(-0.08, -0.05, 0.68);
  const nostrilR = new THREE.Mesh(nostrilGeo, nostrilMat);
  nostrilR.position.set(0.08, -0.05, 0.68);
  headGroup.add(nostrilL, nostrilR);

  // 4. Eyes & Highlights
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeWhiteMat);
  eyeL.position.set(-0.25, 0.18, 0.48);
  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyePupilMat);
  pupilL.position.set(-0.25, 0.18, 0.56);
  const sparkleL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeWhiteMat);
  sparkleL.position.set(-0.23, 0.22, 0.61);

  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), eyeWhiteMat);
  eyeR.position.set(0.25, 0.18, 0.48);
  const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), eyePupilMat);
  pupilR.position.set(0.25, 0.18, 0.56);
  const sparkleR = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeWhiteMat);
  sparkleR.position.set(0.27, 0.22, 0.61);

  headGroup.add(eyeL, pupilL, sparkleL, eyeR, pupilR, sparkleR);

  // 5. Blushing Cheeks
  const cheekGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 16);
  cheekGeo.rotateX(Math.PI / 2);
  const cheekL = new THREE.Mesh(cheekGeo, cheekMat);
  cheekL.position.set(-0.4, -0.02, 0.45);
  const cheekR = new THREE.Mesh(cheekGeo, cheekMat);
  cheekR.position.set(0.4, -0.02, 0.45);
  headGroup.add(cheekL, cheekR);

  // 6. Floppy Ears
  const earGeo = new THREE.ConeGeometry(0.22, 0.38, 16);
  earGeo.rotateZ(-Math.PI / 4);

  const earL = new THREE.Group();
  earL.position.set(-0.48, 0.45, 0.1);
  const earLMesh = new THREE.Mesh(earGeo, skinDarkMat);
  earLMesh.rotation.y = 0.3;
  earL.add(earLMesh);

  const earR = new THREE.Group();
  earR.position.set(0.48, 0.45, 0.1);
  const earRGeo = new THREE.ConeGeometry(0.22, 0.38, 16);
  earRGeo.rotateZ(Math.PI / 4);
  const earRMesh = new THREE.Mesh(earRGeo, skinDarkMat);
  earRMesh.rotation.y = -0.3;
  earR.add(earRMesh);

  headGroup.add(earL, earR);

  // 7. Birthday Party Hat on Head
  const hatGroup = new THREE.Group();
  hatGroup.position.set(0, 0.58, 0.05);

  const hatGeo = new THREE.ConeGeometry(0.24, 0.55, 20);
  const hatMat = new THREE.MeshStandardMaterial({
    color: 0xa855f7, // vibrant party purple
    roughness: 0.2,
    metalness: 0.3,
  });
  const hatMesh = new THREE.Mesh(hatGeo, hatMat);
  hatMesh.castShadow = true;
  hatGroup.add(hatMesh);

  // Gold Pompom ball
  const pompomGeo = new THREE.SphereGeometry(0.08, 12, 12);
  const pompomMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.2,
    metalness: 0.8,
  });
  const pompomMesh = new THREE.Mesh(pompomGeo, pompomMat);
  pompomMesh.position.set(0, 0.3, 0);
  hatGroup.add(pompomMesh);

  // Hat decorative stripes
  const stripeGeo = new THREE.TorusGeometry(0.18, 0.03, 8, 24);
  stripeGeo.rotateX(Math.PI / 2);
  const stripeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8 });
  const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
  stripeMesh.position.set(0, -0.15, 0);
  hatGroup.add(stripeMesh);

  headGroup.add(hatGroup);
  pigGroup.add(headGroup);

  // 8. Stubby Pig Trotters / Legs
  const legGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.38, 16);
  const hoofMat = new THREE.MeshStandardMaterial({ color: 0xbe185d, roughness: 0.5 });

  const legs = [
    { x: -0.38, z: 0.35 },
    { x: 0.38, z: 0.35 },
    { x: -0.38, z: -0.35 },
    { x: 0.38, z: -0.35 },
  ];

  legs.forEach((pos) => {
    const legMesh = new THREE.Mesh(legGeo, skinMat);
    legMesh.position.set(pos.x, 0.2, pos.z);
    legMesh.castShadow = true;

    const hoof = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.19, 0.08, 16), hoofMat);
    hoof.position.set(0, -0.15, 0);
    legMesh.add(hoof);

    pigGroup.add(legMesh);
  });

  // 9. Curly Wiggling Tail
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.85, -0.75);

  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.08, 0.1, -0.12),
    new THREE.Vector3(-0.06, 0.2, -0.18),
    new THREE.Vector3(0.04, 0.28, -0.22),
  ]);
  const tailGeo = new THREE.TubeGeometry(curve, 16, 0.04, 8, false);
  const tailMesh = new THREE.Mesh(tailGeo, skinDarkMat);
  tailGroup.add(tailMesh);
  pigGroup.add(tailGroup);

  // 10. The Catch Basket in front of Piggy
  const basketMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // golden amber wicker
    roughness: 0.6,
    metalness: 0.25,
  });

  const basketRimMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.3,
    metalness: 0.6,
  });

  const basketGroup = new THREE.Group();
  basketGroup.position.set(0, 0.9, 1.15); // positioned right in front of belly

  // Basket bowl (tapered cylinder open at top)
  const basketGeo = new THREE.CylinderGeometry(0.65, 0.45, 0.55, 24, 1, true);
  const basketMesh = new THREE.Mesh(basketGeo, basketMat);
  basketMesh.castShadow = true;
  basketMesh.receiveShadow = true;
  basketGroup.add(basketMesh);

  // Basket bottom
  const bottomGeo = new THREE.CircleGeometry(0.45, 24);
  bottomGeo.rotateX(-Math.PI / 2);
  const bottomMesh = new THREE.Mesh(bottomGeo, basketMat);
  bottomMesh.position.set(0, -0.27, 0);
  basketGroup.add(bottomMesh);

  // Basket upper gold rim
  const rimGeo = new THREE.TorusGeometry(0.65, 0.05, 12, 32);
  rimGeo.rotateX(Math.PI / 2);
  const rimMesh = new THREE.Mesh(rimGeo, basketRimMat);
  rimMesh.position.set(0, 0.27, 0);
  basketGroup.add(rimMesh);

  // Heart badge on the basket
  const heartGeo = new THREE.SphereGeometry(0.14, 16, 16);
  heartGeo.scale(1.2, 1.0, 0.4);
  const heartMat = new THREE.MeshStandardMaterial({
    color: 0xec4899,
    roughness: 0.2,
    metalness: 0.4,
  });
  const heartMesh = new THREE.Mesh(heartGeo, heartMat);
  heartMesh.position.set(0, 0, 0.58);
  basketGroup.add(heartMesh);

  // Pig arms holding the basket
  const armGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.5, 16);
  const armL = new THREE.Mesh(armGeo, skinMat);
  armL.position.set(-0.55, 0.85, 0.7);
  armL.rotation.set(0.6, 0.4, -0.5);
  pigGroup.add(armL);

  const armR = new THREE.Mesh(armGeo, skinMat);
  armR.position.set(0.55, 0.85, 0.7);
  armR.rotation.set(0.6, -0.4, 0.5);
  pigGroup.add(armR);

  pigGroup.add(basketGroup);

  // Contact shadow disk directly beneath Piggy
  const shadowGeo = new THREE.PlaneGeometry(1.8, 1.8);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
  shadowMesh.position.y = 0.02;
  pigGroup.add(shadowMesh);

  return {
    group: pigGroup,
    basket: basketMesh,
    head: headGroup,
    tail: tailGroup,
    ears: [earL, earR],
    hat: hatGroup,
  };
}

/**
 * Procedural 3D Birthday Cake that appears upon reaching 1000 points!
 * Multi-tiered cake with cream piping, strawberries, and lit candles with animated flames!
 */
export function createBirthdayCake(): {
  group: THREE.Group;
  candles: THREE.Mesh[];
  flames: THREE.PointLight[];
} {
  const cakeGroup = new THREE.Group();
  cakeGroup.name = 'BirthdayCake';

  // Base tier (big cylinder)
  const tier1Geo = new THREE.CylinderGeometry(1.4, 1.45, 0.7, 32);
  const cakeFrostingMat = new THREE.MeshStandardMaterial({
    color: 0xfff1f2, // strawberry vanilla frosting
    roughness: 0.3,
    metalness: 0.05,
  });
  const tier1 = new THREE.Mesh(tier1Geo, cakeFrostingMat);
  tier1.position.y = 0.35;
  tier1.castShadow = true;
  tier1.receiveShadow = true;
  cakeGroup.add(tier1);

  // Tier 1 Ribbon (strawberry pink)
  const ribbonGeo = new THREE.TorusGeometry(1.42, 0.06, 12, 32);
  ribbonGeo.rotateX(Math.PI / 2);
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    roughness: 0.2,
    metalness: 0.4,
  });
  const ribbon1 = new THREE.Mesh(ribbonGeo, ribbonMat);
  ribbon1.position.y = 0.1;
  cakeGroup.add(ribbon1);

  // Second tier
  const tier2Geo = new THREE.CylinderGeometry(0.95, 1.0, 0.65, 32);
  const tier2Mat = new THREE.MeshStandardMaterial({
    color: 0xfce7f3, // soft pink
    roughness: 0.3,
    metalness: 0.05,
  });
  const tier2 = new THREE.Mesh(tier2Geo, tier2Mat);
  tier2.position.y = 0.95;
  tier2.castShadow = true;
  tier2.receiveShadow = true;
  cakeGroup.add(tier2);

  // Tier 2 Gold ribbon
  const goldRibbonGeo = new THREE.TorusGeometry(0.98, 0.05, 12, 32);
  goldRibbonGeo.rotateX(Math.PI / 2);
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.2,
    metalness: 0.8,
  });
  const ribbon2 = new THREE.Mesh(goldRibbonGeo, goldMat);
  ribbon2.position.y = 0.7;
  cakeGroup.add(ribbon2);

  // Strawberries on tier 1
  const strawGeo = new THREE.ConeGeometry(0.14, 0.22, 16);
  const strawMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.3 });
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const straw = new THREE.Mesh(strawGeo, strawMat);
    straw.position.set(Math.cos(angle) * 1.2, 0.75, Math.sin(angle) * 1.2);
    straw.castShadow = true;
    cakeGroup.add(straw);
  }

  // Candles on top tier
  const candleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.45, 16);
  const candleMats = [
    new THREE.MeshStandardMaterial({ color: 0x38bdf8 }), // cyan
    new THREE.MeshStandardMaterial({ color: 0xf43f5e }), // pink
    new THREE.MeshStandardMaterial({ color: 0xfacc15 }), // gold
    new THREE.MeshStandardMaterial({ color: 0xa855f7 }), // purple
  ];

  const candleMeshes: THREE.Mesh[] = [];
  const flameLights: THREE.PointLight[] = [];

  const candlePositions = [
    { x: -0.4, z: -0.2, m: 0 },
    { x: 0.4, z: -0.2, m: 1 },
    { x: 0.0, z: 0.35, m: 2 },
    { x: 0.0, z: -0.35, m: 3 },
  ];

  candlePositions.forEach((cp) => {
    const candle = new THREE.Mesh(candleGeo, candleMats[cp.m]);
    candle.position.set(cp.x, 1.45, cp.z);
    candle.castShadow = true;
    cakeGroup.add(candle);
    candleMeshes.push(candle);

    // Candle flame (glowing warm teardrop/sphere)
    const flameGeo = new THREE.SphereGeometry(0.08, 12, 12);
    flameGeo.scale(0.8, 1.5, 0.8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    const flameMesh = new THREE.Mesh(flameGeo, flameMat);
    flameMesh.position.set(cp.x, 1.75, cp.z);
    cakeGroup.add(flameMesh);

    // Dynamic point light for flame glow
    const pLight = new THREE.PointLight(0xffaa22, 1.5, 3.5);
    pLight.position.set(cp.x, 1.8, cp.z);
    cakeGroup.add(pLight);
    flameLights.push(pLight);
  });

  // Plate underneath
  const plateGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.06, 32);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.1,
    metalness: 0.3,
  });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.y = 0.03;
  plate.receiveShadow = true;
  cakeGroup.add(plate);

  return {
    group: cakeGroup,
    candles: candleMeshes,
    flames: flameLights,
  };
}

/**
 * Procedural 3D Golden Birthday Knife for Stage 2!
 * Gleaming golden blade, jewel heart pommel, floating glowing aura ring.
 */
export function createBirthdayKnife(): {
  group: THREE.Group;
  auraRing: THREE.Mesh;
  blade: THREE.Mesh;
  light: THREE.PointLight;
} {
  const knifeGroup = new THREE.Group();
  knifeGroup.name = 'GoldenBirthdayKnife';

  // 1. Knife blade - sharp, tapered, high gold metallic polish
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(0, 0);
  bladeShape.lineTo(0.18, 0.4);
  bladeShape.lineTo(0.14, 1.3);
  bladeShape.lineTo(0, 1.6); // sharp tip
  bladeShape.lineTo(-0.04, 1.3);
  bladeShape.lineTo(-0.04, 0);
  bladeShape.closePath();

  const extrudeSettings = {
    depth: 0.04,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: 0.02,
    bevelThickness: 0.02,
  };

  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, extrudeSettings);
  bladeGeo.center();

  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xffd700, // Gold
    metalness: 0.95,
    roughness: 0.12,
    emissive: 0xffaa00,
    emissiveIntensity: 0.25,
  });

  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.y = 0.9;
  blade.castShadow = true;
  knifeGroup.add(blade);

  // 2. Crossguard (Ornamental golden wing)
  const guardGeo = new THREE.BoxGeometry(0.55, 0.08, 0.12);
  const guardMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e, // Ruby pink
    metalness: 0.8,
    roughness: 0.2,
  });
  const guard = new THREE.Mesh(guardGeo, guardMat);
  guard.position.y = 0.35;
  knifeGroup.add(guard);

  // 3. Handle (velvet magenta wrap)
  const handleGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.45, 16);
  const handleMat = new THREE.MeshStandardMaterial({
    color: 0xdb2777,
    roughness: 0.4,
    metalness: 0.3,
  });
  const handle = new THREE.Mesh(handleGeo, handleMat);
  handle.position.y = 0.1;
  knifeGroup.add(handle);

  // 4. Pommel (Sparkling Pink Heart / Diamond)
  const pommelGeo = new THREE.OctahedronGeometry(0.12);
  const pommelMat = new THREE.MeshStandardMaterial({
    color: 0xff007f,
    metalness: 0.9,
    roughness: 0.1,
    emissive: 0xff1493,
    emissiveIntensity: 0.4,
  });
  const pommel = new THREE.Mesh(pommelGeo, pommelMat);
  pommel.position.y = -0.16;
  knifeGroup.add(pommel);

  // 5. Floating Glowing Aura Ring around the knife
  const auraGeo = new THREE.TorusGeometry(0.7, 0.03, 16, 32);
  auraGeo.rotateX(Math.PI / 2);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
    transparent: true,
    opacity: 0.7,
  });
  const auraRing = new THREE.Mesh(auraGeo, auraMat);
  auraRing.position.y = 0.8;
  knifeGroup.add(auraRing);

  // 6. Knife Sparkle Point Light
  const light = new THREE.PointLight(0xffea00, 2.0, 3.5);
  light.position.y = 0.9;
  knifeGroup.add(light);

  // 7. Base pedestal shadow/glow indicator on the floor
  const floorGlowGeo = new THREE.RingGeometry(0.3, 0.65, 32);
  floorGlowGeo.rotateX(-Math.PI / 2);
  const floorGlowMat = new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const floorGlow = new THREE.Mesh(floorGlowGeo, floorGlowMat);
  floorGlow.position.y = 0.02;
  knifeGroup.add(floorGlow);

  knifeGroup.scale.set(1.1, 1.1, 1.1);

  return { group: knifeGroup, auraRing, blade, light };
}

/**
 * Creates 3D Birthday Balloon clusters for Stage 2 Party Venue
 */
export function createBalloonCluster(colorHex: number): THREE.Group {
  const cluster = new THREE.Group();
  const balloonGeo = new THREE.SphereGeometry(0.42, 18, 18);
  balloonGeo.scale(0.9, 1.15, 0.9);

  const mat = new THREE.MeshStandardMaterial({
    color: colorHex,
    roughness: 0.15,
    metalness: 0.35,
  });

  const offsets = [
    { x: 0, y: 3.2, z: 0, s: 1.0 },
    { x: -0.32, y: 3.5, z: 0.15, s: 0.85 },
    { x: 0.32, y: 3.4, z: -0.1, s: 0.9 },
  ];

  offsets.forEach((o) => {
    const balloon = new THREE.Mesh(balloonGeo, mat);
    balloon.position.set(o.x, o.y, o.z);
    balloon.scale.set(o.s, o.s, o.s);
    balloon.castShadow = true;
    cluster.add(balloon);

    // Knot
    const knotGeo = new THREE.ConeGeometry(0.06, 0.08, 8);
    const knot = new THREE.Mesh(knotGeo, mat);
    knot.position.set(o.x, o.y - 0.46 * o.s, o.z);
    cluster.add(knot);

    // String
    const strGeo = new THREE.CylinderGeometry(0.008, 0.008, 3.2, 4);
    const strMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const str = new THREE.Mesh(strGeo, strMat);
    str.position.set(o.x, o.y / 2, o.z);
    cluster.add(str);
  });

  return cluster;
}

