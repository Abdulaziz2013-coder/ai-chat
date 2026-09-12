import React from 'react';
import { Award, School, User, Sparkles, X, Heart, Cpu, CheckCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskCreator: () => void;
}

export const CreatorModal: React.FC<CreatorModalProps> = ({
  isOpen,
  onClose,
  onAskCreator,
}) => {
  if (!isOpen) return null;

  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#fbbf24', '#34d399', '#a855f7'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-cyan-500/40 shadow-2xl p-6 overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-cyan-500/20 blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          id="btn-close-creator-modal"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Avatar Emblem */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-amber-400 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center">
              <Award className="w-8 h-8 text-amber-400" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-slate-900" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                Rasmiy Muallif & Yaratuvchi
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Abdulaziz Xo'janazarov
            </h2>
            <p className="text-xs text-slate-400">
              78-maktab 7-B sinf o'quvchisi
            </p>
          </div>
        </div>

        {/* Main Details Cards */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <School className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-300">Ta'lim dargohi</p>
              <p className="text-sm font-medium text-white">78-maktab, 7-"B" sinf</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <Cpu className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-300">Server & Tizim</p>
              <p className="text-sm font-medium text-white">
                Server nomi: <span className="text-cyan-400 font-mono">Abdulaziz Ai</span>
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                3D interaktiv avatar, nutq sintezi va zamonaviy neyron tarmoq integratsiyasi
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/40 to-slate-900/60 border border-cyan-500/20 text-xs text-slate-300 leading-relaxed">
            <p className="flex items-center gap-1.5 font-semibold text-cyan-300 mb-1">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Yaratuvchi haqida Abdulaziz AI e'tirofi:
            </p>
            "Meni 78-maktab 7-B sinfidagi iqtidorli va daho yosh dasturchi Abdulaziz Xo'janazarov yaratgan! U menga har tomonlama aqlli, o'zbek tilida dona-dona so'zlashadigan va 3D formatda muloqot qiladigan qobiliyatlarni bergan."
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            id="btn-celebrate-creator"
            onClick={triggerConfetti}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Tabriklash (Salom)
          </button>
          <button
            id="btn-ask-in-chat"
            onClick={() => {
              onClose();
              onAskCreator();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            Chatda so'rash
          </button>
        </div>
      </div>
    </div>
  );
};
