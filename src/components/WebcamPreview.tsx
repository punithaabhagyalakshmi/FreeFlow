import { useEffect, useRef, useState } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { Camera, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { useBoardStore } from '../state/store';
import { GestureType, Point } from '../types';

// Extend Window interface for shared cursor position
declare global {
  interface Window {
    freeflowCursor?: {
      x: number;
      y: number;
      rawX: number;
      rawY: number;
      isDetected: boolean;
      confidence: number;
      videoWidth?: number;
      videoHeight?: number;
    };
    freeflowTriggerSave?: () => void;
  }
}

export default function WebcamPreview() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Store triggers
  const modelStatus = useBoardStore((state) => state.modelStatus);
  const setModelStatus = useBoardStore((state) => state.setModelStatus);
  const currentGesture = useBoardStore((state) => state.currentGesture);
  const setCurrentGesture = useBoardStore((state) => state.setCurrentGesture);
  const gestureProgress = useBoardStore((state) => state.gestureProgress);
  const setGestureProgress = useBoardStore((state) => state.setGestureProgress);
  const cameraDeviceId = useBoardStore((state) => state.settings.cameraDeviceId);
  const clearCurrentPage = useBoardStore((state) => state.clearCurrentPage);
  const sensitivity = useBoardStore((state) => state.settings.gestureSensitivity);
  const cameraFitMode = useBoardStore((state) => state.settings.cameraFitMode);

  // Component state
  const [streamActive, setStreamActive] = useState(false);

  // Queues and timers for smoothing
  const gestureHistoryRef = useRef<GestureType[]>([]);
  const lastCoordinatesRef = useRef<Point>({ x: 0.5, y: 0.5 });
  const holdTimerRef = useRef<{ gesture: GestureType; startTime: number } | null>(null);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let active = true;

    async function initMediaPipe() {
      if (landmarkerRef.current) return; // Already loaded

      setModelStatus('loading');
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
        );
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (active) {
          landmarkerRef.current = landmarker;
          setModelStatus('ready');
        }
      } catch (err) {
        console.error('Failed to load HandLandmarker:', err);
        if (active) setModelStatus('error');
      }
    }

    initMediaPipe();

    return () => {
      active = false;
    };
  }, [setModelStatus]);

  // Request/configure webcam stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      if (modelStatus !== 'ready') return;

      try {
        const constraints: MediaStreamConstraints = {
          video: cameraDeviceId
            ? { deviceId: { exact: cameraDeviceId }, width: 640, height: 480 }
            : { width: 640, height: 480, facingMode: 'user' },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        activeStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              setStreamActive(true);
            });
          };
        }
      } catch (err) {
        console.error('Error starting camera stream:', err);
        setModelStatus('camera_error');
        setStreamActive(false);
      }
    }

    startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      setStreamActive(false);
    };
  }, [modelStatus, cameraDeviceId, setModelStatus]);

  // Main processing loop
  useEffect(() => {
    if (!streamActive || !landmarkerRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastVideoTime = -1;

    // Standard skeleton connector links
    const CONNECTIONS = [
      [0, 1], [1, 2], [2, 3], [3, 4], // thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // index
      [9, 10], [10, 11], [11, 12], // middle
      [13, 14], [14, 15], [15, 16], // ring
      [0, 17], [17, 18], [18, 19], [19, 20], // pinky
      [5, 9], [9, 13], [13, 17] // palm base
    ];

    function processFrame() {
      if (!video || video.paused || video.ended) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      // Check canvas size match video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const timestamp = performance.now();
      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;

        try {
          // Detect hand landmarks
          const result = landmarkerRef.current!.detectForVideo(video, timestamp);

          // Clear skeleton canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (result.landmarks && result.landmarks.length > 0) {
            const landmarks = result.landmarks[0];
            const score = result.handnesses?.[0]?.[0]?.score || 0.9;

            // 1. GESTURE CLASSIFICATION
            // Check finger extensions (Y coordinate goes 0 at top to 1 at bottom)
            const isIndexExtended = landmarks[8].y < landmarks[6].y;
            const isMiddleExtended = landmarks[12].y < landmarks[10].y;
            const isRingExtended = landmarks[16].y < landmarks[14].y;
            const isPinkyExtended = landmarks[20].y < landmarks[18].y;

            let detectedGesture: GestureType = 'none';

            if (score >= sensitivity) {
              if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
                detectedGesture = 'draw';
              } else if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
                detectedGesture = 'move';
              } else if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
                // If index, middle, ring, pinky are folded, check for Thumbs Up or Fist
                // For Thumbs Up: Thumb tip must point up (lower Y) and be significantly higher than index MCP joint (5),
                // with clear horizontal separation to ensure the thumb is not resting on the fist.
                const isThumbsUp = 
                  landmarks[4].y < landmarks[3].y && 
                  landmarks[4].y < landmarks[5].y - 0.045 && 
                  Math.abs(landmarks[4].x - landmarks[5].x) > 0.04;

                detectedGesture = isThumbsUp ? 'save' : 'erase';
              } else if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended) {
                detectedGesture = 'clear';
              }
            }

            // Majority Vote smoothing (last 10 frames)
            gestureHistoryRef.current.push(detectedGesture);
            if (gestureHistoryRef.current.length > 10) {
              gestureHistoryRef.current.shift();
            }

            const counts = gestureHistoryRef.current.reduce((acc, curr) => {
              acc[curr] = (acc[curr] || 0) + 1;
              return acc;
            }, {} as Record<GestureType, number>);

            let smoothedGesture: GestureType = 'none';
            let maxCount = 0;
            for (const [g, countVal] of Object.entries(counts)) {
              const count = countVal as number;
              if (count > maxCount) {
                maxCount = count;
                smoothedGesture = g as GestureType;
              }
            }

            // Prevent accidental switching unless we are reasonably sure
            if (maxCount >= 6) {
              if (currentGesture !== smoothedGesture) {
                setCurrentGesture(smoothedGesture);
                setGestureProgress(0);
                holdTimerRef.current = null;
              }
            }

            // 2. CURSOR LOCATION AND SMOOTHING
            // We use Index finger tip (Landmark 8) for cursor mapping
            const rawX = landmarks[8].x;
            const rawY = landmarks[8].y;

            // Exponential Moving Average (EMA) coordinate smoothing to stop hand jitter
            const alpha = 0.35; // Jitter filter weight
            const smoothedX = lastCoordinatesRef.current.x + alpha * (rawX - lastCoordinatesRef.current.x);
            const smoothedY = lastCoordinatesRef.current.y + alpha * (rawY - lastCoordinatesRef.current.y);

            lastCoordinatesRef.current = { x: smoothedX, y: smoothedY };

            // Save smoothed location to global object for drawing canvas
            window.freeflowCursor = {
              x: smoothedX,
              y: smoothedY,
              rawX,
              rawY,
              isDetected: true,
              confidence: score,
              videoWidth: video.videoWidth || 640,
              videoHeight: video.videoHeight || 480,
            };

            // 3. DRAW HAND SKELETON (Computer Vision overlay)
            // Draw links
            ctx.strokeStyle = smoothedGesture === 'draw' ? 'rgba(59, 130, 246, 0.8)' : 
                             smoothedGesture === 'move' ? 'rgba(139, 92, 246, 0.8)' : 
                             smoothedGesture === 'erase' ? 'rgba(244, 63, 94, 0.8)' : 
                             smoothedGesture === 'clear' ? 'rgba(245, 158, 11, 0.8)' : 
                             smoothedGesture === 'save' ? 'rgba(16, 185, 129, 0.8)' : 
                             'rgba(148, 163, 184, 0.4)';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';

            for (const conn of CONNECTIONS) {
              const p1 = landmarks[conn[0]];
              const p2 = landmarks[conn[1]];
              if (p1 && p2) {
                ctx.beginPath();
                ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                ctx.stroke();
              }
            }

            // Draw nodes
            for (let i = 0; i < landmarks.length; i++) {
              const p = landmarks[i];
              ctx.beginPath();
              ctx.arc(p.x * canvas.width, p.y * canvas.height, i === 8 ? 6 : 4, 0, 2 * Math.PI);
              ctx.fillStyle = i === 8 ? '#FFFFFF' : '#3B82F6';
              ctx.fill();
              if (i === 8) {
                ctx.strokeStyle = '#2563EB';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
            }

            // 4. HOLD COUNTDOWNS (Clear Page or Save Image)
            const targetHold = 1300; // 1.3 seconds
            if (smoothedGesture === 'clear' || smoothedGesture === 'save') {
              if (!holdTimerRef.current || holdTimerRef.current.gesture !== smoothedGesture) {
                holdTimerRef.current = {
                  gesture: smoothedGesture,
                  startTime: timestamp
                };
                setGestureProgress(0);
              } else {
                const duration = timestamp - holdTimerRef.current.startTime;
                const prog = Math.min(1, duration / targetHold);
                setGestureProgress(prog);

                // Hold duration completed!
                if (prog >= 1) {
                  setGestureProgress(0);
                  holdTimerRef.current = null;
                  gestureHistoryRef.current = []; // Reset history to avoid double fire

                  if (smoothedGesture === 'clear') {
                    clearCurrentPage();
                  } else if (smoothedGesture === 'save') {
                    window.freeflowTriggerSave?.();
                  }
                }
              }
            } else {
              if (holdTimerRef.current) {
                holdTimerRef.current = null;
                setGestureProgress(0);
              }
            }

          } else {
            // No hand detected
            if (currentGesture !== 'none') {
              setCurrentGesture('none');
              setGestureProgress(0);
              holdTimerRef.current = null;
            }
            if (window.freeflowCursor) {
              window.freeflowCursor.isDetected = false;
            }
          }
        } catch (e) {
          console.error('Error during MediaPipe inference frame processing:', e);
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(processFrame);
    }

    animationFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [streamActive, currentGesture, sensitivity, setCurrentGesture, setGestureProgress, clearCurrentPage]);

  // Render camera states
  const renderCameraFeed = () => {
    switch (modelStatus) {
      case 'loading':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/90 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-bold font-display text-slate-200">
                Loading AI Vision Model...
              </p>
              <p className="text-[10px] text-slate-500 max-w-[180px] leading-relaxed">
                Fetching neural network parameters from Google storage (~10MB)
              </p>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/90 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500" />
            <div className="space-y-1">
              <p className="text-sm font-bold font-display text-slate-200">
                Model Load Failed
              </p>
              <p className="text-[10px] text-slate-500 leading-normal max-w-[160px]">
                Please check your internet connection and reload the tab.
              </p>
            </div>
          </div>
        );
      case 'camera_error':
        return (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/90 text-center space-y-3">
            <Camera className="w-8 h-8 text-rose-500" />
            <div className="space-y-1">
              <p className="text-sm font-bold font-display text-slate-200">
                Camera Connection Error
              </p>
              <p className="text-[10px] text-slate-500 leading-normal max-w-[160px]">
                Camera permissions denied or device is already in use by another app.
              </p>
            </div>
          </div>
        );
      case 'ready':
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-950">
      {/* Video feeds */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 w-full h-full ${cameraFitMode === 'contain' ? 'object-contain' : 'object-cover'}`}
        style={{ transform: 'scaleX(-1)' }} // Mirror view
      />

      {/* skeleton landmarks drawer overlay */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full ${cameraFitMode === 'contain' ? 'object-contain' : 'object-cover'} z-0 pointer-events-none`}
        style={{ transform: 'scaleX(-1)' }} // Match video mirror
      />

      {/* Status Overlay */}
      {renderCameraFeed()}
    </div>
  );
}
