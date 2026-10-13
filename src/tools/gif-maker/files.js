export const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,.bmp';
const IMAGE_EXTENSION = /\.(png|jpe?g|webp|bmp)$/i;
const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/x-ms-bmp']);

export function isSupportedImage(file) {
  return IMAGE_TYPES.has(file.type) || (!file.type && IMAGE_EXTENSION.test(file.name));
}

// Match the PDF merger's alphabetical filename order, including across batches.
export function sortImages(entries) {
  return [...entries].sort((a, b) => a.file.name.localeCompare(b.file.name));
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
