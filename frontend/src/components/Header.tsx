import React from 'react';
import { Scan, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { OCRStatus } from '../types';

interface HeaderProps {
  ocrStatus: OCRStatus;
  ocrMessage: string;
}

export const Header: React.FC<HeaderProps> = ({ ocrStatus, ocrMessage }) => {
  return (
    <header className="w-full max-w-4xl mx-auto mb-6 px-4">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 rounded-2xl glass-panel shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gray-900 text-white rounded-xl shadow-md">
            <Scan className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gap Number Checker</h1>
            <p className="text-xs font-medium text-gray-500">Real-time Computer Vision Sequence Analysis</p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-gray-100 shadow-sm text-sm">
          {ocrStatus === 'loading_opencv' ? (
            <div className="flex items-center gap-2 text-amber-600 font-medium">
              <div className="spinner" />
              <span>Loading OpenCV.js...</span>
            </div>
          ) : ocrStatus === 'scanning' ? (
            <div className="flex items-center gap-2 text-emerald-600 font-medium">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Scanning live feed...</span>
            </div>
          ) : ocrStatus === 'opencv_ready' ? (
            <div className="flex items-center gap-2 text-blue-600 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>OpenCV Ready</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-600 font-medium">
              <AlertTriangle className="w-4 h-4 text-gray-400" />
              <span>{ocrMessage || 'Ready'}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
