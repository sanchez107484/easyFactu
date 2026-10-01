export interface CompressedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeKB?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  maxSizeKB: 1024,
  quality: 0.8,
};

export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImage> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return {
      file,
      originalSize: file.size,
      compressedSize: file.size,
      compressionRatio: 1,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      if (width > opts.maxWidth!) {
        height = (height * opts.maxWidth!) / width;
        width = opts.maxWidth!;
      }

      if (height > opts.maxHeight!) {
        width = (width * opts.maxHeight!) / height;
        height = opts.maxHeight!;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      const tryCompress = (quality: number): Promise<Blob | null> => {
        return new Promise((res) => {
          canvas.toBlob(
            (blob) => res(blob),
            'image/jpeg',
            quality
          );
        });
      };

      const doCompression = async () => {
        let currentQuality = opts.quality!;
        let blob = await tryCompress(currentQuality);

        while (
          blob &&
          blob.size > opts.maxSizeKB! * 1024 &&
          currentQuality > 0.1
        ) {
          currentQuality -= 0.1;
          blob = await tryCompress(currentQuality);
        }

        if (!blob) {
          resolve({
            file,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 1,
          });
          return;
        }

        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });

        resolve({
          file: compressedFile,
          originalSize: file.size,
          compressedSize: compressedFile.size,
          compressionRatio: compressedFile.size / file.size,
        });
      };

      void doCompression();
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
