import React from 'react';
import { GAME_ITEMS, POSITIVE_ITEM_KEYS, NEGATIVE_ITEM_KEYS, TARGET_SCORE } from '../game/constants';
import { X, Trophy, Sparkles, AlertTriangle } from 'lucide-react';

interface ItemsGuideModalProps {
  onClose: () => void;
}

export const ItemsGuideModal: React.FC<ItemsGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-pink-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl text-white max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-pink-300">
              Cẩm Nang Hứng Đồ — Sinh Nhật Nhật
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 my-3 leading-relaxed">
          Nhiệm vụ của chú heo là hứng các đồ vật rơi từ trên xuống mừng sinh nhật Nhật. Đạt đúng{' '}
          <span className="font-extrabold text-amber-300">{TARGET_SCORE} điểm</span> để kích
          hoạt bàn tiệc sinh nhật bánh kem rực rỡ!
        </p>

        {/* Positive items */}
        <div className="mt-4">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            Đồ vật CỘNG ĐIỂM (Càng nhiều càng tốt!)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {POSITIVE_ITEM_KEYS.map((key) => {
              const item = GAME_ITEMS[key];
              return (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex items-start justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs font-mono">
                    +{item.points}đ
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Negative items */}
        <div className="mt-5">
          <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            Đồ vật TRỪ ĐIỂM (Tuyệt đối né ra!)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {NEGATIVE_ITEM_KEYS.map((key) => {
              const item = GAME_ITEMS[key];
              return (
                <div
                  key={key}
                  className="p-3 rounded-xl bg-slate-800/80 border border-rose-500/30 flex items-start justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.description}</div>
                    </div>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-black text-xs font-mono">
                    {item.points}đ
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs transition"
          >
            Đã Rõ, Tiếp Tục Chơi!
          </button>
        </div>
      </div>
    </div>
  );
};
