import { motion } from 'motion/react';
import { useBoardStore } from '../state/store';

export default function GestureIndicator() {
  const currentGesture = useBoardStore((state) => state.currentGesture);
  const gestureProgress = useBoardStore((state) => state.gestureProgress);

  const getGestureConfig = () => {
    switch (currentGesture) {
      case 'draw':
        return {
          emoji: '☝',
          label: 'Drawing',
          bg: 'bg-blue-600/20 border-blue-500/30 text-blue-200',
          dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]',
        };
      case 'move':
        return {
          emoji: '✌',
          label: 'Moving Cursor',
          bg: 'bg-purple-600/20 border-purple-500/30 text-purple-200',
          dot: 'bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]',
        };
      case 'erase':
        return {
          emoji: '👊',
          label: 'Erasing',
          bg: 'bg-rose-600/20 border-rose-500/30 text-rose-200',
          dot: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]',
        };
      case 'clear':
        return {
          emoji: '🖐',
          label: 'Clearing Page',
          bg: 'bg-amber-600/20 border-amber-500/30 text-amber-200',
          dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]',
          showProgress: true,
        };
      case 'save':
        return {
          emoji: '👍',
          label: 'Saving Drawing',
          bg: 'bg-emerald-600/20 border-emerald-500/30 text-emerald-200',
          dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]',
          showProgress: true,
        };
      case 'none':
      default:
        return {
          emoji: '💤',
          label: 'Ready / Standby',
          bg: 'bg-slate-800/40 border-white/10 text-slate-300',
          dot: 'bg-slate-500',
        };
    }
  };

  const config = getGestureConfig();

  // SVG Circular progress details
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (gestureProgress * circumference);

  return (
    <div className="absolute top-4 right-4 z-10 pointer-events-none select-none">
      <motion.div
        key={currentGesture}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border backdrop-blur-md shadow-lg ${config.bg}`}
      >
        {/* Status Glowing Dot or Progress Ring */}
        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
          {config.showProgress ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 transform -rotate-90">
                {/* Background track */}
                <circle
                  cx="12"
                  cy="12"
                  r={radius}
                  className="stroke-white/10 fill-none"
                  strokeWidth="2.5"
                />
                {/* Progress bar */}
                <circle
                  cx="12"
                  cy="12"
                  r={radius}
                  className="stroke-current fill-none transition-all duration-75"
                  strokeWidth="2.5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
            </div>
          ) : (
            <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          )}
        </div>

        {/* Info text */}
        <div className="flex items-center gap-2">
          <span className="text-base">{config.emoji}</span>
          <div className="flex flex-col">
            <span className="text-[9px] font-bold font-mono uppercase tracking-wider text-slate-400 leading-none mb-0.5">
              Gesture Command
            </span>
            <span className="text-xs font-bold font-sans tracking-tight leading-none">
              {config.label}
            </span>
          </div>
        </div>

        {/* Progress percent display */}
        {config.showProgress && gestureProgress > 0 && (
          <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-white/10">
            {Math.round(gestureProgress * 100)}%
          </span>
        )}
      </motion.div>
    </div>
  );
}
