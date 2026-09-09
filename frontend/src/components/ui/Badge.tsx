import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "indigo"
  | "neutral"
  | "purple";

export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

export default function Badge({
  children,
  variant = "neutral",
  size = "sm",
  dot = false,
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { bg: string; dot: string }> = {
    success: {
      bg: "bg-emerald-100 text-emerald-800 border-emerald-200/50",
      dot: "bg-emerald-500",
    },
    warning: {
      bg: "bg-amber-100 text-amber-800 border-amber-200/50",
      dot: "bg-amber-500",
    },
    danger: {
      bg: "bg-red-100 text-red-800 border-red-200/50",
      dot: "bg-red-500",
    },
    info: {
      bg: "bg-blue-100 text-blue-800 border-blue-200/50",
      dot: "bg-blue-500",
    },
    indigo: {
      bg: "bg-indigo-100 text-indigo-800 border-indigo-200/50",
      dot: "bg-indigo-500",
    },
    neutral: {
      bg: "bg-gray-100 text-gray-800 border-gray-200/50",
      dot: "bg-gray-400",
    },
    purple: {
      bg: "bg-purple-100 text-purple-800 border-purple-200/50",
      dot: "bg-purple-500",
    },
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: "px-2 py-0.5 text-2xs",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${variantStyles[variant].bg} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${variantStyles[variant].dot}`}
        />
      )}
      {children}
    </span>
  );
}
