export type ImageCompressionOptions = {
  maxWidth?: number;
  quality?: number;
};

const DEFAULT_MAX_WIDTH = 1024;
const DEFAULT_QUALITY = 0.72;

export const compressImageFileToDataUrl = async (
  file: File,
  options: ImageCompressionOptions = {}
): Promise<string> => {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const quality = options.quality ?? DEFAULT_QUALITY;

  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Không thể nén ảnh ngoài trình duyệt");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Không đọc được file ảnh"));
    });

    const { width, height } = image;
    if (!width || !height) {
      throw new Error("Ảnh không hợp lệ");
    }

    const targetWidth = width > maxWidth ? maxWidth : width;
    const targetHeight = width > maxWidth ? Math.round((height * maxWidth) / width) : height;

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Không tạo được canvas để nén ảnh");
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};
