import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Heart, Copy, Check, PartyPopper, Flame, Gift, Home } from 'lucide-react';
import { soundManager } from '../audio/soundEffects';
import sixpackGuyImage from '../assets/images/handsome_sixpack_guy_1792133835315.jpg';

interface BirthdayModalProps {
  score: number;
  onBackToHome: () => void;
}

export const BirthdayModal: React.FC<BirthdayModalProps> = ({
  score,
  onBackToHome,
}) => {
  const [copied, setCopied] = useState(false);
  const [candlesLit, setCandlesLit] = useState(false);
  const [giftOpened, setGiftOpened] = useState(false);

  // Initial celebratory confetti
  useEffect(() => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#ec4899', '#f43f5e', '#facc15', '#38bdf8', '#c084fc'],
    });
  }, []);

  const birthdayWishText = `🎉 CHÚC MỪNG SINH NHẬT NHẬT! 🎂✨
Chúc Nhật tuổi mới luôn xinh đẹp, slay hết nước chấm, công việc hanh thông, ví dày cộm và quan trọng nhất:
SỚM CHỐT ĐƠN ĐƯỢC ANH TOP KHOAI TO 6 MÚI CHUẨN GU 18CM ĐỜI MÌNH! 💖
Né xa mọi NYC red flag và chuối 9cm! Mãi luôn hạnh phúc, rạng ngời và được cưng chiều nhất vũ trụ! 🐷👑`;

  const handleCopyWish = () => {
    navigator.clipboard.writeText(birthdayWishText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleBlowCandles = () => {
    setCandlesLit(false);
    soundManager.playMilestone();
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  const handleOpenGift = () => {
    setGiftOpened(true);
    soundManager.playBirthdayFanfare();

    // Grand confetti fireworks
    const duration = 3.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 65,
        origin: { x: 0.1, y: 0.6 },
        colors: ['#ec4899', '#facc15', '#38bdf8', '#ff0055', '#a855f7'],
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 65,
        origin: { x: 0.9, y: 0.6 },
        colors: ['#ec4899', '#facc15', '#38bdf8', '#ff0055', '#a855f7'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-slate-900 via-purple-950/90 to-slate-900 border-2 border-pink-500/60 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-pink-500/30 text-white overflow-hidden max-h-[94vh] flex flex-col justify-between overflow-y-auto">
        {/* Glow ambient background circles */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header Badge */}
        <div className="text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-black uppercase tracking-wider shadow-lg mb-2">
            <PartyPopper className="w-3.5 h-3.5" />
            ĐÃ THỔI NẾN & CẮT BÁNH KEM THÀNH CÔNG!
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 drop-shadow flex items-center justify-center gap-2">
            🎂 HAPPY BIRTHDAY NHẬT! 👑
          </h1>
          <p className="text-pink-200 text-xs mt-0.5 font-medium">
            Điểm số kỷ lục Màn 1: <span className="font-extrabold text-amber-300 tabular-nums">{score} Điểm</span>
          </p>
        </div>

        {/* STAGE 1: BIRTHDAY CAKE WITH CANDLES TO BLOW OUT */}
        {candlesLit && (
          <div className="my-3 p-4 rounded-2xl bg-slate-950/70 border border-pink-500/30 flex flex-col items-center justify-center relative animate-in zoom-in-95 duration-300">
            {/* Cake Display */}
            <div className="relative flex flex-col items-center select-none py-1">
              {/* Candles with glowing flames */}
              <div className="flex gap-4 sm:gap-6 mb-[-6px] z-10">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="animate-pulse text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]">
                      <Flame className="w-5 h-5 fill-amber-400" />
                    </div>
                    <div className="w-2.5 h-6 rounded-t-sm bg-gradient-to-b from-pink-400 via-yellow-300 to-indigo-400 border border-slate-900 shadow-sm" />
                  </div>
                ))}
              </div>

              {/* Top Tier Cake */}
              <div className="w-36 sm:w-44 h-11 bg-gradient-to-r from-rose-200 via-pink-100 to-rose-200 rounded-t-xl border-x-2 border-t-2 border-pink-300 shadow-md flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-x-0 bottom-0 h-3 bg-pink-400/80 rounded-t-lg" />
                <span className="text-xs font-bold text-pink-700 tracking-wider">
                  NHẬT 2026
                </span>
              </div>

              {/* Bottom Tier Cake */}
              <div className="w-52 sm:w-60 h-14 bg-gradient-to-r from-pink-300 via-rose-200 to-pink-300 rounded-b-2xl border-2 border-pink-400 shadow-xl flex items-center justify-center relative">
                <div className="absolute inset-x-2 top-1 flex justify-around">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <span key={s} className="text-xs">🍓</span>
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-black text-rose-800 uppercase tracking-widest drop-shadow-sm mt-1">
                  ✨ Slay Tuổi Mới ✨
                </span>
              </div>

              {/* Cake Plate */}
              <div className="w-60 sm:w-72 h-3 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 rounded-full border border-amber-300 shadow-lg -mt-1" />
            </div>

            {/* Blow Candles CTA */}
            <button
              onClick={handleBlowCandles}
              className="mt-3 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-pink-500/30 transition transform hover:scale-105 active:scale-95 animate-bounce"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              Nhấp để thổi nến sinh nhật!
            </button>
          </div>
        )}

        {/* STAGE 2: CANDLES BLOWN OUT -> MYSTERY GIFT BOX APPEARS */}
        {!candlesLit && !giftOpened && (
          <div className="my-3 p-5 rounded-2xl bg-gradient-to-b from-purple-950/80 to-slate-950/90 border-2 border-amber-400/60 flex flex-col items-center justify-center relative animate-in zoom-in-95 duration-500 text-center">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              ĐÃ CẮT BÁNH KEM XONG! 1 HỘP QUÀ BÍ MẬT XUẤT HIỆN!
            </div>

            {/* Pulsating Animated Gift Box */}
            <div
              onClick={handleOpenGift}
              className="cursor-pointer my-2 p-3 bg-gradient-to-tr from-pink-500/20 to-amber-500/20 rounded-3xl border border-pink-400/40 hover:scale-110 active:scale-95 transition-all duration-300 shadow-2xl shadow-pink-500/40 group flex flex-col items-center"
            >
              <div className="text-7xl sm:text-8xl animate-bounce filter drop-shadow-[0_10px_20px_rgba(244,63,94,0.5)]">
                🎁
              </div>
              <span className="text-xs text-pink-300 font-semibold mt-1 group-hover:text-amber-300 transition-colors">
                (Chạm vào hộp quà để mở)
              </span>
            </div>

            <p className="text-xs sm:text-sm text-pink-100 max-w-sm mt-1 leading-relaxed">
              Món quà sinh nhật đặc biệt nhất đã được chuẩn bị riêng cho Nhật...
            </p>

            <button
              onClick={handleOpenGift}
              className="mt-4 px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-rose-500 hover:from-amber-300 hover:to-pink-400 text-slate-950 text-sm font-black flex items-center gap-2 shadow-xl shadow-pink-500/40 transition transform hover:scale-105 active:scale-95"
            >
              <Gift className="w-5 h-5 text-slate-950 fill-current" />
              <span>MỞ HỘP QUÀ SINH NHẬT NGAY!</span>
            </button>
          </div>
        )}

        {/* STAGE 3: GIFT OPENED -> REVEAL HANDSOME BLACK-HAIRED 6-PACK GUY */}
        {giftOpened && (
          <div className="my-2 p-3 sm:p-4 rounded-2xl bg-gradient-to-b from-slate-950 via-purple-950/70 to-slate-950 border-2 border-pink-400/60 flex flex-col items-center justify-center animate-in zoom-in duration-500">
            {/* Title Banner */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-600/80 text-white text-[11px] font-black uppercase tracking-wider mb-2 shadow">
              👑 QUÀ TẶNG SINH NHẬT ĐÃ ĐƯỢC MỞ:
            </div>

            {/* Revealed 6-Pack Black-Haired Guy Image */}
            <div className="relative w-44 sm:w-56 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-amber-300 shadow-2xl shadow-pink-500/40 group">
              <img
                src={sixpackGuyImage}
                alt="Anh top 6 múi tóc đen mừng sinh nhật Nhật"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-2.5 text-center">
                <span className="text-xs sm:text-sm font-black text-amber-300 drop-shadow">
                  ANH TOP 6 MÚI TÓC ĐEN 1M85 💖
                </span>
                <span className="text-[10px] text-pink-200">
                  Chuẩn gu 18cm — Ship hỏa tốc cho Nhật!
                </span>
              </div>
            </div>

            <p className="text-xs text-amber-300 font-bold mt-2 text-center">
              ✨ Chúc mừng Nhật đã mở khóa thành công anh Top 6 múi tóc đen cực phẩm! ✨
            </p>
          </div>
        )}

        {/* Personalized Sincere & Humorous Birthday Wish Message Box */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-pink-950/40 via-purple-950/50 to-slate-900/80 border border-pink-400/30 relative mt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-pink-300 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
              Lời Chúc Độc Quyền Dành Cho Nhật
            </span>
            <button
              onClick={handleCopyWish}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/90 border border-slate-700 transition active:scale-95"
              title="Sao chép lời chúc"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300 font-bold text-[11px]">Đã chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span className="text-[11px]">Sao chép</span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-slate-200 leading-relaxed font-medium space-y-1 whitespace-pre-line">
            {birthdayWishText}
          </div>
        </div>

        {/* Action Button: Sau khi mở quà xong -> 1 nút duy nhất: Quay Về Trang Đầu Tiên */}
        {giftOpened && (
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={onBackToHome}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-pink-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Quay Về Trang Đầu Tiên 🏠✨</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
