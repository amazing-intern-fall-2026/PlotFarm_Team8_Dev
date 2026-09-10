import type { FarmerProfileData, FarmerPlotItem } from "../farmer.types";

interface FarmerAssignedFarmsListProps {
  profile: FarmerProfileData;
  plots: FarmerPlotItem[];
}

export default function FarmerAssignedFarmsList({
  profile,
  plots,
}: FarmerAssignedFarmsListProps) {
  const totalArea = plots.reduce((acc, p) => acc + (p.areaSquareMeter || 0), 0);

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Name */}
      <div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 border-b border-gray-100 gap-1">
        <span className="font-semibold text-gray-500">1. Họ và tên (Name):</span>
        <span className="sm:col-span-2 font-bold text-gray-900 text-sm">{profile.name}</span>
      </div>

      {/* 2. Email */}
      <div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 border-b border-gray-100 gap-1">
        <span className="font-semibold text-gray-500">2. Email:</span>
        <span className="sm:col-span-2 font-medium text-gray-800 font-mono">{profile.email}</span>
      </div>

      {/* 3. Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 border-b border-gray-100 gap-1">
        <span className="font-semibold text-gray-500">3. Số điện thoại (Phone):</span>
        <span className="sm:col-span-2 font-mono font-bold text-emerald-800">{profile.phone}</span>
      </div>

      {/* 4. Assigned Farm */}
      <div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 border-b border-gray-100 gap-1">
        <span className="font-semibold text-gray-500">4. Nông trại phụ trách (Assigned Farm):</span>
        <div className="sm:col-span-2 space-y-2">
          {profile.assignedFarms && profile.assignedFarms.length > 0 ? (
            profile.assignedFarms.map((farm, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-emerald-950"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏡</span>
                  <div>
                    <p className="font-bold text-xs">{farm}</p>
                    <p className="text-2xs text-emerald-700">
                      Phân công bởi Quản trị viên (Admin)
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-2xs font-semibold">
                  Chính thức
                </span>
              </div>
            ))
          ) : (
            <span className="text-gray-400 italic">Chưa được phân công trang trại</span>
          )}
        </div>
      </div>

      {/* 5. Assigned Plot count */}
      <div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 border-b border-gray-100 gap-1">
        <span className="font-semibold text-gray-500">5. Số thửa đất (Assigned Plot count):</span>
        <div className="sm:col-span-2 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-base text-emerald-800">
              {profile.assignedPlotCount} Thửa ruộng
            </span>
            <span className="text-gray-400 text-2xs">
              • Tổng diện tích quản lý: {totalArea.toLocaleString("vi-VN")} m²
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {plots.map((plot) => (
              <span
                key={plot.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-2xs font-mono text-gray-800 font-semibold"
                title={`${plot.plantCrop} - `}
              >
                <span>🌱</span>
                <span>{plot.plotCode}</span>
                <span className="text-gray-400 font-normal">({plot.plantCrop})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Specialties / Bio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 py-2.5 gap-1">
        <span className="font-semibold text-gray-500">Kinh nghiệm & Chuyên môn:</span>
        <div className="sm:col-span-2 text-gray-700 leading-relaxed">
          <p>{profile.bio || "Nông dân có kinh nghiệm canh tác thực địa chất lượng cao."}</p>
          {profile.specialties && profile.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {profile.specialties.map((spec, index) => (
                <span
                  key={index}
                  className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-2xs font-medium"
                >
                  ✓ {spec}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
