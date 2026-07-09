import { createWorker } from 'tesseract.js';
import type { Worker } from 'tesseract.js';

let ocrWorker: Worker | null = null;
let isInitializing = false;

/**
 * Initializes the Tesseract.js worker with english language
 * and whitelists digits and spaces, optimizing for a single horizontal text line.
 */
export async function getOCRWorker(): Promise<Worker> {
  if (ocrWorker) {
    return ocrWorker;
  }

  if (isInitializing) {
    // Wait a brief moment and check again if loading
    await new Promise((resolve) => setTimeout(resolve, 100));
    return getOCRWorker();
  }

  isInitializing = true;

  try {
    console.log('Initializing Tesseract.js Worker...');
    // Create worker using 'eng' language
    const worker = await createWorker('eng');
    
    // Set custom OCR parameters: whitelist only digits and spaces, 
    // and set page segmentation mode to 7 (Single line of text)
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789 ',
      tessedit_pageseg_mode: '7' as any, // 7 = Treat the image as a single text line.
    });

    ocrWorker = worker;
    console.log('Tesseract.js Worker initialized successfully');
    return ocrWorker;
  } catch (error) {
    console.error('Error initializing Tesseract.js Worker:', error);
    isInitializing = false;
    throw error;
  } finally {
    isInitializing = false;
  }
}

interface OCRWordMatch {
  value: number;
  x0: number;
  confidence: number;
}

/**
 * Recognizes numbers from a preprocessed canvas.
 * Filters and validates the results based on:
 * - Exactly four numbers.
 * - Every value is between 0 and 100.
 * - Sorted left to right physically on the image.
 * - Rejects if confidence is below standard thresholds.
 * 
 * @param canvas HTMLCanvasElement containing preprocessed binary image
 * @param minConfidence Minimum acceptable OCR confidence (0-100)
 */
export async function recognizeNumbers(
  canvas: HTMLCanvasElement,
  minConfidence: number = 60
): Promise<{ numbers: number[]; confidence: number } | null> {
  try {
    const worker = await getOCRWorker();
    
    // Perform OCR
    const { data } = await worker.recognize(canvas);
    
    if (!data || !data.words || data.words.length === 0) {
      return null;
    }

    const validMatches: OCRWordMatch[] = [];

    for (const word of data.words) {
      // Remove any whitespace and try to parse the clean text
      const cleanText = word.text.trim();
      if (!cleanText) continue;

      const num = parseInt(cleanText, 10);

      // Check if it is a valid integer between 0 and 100
      if (!isNaN(num) && num >= 0 && num <= 100) {
        // Enforce a per-word confidence check
        if (word.confidence >= minConfidence) {
          validMatches.push({
            value: num,
            x0: word.bbox.x0,
            confidence: word.confidence,
          });
        }
      }
    }

    // Sort matches from left to right based on their starting X coordinate (x0)
    validMatches.sort((a, b) => a.x0 - b.x0);

    // Filter out duplicates at close coordinates if any (unlikely with words, but safe)
    // Validate we have EXACTLY four numbers
    if (validMatches.length !== 4) {
      console.log(`OCR scan rejected: found ${validMatches.length} numbers (need exactly 4)`, 
        validMatches.map(m => m.value)
      );
      return null;
    }

    const numbers = validMatches.map((m) => m.value);
    const averageConfidence = validMatches.reduce((acc, m) => acc + m.confidence, 0) / 4;

    console.log('OCR scan accepted:', numbers, `Confidence: ${averageConfidence}%`);

    return {
      numbers,
      confidence: averageConfidence,
    };
  } catch (error) {
    console.error('Error during OCR processing:', error);
    return null;
  }
}

/**
 * Terminates the OCR worker if running to free up memory.
 */
export async function terminateOCRWorker(): Promise<void> {
  if (ocrWorker) {
    await ocrWorker.terminate();
    ocrWorker = null;
    console.log('Tesseract.js Worker terminated');
  }
}
