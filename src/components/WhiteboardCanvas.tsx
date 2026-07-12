import React, { useEffect, useRef, useState } from 'react';
import { useBoardStore } from '../state/store';
import { Point, Stroke } from '../types';

export default function WhiteboardCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Zustand state and actions
  const pages = useBoardStore((state) => state.pages);
  const currentPageIndex = useBoardStore((state) => state.currentPageIndex);
  const addStroke = useBoardStore((state) => state.addStroke);
  const updateLastStroke = useBoardStore((state) => state.updateLastStroke);
  const finalizeLastStroke = useBoardStore((state) => state.finalizeLastStroke);
  const currentGesture = useBoardStore((state) => state.currentGesture);
  const currentColor = useBoardStore((state) => state.currentColor);
  const brushSize = useBoardStore((state) => state.brushSize);
  const isEraser = useBoardStore((state) => state.isEraser);
  const undo = useBoardStore((state) => state.undo);
  const redo = useBoardStore((state) => state.redo);
  const showToast = useBoardStore((state) => state.showToast);

  // Local state for direct mouse/finger drawing on screen
  const isMouseDrawingRef = useRef(false);

  // Helper to erase any stroke hit by a point
  const eraseAtPoint = (pt: Point) => {
    const hitIdx = strokes.findIndex((stroke) => isStrokeHit(pt, stroke));
    if (hitIdx !== -1) {
      const updatedStrokes = strokes.filter((_, idx) => idx !== hitIdx);
      useBoardStore.setState((state) => {
        const newPages = [...state.pages];
        newPages[state.currentPageIndex] = {
          ...newPages[state.currentPageIndex],
          strokes: updatedStrokes,
        };
        return { pages: newPages };
      });
      showToast('Erased stroke');
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Only support left-click drawing
    if (e.button !== 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isMouseDrawingRef.current = true;
    const pt: Point = { x, y };

    if (isEraser) {
      eraseAtPoint(pt);
    } else {
      const newStroke: Stroke = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        points: [pt],
        color: currentColor,
        width: brushSize,
        isEraser: false,
      };
      addStroke(newStroke);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMouseDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pt: Point = { x, y };

    if (isEraser) {
      eraseAtPoint(pt);
    } else {
      // Append point to active drawing stroke
      const activePage = useBoardStore.getState().pages[currentPageIndex];
      if (activePage && activePage.strokes.length > 0) {
        const lastStroke = activePage.strokes[activePage.strokes.length - 1];
        const updatedPoints = [...lastStroke.points, pt];
        updateLastStroke(updatedPoints);
      }
    }
  };

  const handleMouseUp = () => {
    if (isMouseDrawingRef.current) {
      isMouseDrawingRef.current = false;
      if (!isEraser) {
        finalizeLastStroke();
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    isMouseDrawingRef.current = true;
    const pt: Point = { x, y };

    if (isEraser) {
      eraseAtPoint(pt);
    } else {
      const newStroke: Stroke = {
        id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        points: [pt],
        color: currentColor,
        width: brushSize,
        isEraser: false,
      };
      addStroke(newStroke);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isMouseDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const pt: Point = { x, y };

    if (isEraser) {
      eraseAtPoint(pt);
    } else {
      const activePage = useBoardStore.getState().pages[currentPageIndex];
      if (activePage && activePage.strokes.length > 0) {
        const lastStroke = activePage.strokes[activePage.strokes.length - 1];
        const updatedPoints = [...lastStroke.points, pt];
        updateLastStroke(updatedPoints);
      }
    }
  };

  const handleTouchEnd = () => {
    if (isMouseDrawingRef.current) {
      isMouseDrawingRef.current = false;
      if (!isEraser) {
        finalizeLastStroke();
      }
    }
  };

  // Local size state for layout tracking
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const currentPage = pages[currentPageIndex] || { strokes: [], redoStack: [] };
  const strokes = currentPage.strokes;

  // 1. RESIZE OBSERVER ON CANVAS CONTAINER
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });

      // Match canvas element actual pixel dimensions
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Helper: check if a point is close to a line segment
  const distanceToSegment = (p: Point, a: Point, b: Point): number => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    if (dx === 0 && dy === 0) {
      return Math.hypot(p.x - a.x, p.y - a.y);
    }
    const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    const clampedT = Math.max(0, Math.min(1, t));
    const projX = a.x + clampedT * dx;
    const projY = a.y + clampedT * dy;
    return Math.hypot(p.x - projX, p.y - projY);
  };

  // Helper: check if cursor hits a stroke (for eraser)
  const isStrokeHit = (cursor: Point, stroke: Stroke): boolean => {
    const points = stroke.points;
    if (points.length === 0) return false;

    // Fast bounds box check for optimization
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const pt of points) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
    const pad = 35; // margin
    if (
      cursor.x < minX - pad ||
      cursor.x > maxX + pad ||
      cursor.y < minY - pad ||
      cursor.y > maxY + pad
    ) {
      return false;
    }

    // Checking vector intersection for shapes
    if (stroke.type === 'circle' && stroke.shapeData?.center && stroke.shapeData.radius) {
      const dist = Math.hypot(cursor.x - stroke.shapeData.center.x, cursor.y - stroke.shapeData.center.y);
      return Math.abs(dist - stroke.shapeData.radius) < 25;
    }

    if ((stroke.type === 'rectangle' || stroke.type === 'square') && stroke.shapeData?.center && stroke.shapeData.width && stroke.shapeData.height) {
      const c = stroke.shapeData.center;
      const w = stroke.shapeData.width;
      const h = stroke.shapeData.height;
      const left = c.x - w/2;
      const right = c.x + w/2;
      const top = c.y - h/2;
      const bottom = c.y + h/2;

      // Check proximity to any of the 4 borders
      const dLeft = distanceToSegment(cursor, { x: left, y: top }, { x: left, y: bottom });
      const dRight = distanceToSegment(cursor, { x: right, y: top }, { x: right, y: bottom });
      const dTop = distanceToSegment(cursor, { x: left, y: top }, { x: right, y: top });
      const dBottom = distanceToSegment(cursor, { x: left, y: bottom }, { x: right, y: bottom });

      return Math.min(dLeft, dRight, dTop, dBottom) < 25;
    }

    if (stroke.type === 'triangle' && stroke.shapeData?.points && stroke.shapeData.points.length === 3) {
      const pts = stroke.shapeData.points;
      const d1 = distanceToSegment(cursor, pts[0], pts[1]);
      const d2 = distanceToSegment(cursor, pts[1], pts[2]);
      const d3 = distanceToSegment(cursor, pts[2], pts[0]);
      return Math.min(d1, d2, d3) < 25;
    }

    if (stroke.type === 'line' && stroke.shapeData?.points && stroke.shapeData.points.length === 2) {
      const pts = stroke.shapeData.points;
      return distanceToSegment(cursor, pts[0], pts[1]) < 25;
    }

    // Default freehand points collision check
    for (let i = 1; i < points.length; i++) {
      const dist = distanceToSegment(cursor, points[i - 1], points[i]);
      if (dist < 25) {
        return true;
      }
    }

    return false;
  };

  // 2. EXPORT DRAWING AS PNG with background camera image!
  const exportAsPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas matching the screen size
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Capture the camera frame from WebcamPreview as the background!
    const video = document.querySelector('video');
    if (video) {
      try {
        // The webcam feed is mirrored on the screen for intuitive interaction.
        // We mirror it in the export so the saved image matches exactly what the user saw on screen!
        ctx.translate(exportCanvas.width, 0);
        ctx.scale(-1, 1);

        // Draw the video frame covering the entire canvas maintaining aspect ratio (cover fit)
        const vw = video.videoWidth || 640;
        const vh = video.videoHeight || 480;
        const cw = exportCanvas.width;
        const ch = exportCanvas.height;
        const scale = Math.max(cw / vw, ch / vh);
        const w = vw * scale;
        const h = vh * scale;
        const x = (cw - w) / 2;
        const y = (ch - h) / 2;

        ctx.drawImage(video, x, y, w, h);

        // Reset the transformation matrix back to identity before drawing strokes
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } catch (e) {
        console.error('Failed to draw camera feed background:', e);
        // Fallback to dark canvas if security / browser prevents drawing the webcam feed
        ctx.fillStyle = '#090D16';
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }
    } else {
      // Fallback if video element not found
      ctx.fillStyle = '#090D16';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }

    // 2. Overlap all user vector drawing strokes
    drawStrokesToContext(ctx, strokes);

    // 3. Trigger immediate file download to user's local device storage
    try {
      const dataUrl = exportCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `freeflow-drawing-${Date.now()}.png`;
      link.href = dataUrl;
      // Append to DOM for maximum compatibility in sandboxed frame environments
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Saved snapshot with your drawing to your device!');
    } catch (e) {
      console.error('Error exporting canvas drawing:', e);
      showToast('Export failed. Please try again.');
    }
  };

  // Register global callback for Thumbs Up gesture triggering save
  useEffect(() => {
    window.freeflowTriggerSave = exportAsPNG;
    return () => {
      window.freeflowTriggerSave = undefined;
    };
  }, [strokes]); // Keep strokes synchronized with closure

  // 3. KEYBOARD SHORTCUT LISTENERS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl + Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        showToast('Undo action');
      }
      // Ctrl + Shift + Z or Ctrl + Y
      if (e.ctrlKey && (e.key === 'Z' || (e.key === 'y' && !e.shiftKey))) {
        e.preventDefault();
        redo();
        showToast('Redo action');
      }
      // Ctrl + S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        exportAsPNG();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, strokes]);

  // Redraw utility used both by screen drawing and offscreen exporter
  const drawStrokesToContext = (ctx: CanvasRenderingContext2D, strokeList: Stroke[]) => {
    for (const stroke of strokeList) {
      if (stroke.points.length === 0) continue;

      ctx.strokeStyle = stroke.isEraser ? '#FFFFFF' : stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // 1. Draw Geometric Shapes
      if (stroke.type === 'circle' && stroke.shapeData?.center && stroke.shapeData.radius) {
        const { center, radius } = stroke.shapeData;
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        continue;
      }

      if ((stroke.type === 'rectangle' || stroke.type === 'square') && stroke.shapeData?.center && stroke.shapeData.width && stroke.shapeData.height) {
        const { center, width, height } = stroke.shapeData;
        ctx.beginPath();
        ctx.rect(center.x - width / 2, center.y - height / 2, width, height);
        ctx.stroke();
        continue;
      }

      if (stroke.type === 'triangle' && stroke.shapeData?.points && stroke.shapeData.points.length === 3) {
        const pts = stroke.shapeData.points;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();
        ctx.stroke();
        continue;
      }

      if (stroke.type === 'line' && stroke.shapeData?.points && stroke.shapeData.points.length === 2) {
        const pts = stroke.shapeData.points;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();
        continue;
      }

      // 2. Draw Freehand Calligraphic Bezier Curve
      const pts = stroke.points;
      if (pts.length < 3) {
        // Simple dot for single clicks
        ctx.beginPath();
        ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, 2 * Math.PI);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length - 1; i++) {
          const xc = (pts[i].x + pts[i + 1].x) / 2;
          const yc = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.stroke();
      }
    }
  };

  // 4. MAIN ANIMATION LOOP (requestAnimationFrame)
  useEffect(() => {
    let active = true;

    function renderLoop() {
      if (!active) return;

      const canvas = canvasRef.current;
      if (!canvas) {
        requestAnimationFrame(renderLoop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        requestAnimationFrame(renderLoop);
        return;
      }

      // CLEAR & REDRAW ALL VECTOR STROKES
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawStrokesToContext(ctx, strokes);

      // READ AI AIR CURSOR FOR REAL-TIME DRAWING OR ERASING
      const cursor = window.freeflowCursor;

      if (cursor && cursor.isDetected) {
        // Map 0-1 normalized coordinates to canvas space
        // Mirror X because the webcam view is mirrored (makes pointing 100% natural)
        let curX = (1 - cursor.x) * dimensions.width;
        let curY = cursor.y * dimensions.height;

        if (cursor.videoWidth && cursor.videoHeight) {
          const vw = cursor.videoWidth;
          const vh = cursor.videoHeight;
          const cw = dimensions.width;
          const ch = dimensions.height;

          const scale = Math.max(cw / vw, ch / vh);
          const ox = (vw * scale - cw) / 2;
          const oy = (vh * scale - ch) / 2;

          curX = (1 - cursor.x) * vw * scale - ox;
          curY = cursor.y * vh * scale - oy;
        }

        // A. ERASING GESTURE (Fist)
        if (currentGesture === 'erase' || (currentGesture === 'draw' && isEraser)) {
          isDrawingRef.current = false;

          // Check vector collisions with existing strokes to rub out
          const cursorPt = { x: curX, y: curY };
          const hitIdx = strokes.findIndex((stroke) => isStrokeHit(cursorPt, stroke));

          if (hitIdx !== -1) {
            // Remove hit stroke from state
            const updatedStrokes = strokes.filter((_, idx) => idx !== hitIdx);
            useBoardStore.setState((state) => {
              const newPages = [...state.pages];
              newPages[state.currentPageIndex] = {
                ...newPages[state.currentPageIndex],
                strokes: updatedStrokes,
              };
              return { pages: newPages };
            });
            showToast('Erased stroke');
          }

          // Draw custom Eraser Target Cursor (Large hollow red ring)
          ctx.strokeStyle = '#F43F5E';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(curX, curY, 20, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.fillStyle = 'rgba(244, 63, 148, 0.15)';
          ctx.fill();

          ctx.fillStyle = '#F43F5E';
          ctx.beginPath();
          ctx.arc(curX, curY, 3, 0, 2 * Math.PI);
          ctx.fill();
        }

        // B. DRAWING GESTURE (One Finger)
        else if (currentGesture === 'draw' && !isEraser) {
          const pt = { x: curX, y: curY };

          if (!isDrawingRef.current) {
            // Start a brand-new stroke
            isDrawingRef.current = true;
            const newStroke: Stroke = {
              id: `stroke_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              points: [pt],
              color: currentColor,
              width: brushSize,
              isEraser: false,
            };
            addStroke(newStroke);
          } else {
            // Append points to active stroke in progress
            const activePage = useBoardStore.getState().pages[currentPageIndex];
            if (activePage && activePage.strokes.length > 0) {
              const lastStroke = activePage.strokes[activePage.strokes.length - 1];
              const updatedPoints = [...lastStroke.points, pt];
              updateLastStroke(updatedPoints);
            }
          }

          // Draw active drawing cursor (filled point with soft outer ring)
          ctx.fillStyle = currentColor;
          ctx.beginPath();
          ctx.arc(curX, curY, brushSize / 2 + 1, 0, 2 * Math.PI);
          ctx.fill();

          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(curX, curY, brushSize / 2 + 2, 0, 2 * Math.PI);
          ctx.stroke();
        }

        // C. HOVER / MOVE GESTURE (Two Fingers)
        else if (currentGesture === 'move') {
          // If we were drawing just before, finalize it to trigger AI shape converter
          if (isDrawingRef.current) {
            isDrawingRef.current = false;
            finalizeLastStroke();
          }

          // Draw hovering cursor (Purple reticle with double halo)
          ctx.strokeStyle = '#8B5CF6';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(curX, curY, brushSize + 6, 0, 2 * Math.PI);
          ctx.stroke();

          ctx.strokeStyle = '#C084FC';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.arc(curX, curY, brushSize + 12, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.setLineDash([]); // clear dash

          ctx.fillStyle = '#8B5CF6';
          ctx.beginPath();
          ctx.arc(curX, curY, 3, 0, 2 * Math.PI);
          ctx.fill();
        }

        // D. OTHER STANDBY GESTURES
        else {
          if (isDrawingRef.current) {
            isDrawingRef.current = false;
            finalizeLastStroke();
          }
        }
      } else {
        // Hand left the webcam sight -> finalize if in drawing loop
        if (isDrawingRef.current) {
          isDrawingRef.current = false;
          finalizeLastStroke();
        }
      }

      requestAnimationFrame(renderLoop);
    }

    requestAnimationFrame(renderLoop);

    return () => {
      active = false;
    };
  }, [strokes, currentGesture, currentColor, brushSize, isEraser, dimensions, currentPageIndex, addStroke, updateLastStroke, finalizeLastStroke, showToast]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full bg-transparent overflow-hidden select-none z-10"
      style={{ cursor: currentGesture !== 'none' ? 'none' : 'crosshair' }}
    >
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 block w-full h-full cursor-crosshair touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
    </div>
  );
}
