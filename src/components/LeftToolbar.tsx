import {
  Undo2,
  Redo2,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Download,
  Paintbrush,
  FileText
} from 'lucide-react';
import { useBoardStore } from '../state/store';

interface LeftToolbarProps {
  onSaveImage: () => void;
}

const PALETTE = [
  { name: 'Charcoal', value: '#1E293B' },
  { name: 'Electric Blue', value: '#3B82F6' },
  { name: 'Royal Purple', value: '#8B5CF6' },
  { name: 'Neon Rose', value: '#F43F5E' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Vibrant Amber', value: '#F59E0B' },
];

export default function LeftToolbar({ onSaveImage }: LeftToolbarProps) {
  const currentColor = useBoardStore((state) => state.currentColor);
  const brushSize = useBoardStore((state) => state.brushSize);
  const isEraser = useBoardStore((state) => state.isEraser);
  const setBrushColor = useBoardStore((state) => state.setBrushColor);
  const setBrushSize = useBoardStore((state) => state.setBrushSize);
  const setIsEraser = useBoardStore((state) => state.setIsEraser);

  // Undo/redo and pages
  const pages = useBoardStore((state) => state.pages);
  const currentPageIndex = useBoardStore((state) => state.currentPageIndex);
  const undo = useBoardStore((state) => state.undo);
  const redo = useBoardStore((state) => state.redo);
  const clearCurrentPage = useBoardStore((state) => state.clearCurrentPage);
  const createNewPage = useBoardStore((state) => state.createNewPage);
  const deleteCurrentPage = useBoardStore((state) => state.deleteCurrentPage);
  const nextPage = useBoardStore((state) => state.nextPage);
  const prevPage = useBoardStore((state) => state.prevPage);

  const currentPage = pages[currentPageIndex] || { strokes: [], redoStack: [] };
  const canUndo = currentPage.strokes.length > 0;
  const canRedo = currentPage.redoStack.length > 0;

  return (
    <aside className="w-64 border-r border-white/10 glass-panel p-4 flex flex-col gap-5 text-white overflow-y-auto h-full shrink-0">
      {/* 1. Paint Brush / Eraser Selection */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          Drawing Tools
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setIsEraser(false)}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${!isEraser ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/10 hover:border-white/20 bg-white/5 text-slate-300'}`}
          >
            <Paintbrush className="w-4 h-4" />
            Draw
          </button>
          <button
            onClick={() => setIsEraser(true)}
            className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${isEraser ? 'bg-rose-600 border-rose-500 text-white' : 'border-white/10 hover:border-white/20 bg-white/5 text-slate-300'}`}
          >
            <Eraser className="w-4 h-4" />
            Eraser
          </button>
        </div>
      </div>

      {/* 2. Color Palette (Hidden when eraser is active) */}
      {!isEraser && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Color Palette
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {PALETTE.map((color) => (
              <button
                key={color.value}
                onClick={() => setBrushColor(color.value)}
                style={{ backgroundColor: color.value }}
                className={`h-10 rounded-xl relative transition-all duration-200 hover:scale-105 cursor-pointer shadow-inner border ${currentColor === color.value ? 'ring-2 ring-white border-transparent' : 'border-white/15 hover:border-white/30'}`}
                title={color.name}
              >
                {currentColor === color.value && (
                  <span className="absolute inset-0 m-auto w-1.5 h-1.5 rounded-full bg-white shadow-md" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Brush Size Slider */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          <span>Brush Size</span>
          <span className="text-blue-400 font-semibold">{brushSize}px</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="2"
            max="30"
            step="1"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
          />
          <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center shrink-0">
            <div
              style={{
                width: `${Math.max(2, Math.min(24, brushSize))}px`,
                height: `${Math.max(2, Math.min(24, brushSize))}px`,
                backgroundColor: isEraser ? '#F43F5E' : currentColor,
              }}
              className="rounded-full shadow-md"
            />
          </div>
        </div>
      </div>

      {/* 4. History Controls */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
          History
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-200 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
            Redo
          </button>
        </div>
      </div>

      <hr className="border-white/5" />

      {/* 5. Page Management */}
      <div className="space-y-2 flex-grow">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Pages
          </h3>
          <button
            onClick={createNewPage}
            className="p-1 rounded bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 text-blue-300 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Create New Page"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/50 border border-white/15">
          <button
            onClick={prevPage}
            disabled={currentPageIndex === 0}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold font-mono text-slate-300 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            {currentPageIndex + 1} / {pages.length}
          </span>

          <button
            onClick={nextPage}
            disabled={currentPageIndex === pages.length - 1}
            className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {pages.length > 1 && (
          <button
            onClick={deleteCurrentPage}
            className="w-full mt-1 py-1.5 rounded-xl border border-rose-500/20 hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Page
          </button>
        )}
      </div>

      {/* 6. Page Action Buttons (Export/Clear) */}
      <div className="space-y-2 pt-2 border-t border-white/5 shrink-0">
        <button
          onClick={clearCurrentPage}
          disabled={currentPage.strokes.length === 0}
          className="w-full py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
          Clear Page
        </button>

        <button
          onClick={onSaveImage}
          className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-blue-500/10 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 cursor-pointer"
          title="Export as PNG (Ctrl+S)"
        >
          <Download className="w-4 h-4" />
          Export Drawing
        </button>
      </div>
    </aside>
  );
}
