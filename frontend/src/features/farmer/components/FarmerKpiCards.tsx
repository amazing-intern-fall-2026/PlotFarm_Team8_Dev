import type { FarmerKPISummary } from "../farmer.types";
import { StatCard } from "../../../components/ui";

interface FarmerKpiCardsProps {
  kpis: FarmerKPISummary;
  onNavigateTab: (tab: "plots" | "logs" | "requests" | "harvest" | "profile") => void;
}

export default function FarmerKpiCards({ kpis, onNavigateTab }: FarmerKpiCardsProps) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
        Chỉ số hiệu suất nông vụ (KPIs - Theo phân công của Admin)
      </h3>
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* 1. Tổng số Farm */}
        <div
          onClick={() => onNavigateTab("plots")}
          className="cursor-pointer transition hover:-translate-y-0.5"
        >
          <StatCard
            title="Tổng số Farm"
            value={`${kpis.totalFarms} Trang trại`}
            subtext="Được Admin phân công"
            subtextClassName="text-emerald-700"
            icon="🏡"
            iconBgColor="bg-emerald-100 text-emerald-800"
          />
        </div>

        {/* 2. Tổng số Plot đang phụ trách */}
        <div
          onClick={() => onNavigateTab("plots")}
          className="cursor-pointer transition hover:-translate-y-0.5"
        >
          <StatCard
            title="Plot đang phụ trách"
            value={`${kpis.totalAssignedPlots} Thửa đất`}
            subtext="Thuộc quyền quản lý"
            subtextClassName="text-teal-700"
            icon="🗺️"
            iconBgColor="bg-teal-100 text-teal-800"
          />
        </div>

        {/* 3. Plot đang canh tác */}
        <div
          onClick={() => onNavigateTab("plots")}
          className="cursor-pointer transition hover:-translate-y-0.5"
        >
          <StatCard
            title="Plot đang canh tác"
            value={`${kpis.cultivatingPlots} Thửa`}
            subtext="Đang có cây trồng"
            subtextClassName="text-blue-700"
            icon="🌱"
            iconBgColor="bg-blue-100 text-blue-800"
          />
        </div>

        {/* 4. Care Request Pending */}
        <div
          onClick={() => onNavigateTab("requests")}
          className="cursor-pointer transition hover:-translate-y-0.5"
        >
          <StatCard
            title="Care Request Pending"
            value={`${kpis.careRequestsPending} Yêu cầu`}
            subtext="Khách gửi chờ làm"
            subtextClassName="text-amber-700"
            icon="💬"
            iconBgColor="bg-amber-100 text-amber-800"
          />
        </div>

        {/* 5. Harvest chờ xử lý */}
        <div
          onClick={() => onNavigateTab("harvest")}
          className="cursor-pointer transition hover:-translate-y-0.5"
        >
          <StatCard
            title="Harvest chờ xử lý"
            value={`${kpis.harvestPending} Vụ`}
            subtext="Sắp đến hạn cắt hái"
            subtextClassName="text-purple-700"
            icon="🌾"
            iconBgColor="bg-purple-100 text-purple-800"
          />
        </div>

        {/* 6. Issue cần chú ý */}
        <div
          onClick={() => onNavigateTab("plots")}
          className="cursor-pointer transition hover:-translate-y-0.5"
        >
          <StatCard
            title="Issue cần chú ý"
            value={`${kpis.attentionIssues} Cảnh báo`}
            subtext="Sâu bệnh & cải tạo"
            subtextClassName="text-red-700"
            icon="⚠️"
            iconBgColor="bg-red-100 text-red-800"
          />
        </div>
      </div>
    </div>
  );
}
