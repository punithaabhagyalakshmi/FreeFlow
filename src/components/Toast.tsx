import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Info } from 'lucide-react';
import { useBoardStore } from '../state/store';

export default function Toast() {
  const toastMessage = useBoardStore((state) => state.toastMessage);
  const clearToast = useBoardStore((state) => state.clearToast);

  return (
    <AnimatePresence>
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-blue-500/30 bg-slate-900/90 backdrop-blur-md shadow-xl text-slate-100 max-w-sm pointer-events-auto"
          >
            <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold font-mono tracking-tight text-slate-100">
              {toastMessage}
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
