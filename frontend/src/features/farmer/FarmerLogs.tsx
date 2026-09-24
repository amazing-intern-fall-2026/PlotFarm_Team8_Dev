import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../auth/auth.api";
import { farmerService } from "./farmer.service";
import type { FarmingLogItem, FarmerProfileData, FarmerPlotItem, HarvestItem } from "./farmer.types";
import { Card, Button, Modal, Input, Alert } from "../../components/ui";

export default function FarmerLogs() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [profile, setProfile] = useState<FarmerProfileData>(() => farmerService.getFarmerProfile());
  const [logs, setLogs] = useState<FarmingLogItem[]>(() => farmerService.getFarmingLogs());
  const [plots, setPlots] = useState<FarmerPlotItem[]>(() => farmerService.getPlots());
  const [harvests, setHarvests] = useState<HarvestItem[]>(() => farmerService.getHarvests());

  const [selectedPlotFilter, setSelectedPlotFilter] = useState<string>("ALL");
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>("ALL");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    farmerService.fetchFarmerDataAsync().catch(console.error);

    function handleSync() {
      setProfile(farmerService.getFarmerProfile());
      setLogs(farmerService.getFarmingLogs());
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

  // Add / Edit Log Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);

  const [formPlot, setFormPlot] = useState<string>("");
  const [formActivity, setFormActivity] = useState<string>("Bón phân");
  const [formGrowthStage, setFormGrowthStage] = useState<string>("Cây con");
  const [formProgress, setFormProgress] = useState<number>(30);
  const [formDescription, setFormDescription] = useState<string>("");
  const [formImageEvidence, setFormImageEvidence] = useState<string>(
    "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop&q=80"
  );
  const [formError, setFormError] = useState("");

  const activityOptions = [
    "Gieo hạt",
    "Bón phân",
    "Tưới nước",
    "Phun thuốc sinh học",
    "Làm cỏ",
    "Tỉa cành",
    "Kiểm tra sâu bệnh",
    "Đo độ ngọt Brix",
    "Thu hoạch thử",
    "Thu hoạch",
  ];

  const growthStageOptions = [
    "Gieo hạt & Ươm mầm",
    "Cây con",
    "Phát triển thân lá",
    "Đang ra hoa & Tạo nhánh",
    "Nuôi quả & Chuẩn bị thu hoạch",
    "Giai đoạn thu hoạch",
  ];

  // Open Add Modal
  function handleOpenAddModal() {
    setEditingLogId(null);
    setFormPlot(plots[0]?.plotCode || "");
    setFormActivity("Bón phân");
    setFormGrowthStage("Cây con");
    setFormProgress(30);
    setFormDescription("");
    setFormError("");
    setIsModalOpen(true);
  }

  // Open Edit Modal
  function handleOpenEditModal(log: FarmingLogItem) {
    const logHarvest = harvests.find(
      (h) =>
        h.plot === log.plot ||
        (log.plotId && (h.plot === log.plotId || (h as any).plotId === log.plotId)) ||
        (log.contractId && (h.plot === log.contractId || h.id === log.contractId))
    );
    const isLogDelivered =
      logHarvest?.deliveryStatus === "DELIVERED" ||
      plots.some(
        (p) =>
          (p.plotCode === log.plot || p.id === log.plotId || p.contractId === log.contractId) &&
          (p.deliveryStatus === "DELIVERED" || p.plantStatus === "Đã giao hàng")
      );

    if (isLogDelivered) {
      alert("Vụ mùa của thửa đất này đã hoàn tất thu hoạch và giao hàng cho khách hàng. Nhật ký canh tác đã được khóa để đảm bảo tính minh bạch, không thể chỉnh sửa.");
      return;
    }

    setEditingLogId(log.id);
    setFormPlot(log.plot);
    setFormActivity(log.activity);
    setFormGrowthStage(log.plantStatus || "Phát triển tốt");
    setFormProgress(log.progress ?? 50);
    setFormDescription(log.description || "");
    setFormImageEvidence(
      log.imageEvidence ||
        "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&auto=format&fit=crop&q=80"
    );
    setFormError("");
    setIsModalOpen(true);
  }

  async function handleSaveLog(e: React.FormEvent) {
    e.preventDefault();
    if (!formDescription.trim()) {
      setFormError("Vui lòng nhập mô tả chi tiết công việc đã thực hiện");
      return;
    }

    const selectedPlotObj = plots.find((p) => p.plotCode === formPlot) || plots[0];
    const targetHarvest = selectedPlotObj
      ? harvests.find(
          (h) =>
            h.plot === selectedPlotObj.plotCode ||
            h.plot === selectedPlotObj.id ||
            (selectedPlotObj.contractId && h.plot === selectedPlotObj.contractId)
        )
      : undefined;

    if (
      targetHarvest?.deliveryStatus === "DELIVERED" ||
      selectedPlotObj?.deliveryStatus === "DELIVERED" ||
      selectedPlotObj?.plantStatus === "Đã giao hàng"
    ) {
      setFormError("Thửa đất này đã hoàn tất giao hàng cho khách hàng. Vụ mùa đã kết thúc, không thể ghi thêm hoặc chỉnh sửa nhật ký.");
      return;
    }

    if (
      (formActivity === "Thu hoạch" ||
        formGrowthStage === "Giai đoạn thu hoạch" ||
        formGrowthStage === "Đã thu hoạch") &&
      Number(formProgress) < 95
    ) {
      setFormError(
        `Hoạt động hoặc giai đoạn Thu hoạch yêu cầu tiến độ mùa vụ phải đạt từ 95% trở lên (hiện tại mới chọn: ${formProgress}%).`
      );
      return;
    }

    const createdBy = profile.name ? `${profile.name} (Nông Dân)` : currentUser?.fullName || "Nông Dân";

    try {
      setIsSubmitting(true);
      setFormError("");

      if (editingLogId) {
        // Edit existing log
        await farmerService.updateFarmingLogAsync(editingLogId, {
          hoatDong: formActivity,
          giaiDoanCay: formGrowthStage,
          tienDoPhanTram: Number(formProgress),
          moTa: formDescription.trim(),
          hinhAnhMinhChung: formImageEvidence.trim() || undefined,
        });
        setSuccessMessage(`Đã cập nhật thành công nhật ký thửa ${formPlot}!`);
      } else {
        // Create new log
        await farmerService.addFarmingLogAsync({
          maHopDong: selectedPlotObj?.contractId || "HD001",
          maODat: selectedPlotObj?.id || "OD001",
          hoatDong: formActivity,
          giaiDoanCay: formGrowthStage,
          tienDoPhanTram: Number(formProgress),
          moTa: formDescription.trim(),
          hinhAnhMinhChung: formImageEvidence.trim() || undefined,
        });

        // Also add to local state
        farmerService.addFarmingLog({
          plot: formPlot,
          plotId: selectedPlotObj?.id,
          contractId: selectedPlotObj?.contractId,
          activity: formActivity,
          plantStatus: formGrowthStage,
          progress: Number(formProgress),
          description: formDescription.trim(),
          imageEvidence: formImageEvidence || undefined,
          createdBy,
        });

        setSuccessMessage(`Đã ghi thành công nhật ký tiến độ ${formProgress}% cho thửa ${formPlot}!`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: any) {
      console.error("Save log error:", err);
      const msg = err?.message || "Lỗi khi lưu nhật ký vào cơ sở dữ liệu";
      setFormError(msg);
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    const matchesPlot = selectedPlotFilter === "ALL" || log.plot === selectedPlotFilter;
    const matchesActivity =
      selectedActivityFilter === "ALL" || log.activity === selectedActivityFilter;
    return matchesPlot && matchesActivity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Nhật Ký Canh Tác Thực Địa (Farming Logs)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Ghi nhận hoạt động, giai đoạn phát triển và cập nhật % tiến độ cây trồng — Khách hàng sẽ nhìn thấy dữ liệu thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            fullWidth={false}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs font-semibold whitespace-nowrap"
            onClick={handleOpenAddModal}
          >
            + Ghi Nhật Ký Mới
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <Alert variant="success" title="Thành công">
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="error" title="Lỗi">
          {errorMessage}
        </Alert>
      )}

      {/* Harvest Stage Call-to-action Banner */}
      {(() => {
        const harvestTarget = plots.find(
          (p) =>
            p.progress >= 95 &&
            !harvests.some(
              (h) =>
                (h.plot === p.plotCode ||
                  h.plot === p.id ||
                  (p.contractId && h.plot === p.contractId)) &&
                (h.harvestStatus === "HARVESTED" || h.deliveryStatus === "DELIVERED")
            ) &&
            p.deliveryStatus !== "DELIVERED" &&
            p.plantStatus !== "Đã giao hàng" &&
            p.plantStatus !== "Đã thu hoạch"
        );

        if (!harvestTarget) return null;

        return (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-emerald-100/70 to-amber-50 border border-emerald-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-2xl p-2 bg-white rounded-xl shadow-2xs border border-emerald-200 shrink-0">🌾</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-emerald-950 flex flex-wrap items-center gap-2">
                  <span>Thửa đất {harvestTarget.plotCode} đã đạt {harvestTarget.progress}% tiến độ (Giai đoạn thu hoạch)!</span>
                  <span className="px-2 py-0.5 rounded-full text-2xs font-extrabold bg-emerald-600 text-white whitespace-nowrap">Sẵn sàng thu hoạch (≥95%)</span>
                </h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Cây trồng: <strong>{harvestTarget.plantCrop}</strong> • Khách hàng: <strong>{harvestTarget.customerName}</strong>. Hãy lập phiếu thu hoạch để ghi nhận sản lượng thực tế, đóng gói và giao trả nông sản cho khách hàng.
                </p>
              </div>
            </div>
            <div className="shrink-0 flex items-center">
              <Button
                variant="primary"
                size="sm"
                fullWidth={false}
                onClick={() => navigate(`/farmer/harvest?create=true&plot=${encodeURIComponent(harvestTarget.plotCode)}`)}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center gap-1.5 shadow-sm whitespace-nowrap px-4 py-2"
              >
                <span>🌾</span>
                <span>Lập Phiếu Thu Hoạch Ngay ➔</span>
              </Button>
            </div>
          </div>
        );
      })()}

      {/* Filter Bar */}
      <Card className="p-4 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Lọc theo Thửa ruộng:
            </label>
            <select
              value={selectedPlotFilter}
              onChange={(e) => setSelectedPlotFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white text-gray-700 focus:outline-none focus:border-emerald-600"
            >
              <option value="ALL">Tất cả thửa ruộng</option>
              {plots.map((p) => (
                <option key={p.id} value={p.plotCode}>
                  {p.plotCode} - {p.plantCrop}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Lọc theo Hoạt động:
            </label>
            <select
              value={selectedActivityFilter}
              onChange={(e) => setSelectedActivityFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-xs bg-white text-gray-700 focus:outline-none focus:border-emerald-600"
            >
              <option value="ALL">Tất cả hoạt động</option>
              {activityOptions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setSelectedPlotFilter("ALL");
                setSelectedActivityFilter("ALL");
              }}
              className="text-xs text-gray-500 hover:text-emerald-700 font-medium py-2 px-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        </div>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50/80 text-gray-700">
            <tr>
              <th className="py-3 px-3.5 text-left font-semibold">Thửa Đất</th>
              <th className="py-3 px-3.5 text-left font-semibold">Ngày Ghi</th>
              <th className="py-3 px-3.5 text-left font-semibold">Hoạt Động</th>
              <th className="py-3 px-3.5 text-left font-semibold">Giai Đoạn Cây</th>
              <th className="py-3 px-3.5 text-left font-semibold">Tiến Độ %</th>
              <th className="py-3 px-3.5 text-left font-semibold min-w-[240px]">
                Nội Dung Mô Tả
              </th>
              <th className="py-3 px-3.5 text-center font-semibold">Ảnh Thực Địa</th>
              <th className="py-3 px-3.5 text-right font-semibold">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  Chưa có nhật ký nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const logHarvest = harvests.find(
                  (h) =>
                    h.plot === log.plot ||
                    (log.plotId && (h.plot === log.plotId || (h as any).plotId === log.plotId)) ||
                    (log.contractId && (h.plot === log.contractId || h.id === log.contractId))
                );

                const isLogDelivered =
                  logHarvest?.deliveryStatus === "DELIVERED" ||
                  plots.some(
                    (p) =>
                      (p.plotCode === log.plot || p.id === log.plotId || p.contractId === log.contractId) &&
                      (p.deliveryStatus === "DELIVERED" || p.plantStatus === "Đã giao hàng")
                  );

                const isLogHarvested =
                  !isLogDelivered &&
                  (logHarvest?.harvestStatus === "HARVESTED" ||
                    plots.some(
                      (p) =>
                        (p.plotCode === log.plot || p.id === log.plotId || p.contractId === log.contractId) &&
                        (p.harvestStatus === "HARVESTED" || p.plantStatus === "Đã thu hoạch")
                    ));

                return (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition">
                    {/* Plot */}
                    <td className="py-3.5 px-3.5 font-bold text-emerald-800 whitespace-nowrap">
                      {log.plot}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-3.5 text-gray-500 whitespace-nowrap">
                      {log.date}
                    </td>

                    {/* Activity */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {log.activity}
                      </span>
                    </td>

                    {/* Stage */}
                    <td className="py-3.5 px-3.5 text-gray-700 whitespace-nowrap">
                      {log.plantStatus}
                    </td>

                    {/* Progress */}
                    <td className="py-3.5 px-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${log.progress ?? 0}%` }}
                          />
                        </div>
                        <span className="text-2xs font-semibold text-gray-600">
                          {log.progress ?? 0}%
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-3.5 px-3.5 text-gray-700 leading-relaxed">
                      {log.description}
                    </td>

                    {/* Image */}
                    <td className="py-3.5 px-3.5 text-center">
                      {log.imageEvidence ? (
                        <a
                          href={log.imageEvidence}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block group relative"
                          title="Bấm để xem ảnh phóng to"
                        >
                          <img
                            src={log.imageEvidence}
                            alt="Bằng chứng"
                            className="h-10 w-14 object-cover rounded-lg border border-gray-200 shadow-2xs group-hover:scale-105 transition mx-auto"
                          />
                        </a>
                      ) : (
                        <span className="text-gray-400 text-2xs italic">Không có</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {isLogDelivered ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold text-gray-500 bg-gray-100 rounded border border-gray-200 select-none"
                            title="Vụ mùa của thửa đất này đã hoàn tất giao hàng. Nhật ký đã khóa để đảm bảo tính minh bạch, không thể chỉnh sửa."
                          >
                            <span>🔒</span>
                            <span>Đã khóa (Đã giao hàng)</span>
                          </span>
                        ) : (
                          <>
                            {!isLogHarvested &&
                              (log.progress ?? 0) >= 95 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/farmer/harvest?create=true&plot=${encodeURIComponent(log.plot)}`)
                                  }
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                  title="Lập phiếu thu hoạch cho đợt này (Tiến độ ≥ 95%)"
                                >
                                  <span>🌾</span>
                                  <span>Thu hoạch</span>
                                </button>
                              )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(log)}
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded transition cursor-pointer"
                            >
                              ✏️ Chỉnh sửa
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===================== ADD / EDIT MODAL ===================== */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLogId ? "Chỉnh Sửa Nhật Ký Canh Tác" : "Ghi Nhật Ký Canh Tác Mới"}
        description="Ghi nhận trung thực thông số chăm sóc để khách hàng yên tâm theo dõi từ xa."
      >
        <form onSubmit={handleSaveLog} className="space-y-3.5 text-xs">
          {formError && (
            <Alert variant="error" title="Thiếu thông tin">
              {formError}
            </Alert>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Chọn Thửa ruộng (Plot) *
            </label>
            <select
              value={formPlot}
              onChange={(e) => setFormPlot(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:outline-none"
              required
            >
              {plots.map((p) => {
                const plotHarvest = harvests.find(
                  (h) => h.plot === p.plotCode || h.plot === p.id || (p.contractId && h.plot === p.contractId)
                );
                const isPlotDelivered =
                  plotHarvest?.deliveryStatus === "DELIVERED" ||
                  p.deliveryStatus === "DELIVERED" ||
                  p.plantStatus === "Đã giao hàng";
                return (
                  <option key={p.id} value={p.plotCode} disabled={isPlotDelivered}>
                    {p.plotCode} - {p.plantCrop} (HĐ: {p.contractId}){isPlotDelivered ? " — [Đã giao hàng - Đã khóa vụ]" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Hoạt động nông vụ *
              </label>
              <select
                value={formActivity}
                onChange={(e) => setFormActivity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:outline-none"
              >
                {activityOptions.map((act) => {
                  const isHarvestAct = act === "Thu hoạch";
                  const isDisabled = isHarvestAct && Number(formProgress) < 95;
                  return (
                    <option key={act} value={act} disabled={isDisabled}>
                      {act} {isDisabled ? "(Yêu cầu tiến độ ≥ 95%)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Giai đoạn phát triển (Growth Stage) *
              </label>
              <select
                value={formGrowthStage}
                onChange={(e) => setFormGrowthStage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:outline-none"
              >
                {growthStageOptions.map((stage) => {
                  const isHarvestStage = stage === "Giai đoạn thu hoạch";
                  const isDisabled = isHarvestStage && Number(formProgress) < 95;
                  return (
                    <option key={stage} value={stage} disabled={isDisabled}>
                      {stage} {isDisabled ? "(Yêu cầu tiến độ ≥ 95%)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Progress % Slider & Input */}
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-emerald-950">
                Tiến độ sinh trưởng vụ mùa (% Progress):
              </label>
              <span className="font-extrabold text-base text-emerald-700">
                {formProgress}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formProgress}
              onChange={(e) => setFormProgress(Number(e.target.value))}
              className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-2xs text-gray-500 font-medium">
              <span>0% (Mới gieo)</span>
              <span>50% (Phát triển mạnh)</span>
              <span>95%+ (Thu hoạch)</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Mô tả chi tiết công việc *
            </label>
            <textarea
              rows={3}
              placeholder="Ghi chú cụ thể: loại phân bón, liều lượng, tình hình sâu bệnh, thời tiết..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Hình ảnh minh chứng thực địa (Image URL):
            </label>
            <Input
              placeholder="https://..."
              value={formImageEvidence}
              onChange={(e) => setFormImageEvidence(e.target.value)}
            />
            {formImageEvidence && (
              <div className="mt-2 flex items-center gap-3">
                <img
                  src={formImageEvidence}
                  alt="Preview"
                  className="h-12 w-16 object-cover rounded border"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <span className="text-2xs text-gray-400">
                  Ảnh này sẽ hiển thị trực tiếp cho khách hàng xem
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Đang lưu..."
                : editingLogId
                ? "Cập nhật nhật ký"
                : "Lưu nhật ký"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
