import React from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper, Sparkles, Sword, Play } from 'lucide-react';

interface StageTransitionModalProps {
  score: number;
  onEnterStage2: () => void;
}

export const StageTransitionModal: React.FC<StageTransitionModalProps> = ({
  score,
  onEnterStage2,
}) => {
  React.useEffect(() => {
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#facc15', '#38bdf8', '#c084fc'],
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-purple-950/95 to-slate-900 border-2 border-pink-500/70 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-pink-500/30 text-white text-center overflow-hidden">
        {/* Glow circles */}
        <div className="absolute -top-20 -left-20 w-52 h-52 bg-pink-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-52 h-52 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black uppercase tracking-wider shadow-lg mb-3">
          <PartyPopper className="w-4 h-4" />
          HOÀN THÀNH XUẤT SẮC MÀN 1 ({score} ĐIỂM)
        </div>

        {/* Title */}
        <h2
          style={{ color: '#b13737' }}
          className="text-2xl sm:text-3xl font-black text-[#b13737] mb-2 drop-shadow-sm"
        >
          🎉 CHÚC MỪNG NHẬT! 🎂
        </h2>

        <p className="text-pink-200 text-sm mb-5 leading-relaxed font-medium">
          Bạn đã hứng trúng toàn cực phẩm chuẩn gu và né sạch mọi red flag để cán mốc 1000 điểm!
        </p>

        {/* Stage 2 Announcement Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/40 mb-6 text-left relative overflow-hidden">
          <div className="flex items-center gap-2.5 text-amber-300 font-extrabold text-base mb-2">
            <Sword className="w-5 h-5 text-amber-400 animate-bounce" />
            <span>MÀN 2: TÌM DAO &amp; 3 CÂY NẾN TRONG BÓNG TỐI 🔦</span>
          </div>
          <ul className="text-xs sm:text-sm text-slate-200 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">1.</span>
              <span>Phòng tiệc tắt đèn tối mịt! Rọi <strong>đèn pin hình quạt 🔦</strong> trước mặt để soi đường và né <strong>bong bóng nổ &amp; vỏ chuối trơn 🍌</strong>!</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">2.</span>
              <span>Dùng <strong>các nút di chuyển ◀️ ▲ ▼ ▶️</strong> trên màn hình để dắt chú heo rọi đèn pin thám hiểm (hoặc dùng phím mũi tên / WASD trên bàn phím).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">3.</span>
              <span>Tìm đủ <strong>1 Cây Dao Cắt Bánh 🗡️</strong> &amp; <strong>3 Cây Nến Sinh Nhật 🕯️</strong> trong bóng tối phòng tiệc, sau đó đến bàn bánh kem để <strong>THỔI NẾN</strong> &amp; <strong>CẮT BÁNH 🎂</strong>!</span>
            </li>
          </ul>

          <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px] text-pink-300/80 flex items-center justify-between">
            <span>🎮 Điều khiển: Nút điều hướng 4 chiều trên màn hình hoặc phím W/A/S/D trên máy tính</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onEnterStage2}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-pink-500 to-rose-500 hover:from-amber-400 hover:via-pink-400 hover:to-rose-400 text-white font-black text-base uppercase tracking-wider shadow-xl shadow-pink-500/40 active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white" />
          <span>Tiến Vào Màn 2 Ngay!</span>
        </button>
      </div>
    </div>
  );
};
