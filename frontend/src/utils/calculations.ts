import type { ScanResult } from '../types';

/**
 * Calculates gaps and expected numbers based on the user's specific formula.
 * 
 * Formula:
 * A = first, B = second, C = third, D = fourth
 * gap1 = B - A
 * gap2 = C - B
 * gap3 = D - C
 * totalGap = gap1 + gap2 + gap3
 * expectedLast = A + totalGap
 * 
 * If expectedLast === D: Show RED X
 * If expectedLast !== D: Show GREEN CHECK MARK
 * 
 * @param numbers Array of 4 numbers
 * @returns ScanResult object containing all calculated gaps and states
 */
export function calculateGaps(numbers: number[]): ScanResult {
  if (numbers.length !== 4) {
    throw new Error('Calculations require exactly 4 numbers.');
  }

  const [A, B, C, D] = numbers;

  const gap1 = B - A;
  const gap2 = C - B;
  const gap3 = D - C;
  
  const totalGap = gap1 + gap2 + gap3;
  const expectedLast = A + totalGap;

  // If expectedLast equals D, we show RED X.
  // Let's use isCorrect to represent whether the result is correct/valid.
  // Wait, the prompt says:
  // "If expectedLast equals D: Display a large RED X.
  //  If expectedLast is NOT equal to D: Display a large GREEN CHECK MARK."
  // So we'll save this boolean as `isCorrect = expectedLast !== D` (i.e. if it's NOT equal, isCorrect is true (GREEN CHECK), if equal, isCorrect is false (RED X))
  const isCorrect = expectedLast !== D;

  return {
    numbers,
    gaps: [gap1, gap2, gap3],
    totalGap,
    expectedLast,
    isCorrect,
    timestamp: new Date().toISOString(),
  };
}
