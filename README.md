# Gap Number Checker

Gap Number Checker is a production-ready, highly responsive web application that utilizes client-side Computer Vision (OpenCV.js) and Optical Character Recognition (Tesseract.js OCR) to detect and analyze sequences of numbers from a device camera feed.

## Key Features
- **Real-Time Camera Scan**: Automatically opens the mobile device rear camera (or defaults to standard desktop webcam) and continuously scans video frames.
- **Rectangular Scan Guide Overlay**: Restricts OCR processing strictly to a cropped visual region.
- **OpenCV.js Preprocessing**: Converts frames to grayscale, enhances contrast, applies Gaussian blur noise reduction, and uses adaptive thresholding to produce clean black-and-white images optimized for text detection.
- **Tesseract.js OCR Engine**: Detects sequence numbers in the preprocessed crop and enforces a strict sequence structure:
  - Exactly 4 numbers.
  - All values must be in range `[0, 100]`.
  - Words sorted physically from left to right on the screen.
- **Calculations & Result Animation**: Computes gaps, expected last digit, and flashes a 2-second fullscreen Red X or Green Check overlay.
- **In-Memory Express History Server**: Logs scans and syncs a history feed. Works in fallback offline/local mode if the backend is unavailable.

---

## Technology Stack

### Frontend
- **Framework**: React (Latest, with TypeScript)
- **Bundler**: Vite
- **Styling**: Tailwind CSS (v3) + CSS3
- **CV Engine**: OpenCV.js
- **OCR Engine**: Tesseract.js

### Backend
- **Framework**: Node.js + Express
- **Middleware**: CORS, JSON parser

---

## Calculations Logic

Assuming four scanned numbers: **A, B, C, D** (where each number is between `0` and `100`):

1. **Gaps Calculation**:
   - `gap1 = B - A`
   - `gap2 = C - B`
   - `gap3 = D - C`
2. **Aggregates**:
   - `totalGap = gap1 + gap2 + gap3` (Simplifies mathematically to `D - A`)
   - `expectedLast = A + totalGap` (Simplifies mathematically to `D`)
3. **Comparison Validation**:
   - If `expectedLast === D`: Displays a large **RED X** (sequence halted).
   - If `expectedLast !== D`: Displays a large **GREEN CHECK MARK** (sequence passed).
   - The result shows as a fullscreen animated overlay for exactly **2 seconds**, during which camera scanning is paused, then resumes automatically.

---

## Getting Started

### Prerequisites
Make sure you have **Node.js** (v18+ recommended) and **npm** installed on your system.

### Installation
Run the following script from the root project directory to install dependencies for the root, frontend, and backend packages:
```bash
npm run install:all
```

### Running Locally
To launch both the React Vite frontend and the Express backend concurrently in development mode:
```bash
npm run dev
```

The application will be accessible at:
- **Frontend Dev Server**: [http://localhost:5173](http://localhost:5173) (or the port displayed in terminal)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)

*Note: The frontend will automatically run in local-offline fallback mode if the Express backend is not running on port 5000.*

---

## Directory Structure

```
g:\Project\Lottery/
├── package.json                 # Workspace orchestrator
├── .gitignore                   # Exclude modules & builds
├── README.md                    # Setup documentation
├── backend/                     # Node.js + Express Backend
│   ├── package.json             # Backend dependencies
│   └── src/
│       └── server.js            # Express server and endpoints
└── frontend/                    # React + TypeScript Frontend
    ├── package.json             # Frontend dependencies
    ├── vite.config.ts           # Vite configurations
    ├── tailwind.config.js       # Tailwind definitions
    ├── postcss.config.js        # PostCSS configuration
    ├── vercel.json              # Vercel deployment routing
    └── src/
        ├── main.tsx             # Entry hook
        ├── index.css            # Style directives & keyframe animations
        ├── App.tsx              # Main controller and API sync state
        ├── types/
        │   └── index.ts         # TypeScript definitions
        ├── hooks/
        │   └── useCamera.ts     # Camera lifecycle and selector utilities
        ├── utils/
        │   ├── calculations.ts  # Gap arithmetic logic
        │   ├── imageProcessing.ts# OpenCV.js loader & image preprocessors
        │   └── ocr.ts           # Tesseract.js recognizer & filters
        └── components/
            ├── Header.tsx       # Brand and dynamic status indicators
            ├── CameraScanner.tsx# Video viewport, guides, OpenCV canvas loops
            ├── DataPanel.tsx    # Current calculation layout & history feed
            └── ResultOverlay.tsx# Screen overlay feedback symbols
```

---

## Deployment Configuration

### Frontend (Vercel)
The project contains a `vercel.json` rewrite configuration:
- Builds Vite production code from the `frontend` folder.
- Configures API proxying from `/api/*` to the Render-deployed backend.
- Set the build directory on Vercel as `frontend/dist` and build command as `npm run build` in the frontend directory.

### Backend (Render)
- Deploy the `backend/` directory to Render as a Web Service.
- Build command: `npm install`
- Start command: `node src/server.js`
- Set the environment variable `PORT` to default.
- Set `VITE_API_URL` in the frontend build settings to point to your live Render backend service URL.
