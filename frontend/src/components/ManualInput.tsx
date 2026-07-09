import React, { useState } from 'react';
import { Keyboard, ArrowRight } from 'lucide-react';

interface ManualInputProps {
  onCalculate: (numbers: number[]) => void;
}

export const ManualInput: React.FC<ManualInputProps> = ({ onCalculate }) => {
  const [inputs, setInputs] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (index: number, value: string) => {
    // Only allow positive integers
    if (value !== '' && !/^\d+$/.test(value)) return;

    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate that all fields are filled
    if (inputs.some((val) => val === '')) {
      setError('Please enter all four numbers.');
      return;
    }

    const numbers = inputs.map((val) => parseInt(val, 10));

    // Validate ranges [0, 100]
    if (numbers.some((num) => num < 0 || num > 100)) {
      setError('Every number must be between 0 and 100.');
      return;
    }

    // Trigger calculation callback
    onCalculate(numbers);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 mb-6">
      <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2.5 mb-6 text-gray-900">
          <div className="p-2 bg-gray-100 rounded-xl">
            <Keyboard className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Manual Entry Mode</h2>
            <p className="text-xs text-gray-400 font-medium">Type your sequence values below to perform calculations.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-4 gap-3 md:gap-6">
            {inputs.map((val, idx) => {
              const label = ['A', 'B', 'C', 'D'][idx];
              return (
                <div key={idx} className="flex flex-col items-center gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Value {label}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    placeholder="0"
                    value={val}
                    onChange={(e) => handleInputChange(idx, e.target.value)}
                    className="w-full text-center font-mono text-2xl font-bold text-gray-900 border border-gray-200 rounded-2xl py-3.5 focus:border-gray-900 focus:outline-none bg-gray-50 focus:bg-white transition-all shadow-sm"
                  />
                </div>
              );
            })}
          </div>

          {error && (
            <div className="text-xs font-semibold text-center text-rose-500 bg-rose-50 border border-rose-100 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-2xl active:scale-[0.99] transition-all shadow-md shadow-gray-200"
          >
            <span>Run Sequence Checker</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
