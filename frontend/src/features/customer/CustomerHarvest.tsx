import { useState, useEffect } from "react";
import { customerService } from "./customer.service";
import type {
  DeliveryStatus,
  HarvestStatus,
  PackageStatus,
  SharedHarvestItem,
} from "./customer.types";
import { Badge, Card, StatCard } from "../../components/ui";

export default function CustomerHarvest() {
  const [harvests, setHarvests] = useState<SharedHarvestItem[]>(() =>
    customerService.getMyHarvests(),
  );

  useEffect(() => {
    function handleDataSync() {
      setHarvests(customerService.getMyHarvests());
    }

    window.addEventListener("pf_data_changed", handleDataSync);
    window.addEventListener("pf_farmer_changed", handleDataSync);
    return () => {
      window.removeEventListener("pf_data_changed", handleDataSync);
      window.removeEventListener("pf_farmer_changed", handleDataSync);
    };
  }, []);

  function getHarvestBadge(status: HarvestStatus) {
    switch (status) {
      case "SCHEDULED":
        return <Badge variant="warning">Lên lịch (SCHEDULED)</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="info">Đang thu hoạch (IN_PROGRESS)</Badge>;
      case "HARVESTED":
        return <Badge variant="success">Đã thu hoạch (HARVESTED)</Badge>;
      case "CANCELLED":
        return <Badge variant="danger">Đã hủy (CANCELLED)</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  }

  function getPackageBadge(status: PackageStatus) {
    switch (status) {
      case "NOT_PACKED":
        return <Badge variant="neutral">Chưa đóng gói</Badge>;
      case "PACKED":
        return <Badge variant="info">Đã đóng thùng giấy</Badge>;
      case "STORAGE_COOL":
        return <Badge variant="success">Kho mát bảo quản</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  }

  function getDeliveryBadge(status: DeliveryStatus) {
    switch (status) {
      case "WAITING_PICKUP":
        return <Badge variant="warning">Chờ bưu tá lấy</Badge>;
      case "DELIVERING":
        return <Badge variant="info">Đang giao hàng</Badge>;
      case "DELIVERED":
        return <Badge variant="success">Đã nhận hàng thành công</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Theo Dõi Thu Hoạch & Giao Nông Sản Tận Nhà
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Nông sản thu hoạch trực tiếp từ thửa đất của bạn, được đóng gói đúng tiêu chuẩn và giao vận lạnh về địa chỉ của bạn.
          </p>
        </div>

        <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold shrink-0">
          Tổng số vụ mùa: {harvests.length}
        </span>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Vụ mùa sắp tới"
          value={`${harvests.filter((h) => h.harvestStatus === "SCHEDULED").length} Đợt`}
          subtext="Đồng bộ lịch gặt với nông dân"
          subtextClassName="text-amber-700 font-medium"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          iconBgColor="bg-amber-100 text-amber-700"
        />

        <StatCard
          title="Đã thu hoạch thành công"
          value={`${harvests.filter((h) => h.harvestStatus === "HARVESTED").length} Đợt`}
          subtext="Sản lượng đạt chất lượng VietGAP"
          subtextClassName="text-emerald-700 font-medium"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          }
          iconBgColor="bg-emerald-100 text-emerald-700"
        />

        <StatCard
          title="Đang giao hàng"
          value={`${harvests.filter((h) => h.deliveryStatus === "DELIVERING").length} Kiện`}
          subtext="Vận chuyển lạnh giữ trọn độ tươi"
          subtextClassName="text-blue-700 font-medium"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          }
          iconBgColor="bg-blue-100 text-blue-700"
        />
      </div>

      {/* Harvest Items List */}
      {harvests.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-gray-400 text-xs">
            Chưa có đợt thu hoạch nào được lên kế hoạch cho thửa đất của bạn.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {harvests.map((h) => (
            <div
              key={h.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4 hover:border-emerald-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded">
                    #{h.id}
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-800">
                    {h.plot}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-base font-bold text-gray-900">
                    {h.plantCrop}
                  </span>
                </div>
                {getHarvestBadge(h.harvestStatus)}
              </div>

              {/* Harvest Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                  <span className="text-2xs text-gray-400 block uppercase">Ngày Thu Hoạch Dự Kiến</span>
                  <span className="font-bold text-gray-800 block mt-0.5">
                    📅 {h.expectedHarvestDate}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                  <span className="text-2xs text-gray-400 block uppercase">Sản Lượng Dự Kiến</span>
                  <span className="font-bold text-gray-800 block mt-0.5">
                    ⚖️ {h.expectedQuantity}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-2xs text-emerald-700 block uppercase font-medium">Sản Lượng Thực Tế</span>
                  <span className="font-bold text-emerald-900 text-sm block mt-0.5">
                    {h.actualQuantity ? `🌾 ${h.actualQuantity}` : "Đang chờ thu hoạch"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                  <span className="text-2xs text-gray-400 block uppercase">Ngày Thu Hoạch Thực Tế</span>
                  <span className="font-bold text-gray-800 block mt-0.5">
                    {h.actualHarvestDate ? `✓ ${h.actualHarvestDate}` : "--"}
                  </span>
                </div>
              </div>

              {/* Packaging & Delivery Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Quy cách đóng gói:</span>
                    {getPackageBadge(h.packageStatus)}
                  </div>
                  <p className="text-gray-600 text-2xs leading-relaxed">
                    Đóng thùng bảo quản tiêu chuẩn của PlotFarm có dán tem QR code truy xuất nguồn gốc từng quả.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-gray-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700">Trạng thái vận chuyển:</span>
                    {getDeliveryBadge(h.deliveryStatus)}
                  </div>
                  <div className="text-2xs text-gray-600 space-y-0.5">
                    {h.deliveryAddress && (
                      <p>📍 Giao về: <strong>{h.deliveryAddress}</strong></p>
                    )}
                    {h.trackingCode && (
                      <p>📦 Mã vận đơn: <strong className="font-mono text-emerald-700">{h.trackingCode}</strong></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Note from Farmer */}
              {h.note && (
                <div className="rounded-xl bg-amber-50/60 p-3 text-xs text-amber-950 border border-amber-200/60">
                  <span className="font-bold block mb-0.5">📝 Ghi chú từ Nông dân thu hoạch:</span>
                  <p className="leading-relaxed">{h.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
