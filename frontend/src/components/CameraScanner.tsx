'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Camera, X, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CameraScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onScan, onClose }) => {
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Initialize ZXing reader and list cameras
  useEffect(() => {
    const reader = new BrowserMultiFormatReader();
    codeReaderRef.current = reader;

    // Check device camera support and request permission
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        setHasPermission(true);
        // Stop stream immediately since we only used it for permission check
        stream.getTracks().forEach(track => track.stop());
        
        // List camera inputs
        reader.listVideoInputDevices()
          .then((videoInputDevices) => {
            setVideoDevices(videoInputDevices);
            if (videoInputDevices.length > 0) {
              // Select back camera by default for mobile device if available
              const backCamera = videoInputDevices.find(device => 
                device.label.toLowerCase().includes('back') || 
                device.label.toLowerCase().includes('rear') || 
                device.label.toLowerCase().includes('environment')
              );
              setSelectedDeviceId(backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId);
            } else {
              toast.error('No camera input devices detected');
            }
          })
          .catch((err) => {
            console.error('Error listing camera devices:', err);
          });
      })
      .catch((err) => {
        console.error('Camera permission denied:', err);
        setHasPermission(false);
        toast.error('Camera access permission is required to scan.');
      });

    return () => {
      // Clean up scanning processes on unmount
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  // Start scanning when camera is selected
  useEffect(() => {
    if (selectedDeviceId && hasPermission && videoRef.current && codeReaderRef.current) {
      setIsScanning(true);
      
      codeReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const scannedText = result.getText();
            toast.success(`Code detected: ${scannedText}`);
            onScan(scannedText);
            // Vibrate device if supported
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
            onClose(); // Auto close on successful scan
          }
          if (err && !(err instanceof NotFoundException)) {
            // Log real decoder errors, ignore normal "not found in frame" polls
            console.error('Scan decoding error:', err);
          }
        }
      );
    }

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
      setIsScanning(false);
    };
  }, [selectedDeviceId, hasPermission, onScan, onClose]);

  const toggleCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentIndex = videoDevices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    setSelectedDeviceId(videoDevices[nextIndex].deviceId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-[#090d22] border border-sky-900/50 shadow-[0_0_50px_rgba(0,242,254,0.15)] flex flex-col relative">
        
        {/* Header */}
        <div className="p-5 border-b border-sky-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400">
            <Camera size={18} />
            <span className="font-semibold text-slate-200">Device Barcode/QR Scanner</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-sky-950/40 hover:bg-rose-950/20 text-slate-400 hover:text-rose-400 border border-sky-900/30 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Video Screen */}
        <div className="flex-1 min-h-[300px] bg-slate-950 relative flex items-center justify-center overflow-hidden">
          
          {hasPermission === false && (
            <div className="p-6 text-center max-w-xs flex flex-col items-center gap-3">
              <AlertCircle className="text-rose-500 w-12 h-12 animate-bounce" />
              <p className="text-sm text-slate-300">Camera permission has been blocked or is unavailable. Please check site permissions in your browser settings.</p>
            </div>
          )}

          {hasPermission === null && (
            <div className="text-center py-10 flex flex-col items-center gap-2">
              <RefreshCw className="text-cyan-400 animate-spin w-8 h-8" />
              <p className="text-xs text-slate-400">Requesting camera access...</p>
            </div>
          )}

          {hasPermission && (
            <>
              {/* Video Element */}
              <video 
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />

              {/* Scanning Target Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-dashed border-cyan-400/40 rounded-3xl relative flex items-center justify-center">
                  
                  {/* Neon Glowing Corners */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl -mt-1 -ml-1 shadow-[0_0_10px_#00F2FE]" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl -mt-1 -mr-1 shadow-[0_0_10px_#00F2FE]" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl -mb-1 -ml-1 shadow-[0_0_10px_#00F2FE]" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-xl -mb-1 -mr-1 shadow-[0_0_10px_#00F2FE]" />
                  
                  {/* Laser line scanner animation */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent absolute top-1/2 left-0 animate-bounce shadow-[0_0_12px_#00F2FE]" />

                  {isScanning && (
                    <span className="text-[10px] text-cyan-400/80 uppercase font-mono tracking-widest absolute bottom-4 animate-pulse">
                      Align Barcode or QR
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer controls */}
        {hasPermission && videoDevices.length > 0 && (
          <div className="p-4 border-t border-sky-950/40 bg-sky-950/10 flex flex-col gap-3">
            <div className="flex gap-2">
              <select 
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="flex-1 bg-[#0a0f28] text-xs text-slate-200 border border-sky-900/50 rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-400 transition-colors"
              >
                {videoDevices.map((device, idx) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>

              {videoDevices.length > 1 && (
                <button
                  onClick={toggleCamera}
                  className="p-2.5 rounded-xl bg-sky-900/30 hover:bg-sky-900/50 border border-sky-900/30 text-cyan-400 hover:text-cyan-300 transition-colors"
                  title="Switch Camera"
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </div>
            
            <p className="text-[10px] text-slate-400 text-center">
              Scanning occurs locally and securely in real-time. Supports UPC, EAN, QR Codes, and serial labels.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
