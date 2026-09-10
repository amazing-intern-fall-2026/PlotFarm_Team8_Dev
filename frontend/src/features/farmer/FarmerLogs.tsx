import { useState, useEffect } from "react";
import { getCurrentUser } from "../auth/auth.api";
import { farmerService } from "./farmer.service";
import type { FarmingLogItem, FarmerProfileData, FarmerPlotItem } from "./farmer.types";
import { Card, Button, Modal, Input, Alert } from "../../components/ui";

export default function FarmerLogs() {
  const currentUser = getCurrentUser();
  const [profile, setProfile] = useState<FarmerProfileData>(() => farmerService.getFarmerProfile());
  const [logs, setLogs] = useState<FarmingLogItem[]>(() => farmerService.getFarmingLogs());
  const [plots, setPlots] = useState<FarmerPlotItem[]>(() => farmerService.getPlots());

  const [selectedPlotFilter, setSelectedPlotFilter] = useState<string>("ALL");
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>("ALL");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    function handleFarmerChange() {
      setProfile(farmerService.getFarmerProfile());
      setLogs(farmerService.getFarmingLogs());
      setPlots(farmerService.getPlots());
      setSelectedPlotFilter("ALL");
    }
    window.addEventListener("pf_farmer_changed", handleFarmerChange);
    return () => window.removeEventListener("pf_farmer_changed", handleFarmerChange);
  }, []);

  // Add Log Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formPlot, setFormPlot] = useState<string>("#PL-0192");
  const [formActivity, setFormActivity] = useState<string>("Bón phân");
  const [formPlantStatus, setFormPlantStatus] = useState<string>("Phát triển tốt");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formImageEvidence, setFormImageEvidence] = useState<string>(
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop&q=80",
  );
  const [formError, setFormError] = useState("");

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const matchesPlot = selectedPlotFilter === "ALL" || log.plot === selectedPlotFilter;
    const matchesActivity = selectedActivityFilter === "ALL" || log.activity === selectedActivityFilter;
    return matchesPlot && matchesActivity;
  });

  const activityOptions = [
    "Bón phân",
    "Tưới nước",
    "Phun thuốc sinh học",
    "Làm cỏ",
    "Tỉa cành",
    "Kiểm tra sâu bệnh",
    "Đo độ ngọt Brix",
    "Thu hoạch thử",
  ];

  function handleOpenAddModal() {
    setFormPlot(plots[0]?.plotCode || "#PL-0192");
    setFormActivity("Bón phân");
    setFormPlantStatus("Phát triển tốt");
    setFormDescription("");
    setFormError("");
    setIsAddModalOpen(true);
  }

  function handleSaveLog() {
    if (!formDescription.trim()) {
      setFormError("Vui lòng nhập mô tả chi tiết công việc đã thực hiện");
      return;
    }
    if (formDescription.trim().length < 8) {
      setFormError("Mô tả hoạt động phải có ít nhất 8 ký tự");
      return;
    }

    const createdBy = profile.name ? `${profile.name} (Nông Dân)` : currentUser?.fullName || "Nông Dân";

    const newLog = farmerService.addFarmingLog({
      plot: formPlot,
      activity: formActivity,
      plantStatus: formPlantStatus,
      description: formDescription.trim(),
      imageEvidence: formImageEvidence || undefined,
      createdBy,
    });

    setLogs((prev) => [newLog, ...prev]);
    setIsAddModalOpen(false);
    setSuccessMessage(`Đã ghi thành công nhật ký cho thửa ${newLog.plot}!`);
    setTimeout(() => setSuccessMessage(""), 3500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Nhật ký Canh tác Đồng ruộng (Farming Log)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Minh bạch hóa hoạt động canh tác hàng ngày cho khách hàng và bộ phận quản trị.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          fullWidth={false}
          onClick={handleOpenAddModal}
        >
          + Ghi nhật ký mới
        </Button>
      </div>

      {/* Admin Assignment Rule Badge */}
      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <span className="text-base">📝</span>
          <span>
            <strong>Phân quyền Admin:</strong> Nông dân <strong>{profile.name}</strong> chỉ ghi và xem nhật ký cho {plots.length} thửa đất được giao ({plots.map((p) => p.plotCode).join(", ")}).
          </span>
        </div>
        <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 shrink-0">
          {filteredLogs.length} nhật ký
        </span>
      </div>

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Lọc theo Thửa ruộng (Plot):
            </label>
            <select
              value={selectedPlotFilter}
              onChange={(e) => setSelectedPlotFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="ALL">Tất cả thửa ruộng ({plots.length} thửa)</option>
              {plots.map((p) => (
                <option key={p.id} value={p.plotCode}>
                  {p.plotCode} - {p.plantCrop} ({p.customerName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Lọc theo Hoạt động (Activity):
            </label>
            <select
              value={selectedActivityFilter}
              onChange={(e) => setSelectedActivityFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="ALL">Tất cả hoạt động</option>
              {activityOptions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Logs Table & Gallery View */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50/80 text-gray-700">
            <tr>
              <th className="py-3 px-3.5 text-left font-semibold">Plot</th>
              <th className="py-3 px-3.5 text-left font-semibold">Date</th>
              <th className="py-3 px-3.5 text-left font-semibold">Activity</th>
              <th className="py-3 px-3.5 text-left font-semibold">Plant status</th>
              <th className="py-3 px-3.5 text-left font-semibold min-w-[280px]">Description / Note</th>
              <th className="py-3 px-3.5 text-center font-semibold">Image / Evidence</th>
              <th className="py-3 px-3.5 text-left font-semibold whitespace-nowrap">Created by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  Chưa có nhật ký nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/70 transition">
                  {/* Plot */}
                  <td className="py-3.5 px-3.5 font-mono font-bold text-emerald-800 whitespace-nowrap">
                    {log.plot}
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-3.5 text-gray-600 font-medium whitespace-nowrap">
                    {log.date}
                  </td>

                  {/* Activity */}
                  <td className="py-3.5 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {log.activity}
                    </span>
                  </td>

                  {/* Plant status */}
                  <td className="py-3.5 px-3.5 text-emerald-900 font-medium whitespace-nowrap">
                    {log.plantStatus}
                  </td>

                  {/* Description / Note */}
                  <td className="py-3.5 px-3.5 text-gray-700 leading-relaxed">
                    {log.description}
                  </td>

                  {/* Image / Evidence */}
                  <td className="py-3.5 px-3.5 text-center">
                    {log.imageEvidence ? (
                      <a
                        href={log.imageEvidence}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block group relative"
                        title="Xem ảnh gốc"
                      >
                        <img
                          src={log.imageEvidence}
                          alt="Bằng chứng đồng ruộng"
                          className="h-12 w-16 object-cover rounded-lg border border-gray-200 shadow-2xs group-hover:scale-105 transition"
                        />
                        <span className="text-2xs text-emerald-700 font-medium block mt-0.5 group-hover:underline">
                          Xem ảnh
                        </span>
                      </a>
                    ) : (
                      <span className="text-gray-400 text-2xs italic">Không có ảnh</span>
                    )}
                  </td>

                  {/* Created by */}
                  <td className="py-3.5 px-3.5 text-gray-600 whitespace-nowrap">
                    {log.createdBy}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm Nhật Ký Canh Tác Mới */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ghi nhật ký canh tác thực địa"
        description="Ghi lại các hoạt động chăm sóc, tưới tiêu, bón phân để gửi báo cáo tới chủ thửa đất."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => setIsAddModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleSaveLog}
            >
              Lưu nhật ký
            </Button>
          </>
        }
      >
        <div className="space-y-3.5 text-xs">
          {formError && (
            <Alert variant="error" onClose={() => setFormError("")}>
              {formError}
            </Alert>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Chọn Thửa ruộng (Plot):
            </label>
            <select
              value={formPlot}
              onChange={(e) => setFormPlot(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            >
              {plots.map((p) => (
                <option key={p.id} value={p.plotCode}>
                  {p.plotCode} - {p.plantCrop} ({p.customerName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Hoạt động (Activity):
              </label>
              <select
                value={formActivity}
                onChange={(e) => setFormActivity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
              >
                {activityOptions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Tình trạng cây trồng:
              </label>
              <select
                value={formPlantStatus}
                onChange={(e) => setFormPlantStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
              >
                <option value="Phát triển tốt">Phát triển tốt</option>
                <option value="Đang ra hoa">Đang ra hoa</option>
                <option value="Chuẩn bị thu hoạch">Chuẩn bị thu hoạch</option>
                <option value="Đang gieo trồng">Đang gieo trồng</option>
                <option value="Cần chú ý chăm sóc">Cần chú ý chăm sóc</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Mô tả chi tiết / Ghi chú (Description / Note) *
            </label>
            <textarea
              rows={3}
              placeholder="Ghi chú cụ thể: loại phân bón, liều lượng, số lượng luống, lưu ý thời tiết..."
              value={formDescription}
              onChange={(e) => {
                setFormDescription(e.target.value);
                if (formError) setFormError("");
              }}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Hình ảnh minh chứng thực địa (Image / Evidence URL):
            </label>
            <Input
              placeholder="https://..."
              value={formImageEvidence}
              onChange={(e) => setFormImageEvidence(e.target.value)}
            />
            <div className="flex gap-2 mt-1.5 text-2xs text-gray-500">
              <span>Mẫu ảnh:</span>
              <button
                type="button"
                className="text-emerald-700 underline cursor-pointer"
                onClick={() =>
                  setFormImageEvidence(
                    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop&q=80",
                  )
                }
              >
                Cánh đồng lúa
              </button>
              <span>•</span>
              <button
                type="button"
                className="text-emerald-700 underline cursor-pointer"
                onClick={() =>
                  setFormImageEvidence(
                    "https://images.unsplash.com/photo-1592417817098-8f3d69106093?w=400&auto=format&fit=crop&q=80",
                  )
                }
              >
                Vườn cà chua
              </button>
              <span>•</span>
              <button
                type="button"
                className="text-emerald-700 underline cursor-pointer"
                onClick={() =>
                  setFormImageEvidence(
                    "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80",
                  )
                }
              >
                Dưa lưới
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
