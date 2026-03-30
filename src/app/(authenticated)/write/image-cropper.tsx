"use client";

import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";

const ASPECT_RATIO = 2 / 1; // Match the cover image display ratio

export function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
}: {
  imageSrc: string;
  onCropComplete: (blob: Blob) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropChange = useCallback(
    (_: unknown, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    setProcessing(true);

    try {
      const blob = await getCroppedImage(imageSrc, croppedAreaPixels);
      onCropComplete(blob);
    } catch {
      // Fall back to uploading uncropped
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      onCropComplete(blob);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-charcoal/95">
      {/* Crop area */}
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={ASPECT_RATIO}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropChange}
          showGrid={false}
          style={{
            containerStyle: {
              background: "rgba(44, 44, 44, 0.95)",
            },
            cropAreaStyle: {
              border: "2px solid rgba(250, 248, 245, 0.6)",
            },
          }}
        />
      </div>

      {/* Controls */}
      <div className="bg-charcoal px-6 py-5 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4 flex-1 max-w-xs">
          <label
            htmlFor="zoom-slider"
            className="text-xs uppercase tracking-wider text-cream/40 shrink-0"
          >
            Zoom
          </label>
          <input
            id="zoom-slider"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-cream/60 h-1"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 text-xs uppercase tracking-wider text-cream/50 hover:text-cream transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing}
            className="px-6 py-2 bg-cream text-charcoal text-xs uppercase tracking-[0.15em] hover:bg-cream-dark disabled:opacity-50 transition-colors"
          >
            {processing ? "Cropping..." : "Use this crop"}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Crop the image on a canvas and return a Blob.
 */
function getCroppedImage(imageSrc: string, crop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = crop.width;
      canvas.height = crop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context not available"));
        return;
      }

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/jpeg",
        0.92
      );
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}
