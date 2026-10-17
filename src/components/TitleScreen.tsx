import React, { useState, useEffect } from 'react';
import { GAME_ITEMS, POSITIVE_ITEM_KEYS, NEGATIVE_ITEM_KEYS, TARGET_SCORE } from '../game/constants';
import { Play, Sparkles, AlertTriangle, ArrowRight, ArrowLeft, Trophy } from 'lucide-react';

interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  // Step 1: 'welcome' -> click "Bắt Đầu" -> Step 2: 'item_list' -> click "Chơi Ngay"
  const [step, setStep] = useState<'welcome' | 'item_list'>('welcome');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (step === 'welcome') {
          setStep('item_list');
        } else {
          onStart();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, onStart]);

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 sm:p-8 bg-slate-950/80 backdrop-blur-md text-white select-none overflow-y-auto">
      {/* Top Banner Tag */}
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-900/60 border border-pink-500/40 text-pink-300 text-xs font-bold uppercase tracking-wider animate-pulse mb-3">
        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
        Sinh Nhật Đặc Quyền Dành Cho Nhật
      </div>

      {step === 'welcome' ? (
        /* STEP 1: WELCOME SCREEN */
        <div className="text-center max-w-2xl my-auto py-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="inline-block mb-3 text-5xl sm:text-6xl animate-bounce">
            🐷🎂👑
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 drop-shadow-[0_5px_15px_rgba(244,63,94,0.4)]">
            NHẬT CATCH & SLAY
          </h1>

          <p className="mt-3 text-base sm:text-xl font-bold text-pink-200">
            Hứng Top Chuẩn Gu — Hứng Đồ &amp; Tìm Dao Cắt Bánh!
          </p>

          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Điều khiển chú heo hứng cực phẩm đạt{' '}
            <span className="text-amber-300 font-extrabold">{TARGET_SCORE} điểm</span> để hoàn thành thử thách,
            sau đó rọi đèn pin tìm 1 Cây Dao Vàng &amp; 3 Cây Nến trong bóng tối để thổi nến và cắt bánh sinh nhật!
          </p>

          {/* Button: BẮT ĐẦU -> moves to item list */}
          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={() => setStep('item_list')}
              className="group relative px-10 sm:px-14 py-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-slate-950 font-black text-lg sm:text-xl tracking-wide shadow-2xl shadow-pink-500/40 transform hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              <span>BẮT ĐẦU</span>
              <ArrowRight className="w-6 h-6 text-slate-950 group-hover:translate-x-1 transition-transform" />
              <span className="text-xs bg-slate-950/20 text-slate-900 px-2 py-0.5 rounded-md font-mono hidden sm:inline-block">
                Space / Enter
              </span>
            </button>
            <span className="text-xs text-slate-400">
              Nhấn để xem bảng điểm các món đồ trước khi vào chơi
            </span>
          </div>
        </div>
      ) : (
        /* STEP 2: ITEM LIST -> CHƠI NGAY */
        <div className="w-full max-w-3xl bg-slate-900/95 border-2 border-pink-500/50 rounded-3xl p-5 sm:p-7 my-auto shadow-2xl shadow-pink-950/50 animate-in slide-in-from-bottom-6 duration-300 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-amber-300">
                DANH SÁCH ĐỒ VẬT & ĐIỂM SỐ
              </h2>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
              Mục tiêu: {TARGET_SCORE}đ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[52vh] overflow-y-auto pr-1">
            {/* Positive items */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-slate-900/95 py-1 z-10">
                <Sparkles className="w-3.5 h-3.5" />
                VẬT PHẨM CỘNG ĐIỂM (Hứng nhiệt tình!)
              </div>
              <div className="space-y-2">
                {POSITIVE_ITEM_KEYS.map((key) => {
                  const it = GAME_ITEMS[key];
                  return (
                    <div
                      key={key}
                      className="p-2.5 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex items-center justify-between hover:border-emerald-400 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{it.icon}</span>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{it.name}</span>
                            <span className="text-emerald-400 font-extrabold text-xs font-mono">
                              +{it.points}đ
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{it.description}</div>
                        </div>
                      </div>
                      <span className="shrink-0 px-2 py-1 rounded-lg bg-emerald-500/25 text-emerald-300 font-black text-xs font-mono ml-2">
                        +{it.points}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Negative items */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-slate-900/95 py-1 z-10">
                <AlertTriangle className="w-3.5 h-3.5" />
                VẬT PHẨM TRỪ ĐIỂM (Tuyệt đối né ra!)
              </div>
              <div className="space-y-2">
                {NEGATIVE_ITEM_KEYS.map((key) => {
                  const it = GAME_ITEMS[key];
                  return (
                    <div
                      key={key}
                      className="p-2.5 rounded-xl bg-slate-800/80 border border-rose-500/30 flex items-center justify-between hover:border-rose-400 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{it.icon}</span>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{it.name}</span>
                            <span className="text-rose-400 font-extrabold text-xs font-mono">
                              {it.points}đ
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 leading-tight mt-0.5">{it.description}</div>
                        </div>
                      </div>
                      <span className="shrink-0 px-2 py-1 rounded-lg bg-rose-500/25 text-rose-300 font-black text-xs font-mono ml-2">
                        {it.points}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Row: Back Button & CHƠI NGAY Button */}
          <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={() => setStep('welcome')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay Lại</span>
            </button>

            <button
              onClick={onStart}
              className="group flex-1 max-w-sm px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 hover:from-pink-400 hover:to-amber-400 text-slate-950 font-black text-base sm:text-lg tracking-wide shadow-xl shadow-pink-500/30 transform hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current text-slate-950 group-hover:translate-x-0.5 transition-transform" />
              <span>CHƠI NGAY</span>
              <span className="text-xs bg-slate-950/20 text-slate-900 px-2 py-0.5 rounded-md font-mono hidden sm:inline-block">
                Space / Enter
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Flat Control Hint Line */}
      <div className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-3 text-center mt-3">
        <span>Di chuột hoặc lướt màn hình để hứng</span>
        <span>•</span>
        <span>Phím A/D hoặc ← →</span>
        <span>•</span>
        <span>Cán mốc 1000 điểm nhận bánh kem sinh nhật</span>
      </div>
    </div>
  );
};
