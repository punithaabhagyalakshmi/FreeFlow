import { useState, useRef } from 'react';
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
        <LeftToolbar onSaveImage={triggerSaveImage} />

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
