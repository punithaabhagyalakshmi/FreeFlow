# FreeFlow 🌌

An immersive, AI-powered, touchless gesture-controlled digital whiteboard that allows users to paint, draw, and interact in the air using their hands through a standard webcam. Powered by computer vision and a modern React client-side architecture.

---

## ✨ Features

- **Spatial Air-Drawing Canvas**: Draw on a transparent whiteboard overlaid directly on top of your mirrored webcam feed for a highly immersive, futuristic feedback loop.
- **Real-Time Hand Tracking**: Uses Google MediaPipe Hand Landmarker under the hood to perform low-latency hand tracking right inside your browser without any server-side processing overhead.
- **Dynamic Hand Skeleton HUD**: Draws a real-time computer vision skeleton overlay that maps perfectly to your hand's joints (landmarks) and changes color depending on the active gesture.
- **Intelligent Gesture Recognition**:
  - **👆 Draw Mode**: Raise your index finger (1 finger) to draw precise, smooth vector strokes.
  - **✌️ Hover/Move Mode**: Present your index and middle fingers (2 fingers) to move around without drawing.
  - **🖐️ Erase/Clear**: Dedicated gestures to wipe the board clean or wipe specific elements.
- **Fully Loaded UI Suite**:
  - **Top Navigation**: Displays current tracking modes and rapid application control buttons.
  - **Left Compact Toolbar**: Easy actions for manual drawing, clearing, and saving configurations.
  - **Onboarding Guide**: Step-by-step interactive instructions showing how to present your hands and master gestures.
  - **Settings Modal**: Customize brush sizes, stroke colors, tracking confidence levels, and more.
  - **State Toasts**: Elegant non-blocking floating alerts for quick event confirmation.

---

## 🎮 Hand Gesture Reference Guide

Stand about **2–4 feet back** from your camera, ensure your hands are well-lit, and try these gestures:

| Gesture Mode | Finger Setup | Visual Skeleton Color | Action |
| :--- | :--- | :--- | :--- |
| **Draw** | Index finger upright (other fingers folded) | 🔵 Blue | Paints a stroke on the canvas |
| **Hover / Move** | Index & Middle fingers upright | 🟣 Purple | Hover over menu items or navigate without drawing |
| **Erase** | Open palm / Hand flat | 🔴 Rose Red | Erases drawn strokes near hand location |
| **Clear** | Folded fist held steady | 🟡 Amber | Trigger countdown to wipe the entire canvas |
| **Save Image** | Custom thumbs-up/ok signal | 🟢 Emerald Green | Captures and downloads the canvas as an image |

---

## 🛠️ Tech Stack & Architecture

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations**: [Motion](https://motion.dev/) (formerly Framer Motion)
- **Computer Vision Engine**: [@mediapipe/tasks-vision](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine (v18 or higher is recommended).

### Installation

1. Clone or download the repository files:
   ```bash
   git clone <your-repo-url>
   cd freeflow
   ```

2. Install the package dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server with Hot Module Replacement and live reload:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:3000` (or the port specified by the dev system) to access the canvas. Ensure you grant **Camera Access** permissions when prompted.

### Production Build

To build the optimized static asset bundle for production deployment:
```bash
npm run build
```
The output files will be generated inside the `dist/` folder, ready to be hosted on any static web provider or cloud engine.

---

## 🎨 Design Philosophy

FreeFlow was built with modern aesthetic guidelines in mind:
- **Clean Slate**: Leverages dark mode (`slate-950`) as the foundation to make colors pop and keep eyes safe during long drawing sessions.
- **Minimalist Margin Clutter**: Keeps helper text, indicators, and canvas gridlines clean, lightweight, and unintrusive so you can focus entirely on the hand-drawing experience.
- **Responsive Sizing**: The canvas auto-scales gracefully using a robust resize loop, making it compatible with varying browser window proportions.

---

Let your hands be the brush! Happy drawing with **FreeFlow**! 🌌
