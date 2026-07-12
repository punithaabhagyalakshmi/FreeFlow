import { create } from 'zustand';
import { Page, Stroke, AppSettings, GestureType } from '../types';
import { recognizeShape } from '../utils/shapeRecognizer';

interface BoardState {
  // Onboarding
  onboardingEnabled: boolean;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
  setOnboardingEnabled: (enabled: boolean) => void;

  // Drawing state
  pages: Page[];
  currentPageIndex: number;
  isDrawing: boolean;
  setIsDrawing: (isDrawing: boolean) => void;

  // Brush settings
  currentColor: string;
  brushSize: number;
  isEraser: boolean;
  setBrushColor: (color: string) => void;
  setBrushSize: (size: number) => void;
  setIsEraser: (isEraser: boolean) => void;

  // Page navigation
  nextPage: () => void;
  prevPage: () => void;
  createNewPage: () => void;
  deleteCurrentPage: () => void;
  setCurrentPageIndex: (index: number) => void;

  // Drawing Actions
  addStroke: (stroke: Stroke) => void;
  updateLastStroke: (points: { x: number; y: number }[]) => void;
  finalizeLastStroke: () => void;
  undo: () => void;
  redo: () => void;
  clearCurrentPage: () => void;

  // Gestures
  currentGesture: GestureType;
  setCurrentGesture: (gesture: GestureType) => void;
  gestureProgress: number; // 0 to 1 for progress of countdowns (clear, save)
  setGestureProgress: (progress: number) => void;

  // Model loading state
  modelStatus: 'loading' | 'ready' | 'error' | 'camera_error' | 'not_started';
  setModelStatus: (status: 'loading' | 'ready' | 'error' | 'camera_error' | 'not_started') => void;

  // App settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Toast notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  gestureSensitivity: 0.75,
  autoShape: true,
  cameraDeviceId: '',
  onboardingEnabled: true,
  brushColor: '#3B82F6',
  brushSize: 6,
  cameraFitMode: 'cover',
};

const initialPage = (): Page => ({
  id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  strokes: [],
  redoStack: [],
});

// Load initial values from localStorage
const storedOnboardingEnabled = localStorage.getItem('freeflow_onboarding_enabled');
const storedShowOnboarding = localStorage.getItem('freeflow_show_onboarding');

const initialOnboardingEnabled = storedOnboardingEnabled !== 'false';
const initialShowOnboarding = storedShowOnboarding !== 'false' && initialOnboardingEnabled;

export const useBoardStore = create<BoardState>((set, get) => ({
  // Onboarding
  onboardingEnabled: initialOnboardingEnabled,
  showOnboarding: initialShowOnboarding,
  setShowOnboarding: (show) => {
    set({ showOnboarding: show });
    localStorage.setItem('freeflow_show_onboarding', show ? 'true' : 'false');
  },
  setOnboardingEnabled: (enabled) => {
    set({ onboardingEnabled: enabled });
    localStorage.setItem('freeflow_onboarding_enabled', enabled ? 'true' : 'false');
  },

  // Drawing state
  pages: [initialPage()],
  currentPageIndex: 0,
  isDrawing: false,
  setIsDrawing: (isDrawing) => set({ isDrawing }),

  // Brush settings
  currentColor: '#3B82F6',
  brushSize: 6,
  isEraser: false,
  setBrushColor: (color) => set({ currentColor: color, isEraser: false }),
  setBrushSize: (size) => set({ brushSize: size }),
  setIsEraser: (isEraser) => set({ isEraser }),

  // Page navigation
  nextPage: () => {
    const { currentPageIndex, pages } = get();
    if (currentPageIndex < pages.length - 1) {
      set({ currentPageIndex: currentPageIndex + 1 });
    }
  },
  prevPage: () => {
    const { currentPageIndex } = get();
    if (currentPageIndex > 0) {
      set({ currentPageIndex: currentPageIndex - 1 });
    }
  },
  createNewPage: () => {
    const { pages, currentPageIndex } = get();
    const newPageObj = initialPage();
    const newPages = [...pages];
    newPages.splice(currentPageIndex + 1, 0, newPageObj);
    set({
      pages: newPages,
      currentPageIndex: currentPageIndex + 1,
    });
    get().showToast('Created Page ' + (currentPageIndex + 2));
  },
  deleteCurrentPage: () => {
    const { pages, currentPageIndex } = get();
    if (pages.length <= 1) {
      // Just clear the single page instead of deleting
      get().clearCurrentPage();
      get().showToast('Cleared page contents');
      return;
    }
    const newPages = pages.filter((_, idx) => idx !== currentPageIndex);
    const newIndex = Math.max(0, currentPageIndex - 1);
    set({
      pages: newPages,
      currentPageIndex: newIndex,
    });
    get().showToast('Page deleted');
  },
  setCurrentPageIndex: (index) => {
    const { pages } = get();
    if (index >= 0 && index < pages.length) {
      set({ currentPageIndex: index });
    }
  },

  // Drawing Actions
  addStroke: (stroke) => {
    const { pages, currentPageIndex } = get();
    const newPages = [...pages];
    const page = { ...newPages[currentPageIndex] };

    // Clear redo stack on new stroke
    page.strokes = [...page.strokes, stroke];
    page.redoStack = [];

    newPages[currentPageIndex] = page;
    set({ pages: newPages });
  },

  updateLastStroke: (points) => {
    const { pages, currentPageIndex } = get();
    const newPages = [...pages];
    const page = { ...newPages[currentPageIndex] };

    if (page.strokes.length === 0) return;

    const lastIdx = page.strokes.length - 1;
    const lastStroke = { ...page.strokes[lastIdx], points };

    page.strokes = [...page.strokes.slice(0, lastIdx), lastStroke];
    newPages[currentPageIndex] = page;

    set({ pages: newPages });
  },

  finalizeLastStroke: () => {
    const { pages, currentPageIndex, settings } = get();
    const newPages = [...pages];
    const page = { ...newPages[currentPageIndex] };

    if (page.strokes.length === 0) return;

    const lastIdx = page.strokes.length - 1;
    const lastStroke = page.strokes[lastIdx];

    // Attempt AI shape recognition if enabled and not eraser
    if (settings.autoShape && !lastStroke.isEraser) {
      const recognized = recognizeShape(lastStroke);
      if (recognized) {
        page.strokes = [...page.strokes.slice(0, lastIdx), recognized];
        newPages[currentPageIndex] = page;
        set({ pages: newPages });
        get().showToast(`Auto-shaped into ${recognized.type}`);
        return;
      }
    }
  },

  undo: () => {
    const { pages, currentPageIndex } = get();
    const newPages = [...pages];
    const page = { ...newPages[currentPageIndex] };

    if (page.strokes.length === 0) return;

    const undoneStroke = page.strokes[page.strokes.length - 1];
    page.strokes = page.strokes.slice(0, -1);
    page.redoStack = [...page.redoStack, undoneStroke];

    newPages[currentPageIndex] = page;
    set({ pages: newPages });
  },

  redo: () => {
    const { pages, currentPageIndex } = get();
    const newPages = [...pages];
    const page = { ...newPages[currentPageIndex] };

    if (page.redoStack.length === 0) return;

    const redoneStroke = page.redoStack[page.redoStack.length - 1];
    page.redoStack = page.redoStack.slice(0, -1);
    page.strokes = [...page.strokes, redoneStroke];

    newPages[currentPageIndex] = page;
    set({ pages: newPages });
  },

  clearCurrentPage: () => {
    const { pages, currentPageIndex } = get();
    const newPages = [...pages];
    const page = { ...newPages[currentPageIndex] };

    if (page.strokes.length === 0) return;

    // We can back up strokes to redo stack so clear is undoable!
    page.redoStack = [...page.strokes];
    page.strokes = [];

    newPages[currentPageIndex] = page;
    set({ pages: newPages });
    get().showToast('Canvas cleared (Undo available)');
  },

  // Gestures
  currentGesture: 'none',
  setCurrentGesture: (gesture) => set({ currentGesture: gesture }),
  gestureProgress: 0,
  setGestureProgress: (progress) => set({ gestureProgress: progress }),

  // Model loading state
  modelStatus: 'not_started',
  setModelStatus: (status) => set({ modelStatus: status }),

  // App settings
  settings: DEFAULT_SETTINGS,
  updateSettings: (updated) => set((state) => ({ settings: { ...state.settings, ...updated } })),

  // Toast notifications
  toastMessage: null,
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      // Clear after 3s if it hasn't changed
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 2500);
  },
  clearToast: () => set({ toastMessage: null }),
}));
