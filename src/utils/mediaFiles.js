// Chỉ nhận định dạng trình duyệt chắc chắn hiển thị được qua thẻ <img>.
// HEIC/HEIF (mặc định ảnh chụp iPhone) và TIFF/ICO không được Chrome/Firefox/Edge
// giải mã: file vẫn lưu thành công lên server (chỉ là 1 chuỗi), nhưng khi hiển thị
// lại <img onError> sẽ âm thầm rơi về ảnh placeholder mặc định — trông như "đổi ảnh
// xong nhưng không thấy hiện ra". Loại các định dạng này khỏi input để tránh từ gốc.
export const IMAGE_FILE_ACCEPT = [
  "image/*",
  ".avif",
  ".bmp",
  ".gif",
  ".jfif",
  ".jpeg",
  ".jpg",
  ".png",
  ".svg",
  ".webp",
].join(",");

/**
 * Đọc file ảnh và trả về data URL. Vẽ lại qua canvas + xuất JPEG khi có thể để:
 * 1) đảm bảo định dạng đầu ra luôn hiển thị được (phòng trường hợp trình duyệt
 *    vẫn chọn được 1 định dạng lạ ngoài whitelist ở trên, vd qua "image/*" chung),
 * 2) nén bớt ảnh chụp gốc thường vài MB xuống nhẹ hơn nhiều trước khi gửi lên server.
 * Nếu trình duyệt không giải mã được ảnh qua canvas (Image.onerror), rơi về đọc
 * thẳng bằng FileReader như cũ thay vì chặn hẳn việc lưu.
 */
export function fileToDataUrl(file, options = {}) {
  const { maxDimension = 1024, quality = 0.85 } = options;

  const readRaw = () =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // SVG giữ nguyên (canvas raster hoá sẽ làm mất tính vector/trong suốt).
  if (file.type === "image/svg+xml") {
    return readRaw();
  }

  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    const cleanup = () => URL.revokeObjectURL(objectUrl);

    img.onload = () => {
      try {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        cleanup();
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        cleanup();
        readRaw().then(resolve, () => resolve(""));
      }
    };

    img.onerror = () => {
      cleanup();
      readRaw().then(resolve, () => resolve(""));
    };

    img.src = objectUrl;
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
