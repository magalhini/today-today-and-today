"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { ImageCropper } from "./image-cropper";

export function CoverImageUpload({
  currentImage,
  onImageChange,
}: {
  currentImage: string | null;
  onImageChange: (path: string | null) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadBlob = useCallback(
    async (blob: Blob) => {
      setError(null);
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", blob, "cover.jpg");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Upload failed.");
          return;
        }

        onImageChange(data.path);
      } catch {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [onImageChange]
  );

  function openCropper(file: File) {
    setError(null);

    if (file.size > 4 * 1024 * 1024) {
      setError("Image must be under 4MB.");
      return;
    }

    if (
      !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
        file.type
      )
    ) {
      setError("Only JPEG, PNG, WebP, and GIF images are allowed.");
      return;
    }

    const url = URL.createObjectURL(file);
    setCropSource(url);
  }

  function handleCropComplete(blob: Blob) {
    if (cropSource) {
      URL.revokeObjectURL(cropSource);
    }
    setCropSource(null);
    uploadBlob(blob);
  }

  function handleCropCancel() {
    if (cropSource) {
      URL.revokeObjectURL(cropSource);
    }
    setCropSource(null);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) openCropper(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) openCropper(file);
    e.target.value = "";
  }

  return (
    <>
      {/* Crop modal */}
      {cropSource && (
        <ImageCropper
          imageSrc={cropSource}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {currentImage ? (
        <div className="relative mb-8 group">
          <div className="relative w-full aspect-[2/1] overflow-hidden bg-cream-dark rounded-sm">
            <Image
              src={currentImage}
              alt="Cover image"
              fill
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-charcoal/80 text-cream text-xs uppercase tracking-wider hover:bg-charcoal transition-colors backdrop-blur-sm"
            >
              Replace
            </button>
            <button
              onClick={() => onImageChange(null)}
              className="px-3 py-1.5 bg-charcoal/80 text-cream text-xs uppercase tracking-wider hover:bg-error transition-colors backdrop-blur-sm"
            >
              Remove
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div className="mb-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                inputRef.current?.click();
            }}
            aria-label="Upload cover image"
            className={`w-full border border-dashed rounded-sm py-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              dragOver
                ? "border-terracotta bg-terracotta/5"
                : "border-charcoal-muted/20 hover:border-charcoal-muted/40"
            }`}
          >
            {uploading ? (
              <p className="text-xs uppercase tracking-wider text-charcoal-muted/60">
                Uploading...
              </p>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wider text-charcoal-muted/40">
                  Add a cover image
                </p>
                <p className="text-xs text-charcoal-muted/30 mt-1">
                  Drag & drop or click &middot; Max 4MB
                </p>
              </>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileSelect}
          />
          {error && <p className="text-error text-xs mt-2">{error}</p>}
        </div>
      )}
    </>
  );
}
