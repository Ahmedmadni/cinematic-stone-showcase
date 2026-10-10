const WEBP_QUALITY = 0.88;
const MAX_IMAGE_EDGE = 2400;

function canvasToBlob(canvas: HTMLCanvasElement, quality = WEBP_QUALITY) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("تعذّر إنشاء ملف WebP."))),
      "image/webp",
      quality,
    );
  });
}

function waitForMedia(
  target: HTMLImageElement | HTMLVideoElement,
  event: "load" | "loadedmetadata" | "seeked",
  timeout = 12_000,
) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => finish(new Error("انتهت مهلة تجهيز الوسائط.")), timeout);
    const finish = (error?: Error) => {
      window.clearTimeout(timer);
      target.removeEventListener(event, ready);
      target.removeEventListener("error", failed);
      if (error) reject(error);
      else resolve();
    };
    const ready = () => finish();
    const failed = () => finish(new Error("تعذّر قراءة ملف الوسائط."));
    target.addEventListener(event, ready, { once: true });
    target.addEventListener("error", failed, { once: true });
  });
}

export async function optimizeImageForUpload(file: File) {
  if (!file.type.startsWith("image/") || file.type === "image/webp") return file;
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    const ready = waitForMedia(image, "load");
    image.src = url;
    await ready;
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("تعذّر تجهيز الصورة.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas);
    return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function createVideoPoster(file: File) {
  if (!file.type.startsWith("video/")) return null;
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.muted = true;
    video.preload = "metadata";
    video.playsInline = true;
    const metadata = waitForMedia(video, "loadedmetadata");
    video.src = url;
    await metadata;
    if (!video.videoWidth || !video.videoHeight) return null;
    const targetTime = Number.isFinite(video.duration)
      ? Math.min(Math.max(video.duration * 0.08, 0.1), 2)
      : 0.1;
    const seeked = waitForMedia(video, "seeked");
    video.currentTime = targetTime;
    await seeked;
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await canvasToBlob(canvas, 0.86);
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}-poster.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}
