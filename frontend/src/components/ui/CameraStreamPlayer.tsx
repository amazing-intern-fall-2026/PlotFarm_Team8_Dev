import React, { useState, useEffect } from "react";

export interface CameraStreamPlayerProps {
  cameraUrl?: string | null;
  plotCode?: string;
  farmName?: string;
  fallbackImage?: string;
  autoPlay?: boolean;
  className?: string;
}

type StreamType = "YOUTUBE" | "VIDEO" | "IMAGE" | "NONE";

/**
 * Phân tích và chuẩn hóa URL luồng camera
 */
function parseCameraUrl(url?: string | null): { type: StreamType; formattedUrl: string } {
  if (!url || typeof url !== "string" || !url.trim()) {
    return { type: "NONE", formattedUrl: "" };
  }

  const trimmed = url.trim();

  // 1. YouTube Live / Watch / Embed
  if (trimmed.includes("youtube.com") || trimmed.includes("youtu.be")) {
    let videoId = "";
    if (trimmed.includes("embed/")) {
      const match = trimmed.match(/embed\/([^?&]+)/);
      videoId = match ? match[1] : "";
    } else if (trimmed.includes("watch?v=")) {
      const match = trimmed.match(/watch\?v=([^&]+)/);
      videoId = match ? match[1] : "";
    } else if (trimmed.includes("youtu.be/")) {
      const match = trimmed.match(/youtu\.be\/([^?&]+)/);
      videoId = match ? match[1] : "";
    }

    if (videoId) {
      return {
        type: "YOUTUBE",
        formattedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1&rel=0`,
      };
    }
    return { type: "YOUTUBE", formattedUrl: trimmed };
  }

  // 2. Video stream (.mp4, .m3u8, .webm, .ogg)
  if (/\.(mp4|m3u8|webm|ogg)($|\?)/i.test(trimmed)) {
    return { type: "VIDEO", formattedUrl: trimmed };
  }

  // 3. Ảnh Snapshot (.jpg, .jpeg, .png, .webp, .gif) hoặc Unsplash
  if (/\.(jpg|jpeg|png|webp|gif)($|\?)/i.test(trimmed) || trimmed.includes("images.unsplash.com")) {
    return { type: "IMAGE", formattedUrl: trimmed };
  }

  // Mặc định cho video stream nếu có tiền tố http
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return { type: "VIDEO", formattedUrl: trimmed };
  }

  return { type: "NONE", formattedUrl: "" };
}

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&auto=format&fit=crop&q=80";

export const CameraStreamPlayer: React.FC<CameraStreamPlayerProps> = ({
  cameraUrl,
  plotCode = "Thửa Đất",
  farmName = "Nông trại PlotFarm",
  fallbackImage = DEFAULT_FALLBACK_IMAGE,
  autoPlay = true,
  className = "",
}) => {
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const { type, formattedUrl } = parseCameraUrl(cameraUrl);

  // Reset trạng thái lỗi khi cameraUrl thay đổi
  useEffect(() => {
    setHasError(false);
  }, [cameraUrl]);

  const isOnline = !hasError && type !== "NONE" && Boolean(formattedUrl);

  const handleRetry = () => {
    setHasError(false);
    setRetryKey((prev) => prev + 1);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-950 aspect-video flex items-center justify-center select-none shadow-inner ${className}`}
    >
      {/* ─── 1. ACTIVE STREAM PLAYERS ─── */}
      {isOnline && type === "YOUTUBE" && (
        <iframe
          key={`yt-${retryKey}`}
          src={formattedUrl}
          title={`Camera Stream ${plotCode}`}
          className="w-full h-full border-0 object-cover"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={() => setHasError(true)}
        />
      )}

      {isOnline && type === "VIDEO" && (
        <video
          key={`vid-${retryKey}`}
          src={formattedUrl}
          controls
          autoPlay={autoPlay}
          muted
          playsInline
          loop
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      )}

      {isOnline && type === "IMAGE" && (
        <img
          key={`img-${retryKey}`}
          src={formattedUrl}
          alt={`Camera Snapshot ${plotCode}`}
          className="w-full h-full object-cover"
          onError={() => setHasError(true)}
        />
      )}

      {/* ─── 2. FALLBACK & OFFLINE PLACEHOLDER ─── */}
      {!isOnline && (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Ảnh nền nông trại mờ */}
          <img
            src={fallbackImage}
            alt="Camera offline placeholder"
            className="w-full h-full object-cover opacity-35 filter blur-[1px]"
          />

          {/* Lớp phủ cảnh báo tín hiệu */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60 flex flex-col items-center justify-center p-4 text-center">
            <div className="h-12 w-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-3 text-2xl animate-pulse">
              📡
            </div>

            <h4 className="text-white font-bold text-sm tracking-wide">
              {hasError ? "Tín Hiệu Gián Đoạn" : "Camera Đang Ngoại Tuyến (Offline)"}
            </h4>

            <p className="text-gray-300 text-xs mt-1 max-w-sm">
              {hasError
                ? "Không thể kết nối đến trạm phát luồng RTSP/WebRTC. Đang hiển thị ảnh lưu trữ gần nhất."
                : "Chưa cấu hình luồng truyền hình ảnh thực địa cho thửa đất này."}
            </p>

            {hasError && (
              <button
                type="button"
                onClick={handleRetry}
                className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                🔄 Thử kết nối lại
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── 3. TOP STATUS BADGE ─── */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-2xs font-semibold backdrop-blur-md shadow-sm ${
            isOnline
              ? "bg-black/60 text-white border border-emerald-500/40"
              : "bg-red-950/70 text-red-200 border border-red-500/40"
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isOnline ? "bg-emerald-400 animate-ping" : "bg-red-500"
            }`}
          />
          <span>
            {isOnline
              ? `LIVE CAM • TRẠM ${String(plotCode).replace(/^#/, "")}`
              : "OFFLINE • TRẠM MẤT TÍN HIỆU"}
          </span>
        </div>
      </div>

      {/* ─── 4. BOTTOM METADATA OVERLAY ─── */}
      <div className="absolute bottom-3 left-3 z-10 bg-black/60 backdrop-blur-xs text-white px-3 py-1 rounded-md text-2xs font-mono border border-white/10 flex items-center gap-2">
        <span>📍 {farmName}</span>
        <span>•</span>
        <span>{new Date().toLocaleDateString("vi-VN")}</span>
      </div>
    </div>
  );
};

export default CameraStreamPlayer;
