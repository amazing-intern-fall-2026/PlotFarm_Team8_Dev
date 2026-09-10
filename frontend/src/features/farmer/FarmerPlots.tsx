import { useState, useEffect } from "react";
import { farmerService } from "./farmer.service";
import type { FarmerPlotItem, PlantGrowthStage, PlotStatus, FarmerProfileData } from "./farmer.types";
import { Card, Badge, Button, Modal, Input, Alert } from "../../components/ui";

export default function FarmerPlots() {
  const [profile, setProfile] = useState<FarmerProfileData>(() => farmerService.getFarmerProfile());
  const [plots, setPlots] = useState<FarmerPlotItem[]>(() => farmerService.getPlots());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFarm, setSelectedFarm] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");

  useEffect(() => {
    function handleFarmerChange() {
      setProfile(farmerService.getFarmerProfile());
      setPlots(farmerService.getPlots());
      setSelectedFarm("ALL");
    }
    window.addEventListener("pf_farmer_changed", handleFarmerChange);
    return () => window.removeEventListener("pf_farmer_changed", handleFarmerChange);
  }, []);

  // Edit Modal State
  const [editingPlot, setEditingPlot] = useState<FarmerPlotItem | null>(null);
  const [editProgress, setEditProgress] = useState<number>(0);
  const [editPlantStatus, setEditPlantStatus] = useState<PlantGrowthStage>("Phát triển tốt");
  const [successMessage, setSuccessMessage] = useState("");

  const farmList = Array.from(new Set(plots.map((p) => p.farmName)));

  const filteredPlots = plots.filter((plot) => {
    const matchesSearch =
      plot.plotCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.plantCrop.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plot.contractId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFarm = selectedFarm === "ALL" || plot.farmName === selectedFarm;
    const matchesStatus = selectedStatus === "ALL" || plot.plotStatus === selectedStatus;

    return matchesSearch && matchesFarm && matchesStatus;
  });

  function handleOpenEdit(plot: FarmerPlotItem) {
    setEditingPlot(plot);
    setEditProgress(plot.progress);
    setEditPlantStatus(plot.plantStatus);
  }

  function handleSaveEdit() {
    if (!editingPlot) return;
    const updated = farmerService.updatePlot(editingPlot.id, editProgress, editPlantStatus);
    setPlots((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPlot(null);
    setSuccessMessage(`Đã cập nhật thành công tiến độ thửa đất ${updated.plotCode}!`);
    setTimeout(() => setSuccessMessage(""), 3500);
  }

  function getStatusBadge(status: PlotStatus) {
    switch (status) {
      case "IN_USE":
        return <Badge variant="success">Đang canh tác</Badge>;
      case "ACTIVE":
        return <Badge variant="info">Đang hoạt động</Badge>;
      case "RESTING":
        return <Badge variant="warning">Đang nghỉ / Cải tạo</Badge>;
      case "MAINTENANCE":
        return <Badge variant="neutral">Bảo trì</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  }

  function getPlantStatusColor(status: PlantGrowthStage) {
    switch (status) {
      case "Phát triển tốt":
        return "text-emerald-700 font-semibold";
      case "Đang ra hoa":
        return "text-purple-700 font-semibold";
      case "Chuẩn bị thu hoạch":
        return "text-amber-700 font-semibold";
      case "Cần chú ý chăm sóc":
        return "text-red-700 font-semibold";
      default:
        return "text-gray-700";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Quản lý Thửa đất Nông trại (Farm & Plot Management)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi danh sách thửa đất, hợp đồng thuê của khách hàng, tiến độ sinh trưởng cây trồng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Đang quản lý: <strong className="text-emerald-700">{filteredPlots.length}</strong> / {plots.length} thửa
          </span>
        </div>
      </div>

      {/* Admin Assignment Rule Badge */}
      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <span className="text-base">📌</span>
          <span>
            <strong>Quy tắc UI:</strong> Đang hiển thị danh sách thửa đất thuộc quyền quản lý của Nông dân <strong>{profile.name}</strong> ({profile.assignedFarms.join(", ")}).
          </span>
        </div>
        <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 shrink-0">
          Admin phân công ({plots.length} thửa)
        </span>
      </div>

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Tìm kiếm thửa / Khách / Cây trồng:
            </label>
            <Input
              placeholder="Nhập mã thửa (#PL-...), tên khách, cây trồng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Lọc theo Trang trại (Farm name):
            </label>
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="ALL">Tất cả trang trại ({farmList.length})</option>
              {farmList.map((farm) => (
                <option key={farm} value={farm}>
                  {farm}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Lọc theo Trạng thái thửa (Plot status):
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="IN_USE">Đang canh tác (IN_USE)</option>
              <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
              <option value="RESTING">Đang nghỉ / Cải tạo (RESTING)</option>
              <option value="MAINTENANCE">Bảo trì (MAINTENANCE)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Plots Data Table containing all 11 required fields */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50/80 text-gray-700">
            <tr>
              <th className="py-3 px-3 text-left font-semibold">Plot code</th>
              <th className="py-3 px-3 text-left font-semibold">Farm name</th>
              <th className="py-3 px-3 text-left font-semibold">Customer name</th>
              <th className="py-3 px-3 text-left font-semibold">Contract ID</th>
              <th className="py-3 px-3 text-left font-semibold">Plant / Crop</th>
              <th className="py-3 px-3 text-left font-semibold">Plant status</th>
              <th className="py-3 px-3 text-left font-semibold min-w-[130px]">Progress (%)</th>
              <th className="py-3 px-3 text-left font-semibold">Thời gian vụ</th>
              <th className="py-3 px-3 text-left font-semibold">Plot status</th>
              <th className="py-3 px-3 text-left font-semibold">Last update</th>
              <th className="py-3 px-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredPlots.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-400">
                  Không tìm thấy thửa đất nào phù hợp với bộ lọc tìm kiếm.
                </td>
              </tr>
            ) : (
              filteredPlots.map((plot) => (
                <tr key={plot.id} className="hover:bg-gray-50/70 transition">
                  {/* Plot code */}
                  <td className="py-3.5 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                    {plot.plotCode}
                  </td>

                  {/* Farm name */}
                  <td className="py-3.5 px-3 font-medium text-gray-900 max-w-[160px] truncate" title={plot.farmName}>
                    {plot.farmName}
                  </td>

                  {/* Customer name */}
                  <td className="py-3.5 px-3 text-gray-800 font-medium">
                    {plot.customerName}
                  </td>

                  {/* Contract ID */}
                  <td className="py-3.5 px-3 font-mono text-gray-500 whitespace-nowrap">
                    {plot.contractId}
                  </td>

                  {/* Plant / Crop */}
                  <td className="py-3.5 px-3 font-medium text-emerald-900 whitespace-nowrap">
                    {plot.plantCrop}
                  </td>

                  {/* Plant status */}
                  <td className={`py-3.5 px-3 whitespace-nowrap ${getPlantStatusColor(plot.plantStatus)}`}>
                    {plot.plantStatus}
                  </td>

                  {/* Progress (%) */}
                  <td className="py-3.5 px-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-2xs text-gray-600">
                        <span className="font-bold">{plot.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            plot.progress > 80
                              ? "bg-amber-500"
                              : plot.progress > 40
                              ? "bg-emerald-600"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${plot.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Start date -> End date */}
                  <td className="py-3.5 px-3 text-2xs text-gray-600 whitespace-nowrap">
                    <div>{plot.startDate}</div>
                    <div className="text-gray-400">đến {plot.endDate}</div>
                  </td>

                  {/* Plot status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getStatusBadge(plot.plotStatus)}
                  </td>

                  {/* Last update */}
                  <td className="py-3.5 px-3 text-2xs text-gray-500 whitespace-nowrap">
                    {plot.lastUpdate}
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-3 text-right whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth={false}
                      onClick={() => handleOpenEdit(plot)}
                    >
                      Cập nhật
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal cập nhật tiến độ thửa đất */}
      <Modal
        isOpen={Boolean(editingPlot)}
        onClose={() => setEditingPlot(null)}
        title={`Cập nhật tiến độ: ${editingPlot?.plotCode} (${editingPlot?.plantCrop})`}
        description="Điều chỉnh tiến độ hoàn thành mùa vụ và giai đoạn phát triển của cây trồng."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => setEditingPlot(null)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleSaveEdit}
            >
              Lưu thay đổi
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Tiến độ mùa vụ: <span className="text-emerald-700 font-bold">{editProgress}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={editProgress}
              onChange={(e) => setEditProgress(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
            <div className="flex justify-between text-2xs text-gray-400 mt-1">
              <span>0% (Mới gieo)</span>
              <span>50% (Phát triển)</span>
              <span>100% (Hoàn tất thu hoạch)</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Tình trạng sinh trưởng (Plant status):
            </label>
            <select
              value={editPlantStatus}
              onChange={(e) => setEditPlantStatus(e.target.value as PlantGrowthStage)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="Đang gieo trồng">Đang gieo trồng</option>
              <option value="Phát triển tốt">Phát triển tốt</option>
              <option value="Đang ra hoa">Đang ra hoa</option>
              <option value="Chuẩn bị thu hoạch">Chuẩn bị thu hoạch</option>
              <option value="Cần chú ý chăm sóc">Cần chú ý chăm sóc</option>
            </select>
          </div>

          <div className="rounded-lg bg-emerald-50 p-3 text-2xs text-emerald-800 space-y-1">
            <p className="font-semibold">Thông tin liên quan:</p>
            <p>Khách hàng: <strong>{editingPlot?.customerName}</strong></p>
            <p>Trang trại: {editingPlot?.farmName}</p>
            <p>Hợp đồng: {editingPlot?.contractId}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
