import { useState, useEffect } from "react";
import { customerService } from "./customer.service";
import type {
  SharedFarmingLogItem,
  SharedPlotItem,
} from "./customer.types";
import { Card, Modal, Button } from "../../components/ui";

export default function CustomerLogs() {
  const [logs, setLogs] = useState<SharedFarmingLogItem[]>(() =>
    customerService.getMyFarmingLogs(),
  );
  const [plots] = useState<SharedPlotItem[]>(() => customerService.getMyPlots());
  const [selectedPlotFilter, setSelectedPlotFilter] = useState<string>("ALL");
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>("ALL");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    function handleDataSync() {
      setLogs(customerService.getMyFarmingLogs());
    }

    window.addEventListener("pf_data_changed", handleDataSync);
    window.addEventListener("pf_farmer_changed", handleDataSync);
    return () => {
      window.removeEventListener("pf_data_changed", handleDataSync);
      window.removeEventListener("pf_farmer_changed", handleDataSync);
    };
  }, []);

  const activities = Array.from(new Set(logs.map((l) => l.activity)));

  const filteredLogs = logs.filter((log) => {
    const matchPlot = selectedPlotFilter === "ALL" || log.plot === selectedPlotFilter;
    const matchActivity = selectedActivityFilter === "ALL" || log.activity === selectedActivityFilter;
    return matchPlot && matchActivity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Nhật Ký Canh Tác Thực Địa
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi quá trình chăm sóc thực tế do Nông dân thực hiện trên các thửa đất của bạn (bón phân, tưới tiêu, tỉa cành, phòng trừ sâu bệnh).
          </p>
        </div>

        <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold shrink-0">
          Tổng cộng: {filteredLogs.length} ghi chép
        </span>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div className="p-4 flex flex-wrap items-center gap-3">
          {/* Plot Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-600">Thửa đất:</span>
            <select
              value={selectedPlotFilter}
              onChange={(e) => setSelectedPlotFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
            >
              <option value="ALL">Tất cả thửa đất ({plots.length})</option>
              {plots.map((p) => (
                <option key={p.id} value={p.plotCode}>
                  {p.plotCode} - {p.plantCrop}
                </option>
              ))}
            </select>
          </div>

          {/* Activity Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-600">Hoạt động:</span>
            <select
              value={selectedActivityFilter}
              onChange={(e) => setSelectedActivityFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
            >
              <option value="ALL">Tất cả hoạt động</option>
              {activities.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Timeline List of Logs */}
      {filteredLogs.length === 0 ? (
        <Card>
          <div className="p-10 text-center text-gray-400 text-xs">
            Không tìm thấy nhật ký canh tác nào phù hợp với bộ lọc.
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs hover:border-emerald-300 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                    {log.plot}
                  </span>
                  <span className="font-bold text-sm text-gray-900">
                    {log.activity}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs text-emerald-700 font-medium">
                    {log.plantStatus}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-2xs text-gray-400">
                  <span>📅 Ngày thực hiện: <strong className="text-gray-700 font-mono">{log.date}</strong></span>
                </div>
              </div>

              <p className="text-xs text-gray-700 leading-relaxed">
                {log.description}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-2xs text-gray-500 flex items-center gap-1.5">
                  <span>👨‍🌾 Kỹ sư thực hiện:</span>
                  <strong className="text-gray-800">{log.createdBy}</strong>
                </div>

                {log.imageEvidence && (
                  <button
                    type="button"
                    onClick={() => setPreviewImage(log.imageEvidence || null)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-900 cursor-pointer"
                  >
                    <span>📷 Xem ảnh thực địa</span>
                  </button>
                )}
              </div>

              {log.imageEvidence && (
                <div className="pt-2">
                  <img
                    src={log.imageEvidence}
                    alt="Hình ảnh nhật ký thực tế"
                    className="h-28 w-44 object-cover rounded-xl border border-gray-200 shadow-2xs hover:scale-102 transition cursor-pointer"
                    onClick={() => setPreviewImage(log.imageEvidence || null)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      <Modal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title="Ảnh Chụp Thực Địa Từ Nông Dân"
        description="Hình ảnh ghi nhận hiện trạng cây trồng được tải lên bởi kỹ sư nông nghiệp."
        footer={
          <Button
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => setPreviewImage(null)}
          >
            Đóng
          </Button>
        }
      >
        {previewImage && (
          <div className="space-y-3">
            <img
              src={previewImage}
              alt="Ảnh chụp thực địa"
              className="w-full rounded-xl object-contain max-h-96"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
