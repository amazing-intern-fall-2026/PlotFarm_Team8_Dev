import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { farmerService } from "./farmer.service";
import type { DeliveryStatus, HarvestItem, HarvestStatus, PackageStatus, FarmerProfileData, FarmerPlotItem } from "./farmer.types";
import { Card, Badge, Button, Modal, Input, Alert } from "../../components/ui";

export default function FarmerHarvest() {
  const [profile, setProfile] = useState<FarmerProfileData>(() => farmerService.getFarmerProfile());
  const [plots, setPlots] = useState<FarmerPlotItem[]>(() => farmerService.getPlots());
  const [harvests, setHarvests] = useState<HarvestItem[]>(() => farmerService.getHarvests());
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [successMessage, setSuccessMessage] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  // Create Harvest modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createPlotCode, setCreatePlotCode] = useState("");
  const [createExpectedDate, setCreateExpectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [createExpectedQty, setCreateExpectedQty] = useState("50 kg");
  const [isImmediateHarvest, setIsImmediateHarvest] = useState(true);
  const [createActualDate, setCreateActualDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [createActualQty, setCreateActualQty] = useState("50 kg");
  const [createHarvestStatus, setCreateHarvestStatus] = useState<HarvestStatus>("HARVESTED");
  const [createPackageStatus, setCreatePackageStatus] = useState<PackageStatus>("PACKED");
  const [createDeliveryStatus, setCreateDeliveryStatus] = useState<DeliveryStatus>("WAITING_PICKUP");
  const [createDeliveryAddress, setCreateDeliveryAddress] = useState("");
  const [createNote, setCreateNote] = useState("Nông sản đạt chuẩn hữu cơ, độ ngọt cao, thu hoạch đúng độ chín vụ mùa.");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    farmerService.fetchFarmerDataAsync().catch((err) => {
      console.warn("fetchFarmerDataAsync error in FarmerHarvest:", err);
    });

    function handleSync() {
      setProfile(farmerService.getFarmerProfile());
      setPlots(farmerService.getPlots());
      setHarvests(farmerService.getHarvests());
    }
    window.addEventListener("pf_farmer_changed", handleSync);
    window.addEventListener("pf_data_changed", handleSync);
    return () => {
      window.removeEventListener("pf_farmer_changed", handleSync);
      window.removeEventListener("pf_data_changed", handleSync);
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("create") === "true") {
      const plotParam = searchParams.get("plot");
      handleOpenCreateModal(plotParam || undefined);
      searchParams.delete("create");
      searchParams.delete("plot");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, plots]);

  function handleOpenCreateModal(preselectedPlotCode?: string) {
    const availablePlots = plots.filter((p) => p.contractId && p.contractId !== "HD-NONE");
    const targetPlot = preselectedPlotCode
      ? availablePlots.find((p) => p.plotCode === preselectedPlotCode || p.id === preselectedPlotCode) || plots.find((p) => p.plotCode === preselectedPlotCode || p.id === preselectedPlotCode)
      : availablePlots[0] || plots[0];

    const plotCodeVal = targetPlot?.plotCode || (plots[0]?.plotCode ?? "");
    setCreatePlotCode(plotCodeVal);
    setCreateExpectedDate(new Date().toISOString().slice(0, 10));
    setCreateExpectedQty("50 kg");
    setIsImmediateHarvest(true);
    setCreateActualDate(new Date().toISOString().slice(0, 10));
    setCreateActualQty("50 kg");
    setCreateHarvestStatus("HARVESTED");
    setCreatePackageStatus("PACKED");
    setCreateDeliveryStatus("WAITING_PICKUP");
    setCreateDeliveryAddress("");
    setCreateNote("Nông sản đạt chuẩn hữu cơ, độ ngọt cao, thu hoạch đúng độ chín vụ mùa.");
    setCreateError("");
    setIsCreateModalOpen(true);
  }

  async function handleSaveNewHarvest() {
    const selectedPlotObj = plots.find((p) => p.plotCode === createPlotCode || p.id === createPlotCode);
    if (!selectedPlotObj || !selectedPlotObj.contractId || selectedPlotObj.contractId === "HD-NONE") {
      setCreateError("Thửa đất này chưa có hợp đồng thuê hoạt động để lên lịch thu hoạch.");
      return;
    }
    if (selectedPlotObj.progress < 95) {
      setCreateError(
        `Thửa đất ${selectedPlotObj.plotCode} hiện mới đạt ${selectedPlotObj.progress}% tiến độ sinh trưởng. Quy định yêu cầu tiến độ mùa vụ phải đạt từ 95% trở lên mới được phép lập phiếu thu hoạch.`
      );
      return;
    }

    if (!createExpectedQty.trim()) {
      setCreateError("Vui lòng nhập sản lượng dự kiến");
      return;
    }

    try {
      setIsCreating(true);
      setCreateError("");

      const payload = {
        maHopDong: selectedPlotObj.contractId,
        ngayThuHoachDuKien: createExpectedDate,
        sanLuongDuKien: createExpectedQty.trim(),
        ngayThuHoachThucTe: isImmediateHarvest ? createActualDate : undefined,
        sanLuongThucTe: isImmediateHarvest ? (createActualQty.trim() || createExpectedQty.trim()) : undefined,
        trangThaiThuHoach: isImmediateHarvest ? createHarvestStatus : "SCHEDULED",
        trangThaiDongGoi: isImmediateHarvest ? createPackageStatus : "NOT_PACKED",
        trangThaiGiaoHang: isImmediateHarvest ? createDeliveryStatus : "WAITING_PICKUP",
        diaChiGiaoHang: createDeliveryAddress.trim() || undefined,
        ghiChu: createNote.trim() || undefined,
      };

      await farmerService.createHarvestAsync(payload);
      setHarvests(farmerService.getHarvests());
      setIsCreateModalOpen(false);
      setSuccessMessage(`Đã lập thành công phiếu thu hoạch cho thửa ${selectedPlotObj.plotCode} (HĐ: ${selectedPlotObj.contractId})!`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Create harvest error:", err);
      setCreateError(err?.response?.data?.message || err?.message || "Lỗi khi lập phiếu thu hoạch");
    } finally {
      setIsCreating(false);
    }
  }

  // Viewing / Tracking modal (Read-Only)
  const [viewingHarvest, setViewingHarvest] = useState<HarvestItem | null>(null);

  const filteredHarvests = harvests.filter((h) => {
    if (selectedStatusFilter === "ALL") return true;
    return h.harvestStatus === selectedStatusFilter;
  });

  function getHarvestStatusBadge(status: HarvestStatus) {
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

  function getPackageStatusBadge(status: PackageStatus) {
    switch (status) {
      case "PACKED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-emerald-100 text-emerald-800">Đã đóng gói</span>;
      case "STORAGE_COOL":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-blue-100 text-blue-800">Kho lạnh</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-gray-100 text-gray-700">Chưa đóng gói</span>;
    }
  }

  function getDeliveryStatusBadge(status: DeliveryStatus) {
    switch (status) {
      case "DELIVERED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-emerald-100 text-emerald-800">Đã giao tận nơi</span>;
      case "DELIVERING":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-amber-100 text-amber-800">Đang vận chuyển</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold bg-gray-100 text-gray-700">Chờ nhận hàng</span>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Quản lý Thu hoạch & Vận chuyển Nông sản (Harvest Management)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Ghi nhận sản lượng thực tế, kiểm soát đóng gói quy chuẩn và giao trả nông sản cho khách hàng.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Đang hiển thị: <strong className="text-emerald-700">{filteredHarvests.length}</strong> / {harvests.length} vụ
          </span>
          <Button
            variant="primary"
            size="sm"
            fullWidth={false}
            onClick={() => handleOpenCreateModal()}
            className="flex items-center gap-1.5 shadow-xs bg-emerald-700 hover:bg-emerald-800 text-white font-medium whitespace-nowrap"
          >
            <span>🌾</span>
            <span>+ Lên lịch / Ghi nhận Thu hoạch</span>
          </Button>
        </div>
      </div>

      {/* Admin Assignment Rule Badge */}
      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <span className="text-base">🌾</span>
          <span>
            <strong>Phân quyền Admin:</strong> Nông dân <strong>{profile.name}</strong> chỉ quản lý các vụ thu hoạch thuộc {profile.assignedPlotCount} thửa đất được giao ({profile.assignedFarms.join(", ")}).
          </span>
        </div>
        <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 shrink-0">
          {harvests.length} vụ thu hoạch
        </span>
      </div>

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 mr-2">Lọc trạng thái:</span>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedStatusFilter === "ALL"
                ? "bg-emerald-700 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            Tất cả ({harvests.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter("SCHEDULED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedStatusFilter === "SCHEDULED"
                ? "bg-amber-600 text-white"
                : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
            }`}
          >
            Lên lịch ({harvests.filter((h) => h.harvestStatus === "SCHEDULED").length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedStatusFilter("HARVESTED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedStatusFilter === "HARVESTED"
                ? "bg-emerald-600 text-white"
                : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
            }`}
          >
            Đã thu hoạch ({harvests.filter((h) => h.harvestStatus === "HARVESTED").length})
          </button>
        </div>
      </Card>

      {/* Harvest Data Table containing all 12 required fields */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50/80 text-gray-700">
            <tr>
              <th className="py-3 px-3 text-left font-semibold">Harvest ID</th>
              <th className="py-3 px-3 text-left font-semibold">Plot</th>
              <th className="py-3 px-3 text-left font-semibold">Customer</th>
              <th className="py-3 px-3 text-left font-semibold">Plant / Crop</th>
              <th className="py-3 px-3 text-left font-semibold whitespace-nowrap">Expected harvest date</th>
              <th className="py-3 px-3 text-left font-semibold whitespace-nowrap">Actual harvest date</th>
              <th className="py-3 px-3 text-left font-semibold whitespace-nowrap">Expected quantity</th>
              <th className="py-3 px-3 text-left font-semibold whitespace-nowrap">Actual quantity</th>
              <th className="py-3 px-3 text-left font-semibold">Harvest status</th>
              <th className="py-3 px-3 text-left font-semibold">Package status</th>
              <th className="py-3 px-3 text-left font-semibold">Delivery status</th>
              <th className="py-3 px-3 text-left font-semibold min-w-[200px]">Note</th>
              <th className="py-3 px-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredHarvests.length === 0 ? (
              <tr>
                <td colSpan={13} className="py-12 text-center text-gray-500">
                  <div className="max-w-md mx-auto space-y-3">
                    <div className="text-4xl">🌾</div>
                    <p className="font-bold text-gray-800 text-sm">Chưa có vụ thu hoạch nào</p>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Các thửa đất bạn phụ trách chưa có lịch thu hoạch nào. Hãy bấm nút bên dưới để bắt đầu ghi nhận đợt thu hoạch nông sản cho khách hàng.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleOpenCreateModal()}
                      className="mt-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                    >
                      🌾 + Ghi nhận Thu hoạch ngay
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredHarvests.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50/70 transition">
                  {/* Harvest ID */}
                  <td className="py-3.5 px-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                    #{h.id}
                  </td>

                  {/* Plot */}
                  <td className="py-3.5 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                    {h.plot}
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-3 font-medium text-gray-900 whitespace-nowrap">
                    {h.customer}
                  </td>

                  {/* Plant / Crop */}
                  <td className="py-3.5 px-3 font-semibold text-emerald-900 whitespace-nowrap">
                    {h.plantCrop}
                  </td>

                  {/* Expected harvest date */}
                  <td className="py-3.5 px-3 text-gray-600 whitespace-nowrap">
                    {h.expectedHarvestDate}
                  </td>

                  {/* Actual harvest date */}
                  <td className="py-3.5 px-3 font-medium text-gray-900 whitespace-nowrap">
                    {h.actualHarvestDate || <span className="text-gray-300 italic">Chưa cắt</span>}
                  </td>

                  {/* Expected quantity */}
                  <td className="py-3.5 px-3 text-gray-600 whitespace-nowrap font-mono">
                    {h.expectedQuantity}
                  </td>

                  {/* Actual quantity */}
                  <td className="py-3.5 px-3 font-bold text-emerald-800 whitespace-nowrap font-mono">
                    {h.actualQuantity || <span className="text-gray-300 font-normal italic">--</span>}
                  </td>

                  {/* Harvest status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getHarvestStatusBadge(h.harvestStatus)}
                  </td>

                  {/* Package status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getPackageStatusBadge(h.packageStatus)}
                  </td>

                  {/* Delivery status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getDeliveryStatusBadge(h.deliveryStatus)}
                  </td>

                  {/* Note */}
                  <td className="py-3.5 px-3 text-gray-700 leading-relaxed">
                    {h.note || <span className="text-gray-300 italic">--</span>}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        fullWidth={false}
                        onClick={() => setViewingHarvest(h)}
                        className="flex items-center gap-1 hover:border-emerald-600 hover:text-emerald-700 font-medium text-xs"
                      >
                        <span>🔍</span>
                        <span>Chi tiết</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Chi Tiết & Theo Dõi Tiến Trình Đơn Hàng (Read-Only) */}
      <Modal
        isOpen={Boolean(viewingHarvest)}
        onClose={() => setViewingHarvest(null)}
        title={`🔍 Chi Tiết & Theo Dõi Đơn Hàng #${viewingHarvest?.id}`}
        description="Theo dõi trạng thái vụ mùa từ thu hoạch, đóng gói đến giao nhận bưu chính."
        footer={
          <Button
            variant="primary"
            size="sm"
            fullWidth={false}
            onClick={() => setViewingHarvest(null)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium px-5"
          >
            Đóng
          </Button>
        }
      >
        {viewingHarvest && (
          <div className="space-y-5 text-xs">
            {/* Role Notice Banner */}
            <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-900">
              <span className="text-base flex-shrink-0">ℹ️</span>
              <div className="leading-relaxed">
                <span className="font-semibold">Chế độ theo dõi tiến độ: </span>
                Nông dân chỉ theo dõi tình trạng đơn hàng và lịch trình giao vận. Việc khởi tạo mã vận đơn bưu chính và điều phối đơn vị vận chuyển do Quản trị viên (Admin/Logistics) quản lý.
              </div>
            </div>

            {/* Visual Tracking Stepper */}
            <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 space-y-3">
              <h4 className="font-bold text-gray-800 uppercase tracking-wider text-2xs flex items-center gap-1.5">
                <span>📍</span>
                <span>Tiến trình thực hiện đơn hàng</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Step 1: Harvest */}
                <div
                  className={`p-3 rounded-lg border flex flex-col justify-between ${
                    viewingHarvest.harvestStatus === "HARVESTED"
                      ? "bg-emerald-50 border-emerald-300"
                      : viewingHarvest.harvestStatus === "IN_PROGRESS"
                      ? "bg-blue-50 border-blue-300"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-gray-700 text-xs">1. Thu hoạch</span>
                      {getHarvestStatusBadge(viewingHarvest.harvestStatus)}
                    </div>
                    <div className="text-2xs text-gray-600 space-y-0.5">
                      <div>
                        Dự kiến: <span className="font-medium text-gray-800">{viewingHarvest.expectedHarvestDate}</span>
                      </div>
                      <div>
                        Thực tế: <span className="font-medium text-gray-800">{viewingHarvest.actualHarvestDate || "Chưa ghi nhận"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-2xs font-semibold text-emerald-800 pt-1.5 border-t border-gray-100">
                    Sản lượng: {viewingHarvest.actualQuantity || viewingHarvest.expectedQuantity}
                  </div>
                </div>

                {/* Step 2: Package */}
                <div
                  className={`p-3 rounded-lg border flex flex-col justify-between ${
                    viewingHarvest.packageStatus === "PACKED" || viewingHarvest.packageStatus === "STORAGE_COOL"
                      ? "bg-emerald-50 border-emerald-300"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-gray-700 text-xs">2. Đóng gói</span>
                      {getPackageStatusBadge(viewingHarvest.packageStatus)}
                    </div>
                    <div className="text-2xs text-gray-600">
                      {viewingHarvest.packageStatus === "PACKED" && "Đã đóng gói thùng chuẩn bảo quản sẵn sàng bàn giao."}
                      {viewingHarvest.packageStatus === "STORAGE_COOL" && "Đang được lưu trữ nhiệt độ mát bảo quản độ tươi ngon."}
                      {viewingHarvest.packageStatus === "NOT_PACKED" && "Chưa đóng gói hoặc đang chờ sơ chế nông sản."}
                    </div>
                  </div>
                  <div className="mt-2 text-2xs text-gray-500 pt-1.5 border-t border-gray-100">
                    Quy cách: Thùng giấy PlotFarm Eco
                  </div>
                </div>

                {/* Step 3: Delivery */}
                <div
                  className={`p-3 rounded-lg border flex flex-col justify-between ${
                    viewingHarvest.deliveryStatus === "DELIVERED"
                      ? "bg-emerald-50 border-emerald-300"
                      : viewingHarvest.deliveryStatus === "DELIVERING"
                      ? "bg-amber-50 border-amber-300"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-gray-700 text-xs">3. Vận chuyển</span>
                      {getDeliveryStatusBadge(viewingHarvest.deliveryStatus)}
                    </div>
                    <div className="text-2xs text-gray-600">
                      {viewingHarvest.deliveryStatus === "DELIVERED" && "Nông sản đã giao an toàn tận tay khách hàng."}
                      {viewingHarvest.deliveryStatus === "DELIVERING" && "Bưu tá đang vận chuyển đơn hàng đến địa chỉ nhận."}
                      {viewingHarvest.deliveryStatus === "WAITING_PICKUP" && "Đang chờ bàn giao cho đơn vị vận chuyển."}
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-gray-100">
                    {viewingHarvest.trackingCode ? (
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-2xs">
                        🚚 {viewingHarvest.trackingCode}
                      </span>
                    ) : (
                      <span className="text-amber-700 italic text-2xs">Chưa tạo mã vận đơn</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tracking Code Highlight Box */}
            <div
              className={`p-3.5 rounded-xl border ${
                viewingHarvest.trackingCode
                  ? "bg-emerald-50/50 border-emerald-200"
                  : "bg-amber-50/60 border-amber-200"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{viewingHarvest.trackingCode ? "📦" : "⏳"}</span>
                  <div>
                    <div className="font-semibold text-gray-900 text-xs">
                      {viewingHarvest.trackingCode ? "Mã vận đơn giao hàng:" : "Trạng thái mã vận đơn:"}
                    </div>
                    <div className="text-2xs text-gray-500">
                      {viewingHarvest.trackingCode
                        ? "Sử dụng mã này để tra cứu lộ trình trên hệ thống bưu chính"
                        : "Đơn hàng này chưa có mã vận đơn nên chưa chuyển sang trạng thái đi đường."}
                    </div>
                  </div>
                </div>
                {viewingHarvest.trackingCode ? (
                  <span className="font-mono font-bold text-sm bg-white border border-emerald-300 text-emerald-800 px-3 py-1 rounded-lg shadow-2xs">
                    {viewingHarvest.trackingCode}
                  </span>
                ) : (
                  <span className="text-2xs font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg">
                    Chờ Admin tạo mã vận đơn
                  </span>
                )}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plot & Crop details */}
              <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-2.5">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-2xs flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                  <span>🌱</span>
                  <span>Thông tin nông sản & Thửa đất</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-2xs">
                  <div>
                    <span className="text-gray-500 block">Thửa đất canh tác:</span>
                    <strong className="text-emerald-800 text-xs">{viewingHarvest.plot}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Cây trồng:</span>
                    <strong className="text-gray-900 text-xs">{viewingHarvest.plantCrop}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Sản lượng dự kiến:</span>
                    <span className="font-mono text-gray-700">{viewingHarvest.expectedQuantity}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Sản lượng thực tế:</span>
                    <span className="font-mono font-bold text-emerald-700">{viewingHarvest.actualQuantity || "Chưa cân"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Ngày dự kiến:</span>
                    <span className="text-gray-700">{viewingHarvest.expectedHarvestDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Ngày thực tế:</span>
                    <span className="text-gray-700">{viewingHarvest.actualHarvestDate || "Chưa ghi nhận"}</span>
                  </div>
                </div>
              </div>

              {/* Customer & Delivery details */}
              <div className="p-3.5 bg-white rounded-xl border border-gray-200 space-y-2.5">
                <h4 className="font-bold text-gray-800 uppercase tracking-wider text-2xs flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
                  <span>👤</span>
                  <span>Khách hàng & Địa chỉ nhận hàng</span>
                </h4>
                <div className="space-y-2 text-2xs">
                  <div>
                    <span className="text-gray-500 block">Người sở hữu hợp đồng:</span>
                    <strong className="text-gray-900 text-xs">{viewingHarvest.customer}</strong>
                    {viewingHarvest.customerId && (
                      <span className="text-gray-400 ml-1">({viewingHarvest.customerId})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-gray-500 block">Địa chỉ giao nhận hàng:</span>
                    <span className="text-gray-800 leading-relaxed font-medium">
                      {viewingHarvest.deliveryAddress || "Địa chỉ theo hồ sơ hợp đồng của khách hàng"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Ghi chú vụ mùa & Kiểm định:</span>
                    <p className="text-gray-700 italic bg-gray-50 p-2 rounded border border-gray-100 mt-1">
                      {viewingHarvest.note || "Không có ghi chú thêm."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Lập Phiếu Thu Hoạch Mới */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="🌾 Lập Phiếu Thu Hoạch & Giao Hàng Nông Sản"
        description="Ghi nhận thông tin thu hoạch mùa vụ cho thửa đất được phân công, cập nhật sản lượng thực tế và trạng thái giao hàng."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              disabled={isCreating}
              onClick={() => setIsCreateModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              disabled={
                isCreating ||
                (plots.find((p) => p.plotCode === createPlotCode || p.id === createPlotCode)?.progress ?? 0) < 95
              }
              onClick={handleSaveNewHarvest}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium disabled:opacity-50"
            >
              {isCreating ? "Đang lưu..." : "✓ Xác nhận Lập phiếu Thu hoạch"}
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {createError && (
            <Alert variant="error" onClose={() => setCreateError("")}>
              {createError}
            </Alert>
          )}

          {/* Chọn thửa đất */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Chọn Thửa ruộng cần Thu hoạch (Yêu cầu tiến độ đạt từ 95% trở lên) *
            </label>
            <select
              value={createPlotCode}
              onChange={(e) => setCreatePlotCode(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            >
              {plots.map((p) => {
                const isDelivered = p.deliveryStatus === "DELIVERED" || p.plantStatus === "Đã giao hàng";
                const isUnder95 = p.progress < 95;
                const isDisabled = isDelivered || isUnder95;
                return (
                  <option key={p.id} value={p.plotCode} disabled={isDisabled}>
                    {p.plotCode} - {p.plantCrop} ({p.progress}%) - {p.farmName}
                    {isDelivered
                      ? " — [Đã hoàn tất giao hàng]"
                      : isUnder95
                      ? ` — [Chưa đạt chuẩn: Mới đạt ${p.progress}% < 95%]`
                      : " — [Đủ điều kiện thu hoạch (>= 95%)]"}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Thông tin thửa đất & khách hàng tóm tắt */}
          {(() => {
            const curPlot = plots.find((p) => p.plotCode === createPlotCode || p.id === createPlotCode);
            if (!curPlot) return null;
            return (
              <div className="space-y-2">
                <div className="p-3 bg-emerald-50/80 rounded-xl border border-emerald-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-2xs">
                  <div>
                    <span className="text-gray-500 block">Cây trồng:</span>
                    <strong className="text-emerald-900">{curPlot.plantCrop}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Khách hàng:</span>
                    <strong className="text-emerald-900">{curPlot.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Mã hợp đồng:</span>
                    <strong className="text-emerald-900 font-mono">{curPlot.contractId}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Tiến độ mùa vụ:</span>
                    <strong
                      className={
                        curPlot.progress >= 95
                          ? "text-emerald-700 font-bold"
                          : "text-amber-700 font-bold"
                      }
                    >
                      {curPlot.progress}%{" "}
                      {curPlot.progress >= 95
                        ? "✓ (Đạt chuẩn >= 95%)"
                        : "⚠️ (Chưa đạt chuẩn >= 95%)"}
                    </strong>
                  </div>
                </div>

                {curPlot.progress < 95 && (
                  <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg text-2xs text-amber-900 flex items-start gap-2">
                    <span className="text-base flex-shrink-0">⚠️</span>
                    <div className="leading-relaxed">
                      <strong>Chưa đủ điều kiện thu hoạch:</strong> Thửa đất này hiện mới đạt{" "}
                      <strong>{curPlot.progress}%</strong> tiến độ. Quy định nông nghiệp yêu cầu
                      tiến độ mùa vụ phải đạt <strong>từ 95% trở lên</strong> mới được phép lập
                      phiếu thu hoạch nông sản.
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Dự kiến */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Ngày thu hoạch dự kiến *
              </label>
              <Input
                type="date"
                value={createExpectedDate}
                onChange={(e) => setCreateExpectedDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Sản lượng dự kiến (kg) *
              </label>
              <Input
                value={createExpectedQty}
                placeholder="VD: 50 kg"
                onChange={(e) => setCreateExpectedQty(e.target.value)}
              />
            </div>
          </div>

          {/* Checkbox Đã thu hoạch xong ngay */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
              <input
                type="checkbox"
                checked={isImmediateHarvest}
                onChange={(e) => setIsImmediateHarvest(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <span>Ghi nhận hoàn tất thu hoạch thực tế ngay hôm nay (Đã cắt xong)</span>
            </label>

            {isImmediateHarvest && (
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Ngày thu hoạch thực tế:
                    </label>
                    <Input
                      type="date"
                      value={createActualDate}
                      onChange={(e) => setCreateActualDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Sản lượng thực tế thu hoạch:
                    </label>
                    <Input
                      value={createActualQty}
                      placeholder="VD: 52.5 kg"
                      onChange={(e) => setCreateActualQty(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Trạng thái thu hoạch:
                    </label>
                    <select
                      value={createHarvestStatus}
                      onChange={(e) => setCreateHarvestStatus(e.target.value as HarvestStatus)}
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white"
                    >
                      <option value="HARVESTED">Đã thu hoạch (HARVESTED)</option>
                      <option value="IN_PROGRESS">Đang thu hoạch (IN_PROGRESS)</option>
                      <option value="SCHEDULED">Lên lịch (SCHEDULED)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Đóng gói:
                    </label>
                    <select
                      value={createPackageStatus}
                      onChange={(e) => setCreatePackageStatus(e.target.value as PackageStatus)}
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white"
                    >
                      <option value="NOT_PACKED">Chưa đóng gói</option>
                      <option value="PACKED">Đã đóng gói thùng carton</option>
                      <option value="STORAGE_COOL">Bảo quản kho lạnh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">
                      Giao hàng:
                    </label>
                    <select
                      value={createDeliveryStatus}
                      onChange={(e) => setCreateDeliveryStatus(e.target.value as DeliveryStatus)}
                      className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white"
                    >
                      <option value="WAITING_PICKUP">Chờ nhận hàng</option>
                      <option value="DELIVERING">Đang vận chuyển</option>
                      <option value="DELIVERED">Đã giao tận nơi</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Địa chỉ giao hàng */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Địa chỉ giao hàng cho khách:
            </label>
            <Input
              value={createDeliveryAddress}
              placeholder="Để trống sẽ tự động lấy địa chỉ trong hợp đồng của khách"
              onChange={(e) => setCreateDeliveryAddress(e.target.value)}
            />
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Ghi chú chất lượng nông sản:
            </label>
            <textarea
              rows={2}
              value={createNote}
              onChange={(e) => setCreateNote(e.target.value)}
              placeholder="Chất lượng nông sản, độ ngọt, tiêu chuẩn đóng gói..."
              className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
