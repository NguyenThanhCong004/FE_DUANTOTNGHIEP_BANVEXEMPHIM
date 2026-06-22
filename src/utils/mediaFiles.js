export const IMAGE_FILE_ACCEPT = [
  "image/*",
  ".avif",
  ".bmp",
  ".gif",
  ".heic",
  ".heif",
  ".ico",
  ".jfif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".tif",
  ".tiff",
  ".webp",
].join(",");

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function isDisplayableImageSrc(value) {
  const src = String(value || "").trim();
  return src.startsWith("http")
    || src.startsWith("data:image")
    || src.startsWith("/")
    || src.startsWith("./")
    || src.startsWith("../");
}
