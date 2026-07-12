import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, Sliders, ToggleLeft, ToggleRight, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useBoardStore } from '../state/store';
import { useEffect, useState } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const settings = useBoardStore((state) => state.settings);
  const updateSettings = useBoardStore((state) => state.updateSettings);
  const onboardingEnabled = useBoardStore((state) => state.onboardingEnabled);
  const setOnboardingEnabled = useBoardStore((state) => state.setOnboardingEnabled);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Enumerate media devices (cameras)
    navigator.mediaDevices.enumerateDevices()
      .then((deviceInfos) => {
        const videoDevices = deviceInfos.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevices);

        // If no camera device ID is currently selected, pick the first one
        if (!settings.cameraDeviceId && videoDevices.length > 0) {
          updateSettings({ cameraDeviceId: videoDevices[0].deviceId });
        }
      })
      .catch((err) => {
        console.error('Error enumerating devices:', err);
      });
  }, [isOpen, settings.cameraDeviceId, updateSettings]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-md rounded-2xl glass-panel p-6 text-white shadow-2xl flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xl font-bold font-display tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-400" />
              Settings
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Camera Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-500" />
                Active Camera Input
              </label>
              <select
                value={settings.cameraDeviceId}
                onChange={(e) => updateSettings({ cameraDeviceId: e.target.value })}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-500 transition-all cursor-pointer"
              >
                {devices.length === 0 ? (
                  <option value="">Default System Camera</option>
                ) : (
                  devices.map((d, idx) => (
                    <option key={d.deviceId || idx} value={d.deviceId}>
                      {d.label || `Webcam ${idx + 1}`}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Sensitivity Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                  Gesture Sensitivity
                </span>
                <span className="text-blue-400 font-bold">
                  {Math.round(settings.gestureSensitivity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={settings.gestureSensitivity}
                onChange={(e) => updateSettings({ gestureSensitivity: parseFloat(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
              />
              <p className="text-[10px] text-slate-400">
                Higher values reduce false-positive triggers but require cleaner hand gestures.
              </p>
            </div>

            {/* Auto Shape recognition Toggle */}
            <div className="flex items-center justify-between py-2 border-t border-b border-white/5">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold flex items-center gap-2 text-slate-200">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  AI Shape Correction
                </span>
                <p className="text-xs text-slate-400">
                  Auto-convert circles, squares, etc. after a pause.
                </p>
              </div>
              <button
                onClick={() => updateSettings({ autoShape: !settings.autoShape })}
                className="text-slate-400 hover:text-white transition-all shrink-0"
              >
                {settings.autoShape ? (
                  <ToggleRight className="w-10 h-10 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-600" />
                )}
              </button>
            </div>

            {/* Onboarding Guide Toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-slate-200">
                  Onboarding On Startup
                </span>
                <p className="text-xs text-slate-400">
                  Show the gesture guide every time you open FreeFlow.
                </p>
              </div>
              <button
                onClick={() => {
                  const val = !onboardingEnabled;
                  setOnboardingEnabled(val);
                }}
                className="text-slate-400 hover:text-white transition-all shrink-0"
              >
                {onboardingEnabled ? (
                  <ToggleRight className="w-10 h-10 text-blue-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <button
            onClick={onClose}
            className="w-full mt-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-sm transition-all shadow-md active:scale-95"
          >
            Apply & Save
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
