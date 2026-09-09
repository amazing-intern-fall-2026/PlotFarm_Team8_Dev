import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-8 sm:p-12 text-center shadow-xs flex flex-col items-center justify-center ${className}`}
    >
      {icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-2xl text-gray-600 mb-4 shadow-2xs">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h3>

      {description && (
        <p className="mt-1.5 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
