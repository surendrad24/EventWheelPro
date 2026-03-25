"use client";

import { ChangeEvent, useMemo, useState } from "react";

const TARGET_SIZE = 512;
const MAX_BYTES = 220 * 1024;

type ImageMeta = {
  width: number;
  height: number;
  src: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string) {
  return new Promise<ImageMeta>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ src, width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("image_load_failed"));
    image.src = src;
  });
}

async function compressCanvasToDataUrl(canvas: HTMLCanvasElement) {
  let quality = 0.92;
  let result = canvas.toDataURL("image/jpeg", quality);
  while (result.length > MAX_BYTES * 1.37 && quality > 0.45) {
    quality -= 0.08;
    result = canvas.toDataURL("image/jpeg", quality);
  }
  return result;
}

export function ImageUploadCrop({
  value,
  onChange,
  label = "Upload Image"
}: {
  value: string;
  onChange: (nextValue: string) => void;
  label?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ImageMeta | null>(null);
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const previewStyle = useMemo(() => {
    if (!meta) {
      return undefined;
    }
    return {
      transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})`
    };
  }, [meta, panX, panY, zoom]);

  async function finalizeCrop(currentMeta: ImageMeta, nextZoom: number, nextPanX: number, nextPanY: number) {
    const image = new Image();
    image.src = currentMeta.src;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("image_load_failed"));
    });

    const canvas = document.createElement("canvas");
    canvas.width = TARGET_SIZE;
    canvas.height = TARGET_SIZE;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("canvas_not_supported");
    }

    const cropSize = Math.min(currentMeta.width, currentMeta.height) / nextZoom;
    const maxShiftX = (currentMeta.width - cropSize) / 2;
    const maxShiftY = (currentMeta.height - cropSize) / 2;
    const centerX = currentMeta.width / 2 + (nextPanX / 120) * maxShiftX;
    const centerY = currentMeta.height / 2 + (nextPanY / 120) * maxShiftY;
    const sx = clamp(centerX - cropSize / 2, 0, currentMeta.width - cropSize);
    const sy = clamp(centerY - cropSize / 2, 0, currentMeta.height - cropSize);

    context.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, TARGET_SIZE, TARGET_SIZE);
    const compressed = await compressCanvasToDataUrl(canvas);
    onChange(compressed);
  }

  async function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const src = await readFileAsDataUrl(file);
      const loaded = await loadImage(src);
      const requiresCrop = loaded.width > TARGET_SIZE || loaded.height > TARGET_SIZE || file.size > MAX_BYTES;

      if (!requiresCrop) {
        await finalizeCrop(loaded, 1, 0, 0);
        return;
      }

      setMeta(loaded);
      setZoom(1);
      setPanX(0);
      setPanY(0);
      setIsOpen(true);
    } catch (fileError) {
      const text = fileError instanceof Error ? fileError.message : "upload_failed";
      setError(`Image upload failed: ${text}`);
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  async function applyCrop() {
    if (!meta) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await finalizeCrop(meta, zoom, panX, panY);
      setIsOpen(false);
      setMeta(null);
    } catch (cropError) {
      const text = cropError instanceof Error ? cropError.message : "crop_failed";
      setError(`Image processing failed: ${text}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 10 }}>
      <label className="field">
        <span>{label}</span>
        <input type="file" accept="image/*" onChange={onFileChange} disabled={loading} />
      </label>
      {value ? (
        <div className="list-item" style={{ alignItems: "center", gap: 12 }}>
          <img src={value} alt="Profile preview" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", border: "1px solid rgba(45,255,86,0.5)" }} />
          <button className="btn-ghost" type="button" onClick={() => onChange("")}>Remove image</button>
        </div>
      ) : null}
      {error && <p className="muted" style={{ color: "#ff5cb2" }}>{error}</p>}

      {isOpen && meta && (
        <div className="matrix-modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="matrix-modal" onClick={(event) => event.stopPropagation()}>
            <button className="matrix-modal-close" onClick={() => setIsOpen(false)}>×</button>
            <h2>Crop & Compress Image</h2>
            <div className="matrix-image-crop-preview">
              <img src={meta.src} alt="Crop preview" style={previewStyle} />
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Zoom</span>
                <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
              </label>
              <label className="field">
                <span>Move X</span>
                <input type="range" min="-120" max="120" step="1" value={panX} onChange={(event) => setPanX(Number(event.target.value))} />
              </label>
              <label className="field">
                <span>Move Y</span>
                <input type="range" min="-120" max="120" step="1" value={panY} onChange={(event) => setPanY(Number(event.target.value))} />
              </label>
            </div>
            <div className="wrap">
              <button className="btn" type="button" onClick={applyCrop} disabled={loading}>Apply</button>
              <button className="btn-ghost" type="button" onClick={() => setIsOpen(false)} disabled={loading}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
