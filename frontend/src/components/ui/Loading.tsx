import type { HTMLAttributes } from "react";

export interface SpinnerProps extends HTMLAttributes<SVGElement> {
  size?: "sm" | "md" | "lg";
  color?: "emerald" | "indigo" | "gray" | "white";
}

export function Spinner({
  size = "md",
  color = "emerald",
  className = "",
  ...props
}: SpinnerProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-10 w-10",
  };

  const colorMap = {
    emerald: "text-emerald-600",
    indigo: "text-indigo-600",
    gray: "text-gray-500",
    white: "text-white",
  };

  return (
    <svg
      className={`animate-spin ${sizeMap[size]} ${colorMap[color]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export interface LoadingOverlayProps {
  text?: string;
  fullPage?: boolean;
}

export function LoadingOverlay({
  text = "Đang tải dữ liệu...",
  fullPage = false,
}: LoadingOverlayProps) {
  const containerClasses = fullPage
    ? "fixed inset-0 z-50 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-3"
    : "absolute inset-0 z-20 bg-white/70 backdrop-blur-2xs flex flex-col items-center justify-center gap-2 rounded-xl";

  return (
    <div className={containerClasses}>
      <Spinner size="lg" color="emerald" />
      <span className="text-sm font-semibold text-gray-700">{text}</span>
    </div>
  );
}

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
      {...props}
    />
  );
}
