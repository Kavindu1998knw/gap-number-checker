import React from 'react';
import type { ScanResult } from '../types';
import { RefreshCw, Trash2, History, AlertCircle } from 'lucide-react';

interface DataPanelProps {
  lastResult: ScanResult | null;
  history: ScanResult[];
  onClearHistory: () => void;
  onRefreshHistory: () => void;
  isLoadingHistory: boolean;
}

export const DataPanel: React.FC<DataPanelProps> = ({
  lastResult,
  history,
  onClearHistory,
  onRefreshHistory,
  isLoadingHistory
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      
      {/* Current/Last Result Card */}
      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-950 inline-block"></span>
            Current Calculation
          </h2>

          {lastResult ? (
            <div className="space-y-4">
              {/* Detected Numbers */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                  Detected Numbers
                </span>
                <div className="flex items-center gap-2 font-mono text-xl font-bold text-gray-900 bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-100">
                  {lastResult.numbers.map((n, i) => (
                    <React.Fragment key={i}>
                      <span>{n}</span>
                      {i < lastResult.numbers.length - 1 && <span className="text-gray-300">|</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Gaps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                    Gap Values
                  </span>
                  <div className="font-mono text-base font-bold text-gray-800 bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-100/80">
                    {lastResult.gaps.map((g, i) => (
                      <React.Fragment key={i}>
                        <span>{g}</span>
                        {i < lastResult.gaps.length - 1 && <span className="text-gray-300"> | </span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                    Total Gap
                  </span>
                  <div className="font-mono text-base font-bold text-gray-800 bg-gray-50/50 px-3 py-2 rounded-xl border border-gray-100/80">
                    {lastResult.totalGap}
                  </div>
                </div>
              </div>

              {/* Expected vs Actual */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                    Expected Last
                  </span>
                  <div className="font-mono text-lg font-extrabold text-blue-600 bg-blue-50/30 px-3.5 py-2.5 rounded-xl border border-blue-100/50">
                    {lastResult.expectedLast}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1">
                    Actual Last
                  </span>
                  <div className="font-mono text-lg font-extrabold text-gray-900 bg-gray-50 px-3.5 py-2.5 rounded-xl border border-gray-100">
                    {lastResult.numbers[3]}
                  </div>
                </div>
              </div>

              {/* Status Banner */}
              <div className="pt-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block mb-1.5">
                  Calculation Status
                </span>
                {lastResult.isCorrect ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 font-semibold text-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Valid sequence progression (Values differ)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-100 font-semibold text-sm">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    <span>Sequence halted (Last value matches expected sum)</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6 text-center">
              <AlertCircle className="w-8 h-8 mb-2 text-gray-300" />
              <p className="text-sm font-semibold text-gray-500 mb-1">No scanned values yet</p>
              <p className="text-xs text-gray-400 max-w-[220px]">
                Position the sequence in the rectangular scanning box above to begin.
              </p>
            </div>
          )}
        </div>
        
        {lastResult && (
          <div className="text-[10px] text-gray-400 text-right mt-4 font-mono">
            Last updated: {new Date(lastResult.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* History Card */}
      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-700" />
              Scan History
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onRefreshHistory}
                disabled={isLoadingHistory}
                className="p-2 hover:bg-gray-50 text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-gray-100 active:scale-95"
                title="Refresh history"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClearHistory}
                disabled={history.length === 0}
                className="p-2 hover:bg-rose-50 text-gray-500 hover:text-rose-600 rounded-lg transition-colors border border-gray-100 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-500 active:scale-95"
                title="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[290px] pr-1 space-y-2">
            {history.length > 0 ? (
              history.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100/50 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-bold text-gray-800">
                        {item.numbers.join(' | ')}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 font-mono font-medium">
                        Exp: {item.expectedLast}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono font-medium">
                        Tot Gap: {item.totalGap}
                      </span>
                    </div>
                    {item.isCorrect ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                        ✓
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                        ✗
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-xl border border-dashed border-gray-100 p-6 text-center">
                <History className="w-8 h-8 mb-2 text-gray-300" />
                <p className="text-sm font-semibold text-gray-500 mb-1">No scanned history</p>
                <p className="text-xs text-gray-400 max-w-[200px]">
                  All processed calculations will be listed here automatically.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] text-gray-400 font-mono mt-4">
          Showing latest {history.length} records
        </div>
      </div>

    </div>
  );
};
