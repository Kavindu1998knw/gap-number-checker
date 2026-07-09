// Global declaration for OpenCV (cv)
/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    cv: any;
    Module: any;
  }
}

let openCvLoadingPromise: Promise<void> | null = null;

export function loadOpenCV(): Promise<void> {
  if (openCvLoadingPromise) {
    return openCvLoadingPromise;
  }

  const sources = [
    'https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.6.0/dist/opencv.js',
    'https://docs.opencv.org/4.10.0/opencv.js'
  ];

  openCvLoadingPromise = new Promise<void>((resolve, reject) => {
    // If cv is already defined and loaded
    if (window.cv && window.cv.Mat) {
      resolve();
      return;
    }

    // Set up runtime initialized callback
    window.Module = {
      onRuntimeInitialized: () => {
        console.log('OpenCV.js is fully loaded and initialized');
        resolve();
      }
    };

    let currentIndex = 0;

    const loadNext = () => {
      if (currentIndex >= sources.length) {
        openCvLoadingPromise = null;
        reject(new Error('Failed to load OpenCV library from all available CDN sources.'));
        return;
      }

      console.log(`Attempting to load OpenCV.js from: ${sources[currentIndex]}`);
      const script = document.createElement('script');
      script.src = sources[currentIndex];
      script.async = true;
      script.type = 'text/javascript';

      script.onload = () => {
        // Double-check if cv is ready immediately or after a small delay
        setTimeout(() => {
          if (window.cv && window.cv.Mat) {
            console.log('OpenCV.js loaded and validated');
            resolve();
          }
        }, 100);
      };

      script.onerror = (err) => {
        console.warn(`Failed to load OpenCV.js from ${sources[currentIndex]}. Trying next source...`, err);
        try {
          document.body.removeChild(script);
        } catch (e) {
          // Ignore if already removed
        }
        currentIndex++;
        loadNext();
      };

      document.body.appendChild(script);
    };

    loadNext();
  });

  return openCvLoadingPromise;
}

/**
 * Preprocesses a canvas image for OCR using OpenCV.js.
 * Steps:
 * 1. Convert to grayscale
 * 2. Increase contrast (using convertTo or adaptive contrast)
 * 3. Noise removal (Gaussian blur)
 * 4. Adaptive thresholding (to binarize the text)
 * 
 * @param sourceCanvas HTMLCanvasElement containing the cropped scan region
 * @param targetCanvas HTMLCanvasElement to draw the processed image onto
 */
export function preprocessImage(
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement
): void {
  const cv = window.cv;
  if (!cv || !cv.Mat) {
    throw new Error('OpenCV is not loaded');
  }

  // Read image from source canvas
  const src = cv.imread(sourceCanvas);
  const gray = new cv.Mat();
  const contrast = new cv.Mat();
  const blurred = new cv.Mat();
  const thresholded = new cv.Mat();

  try {
    // 1. Convert to Grayscale
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // 2. Increase Contrast
    // Adjust brightness/contrast: dest = alpha * src + beta
    // alpha = 1.4 (scale factor for contrast), beta = -20 (brightness shift)
    gray.convertTo(contrast, -1, 1.4, -20);

    // 3. Noise removal using Gaussian Blur
    const ksize = new cv.Size(3, 3);
    cv.GaussianBlur(contrast, blurred, ksize, 0, 0, cv.BORDER_DEFAULT);

    // 4. Adaptive Thresholding (Creates clean black and white image)
    // block size = 11, constant C = 2
    cv.adaptiveThreshold(
      blurred,
      thresholded,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11,
      2
    );

    // 5. Draw the final result back to the target canvas
    cv.imshow(targetCanvas, thresholded);
  } catch (error) {
    console.error('Error in OpenCV image preprocessing:', error);
    throw error;
  } finally {
    // Free OpenCV memory
    src.delete();
    gray.delete();
    contrast.delete();
    blurred.delete();
    thresholded.delete();
  }
}

/**
 * Helper to crop a specific portion of a video/canvas onto a target canvas.
 * This satisfies "Crop only the scan region" requirement.
 */
export function cropScanRegion(
  videoElement: HTMLVideoElement,
  targetCanvas: HTMLCanvasElement,
  guideRect: { x: number; y: number; width: number; height: number }
): void {
  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  // Set the target canvas resolution to the crop guide bounds
  targetCanvas.width = guideRect.width;
  targetCanvas.height = guideRect.height;

  // Draw only the specified sub-rectangle of the video feed onto target canvas
  ctx.drawImage(
    videoElement,
    guideRect.x,
    guideRect.y,
    guideRect.width,
    guideRect.height,
    0,
    0,
    guideRect.width,
    guideRect.height
  );
}
