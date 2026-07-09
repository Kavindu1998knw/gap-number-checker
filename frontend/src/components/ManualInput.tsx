import React, { useState, useEffect, useRef } from 'react';
import { Keyboard } from 'lucide-react';

interface ManualInputProps {
  onCalculate: (numbers: number[]) => void;
}

export const ManualInput: React.FC<ManualInputProps> = ({ onCalculate }) => {
  const [inputs, setInputs] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);

  // Focus refs for inputs A, B, C, D
  const inputRefA = useRef<HTMLInputElement>(null);
  const inputRefB = useRef<HTMLInputElement>(null);
  const inputRefC = useRef<HTMLInputElement>(null);
  const inputRefD = useRef<HTMLInputElement>(null);

  const refs = [inputRefA, inputRefB, inputRefC, inputRefD];

  // Auto-focus input A when the component mounts
  useEffect(() => {
    // Small timeout ensures browser focus is captured successfully
    const timer = setTimeout(() => {
      inputRefA.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value !== '' && !/^\d+$/.test(value)) return;

    // Limit to maximum 2 digits
    const cleanValue = value.slice(0, 2);

    const newInputs = [...inputs];
    newInputs[index] = cleanValue;
    setInputs(newInputs);
    setError(null);

    // Auto-focus logic:
    // If user has typed exactly 2 digits, move to next box or submit if last box
    if (cleanValue.length === 2) {
      if (index < 3) {
        refs[index + 1].current?.focus();
      } else {
        // Last box filled (Value D). Automatically submit calculations.
        const numbers = newInputs.map((val) => parseInt(val, 10));

        // Validation
        if (numbers.some((num) => isNaN(num) || num < 0 || num > 100)) {
          setError('Please verify that all inputs are valid numbers between 0 and 100.');
          return;
        }

        onCalculate(numbers);
      }
    }
  };

  // Backspace helper: move focus to previous input if current is empty
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && inputs[index] === '' && index > 0) {
      refs[index - 1].current?.focus();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-6">
      <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2.5 mb-6 text-gray-900">
          <div className="p-2 bg-gray-100 rounded-xl">
            <Keyboard className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Manual Entry</h2>
            <p className="text-xs text-gray-400 font-medium">
              Type 2 digits in each box. The sequence will calculate automatically on the last digit.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-3 md:gap-6">
            {inputs.map((val, idx) => {
              const label = ['A', 'B', 'C', 'D'][idx];
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Value {label}
                  </label>
                  <input
                    ref={refs[idx]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    placeholder="00"
                    value={val}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className="w-full text-center font-mono text-2xl font-bold text-gray-900 border border-gray-200 rounded-2xl py-3.5 focus:border-gray-900 focus:outline-none bg-gray-50 focus:bg-white transition-all shadow-sm focus:ring-2 focus:ring-gray-900/5"
                  />
                </div>
              );
            })}
          </div>

          {error && (
            <div className="text-xs font-semibold text-center text-rose-500 bg-rose-50 border border-rose-100 py-3 rounded-xl animate-pulse">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
