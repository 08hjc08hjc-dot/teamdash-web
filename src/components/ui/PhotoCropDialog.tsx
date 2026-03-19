'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface PhotoCropDialogProps {
  open: boolean;
  imageSrc: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

function getCroppedImg(imageSrc: string, crop: Area, size = 128): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no ctx')); return; }
      ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, size, size);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

export function PhotoCropDialog({ open, imageSrc, onConfirm, onCancel }: PhotoCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedArea) return;
    const dataUrl = await getCroppedImg(imageSrc, croppedArea);
    onConfirm(dataUrl);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative w-[90vw] max-w-sm bg-td-overlay border border-td-border rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-td-border">
          <h3 className="text-sm font-semibold text-td-text">사진 자르기</h3>
          <button onClick={onCancel} className="p-1 text-td-text-muted hover:text-td-text hover:bg-td-hover-strong rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full aspect-square bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom control */}
        <div className="flex items-center gap-3 px-4 py-3 border-t border-td-border">
          <ZoomOut size={14} className="text-td-text-muted shrink-0" />
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 h-1 bg-td-input rounded-full appearance-none cursor-pointer accent-teal-500
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-400 [&::-webkit-slider-thumb]:shadow-lg"
          />
          <ZoomIn size={14} className="text-td-text-muted shrink-0" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 pb-4">
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-td-border rounded-xl text-sm font-medium text-td-text-secondary hover:bg-td-hover transition-colors"
          >
            <X size={14} /> 취소
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-600 rounded-xl text-sm font-medium text-white transition-colors"
          >
            <Check size={14} /> 적용
          </button>
        </div>
      </div>
    </div>
  );
}
