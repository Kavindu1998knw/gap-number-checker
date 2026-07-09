import React from 'react';
import { Check, X } from 'lucide-react';

interface ResultOverlayProps {
  isVisible: boolean;
  isCorrect: boolean; // if expectedLast !== D, this is true (GREEN CHECK). if expectedLast === D, this is false (RED X)
  numbers: number[];
}

export const ResultOverlay: React.FC<ResultOverlayProps> = ({ isVisible, isCorrect, numbers }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="text-center p-8 rounded-3xl max-w-sm w-full mx-4 bg-white/90 shadow-2xl border border-white/20 animate-scale-up">
        {/* Animated Icon Container */}
        <div className="flex justify-center mb-6">
          {isCorrect ? (
            <div className="w-32 h-32 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-200 border-4 border-emerald-200 animate-pulse-slow">
              <Check className="w-20 h-20 stroke-[3]" />
            </div>
          ) : (
            <div className="w-32 h-32 flex items-center justify-center rounded-full bg-rose-100 text-rose-600 shadow-lg shadow-rose-200 border-4 border-rose-200 animate-pulse-slow">
              <X className="w-20 h-20 stroke-[3]" />
            </div>
          )}
        </div>

        {/* Text Details */}
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 mb-2">
          {isCorrect ? 'Sequence Passed' : 'Sequence Halted'}
        </h2>
        <p className="text-sm text-gray-500 font-medium mb-4">
          {isCorrect 
            ? 'The final digit is NOT equal to the total gap sum!' 
            : 'The final digit matches the expected gap sum!'}
        </p>

        {/* Display detected numbers inside overlay */}
        <div className="inline-flex gap-2 justify-center bg-gray-950/5 px-4 py-2 rounded-xl text-lg font-mono font-bold text-gray-800">
          {numbers.map((num, i) => (
            <React.Fragment key={i}>
              <span>{num}</span>
              {i < numbers.length - 1 && <span className="text-gray-300">|</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};
