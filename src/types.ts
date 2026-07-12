export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  points: Point[];
  color: string;
  width: number;
  isEraser: boolean;
  type?: 'free' | 'circle' | 'square' | 'rectangle' | 'triangle' | 'line';
  shapeData?: {
    center?: Point;
    radius?: number;
    width?: number;
    height?: number;
    points?: Point[]; // for polygon (triangle, line)
  };
}

export interface Page {
  id: string;
  strokes: Stroke[];
  redoStack: Stroke[];
}

export type GestureType = 'none' | 'draw' | 'move' | 'erase' | 'clear' | 'save';

export interface AppSettings {
  gestureSensitivity: number; // confidence threshold
  autoShape: boolean; // auto shape recognition
  cameraDeviceId: string;
  onboardingEnabled: boolean;
  brushColor: string;
  brushSize: number;
  cameraFitMode: 'cover' | 'contain';
}
