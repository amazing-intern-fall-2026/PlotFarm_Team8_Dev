import { useState, useEffect } from "react";
import { farmerService } from "./farmer.service";
import type { DeliveryStatus, HarvestItem, HarvestStatus, PackageStatus, FarmerProfileData } from "./farmer.types";
import { Card, Badge, Button, Modal, Input, Alert } from "../../components/ui";

export default function FarmerHarvest() {
  const [profile, setProfile] = useState<FarmerProfileData>(() => farmerService.getFarmerProfile());
  const [harvests, setHarvests] = useState<HarvestItem[]>(() => farmerService.getHarvests());
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("ALL");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    function handleFarmerChange() {
      setProfile(farmerService.getFarmerProfile());
      setHarvests(farmerService.getHarvests());
      setSelectedStatusFilter("ALL");
    }
    window.addEventListener("pf_farmer_changed", handleFarmerChange);
    return () => window.removeEventListener("pf_farmer_changed", handleFarmerChange);
  }, []);

  // Edit/Record modal
  const [editingHarvest, setEditingHarvest] = useState<HarvestItem | null>(null);
  const [formActualDate, setFormActualDate] = useState("");
  const [formActualQty, setFormActualQty] = useState("");
  const [formHarvestStatus, setFormHarvestStatus] = useState<HarvestStatus>("SCHEDULED");
  const [formPackageStatus, setFormPackageStatus] = useState<PackageStatus>("NOT_PACKED");
  const [formDeliveryStatus, setFormDeliveryStatus] = useState<DeliveryStatus>("WAITING_PICKUP");
  const [formNote, setFormNote] = useState("");

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

  function handleOpenEdit(harvest: HarvestItem) {
    setEditingHarvest(harvest);
    setFormActualDate(harvest.actualHarvestDate || new Date().toLocaleDateString("vi-VN"));
    setFormActualQty(harvest.actualQuantity || harvest.expectedQuantity);
    setFormHarvestStatus(harvest.harvestStatus);
    setFormPackageStatus(harvest.packageStatus);
    setFormDeliveryStatus(harvest.deliveryStatus);
    setFormNote(harvest.note || "");
  }

  function handleSaveHarvest() {
    if (!editingHarvest) return;

    const updated = farmerService.updateHarvest(editingHarvest.id, {
      actualHarvestDate: formActualDate,
      actualQuantity: formActualQty,
      harvestStatus: formHarvestStatus,
      packageStatus: formPackageStatus,
      deliveryStatus: formDeliveryStatus,
      note: formNote.trim(),
    });

    setHarvests((prev) => prev.map((h) => (h.id === updated.id ? updated : h)));
    setEditingHarvest(null);
    setSuccessMessage(`Đã cập nhật thông tin vụ thu hoạch #${updated.id} thành công!`);
    setTimeout(() => setSuccessMessage(""), 3500);
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Đang hiển thị: <strong className="text-emerald-700">{filteredHarvests.length}</strong> / {harvests.length} vụ
          </span>
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
                <td colSpan={13} className="py-8 text-center text-gray-400">
                  Không tìm thấy thông tin vụ thu hoạch nào.
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
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth={false}
                      onClick={() => handleOpenEdit(h)}
                    >
                      Ghi nhận
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Cập nhật / Ghi nhận Thu Hoạch */}
      <Modal
        isOpen={Boolean(editingHarvest)}
        onClose={() => setEditingHarvest(null)}
        title={`Ghi nhận Thu hoạch: #${editingHarvest?.id} - ${editingHarvest?.plantCrop}`}
        description="Nhập ngày thu hoạch thực tế, sản lượng cân đong và trạng thái đóng gói giao trả."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => setEditingHarvest(null)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleSaveHarvest}
            >
              Lưu dữ liệu thu hoạch
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Ngày thu hoạch thực tế:
              </label>
              <Input
                value={formActualDate}
                placeholder="VD: 15/03/2026"
                onChange={(e) => setFormActualDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Sản lượng thực tế thu hoạch:
              </label>
              <Input
                value={formActualQty}
                placeholder="VD: 475 kg"
                onChange={(e) => setFormActualQty(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Trạng thái thu hoạch:
              </label>
              <select
                value={formHarvestStatus}
                onChange={(e) => setFormHarvestStatus(e.target.value as HarvestStatus)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
              >
                <option value="SCHEDULED">SCHEDULED (Lên lịch)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Đang cắt)</option>
                <option value="HARVESTED">HARVESTED (Đã xong)</option>
                <option value="CANCELLED">CANCELLED (Hủy vụ)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Đóng gói nông sản:
              </label>
              <select
                value={formPackageStatus}
                onChange={(e) => setFormPackageStatus(e.target.value as PackageStatus)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
              >
                <option value="NOT_PACKED">NOT_PACKED (Chưa đóng)</option>
                <option value="PACKED">PACKED (Đã đóng thùng)</option>
                <option value="STORAGE_COOL">STORAGE_COOL (Kho lạnh)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Giao hàng (Delivery):
              </label>
              <select
                value={formDeliveryStatus}
                onChange={(e) => setFormDeliveryStatus(e.target.value as DeliveryStatus)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
              >
                <option value="WAITING_PICKUP">WAITING_PICKUP (Chờ giao)</option>
                <option value="DELIVERING">DELIVERING (Đang giao)</option>
                <option value="DELIVERED">DELIVERED (Đã giao khách)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Ghi chú chất lượng / Kiểm định (Note):
            </label>
            <textarea
              rows={3}
              placeholder="Ghi chú về độ ngọt, kích cỡ trái, chất lượng lúa, phản hồi kiểm định..."
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
