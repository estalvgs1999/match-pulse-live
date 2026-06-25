"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";

interface ImageCropModalProps {
  src: string;
  title?: string;
  cropShape?: "round" | "rect";
  outputSize?: number;
  outputFormat?: "png" | "jpeg";
  onConfirm: (dataUrl: string) => void;
  onCancel: () => void;
}

async function cropToDataUrl(
  imageSrc: string,
  pixelCrop: Area,
  outputSize: number,
  format: "png" | "jpeg",
): Promise<string> {
  const image = new Image();
  image.src = imageSrc;
  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
  });

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const ctx = canvas.getContext("2d")!;

  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputSize, outputSize);
  }

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return canvas.toDataURL(format === "jpeg" ? "image/jpeg" : "image/png", 0.92);
}

export function ImageCropModal({
  src,
  title = "Ajustar imagen",
  cropShape = "round",
  outputSize = 400,
  outputFormat = "png",
  onConfirm,
  onCancel,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);
    const dataUrl = await cropToDataUrl(src, croppedAreaPixels, outputSize, outputFormat);
    onConfirm(dataUrl);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="bg-surface-container w-full sm:max-w-sm sm:mx-4 sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl border border-outline-variant">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">crop</span>
            <p className="font-bold text-sm text-on-surface">{title}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Crop canvas */}
        <div className="relative w-full" style={{ height: 300, background: "#09090b" }}>
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape={cropShape}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom control */}
        <div className="px-5 py-3 flex items-center gap-3 border-t border-outline-variant bg-surface-container-low">
          <span className="material-symbols-outlined text-base text-on-surface-variant select-none">zoom_out</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary h-1.5 cursor-pointer"
          />
          <span className="material-symbols-outlined text-base text-on-surface-variant select-none">zoom_in</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-4 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 border border-outline-variant text-on-surface-variant hover:text-on-surface rounded-xl text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="flex-1 py-2.5 bg-primary text-on-primary font-bold rounded-xl text-sm hover:bg-primary-container transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
          >
            {processing ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                Procesando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">check</span>
                Aplicar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
