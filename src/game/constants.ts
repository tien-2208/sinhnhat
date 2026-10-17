import { GameItemConfig, ItemType } from '../types/game';

export const TARGET_SCORE = 1000;

export const GAME_ITEMS: Record<ItemType, GameItemConfig> = {
  anh_top_khoai_to: {
    id: 'anh_top_khoai_to',
    name: 'Anh Top Khoai To',
    shortLabel: 'TOP KHOAI TO',
    points: 50,
    isPositive: true,
    color: '#ec4899', // pink-500
    badgeBg: 'rgba(236, 72, 153, 0.95)',
    description: 'Cực phẩm ngút trời! Top 1m85 8 múi nuông chiều bé bot hết nấc!',
    icon: '👑',
    voiceLine: 'Chốt đơn anh top!'
  },
  chuoi_18cm: {
    id: 'chuoi_18cm',
    name: 'Chuối 18cm',
    shortLabel: 'CHUỐI 18CM',
    points: 40,
    isPositive: true,
    color: '#eab308', // yellow-500
    badgeBg: 'rgba(234, 179, 8, 0.95)',
    description: 'Hàng tuyển chất lượng cao chuẩn size quốc tế, căng đét!',
    icon: '🍌',
    voiceLine: 'Hàng khủng 18cm!'
  },
  dep_trai_khoai_to: {
    id: 'dep_trai_khoai_to',
    name: 'Đẹp Trai Khoai To',
    shortLabel: 'ĐẸP TRAI KHOAI TO',
    points: 30,
    isPositive: true,
    color: '#a855f7', // purple-500
    badgeBg: 'rgba(168, 85, 247, 0.95)',
    description: 'Gương mặt nam thần, body bốc lửa, vũ khí sắc bén!',
    icon: '✨',
    voiceLine: 'Mê chữ ê kéo dàiii!'
  },
  trai_6_mui: {
    id: 'trai_6_mui',
    name: 'Trai 6 Múi',
    shortLabel: 'TRAI 6 MÚI',
    points: 20,
    isPositive: true,
    color: '#06b6d4', // cyan-500
    badgeBg: 'rgba(6, 182, 212, 0.95)',
    description: 'Múi nào ra múi nấy, sờ vào là rạo rực con tim!',
    icon: '💪',
    voiceLine: 'Múi sô-cô-la ngọt ngào!'
  },
  // Negative items
  be_bot: {
    id: 'be_bot',
    name: 'Bé Bot Khác',
    shortLabel: 'BÉ BOT (ĐỤNG HÀNG)',
    points: -20,
    isPositive: false,
    color: '#f97316', // orange-500
    badgeBg: 'rgba(249, 115, 22, 0.95)',
    description: 'Đụng hàng chị em ơi! Hai bot ở chung chỉ có cãi nhau tranh top!',
    icon: '👶',
    voiceLine: 'Bot né bot ra giùm!'
  },
  chuoi_9cm: {
    id: 'chuoi_9cm',
    name: 'Chuối 9cm',
    shortLabel: 'CHUỐI 9CM',
    points: -30,
    isPositive: false,
    color: '#84cc16', // lime-500
    badgeBg: 'rgba(132, 204, 22, 0.95)',
    description: 'Bé tí teo như quả ớt hiểm, không đủ gãi ngứa bé bot!',
    icon: '🤏',
    voiceLine: 'Ủa rồi nhét kẽ răng hả?'
  },
  anh_da_den: {
    id: 'anh_da_den',
    name: 'Anh Da Đen',
    shortLabel: 'ANH DA ĐEN',
    points: -40,
    isPositive: false,
    color: '#334155', // slate-700
    badgeBg: 'rgba(30, 41, 59, 0.95)',
    description: 'Quá hung hãn, coi chừng bé bot chịu không nổi nhiệt!',
    icon: '🕶️',
    voiceLine: 'Cảnh báo nguy hiểm!'
  },
  nyc: {
    id: 'nyc',
    name: 'Người Yêu Cũ (NYC)',
    shortLabel: 'NYC RED FLAG',
    points: -40,
    isPositive: false,
    color: '#ef4444', // red-500
    badgeBg: 'rgba(239, 68, 68, 0.95)',
    description: 'Vía đen xui xẻo! Mùi văn vở hứa hẹn quay lại, né gấp 10 vạn dặm!',
    icon: '🚩',
    voiceLine: 'Né gấp con ma NYC!'
  }
};

export const POSITIVE_ITEM_KEYS: ItemType[] = [
  'anh_top_khoai_to',
  'chuoi_18cm',
  'dep_trai_khoai_to',
  'trai_6_mui'
];

export const NEGATIVE_ITEM_KEYS: ItemType[] = [
  'nyc',
  'anh_da_den',
  'chuoi_9cm',
  'be_bot'
];

export const ALL_ITEM_KEYS: ItemType[] = [
  ...POSITIVE_ITEM_KEYS,
  ...NEGATIVE_ITEM_KEYS
];

export const STAGE2_REQUIRED_KNIVES = 1;
export const STAGE2_REQUIRED_CANDLES = 3;
