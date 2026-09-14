import { useState, useEffect, useCallback } from "react";
import { customerService } from "./customer.service";
import type {
  DeliveryStatus,
  HarvestStatus,
  PackageStatus,
  SharedHarvestItem,
} from "./customer.types";
import { Badge, Button, Card, Spinner, StatCard } from "../../components/ui";

export default function CustomerHarvest() {
  const [harvests, setHarvests] = useState<SharedHarvestItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load harvests from API: GET /api/v1/harvests/my
  const loadHarvests = useCallback(async () => {
    setIsLoading(true);
    try {
      const serverHarvests = await customerService.fetchMyHarvestsAsync();
      setHarvests(serverHarvests);
    } catch (err) {
      console.warn("Lỗi khi tải danh sách thu hoạch từ API:", err);
      setHarvests(customerService.getMyHarvests());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHarvests();
  }, [loadHarvests]);

  // Sync listener on external data updates
  useEffect(() => {
    function handleDataSync() {
      loadHarvests();
    }

    window.addEventListener("pf_data_changed", handleDataSync);
    window.addEventListener("pf_farmer_changed", handleDataSync);
    return () => {
      window.removeEventListener("pf_data_changed", handleDataSync);
      window.removeEventListener("pf_farmer_changed", handleDataSync);
    };
  }, [loadHarvests]);

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

  const filteredHarvests = harvests.filter((h) => {
    if (statusFilter === "ALL") return true;
    return (
      h.harvestStatus === statusFilter ||
      h.deliveryStatus === statusFilter ||
      h.packageStatus === statusFilter
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              Theo Dõi Thu Hoạch & Giao Nông Sản Tận Nhà
            </h2>
            <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              Task 17: Live API
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi Ngày thu hoạch, Sản lượng (dự kiến/thực tế), Quy cách đóng gói, Trạng thái giao hàng, Mã vận đơn và Địa chỉ nhận hàng trực tiếp từ API <code>GET /api/v1/harvests/my</code>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => loadHarvests()}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <span className={isLoading ? "animate-spin" : ""}>🔄</span>
            <span>Làm mới dữ liệu</span>
          </Button>

          <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold shrink-0">
            Tổng số: {harvests.length} vụ mùa
          </span>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          title="Vụ mùa sắp tới"
          value={`${harvests.filter((h) => h.harvestStatus === "SCHEDULED").length} Đợt`}
          subtext="Lên lịch dự kiến với nông dân"
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
          title="Đang vận chuyển giao hàng"
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Tất cả vụ mùa ({harvests.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("SCHEDULED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === "SCHEDULED"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
          }`}
        >
          Lên lịch thu hoạch ({harvests.filter((h) => h.harvestStatus === "SCHEDULED").length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("HARVESTED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === "HARVESTED"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          Đã thu hoạch ({harvests.filter((h) => h.harvestStatus === "HARVESTED").length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("DELIVERING")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === "DELIVERING"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-blue-800 border border-blue-200 hover:bg-blue-50"
          }`}
        >
          Đang giao hàng ({harvests.filter((h) => h.deliveryStatus === "DELIVERING").length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("DELIVERED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === "DELIVERED"
              ? "bg-teal-700 text-white shadow-xs"
              : "bg-white text-teal-800 border border-teal-200 hover:bg-teal-50"
          }`}
        >
          Đã nhận thành công ({harvests.filter((h) => h.deliveryStatus === "DELIVERED").length})
        </button>
      </div>

      {/* Harvest Items List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <Spinner size="lg" className="mx-auto text-emerald-600" />
          <p className="text-xs text-gray-500">Đang tải dữ liệu thu hoạch & giao hàng từ hệ thống...</p>
        </div>
      ) : filteredHarvests.length === 0 ? (
        <Card>
          <div className="p-12 text-center space-y-2">
            <span className="text-3xl block">🌾</span>
            <p className="text-sm font-semibold text-gray-700">
              Chưa có đợt thu hoạch nào phù hợp với bộ lọc.
            </p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Khi nông sản tại thửa đất của bạn bước vào giai đoạn sắp chín, kỹ sư nông dân sẽ lên lịch gặt hái và cập nhật quy trình vận chuyển tại đây.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredHarvests.map((h) => (
            <div
              key={h.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4 hover:border-emerald-300 transition"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-gray-900 bg-gray-100 px-2.5 py-0.5 rounded border border-gray-200">
                    #{h.id}
                  </span>
                  {h.contractId && (
                    <span className="font-mono text-2xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      HĐ: {h.contractId}
                    </span>
                  )}
                  <span className="font-mono text-sm font-bold text-emerald-800">
                    {h.plot}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-base font-bold text-gray-900">
                    {h.plantCrop}
                  </span>
                  {h.farmName && (
                    <span className="text-xs text-gray-500">
                      ({h.farmName})
                    </span>
                  )}
                </div>
                {getHarvestBadge(h.harvestStatus)}
              </div>

              {/* Harvest Metrics Grid (Harvest date & Quantities) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {/* 1. Harvest Date: Expected */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-200 space-y-1">
                  <span className="text-2xs text-gray-500 block uppercase font-medium">
                    📅 Ngày Thu Hoạch Dự Kiến
                  </span>
                  <span className="font-bold text-gray-900 text-sm block font-mono">
                    {h.expectedHarvestDate}
                  </span>
                </div>

                {/* 2. Harvest Date: Actual */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-200 space-y-1">
                  <span className="text-2xs text-gray-500 block uppercase font-medium">
                    ✓ Ngày Thu Hoạch Thực Tế
                  </span>
                  <span className="font-bold text-gray-900 text-sm block font-mono">
                    {h.actualHarvestDate ? `✓ ${h.actualHarvestDate}` : "--"}
                  </span>
                </div>

                {/* 3. Expected Quantity */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-gray-200 space-y-1">
                  <span className="text-2xs text-gray-500 block uppercase font-medium">
                    ⚖️ Sản Lượng Dự Kiến
                  </span>
                  <span className="font-bold text-gray-900 text-sm block font-mono">
                    {h.expectedQuantity}
                  </span>
                </div>

                {/* 4. Actual Quantity */}
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-1">
                  <span className="text-2xs text-emerald-800 block uppercase font-medium">
                    🌾 Sản Lượng Thực Tế
                  </span>
                  <span className="font-bold text-emerald-950 text-sm block font-mono">
                    {h.actualQuantity ? h.actualQuantity : "Đang chờ thu hoạch"}
                  </span>
                </div>
              </div>

              {/* Packaging & Delivery Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
                {/* Packing Status Box */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                      <span>📦</span> Quy cách đóng gói (Packing Status):
                    </span>
                    {getPackageBadge(h.packageStatus)}
                  </div>
                  <p className="text-gray-600 text-2xs leading-relaxed">
                    Đóng thùng bảo quản lạnh tiêu chuẩn PlotFarm, dán tem nhãn QR code truy xuất nguồn gốc từng quả từ nông trại sinh thái.
                  </p>
                </div>

                {/* Delivery Status & Tracking Number Box */}
                <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                      <span>🚚</span> Giao vận (Delivery Status):
                    </span>
                    {getDeliveryBadge(h.deliveryStatus)}
                  </div>

                  <div className="space-y-1.5 text-2xs border-t border-gray-100 pt-2">
                    {/* Tracking number */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Mã vận đơn (Tracking Number):</span>
                      <strong className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {h.trackingCode || "Chưa tạo mã vận đơn"}
                      </strong>
                    </div>

                    {/* Delivery address */}
                    <div>
                      <span className="text-gray-500 block mb-0.5">Địa chỉ giao nhận (Delivery Address):</span>
                      <strong className="text-gray-900 block font-medium">
                        📍 {h.deliveryAddress || "Địa chỉ mặc định của khách hàng"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Note from Farmer */}
              {h.note && (
                <div className="rounded-xl bg-amber-50/70 p-3 text-xs text-amber-950 border border-amber-200/80">
                  <span className="font-bold block mb-0.5">📝 Ghi chú từ Nông dân / Đơn vị giao nhận:</span>
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

