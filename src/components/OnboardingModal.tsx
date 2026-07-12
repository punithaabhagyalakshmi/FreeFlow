import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MousePointer, Eraser, Trash2, Download, Check } from 'lucide-react';
import { useBoardStore } from '../state/store';
import { useState } from 'react';

export default function OnboardingModal() {
  const showOnboarding = useBoardStore((state) => state.showOnboarding);
  const setShowOnboarding = useBoardStore((state) => state.setShowOnboarding);
  const onboardingEnabled = useBoardStore((state) => state.onboardingEnabled);
  const setOnboardingEnabled = useBoardStore((state) => state.setOnboardingEnabled);

  const [remember, setRemember] = useState(!onboardingEnabled);

  if (!showOnboarding) return null;

  const handleStart = () => {
    setOnboardingEnabled(!remember);
    setShowOnboarding(false);
  };

  const gestureCards = [
    {
      icon: <span className="text-3xl">☝</span>,
      name: "One Finger",
      action: "Draw",
      desc: "Raise your index finger. Move your hand to sketch smooth calligraphic lines.",
      color: "from-blue-500/20 to-blue-600/5",
      border: "border-blue-500/30"
    },
    {
      icon: <span className="text-3xl">✌</span>,
      name: "Two Fingers",
      action: "Move Cursor",
      desc: "Raise index & middle fingers. Hover and reposition without drawing a stroke.",
      color: "from-purple-500/20 to-purple-600/5",
      border: "border-purple-500/30"
    },
    {
      icon: <span className="text-3xl">👊</span>,
      name: "Fist",
      action: "Eraser",
      desc: "Fold all your fingers. Pass your hand over drawings to rub them out.",
      color: "from-rose-500/20 to-rose-600/5",
      border: "border-rose-500/30"
    },
    {
      icon: <span className="text-3xl">🖐</span>,
      name: "Open Palm",
      action: "Clear Canvas",
      desc: "Spread all fingers. Hold still for 1.5s to completely wipe the current page.",
      color: "from-amber-500/20 to-amber-600/5",
      border: "border-amber-500/30"
    },
    {
      icon: <span className="text-3xl">👍</span>,
      name: "Thumbs Up",
      action: "Save Image",
      desc: "Give a thumbs up. Hold for 1.5s to snap and export the sketch as a PNG.",
      color: "from-emerald-500/20 to-emerald-600/5",
      border: "border-emerald-500/30"
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowOnboarding(false)}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl glass-panel p-6 md:p-8 text-white shadow-2xl flex flex-col gap-6"
        >
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full text-blue-300 text-xs font-semibold tracking-wider uppercase font-mono">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Air Whiteboard Engine
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold font-display tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              FreeFlow
            </h1>
            <p className="text-slate-400 text-lg font-medium">
              Draw Beyond Touch.
            </p>
          </div>

          {/* Gesture Guide */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Gesture Control Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {gestureCards.map((g, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col p-4 rounded-xl border bg-gradient-to-b ${g.color} ${g.border} transition-all duration-300 hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between mb-3">
                    {g.icon}
                    <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                      {g.action}
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1">{g.name}</h4>
                  <p className="text-xs text-slate-400 leading-relaxed flex-grow">
                    {g.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Feature highlights */}
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 items-start">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-blue-200">
                AI Shape Correction
              </h4>
              <p className="text-xs text-blue-300/80 leading-relaxed">
                Draw rough geometric shapes like triangles, rectangles, squares, circles, or straight lines. FreeFlow automatically detects the contour and transforms it into a pixel-perfect shape after you pause.
              </p>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
            <label className="flex items-center gap-2.5 cursor-pointer group text-slate-400 select-none">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${remember ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-600 group-hover:border-slate-500 bg-slate-900/50'}`}>
                  {remember && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
              <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300">
                Do not show this guide on startup
              </span>
            </label>

            <button
              onClick={handleStart}
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105"
            >
              Start Drawing
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
