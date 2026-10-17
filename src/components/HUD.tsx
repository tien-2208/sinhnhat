import React from 'react';
import { FloatingText } from '../types/game';
import { TARGET_SCORE } from '../game/constants';
import { Sparkles, Trophy, Volume2, VolumeX, Flame, HelpCircle } from 'lucide-react';
import { soundManager } from '../audio/soundEffects';

interface HUDProps {
  score: number;
  floatingTexts: FloatingText[];
  isMuted: boolean;
  onToggleMute: () => void;
  combo: number;
  onOpenGuide?: () => void;
  onAddTestPoints?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  floatingTexts,
  isMuted,
  onToggleMute,
  combo,
  onOpenGuide,
  onAddTestPoints,
}) => {
  // Determine title tier based on score
  const getRankTitle = () => {
    if (score >= 1000) return '👑 NỮ HOÀNG SĂN TOP (HPBD!)';
    if (score >= 750) return '🔥 BÉ BOT QUYẾN RŨ';
    if (score >= 500) return '💅 BÉ BOT SÀNH ĐIỆU';
    if (score >= 250) return '✨ BÉ BOT ĐANG KHỞI ĐỘNG';
    return '🐷 CHÚ HEO TẬP SỰ';
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20">
      {/* Top Bar HUD */}
      <div className="p-3 sm:p-5 flex items-start justify-between gap-3 max-w-7xl mx-auto w-full">
        {/* Left: Score Cluster */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-pink-500/40 rounded-2xl p-2.5 sm:p-3.5 shadow-xl shadow-pink-950/30 flex items-center gap-2.5 sm:gap-3 pointer-events-auto">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-400 flex items-center justify-center text-white text-xl sm:text-2xl shadow-inner">
            🐷
          </div>
          <div>
            <div className="text-[10px] sm:text-[11px] font-bold text-pink-300 tracking-wider uppercase flex items-center gap-1">
              <span className="px-1.5 py-0.2 rounded bg-pink-500/30 text-pink-200 text-[9px] font-black mr-1">MÀN 1</span>
              <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />
              Điểm Hiện Tại
            </div>
            <div className="text-2xl sm:text-4xl font-black text-white tabular-nums tracking-tight drop-shadow leading-none mt-0.5">
              {score}
              <span className="text-xs sm:text-base font-normal text-pink-300/80 ml-1">
                / {TARGET_SCORE}
              </span>
            </div>
            <div className="text-[10px] text-pink-400 font-semibold mt-1 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" />
              {getRankTitle()}
            </div>
          </div>
        </div>

        {/* Right Action Cluster: Combo + Guide + Pause + Mute */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {combo > 1 && (
            <div className="bg-amber-500/90 text-slate-950 font-black px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm flex items-center gap-1 shadow-lg animate-bounce">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current text-red-600" />
              x{combo}
            </div>
          )}

          {onAddTestPoints && (
            <button
              onClick={onAddTestPoints}
              className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-pink-500/25 hover:bg-pink-500/40 border border-pink-400 text-pink-200 hover:text-white font-extrabold text-xs flex items-center gap-1.5 transition shadow-lg shadow-pink-900/30 active:scale-95 cursor-pointer pointer-events-auto"
              title="Nút test tính năng: +250 Điểm"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
              <span>+250 Điểm (Test)</span>
            </button>
          )}

          {onOpenGuide && (
            <button
              onClick={onOpenGuide}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-purple-400 text-purple-300 flex items-center justify-center transition shadow-lg active:scale-95"
              title="Xem điểm đồ vật"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          <button
            onClick={() => {
              onToggleMute();
              soundManager.isMuted = !isMuted;
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-pink-500 text-white flex items-center justify-center transition shadow-lg active:scale-95"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* Floating 3D/DOM Score reaction text popups */}
      {floatingTexts.map((ft) => (
        <div
          key={ft.id}
          className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-none transition-all duration-700 ease-out animate-float-up font-black text-center"
          style={{
            left: `${ft.x * 100}%`,
            top: `${ft.y}%`,
          }}
        >
          <div
            className="px-3 py-1 rounded-full text-sm sm:text-base font-extrabold shadow-2xl backdrop-blur-sm border"
            style={{
              backgroundColor: ft.isPositive ? 'rgba(15, 23, 42, 0.88)' : 'rgba(45, 10, 15, 0.92)',
              borderColor: ft.color,
              color: ft.color,
            }}
          >
            {ft.text}
          </div>
        </div>
      ))}
    </div>
  );
};
