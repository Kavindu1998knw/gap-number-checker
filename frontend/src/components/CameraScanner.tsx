import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, Eye, EyeOff, ShieldAlert, Sparkles } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import type { OCRState, ScanResult } from '../types';
import { loadOpenCV, cropScanRegion, preprocessImage } from '../utils/imageProcessing';
import { recognizeNumbers } from '../utils/ocr';

interface CameraScannerProps {
  onScanSuccess: (result: ScanResult) => void;
  ocrState: OCRState;
  setOcrState: React.Dispatch<React.SetStateAction<OCRState>>;
  isOverlayActive: boolean;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  onScanSuccess,
  ocrState,
  setOcrState,
  isOverlayActive,
}) => {
  const {
    stream,
    status: cameraStatus,
    devices,
    activeDeviceId,
    startCamera,
    stopCamera,
    switchCamera,
  } = useCamera();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const targetCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [isProcessingFrame, setIsProcessingFrame] = useState<boolean>(false);
  const scanIntervalRef = useRef<any | null>(null);

  // Initialize OpenCV and start the camera
  useEffect(() => {
    const initialize = async () => {
      setOcrState({
        status: 'loading_opencv',
        message: 'Initializing Computer Vision library...',
        confidence: 0,
        lastScannedTime: Date.now(),
      });

      try {
        await loadOpenCV();
        setOcrState((prev) => ({
          ...prev,
          status: 'opencv_ready',
          message: 'Computer Vision initialized. Requesting camera...',
        }));

        await startCamera();
      } catch (err: any) {
        setOcrState((prev) => ({
          ...prev,
          status: 'failed',
          message: err.message || 'Initialization failed.',
        }));
      }
    };

    initialize();

    return () => {
      stopCamera();
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, [startCamera, stopCamera, setOcrState]);

  // Connect stream to video element
  useEffect(() => {
    if (videoRef.current && stream && cameraStatus === 'active') {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraStatus]);

  // Main scanning loop
  useEffect(() => {
    const shouldScan = 
      cameraStatus === 'active' && 
      !isOverlayActive && 
      !isProcessingFrame && 
      window.cv && 
      window.cv.Mat;

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    if (shouldScan) {
      // Run scanner every 350ms to keep CPU load low while retaining near real-time feel
      scanIntervalRef.current = setInterval(async () => {
        await captureAndProcessFrame();
      }, 350);
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [cameraStatus, isOverlayActive, isProcessingFrame]);

  // Capture frame, preprocess with OpenCV, run OCR
  const captureAndProcessFrame = async () => {
    const video = videoRef.current;
    const sourceCanvas = sourceCanvasRef.current;
    const targetCanvas = targetCanvasRef.current;

    if (!video || !sourceCanvas || !targetCanvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    setIsProcessingFrame(true);
    setOcrState((prev) => ({ ...prev, status: 'scanning', message: 'Analyzing frame...' }));

    try {
      // Calculate video scaling factors
      const clientWidth = video.clientWidth;
      const clientHeight = video.clientHeight;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      const scaleX = videoWidth / clientWidth;
      const scaleY = videoHeight / clientHeight;

      // Define CSS box dimensions matching the scan guide style
      const guideWidth = clientWidth * 0.85;
      const guideHeight = 85;
      const guideLeft = (clientWidth - guideWidth) / 2;
      const guideTop = (clientHeight - guideHeight) / 2;

      // Map CSS guide box coordinates to the actual video source dimensions
      const guideRect = {
        x: Math.max(0, guideLeft * scaleX),
        y: Math.max(0, guideTop * scaleY),
        width: Math.min(videoWidth, guideWidth * scaleX),
        height: Math.min(videoHeight, guideHeight * scaleY),
      };

      // 1. Crop only the scan guide region from the video feed
      cropScanRegion(video, sourceCanvas, guideRect);

      // 2. Preprocess the cropped frame using OpenCV.js
      preprocessImage(sourceCanvas, targetCanvas);

      // 3. Recognize numbers using Tesseract.js from preprocessed canvas
      const ocrResult = await recognizeNumbers(targetCanvas, 65);

      if (ocrResult) {
        setOcrState((prev) => ({
          ...prev,
          status: 'success',
          message: 'Numbers identified successfully!',
          confidence: ocrResult.confidence,
          lastScannedTime: Date.now(),
        }));

        // Trigger success callback
        onScanSuccess({
          numbers: ocrResult.numbers,
          gaps: [],
          totalGap: 0,
          expectedLast: 0,
          isCorrect: false,
          timestamp: new Date().toISOString(),
        });
      } else {
        setOcrState((prev) => ({
          ...prev,
          status: 'scanning',
          message: 'Searching for four numbers...',
        }));
      }
    } catch (error) {
      console.error('Scan processing error:', error);
    } finally {
      setIsProcessingFrame(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-6">
      <div className="relative overflow-hidden rounded-3xl bg-gray-950 border border-gray-900 shadow-xl flex flex-col items-center">
        
        {/* Top Info Banner inside Camera Box */}
        <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="glass-panel text-gray-900 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 animate-pulse" />
            <span>Horizontal Row Scanner</span>
          </div>
          
          {cameraStatus === 'active' && (
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="pointer-events-auto bg-black/60 hover:bg-black/80 active:scale-95 text-white p-2 rounded-full transition-all border border-white/10"
              title={showDebug ? 'Hide Preprocessing Debug' : 'Show Preprocessing Debug'}
            >
              {showDebug ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Video Frame */}
        <div className="relative w-full h-[400px] md:h-[480px] bg-black flex items-center justify-center overflow-hidden">
          {cameraStatus === 'active' ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 text-gray-400">
              {cameraStatus === 'denied' ? (
                <div className="flex flex-col items-center max-w-md">
                  <ShieldAlert className="w-12 h-12 text-rose-500 mb-3" />
                  <h3 className="text-base font-bold text-white mb-1">Camera Permission Denied</h3>
                  <p className="text-xs text-gray-500 mb-4 px-4 leading-relaxed">
                    We need camera access to capture numbers. Please click the camera icon in your address bar and update your browser permission settings to reload the feed.
                  </p>
                  <button
                    onClick={() => startCamera()}
                    className="flex items-center gap-2 bg-white text-gray-900 font-semibold px-4 py-2 rounded-xl text-xs hover:bg-gray-100 active:scale-95 transition-all shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Camera Permission
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="spinner mb-4 border-t-white" />
                  <p className="text-sm font-semibold text-gray-300">Initializing Scanner...</p>
                  <p className="text-xs text-gray-500 mt-1">{ocrState.message}</p>
                </div>
              )}
            </div>
          )}

          {/* Rectangular Scanning Guide Box */}
          {cameraStatus === 'active' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[85%] h-[85px] border-[3px] border-dashed border-white rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                {/* Laser animation inside guide box */}
                <div className="scanner-laser" />
                
                {/* Helper text under scanner */}
                <div className="absolute -bottom-7 left-0 right-0 text-center">
                  <span className="text-[10px] md:text-xs font-semibold tracking-wider text-white bg-black/60 px-3 py-1 rounded-full border border-white/10 uppercase">
                    {ocrState.message}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Camera Selector and Configuration bar */}
        {cameraStatus === 'active' && (
          <div className="w-full bg-gray-900 border-t border-gray-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-400">
              <Camera className="w-4 h-4 text-white" />
              <span className="font-semibold text-white">Active Device:</span>
              {devices.length > 1 ? (
                <select
                  value={activeDeviceId || ''}
                  onChange={(e) => switchCamera(e.target.value)}
                  className="bg-gray-800 text-white rounded-lg px-2.5 py-1 border border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-600 font-medium"
                >
                  {devices.map((device, idx) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs font-medium text-gray-500">
                  {devices.find((d) => d.deviceId === activeDeviceId)?.label || 'Default Camera'}
                </span>
              )}
            </div>

            {/* Scanning indicator */}
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wide">
                Live Feed OCR Scanning
              </span>
            </div>
          </div>
        )}

        {/* Debug view canvas container (Hidden by default) */}
        {showDebug && cameraStatus === 'active' && (
          <div className="w-full bg-gray-950 p-4 border-t border-gray-900 flex flex-col md:flex-row gap-4 items-center justify-center">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                1. Cropped Source Guide Region
              </span>
              <canvas ref={sourceCanvasRef} className="border border-gray-800 rounded-lg max-h-[85px] object-contain bg-black" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">
                2. OpenCV.js Preprocessed Binary (OCR view)
              </span>
              <canvas ref={targetCanvasRef} className="border border-gray-800 rounded-lg max-h-[85px] object-contain bg-black" />
            </div>
          </div>
        )}

        {/* Invisible canvas hooks used in cropping when debug view is toggled off */}
        <canvas ref={sourceCanvasRef} className="hidden" />
        <canvas ref={targetCanvasRef} className="hidden" />
      </div>
    </div>
  );
};
