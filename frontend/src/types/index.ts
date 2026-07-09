export interface ScanResult {
  id?: string;
  numbers: number[];
  gaps: number[];
  totalGap: number;
  expectedLast: number;
  isCorrect: boolean;
  timestamp: string;
}

export type CameraStatus = 'idle' | 'loading' | 'active' | 'denied' | 'error';

export interface CameraState {
  status: CameraStatus;
  error: string | null;
  devices: MediaDeviceInfo[];
  activeDeviceId: string | null;
}

export type OCRStatus = 'idle' | 'loading_opencv' | 'opencv_ready' | 'scanning' | 'success' | 'failed';

export interface OCRState {
  status: OCRStatus;
  message: string;
  confidence: number;
  lastScannedTime: number;
}
