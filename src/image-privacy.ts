export const MAX_IMAGE_EDGE = 2048;
export const MAX_IMAGE_PIXELS = 3_500_000;

export type SanitizedImage = {
  dataUrl: string;
  width: number;
  height: number;
  encodedBytes: number;
  originalBytes: number;
};

export function boundedImageDimensions(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Kích thước ảnh không hợp lệ.');
  }
  const edgeScale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
  const pixelScale = Math.min(1, Math.sqrt(MAX_IMAGE_PIXELS / (width * height)));
  const scale = Math.min(edgeScale, pixelScale);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function blobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Không thể mã hóa ảnh đã làm sạch.'));
    reader.readAsDataURL(blob);
  });
}

async function loadImage(file: File): Promise<{source: CanvasImageSource; width: number; height: number; close: () => void}> {
  if ('createImageBitmap' in globalThis) {
    const bitmap = await createImageBitmap(file, {imageOrientation: 'from-image'});
    return {source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close()};
  }

  const url = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
  try {
    await image.decode();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    close: () => URL.revokeObjectURL(url),
  };
}

export async function sanitizeImageFile(file: File): Promise<SanitizedImage> {
  const loaded = await loadImage(file);
  try {
    const dimensions = boundedImageDimensions(loaded.width, loaded.height);
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext('2d', {alpha: false});
    if (!context) throw new Error('Trình duyệt không thể xử lý ảnh này.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, dimensions.width, dimensions.height);
    context.drawImage(loaded.source, 0, 0, dimensions.width, dimensions.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error('Không thể tạo bản ảnh đã làm sạch.'));
      }, 'image/jpeg', 0.9);
    });
    return {
      dataUrl: await blobAsDataUrl(blob),
      width: dimensions.width,
      height: dimensions.height,
      encodedBytes: blob.size,
      originalBytes: file.size,
    };
  } finally {
    loaded.close();
  }
}
