import type { ReactNode } from "react";

export interface StatCardProps {
  title: string;
  value: ReactNode;
  subtext?: ReactNode;
  icon: ReactNode;
  iconBgColor?: string;
  valueClassName?: string;
  subtextClassName?: string;
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtext,
  icon,
  iconBgColor = "bg-emerald-100 text-emerald-700",
  valueClassName = "text-gray-900",
  subtextClassName = "text-gray-500",
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition hover:shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </span>
        <span className={`rounded-md p-2 text-base flex items-center justify-center ${iconBgColor}`}>
          {icon}
        </span>
      </div>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${valueClassName}`}>
        {value}
      </p>
      {subtext && (
        <p className={`mt-1 text-xs font-medium ${subtextClassName}`}>
          {subtext}
        </p>
      )}
    </div>
  );
}
