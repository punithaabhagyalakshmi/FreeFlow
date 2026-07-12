import { Sparkles, Settings, HelpCircle, Activity, Camera, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useBoardStore } from '../state/store';

interface TopNavProps {
  onOpenSettings: () => void;
}

export default function TopNav({ onOpenSettings }: TopNavProps) {
  const modelStatus = useBoardStore((state) => state.modelStatus);
  const setShowOnboarding = useBoardStore((state) => state.setShowOnboarding);

  const getStatusBadge = () => {
    switch (modelStatus) {
      case 'loading':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Loading AI Tracker...
          </div>
        );
      case 'ready':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            AI Active
          </div>
        );
      case 'camera_error':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-300 text-xs font-mono">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            Webcam Access Denied
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-300 text-xs font-mono">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            AI Load Failed
          </div>
        );
      case 'not_started':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-500/10 border border-slate-500/20 rounded-full text-slate-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            Webcam Offline
          </div>
        );
    }
  };

  return (
    <header className="h-16 shrink-0 border-b border-white/10 glass-panel px-6 flex items-center justify-between text-white z-10 relative">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold font-display tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent leading-none">
            FreeFlow
          </h1>
          <p className="text-[10px] text-slate-400 font-medium font-sans">
            Draw Beyond Touch.
          </p>
        </div>
      </div>

      {/* Tracker Status Indicator */}
      <div className="hidden sm:block">
        {getStatusBadge()}
      </div>

      {/* Navigation Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowOnboarding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-all active:scale-95 cursor-pointer"
          aria-label="Open gesture tutorial guide"
        >
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span className="hidden md:inline">Gesture Guide</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
          aria-label="Open application settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
