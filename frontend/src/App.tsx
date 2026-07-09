import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { CameraScanner } from './components/CameraScanner';
import { DataPanel } from './components/DataPanel';
import { ResultOverlay } from './components/ResultOverlay';
import { calculateGaps } from './utils/calculations';
import type { OCRState, ScanResult } from './types';
import { AlertCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [ocrState, setOcrState] = useState<OCRState>({
    status: 'idle',
    message: 'Press start to initialize',
    confidence: 0,
    lastScannedTime: 0,
  });

  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [isOverlayActive, setIsOverlayActive] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Fetch scan history from Node.js backend
  const fetchHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    setNetworkError(null);
    try {
      const response = await fetch(`${API_BASE}/history`);
      if (!response.ok) {
        throw new Error('Failed to retrieve history');
      }
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (err: any) {
      console.warn('Backend server seems offline. Operating in client-only mode.', err.message);
      setNetworkError('Server offline. Operating in offline/local-only mode.');
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Save scan result to Node.js backend
  const saveScanToBackend = async (scan: ScanResult) => {
    try {
      const response = await fetch(`${API_BASE}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scan),
      });

      if (!response.ok) {
        throw new Error('Failed to save scan to server.');
      }
      
      // Refresh local list
      await fetchHistory();
    } catch (err: any) {
      console.warn('Backend server offline. Saving scan locally only.', err.message);
      // Fallback: update local state history directly if backend is offline
      const mockLoggedScan = {
        ...scan,
        id: `local_${Date.now()}`,
      };
      setHistory((prev) => [mockLoggedScan, ...prev].slice(0, 50));
    }
  };

  // Clear scan history
  const handleClearHistory = async () => {
    try {
      const response = await fetch(`${API_BASE}/history`, { method: 'DELETE' });
      if (response.ok) {
        setHistory([]);
      }
    } catch (err: any) {
      console.warn('Backend server offline. Clearing history locally.', err.message);
      setHistory([]);
    }
  };

  // Callback from CameraScanner when 4 valid numbers are identified
  const handleScanSuccess = async (result: ScanResult) => {
    // 1. Calculate gaps and values using the core formula
    const processedResult = calculateGaps(result.numbers);
    
    // 2. Update state to trigger rendering calculations and visual overlay
    setLastResult(processedResult);
    setIsOverlayActive(true);

    // 3. Write results to backend database/log
    await saveScanToBackend(processedResult);

    // 4. Leave overlay open for exactly 2 seconds before resuming scanning
    setTimeout(() => {
      setIsOverlayActive(false);
    }, 2000);
  };

  // Initial load
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between py-6">
      
      <div>
        <Header ocrStatus={ocrState.status} ocrMessage={ocrState.message} />

        {networkError && (
          <div className="w-full max-w-4xl mx-auto px-4 mb-4">
            <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-200 px-4 py-3 rounded-xl text-xs font-semibold shadow-sm">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>{networkError}</span>
            </div>
          </div>
        )}

        <CameraScanner
          onScanSuccess={handleScanSuccess}
          ocrState={ocrState}
          setOcrState={setOcrState}
          isOverlayActive={isOverlayActive}
        />

        <DataPanel
          lastResult={lastResult}
          history={history}
          onClearHistory={handleClearHistory}
          onRefreshHistory={fetchHistory}
          isLoadingHistory={isLoadingHistory}
        />
      </div>

      <footer className="w-full max-w-4xl mx-auto px-4 text-center text-xs font-medium text-gray-400 border-t border-gray-100 pt-6">
        <div>Gap Number Checker • Built with React, OpenCV.js & Tesseract.js</div>
      </footer>

      {/* Fullscreen 2-second Checkmark/Cross animation overlay */}
      <ResultOverlay
        isVisible={isOverlayActive}
        isCorrect={lastResult?.isCorrect ?? false}
        numbers={lastResult?.numbers ?? []}
      />
    </div>
  );
}
