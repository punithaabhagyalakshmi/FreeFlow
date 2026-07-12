import { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TopNav from './components/TopNav';
import LeftToolbar from './components/LeftToolbar';
import WhiteboardCanvas from './components/WhiteboardCanvas';
import WebcamPreview from './components/WebcamPreview';
import GestureIndicator from './components/GestureIndicator';
import OnboardingModal from './components/OnboardingModal';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Helper reference to trigger save from toolbar button click
  const triggerSaveImage = () => {
    if (window.freeflowTriggerSave) {
      window.freeflowTriggerSave();
    }
  };

  return (
    <div id="freeflow-app" className="h-screen w-screen bg-slate-950 flex flex-col overflow-hidden font-sans select-none">
      {/* 1. TOP NAVIGATION BAR */}
      <TopNav onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* 2. MAIN LAYOUT ARENA */}
      <div className="flex-grow flex overflow-hidden relative">
        {/* LEFT COMPACT TOOLBAR */}
        <LeftToolbar onSaveImage={triggerSaveImage} isOpen={isSidebarOpen} />

        {/* DYNAMIC SIDEBAR COLLAPSE TOGGLE BUTTON */}
        <motion.button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          animate={{
            left: isSidebarOpen ? 272 : 16,
          }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="absolute top-4 z-40 bg-slate-900/90 hover:bg-slate-800 border border-white/15 backdrop-blur-md text-white w-10 h-10 rounded-xl shadow-xl flex items-center justify-center cursor-pointer hover:text-blue-400 active:scale-95 transition-colors"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </motion.button>

        {/* IMMERSIVE SPATIAL DRAWING ARENA */}
        <div className="flex-grow relative h-full overflow-hidden bg-slate-950">
          {/* WEBCAM PREVIEW (Now full-screen in the background of the drawing area!) */}
          <WebcamPreview />

          {/* TRANSPARENT DRAWING CANVAS (Directly on top of the webcam feed!) */}
          <WhiteboardCanvas />
        </div>

        {/* TOP-RIGHT FLOATING GESTURE STATUS overlay */}
        <GestureIndicator />
      </div>

      {/* 3. MODAL OVERLAYS */}
      {/* Dynamic Settings */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Interactive Step-by-Step Gestures Guide */}
      <OnboardingModal />

      {/* Notification Toast Streamer */}
      <Toast />
    </div>
  );
}
