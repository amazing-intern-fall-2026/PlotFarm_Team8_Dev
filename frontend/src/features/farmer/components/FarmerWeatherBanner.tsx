import type { FarmerProfileData } from "../farmer.types";

interface FarmerWeatherBannerProps {
  profile: FarmerProfileData;
}

export default function FarmerWeatherBanner({ profile }: FarmerWeatherBannerProps) {
  const farmCluster = profile.assignedFarms.join(" & ") || "Cụm Nông trại PlotFarm";

  return (
    <div className="rounded-2xl bg-linear-to-r from-emerald-800 to-teal-900 text-white p-5 sm:p-6 shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Trạm Quan Trắc IoT: {farmCluster}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1 text-white">
            Điều kiện vi khí hậu lý tưởng cho cây trồng phát triển
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-xl">
            Nhiệt độ trung bình 28.5°C, gió nhẹ 6 km/h. Cảm biến đồng ruộng tại các thửa đất báo độ ẩm ổn định 68% - 74%.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/15 text-xs">
          <div className="text-center px-2 py-1">
            <span className="block text-xl font-bold">28.5°C</span>
            <span className="text-2xs text-emerald-200">Nhiệt độ</span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center px-2 py-1">
            <span className="block text-xl font-bold">70%</span>
            <span className="text-2xs text-emerald-200">Độ ẩm đất</span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-center px-2 py-1">
            <span className="block text-xl font-bold">6.8</span>
            <span className="text-2xs text-emerald-200">Độ pH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
