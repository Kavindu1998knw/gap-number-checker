import { useState, useEffect, useCallback, useRef } from 'react';
import type { CameraState, CameraStatus } from '../types';

export function useCamera() {
  const [cameraState, setCameraState] = useState<CameraState>({
    status: 'idle',
    error: null,
    devices: [],
    activeDeviceId: null,
  });

  const streamRef = useRef<MediaStream | null>(null);

  // Helper to stop all tracks in the current stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log(`Camera track ${track.label} stopped`);
      });
      streamRef.current = null;
    }
    setCameraState((prev) => ({
      ...prev,
      status: 'idle',
    }));
  }, []);

  // Lists all available video input devices
  const enumerateDevices = useCallback(async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((device) => device.kind === 'videoinput');
      
      setCameraState((prev) => ({
        ...prev,
        devices: videoDevices,
      }));
      return videoDevices;
    } catch (error) {
      console.error('Error enumerating video devices:', error);
      return [];
    }
  }, []);

  // Starts the camera stream
  const startCamera = useCallback(async (deviceId?: string) => {
    // Stop any existing camera tracks first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setCameraState((prev) => ({
      ...prev,
      status: 'loading',
      error: null,
    }));

    // Build constraints. Mobile rear camera is preferred by default using "ideal: 'environment'"
    const constraints: MediaStreamConstraints = {
      audio: false,
      video: deviceId
        ? { deviceId: { exact: deviceId } }
        : {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Enumerate devices to get labels and IDs (useful for camera selectors)
      const devices = await enumerateDevices();
      
      // Determine active device ID from the tracks
      const activeVideoTrack = stream.getVideoTracks()[0];
      const activeSettings = activeVideoTrack?.getSettings();
      const activeId = activeSettings?.deviceId || deviceId || (devices[0]?.deviceId ?? null);

      setCameraState((prev) => ({
        ...prev,
        status: 'active',
        activeDeviceId: activeId,
        error: null,
      }));
    } catch (err: any) {
      console.error('Error accessing camera:', err);
      let status: CameraStatus = 'error';
      let errorMsg = 'Could not access the camera. Make sure it is connected and not in use by another app.';

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        status = 'denied';
        errorMsg = 'Camera permission was denied. Please check your browser settings to allow camera access.';
      }

      setCameraState((prev) => ({
        ...prev,
        status,
        error: errorMsg,
      }));
    }
  }, [enumerateDevices]);

  // Switch camera to a specific device ID
  const switchCamera = useCallback(async (deviceId: string) => {
    await startCamera(deviceId);
  }, [startCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    stream: streamRef.current,
    status: cameraState.status,
    error: cameraState.error,
    devices: cameraState.devices,
    activeDeviceId: cameraState.activeDeviceId,
    startCamera,
    stopCamera,
    switchCamera,
  };
}
