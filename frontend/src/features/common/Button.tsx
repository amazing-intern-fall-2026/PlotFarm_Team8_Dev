import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline";
}

export default function Button({
  children,
  loading = false,
  disabled,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const baseStyles =
    "relative inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 shadow-xs";

  const variantStyles = {
    primary:
      "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500",
    secondary:
      "bg-gray-900 text-white hover:bg-gray-800 active:bg-black focus:ring-gray-700",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 active:bg-gray-100 focus:ring-emerald-500",
  }[variant];

  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
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
          <span>Đang xử lý...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}