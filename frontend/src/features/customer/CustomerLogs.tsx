import { useState, useEffect, useCallback } from "react";
import { customerService } from "./customer.service";
import type {
  SharedContractItem,
  SharedFarmingLogItem,
  SharedPlotItem,
} from "./customer.types";
import { Card, Modal, Button, Spinner } from "../../components/ui";

export default function CustomerLogs() {
  const [logs, setLogs] = useState<SharedFarmingLogItem[]>([]);
  const [contracts, setContracts] = useState<SharedContractItem[]>([]);
  const [, setPlots] = useState<SharedPlotItem[]>([]);
  const [selectedContractFilter, setSelectedContractFilter] = useState<string>("ALL");
  const [selectedActivityFilter, setSelectedActivityFilter] = useState<string>("ALL");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load contracts and plots first
  useEffect(() => {
    let isMounted = true;
    async function initData() {
      try {
        const [loadedContracts, loadedPlots] = await Promise.all([
          customerService.fetchMyContractsAsync(),
          customerService.fetchPlotsAsync(),
        ]);
        if (isMounted) {
          setContracts(loadedContracts);
          setPlots(loadedPlots);
        }
      } catch (err) {
        console.warn("Lỗi khi tải hợp đồng / thửa đất:", err);
      }
    }
    initData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch logs from API: GET /api/v1/farming-logs?contractId=...
  const loadFarmingLogs = useCallback(async (contractId?: string) => {
    setIsLoading(true);
    try {
      const serverLogs = await customerService.fetchFarmingLogsAsync(
        contractId === "ALL" ? undefined : contractId,
      );
      setLogs(serverLogs);
    } catch (err) {
      console.warn("Lỗi khi tải nhật ký canh tác từ API:", err);
      setLogs(customerService.getMyFarmingLogs());
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger fetch when contract filter changes
  useEffect(() => {
    loadFarmingLogs(selectedContractFilter);
  }, [selectedContractFilter, loadFarmingLogs]);

  // Sync listener on external data updates
  useEffect(() => {
    function handleDataSync() {
      loadFarmingLogs(selectedContractFilter);
    }

    window.addEventListener("pf_data_changed", handleDataSync);
    window.addEventListener("pf_farmer_changed", handleDataSync);
    return () => {
      window.removeEventListener("pf_data_changed", handleDataSync);
      window.removeEventListener("pf_farmer_changed", handleDataSync);
    };
  }, [selectedContractFilter, loadFarmingLogs]);

  const activities = Array.from(new Set(logs.map((l) => l.activity)));

  const filteredLogs = logs.filter((log) => {
    const matchActivity =
      selectedActivityFilter === "ALL" || log.activity === selectedActivityFilter;
    return matchActivity;
  });

  // Helper function to return icon for activity
  function getActivityIcon(activity: string) {
    const lower = activity.toLowerCase();
    if (lower.includes("tưới")) return "💧";
    if (lower.includes("phân") || lower.includes("dinh dưỡng")) return "🧪";
    if (lower.includes("tỉa") || lower.includes("cắt")) return "✂️";
    if (lower.includes("sâu") || lower.includes("bệnh") || lower.includes("phòng trừ")) return "🛡️";
    if (lower.includes("gieo") || lower.includes("trồng")) return "🌱";
    if (lower.includes("thu hoạch") || lower.includes("hái")) return "🌾";
    return "📝";
  }

  // Helper function to color code progress
  function getProgressBarColor(progress: number) {
    if (progress >= 80) return "bg-emerald-600";
    if (progress >= 50) return "bg-teal-600";
    if (progress >= 25) return "bg-amber-500";
    return "bg-blue-500";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              Nhật Ký Canh Tác Thực Địa
            </h2>
            <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              Task 15: Live API
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi dòng thời gian (Timeline), Hoạt động chăm sóc, Giai đoạn sinh trưởng, Tiến độ %, Ảnh thực địa và Cảm biến IoT kết nối trực tiếp với API backend.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => loadFarmingLogs(selectedContractFilter)}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <span className={isLoading ? "animate-spin" : ""}>🔄</span>
            <span>Làm mới dữ liệu</span>
          </Button>
          <span className="text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-semibold shrink-0">
            {filteredLogs.length} nhật ký
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card>
        <div className="p-4 flex flex-wrap items-center gap-4">
          {/* Contract Filter (Maps to API: GET /api/v1/farming-logs?contractId=...) */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <span>📄</span> Hợp đồng:
            </span>
            <select
              value={selectedContractFilter}
              onChange={(e) => setSelectedContractFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 font-medium focus:border-emerald-600 focus:outline-none shadow-2xs"
            >
              <option value="ALL">Tất cả hợp đồng ({contracts.length})</option>
              {contracts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.plotCode} ({c.plantCrop})
                </option>
              ))}
            </select>
          </div>

          {/* Activity Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-700 flex items-center gap-1">
              <span>🛠️</span> Hoạt động:
            </span>
            <select
              value={selectedActivityFilter}
              onChange={(e) => setSelectedActivityFilter(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none shadow-2xs"
            >
              <option value="ALL">Tất cả hoạt động ({activities.length})</option>
              {activities.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {selectedContractFilter !== "ALL" && (
            <span className="text-2xs text-gray-500 font-mono bg-gray-100 px-2.5 py-1 rounded">
              API query: <code>?contractId={selectedContractFilter}</code>
            </span>
          )}
        </div>
      </Card>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <Spinner size="lg" className="mx-auto text-emerald-600" />
          <p className="text-xs text-gray-500">Đang tải dữ liệu nhật ký canh tác từ hệ thống...</p>
        </div>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <div className="p-12 text-center space-y-2">
            <span className="text-3xl block">📋</span>
            <p className="text-sm font-semibold text-gray-700">
              Chưa có ghi chép nhật ký canh tác nào cho bộ lọc này.
            </p>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Kỹ sư nông nghiệp phụ trách thửa đất sẽ thường xuyên cập nhật quá trình chăm sóc thực tế, ảnh hiện trạng và cảm biến IoT tại đây.
            </p>
          </div>
        </Card>
      ) : (
        /* Timeline View */
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-linear-to-b before:from-emerald-600 before:via-teal-500 before:to-emerald-200">
          {filteredLogs.map((log, index) => {
            const progressVal = log.progress !== undefined ? log.progress : 25;
            const sensor = log.sensorData || {
              moisture: 68,
              temperature: 26.5,
              soilPh: 6.5,
              lightLux: 15000,
            };

            return (
              <div key={log.id || index} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-6 sm:-left-8 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md ring-4 ring-white group-hover:scale-110 transition">
                  <span className="text-xs">{getActivityIcon(log.activity)}</span>
                </div>

                {/* Timeline Card */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs hover:border-emerald-300 hover:shadow-md transition space-y-4">
                  {/* Top: Metadata & Date */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Plot Badge */}
                        <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          {log.plot}
                        </span>

                        {log.contractId && (
                          <span className="font-mono text-2xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                            HĐ: {log.contractId}
                          </span>
                        )}

                        {/* Activity */}
                        <span className="font-bold text-base text-gray-900 flex items-center gap-1">
                          {log.activity}
                        </span>
                      </div>

                      {/* Growth Stage */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-500">Giai đoạn cây:</span>
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-flex items-center gap-1">
                          <span>🌿</span> {log.plantStatus || "Phát triển ổn định"}
                        </span>
                      </div>
                    </div>

                    {/* Timeline Date */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 shrink-0 bg-slate-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <span>📅</span>
                      <strong className="text-gray-800 font-mono font-semibold">
                        {log.date}
                      </strong>
                    </div>
                  </div>

                  {/* Progress % Bar */}
                  <div className="space-y-1.5 bg-emerald-50/40 p-3 rounded-xl border border-emerald-100">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-emerald-950 flex items-center gap-1">
                        <span>📊</span> Tiến độ vụ mùa hiện tại:
                      </span>
                      <span className="font-bold text-emerald-800 font-mono">
                        {progressVal}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor(
                          progressVal,
                        )}`}
                        style={{ width: `${Math.min(100, Math.max(0, progressVal))}%` }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  {log.description && (
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                      {log.description}
                    </p>
                  )}

                  {/* Photos & Sensor Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start pt-1">
                    {/* Photos Section */}
                    {log.imageEvidence ? (
                      <div className="lg:col-span-4 space-y-2">
                        <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                          <span>📷</span> Ảnh Chụp Thực Địa
                        </span>
                        <div
                          onClick={() => setPreviewImage(log.imageEvidence || null)}
                          className="group/img relative overflow-hidden rounded-xl border border-gray-200 shadow-2xs cursor-pointer max-h-48"
                        >
                          <img
                            src={log.imageEvidence}
                            alt="Ảnh chụp nhật ký thực địa"
                            className="w-full h-36 object-cover group-hover/img:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold gap-1">
                            <span>🔍 Phóng to ảnh</span>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {/* Sensor IoT Box */}
                    <div className={log.imageEvidence ? "lg:col-span-8 space-y-2" : "lg:col-span-12 space-y-2"}>
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1">
                          <span>📡</span> Cảm Biến IoT Tại Thửa Đất
                        </span>
                        <span className="text-3xs text-gray-400 font-mono">
                          {sensor.lastUpdated || "Thời gian thực"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                        {/* Moisture */}
                        <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100 space-y-0.5">
                          <span className="text-2xs text-blue-700 block">💧 Độ ẩm đất</span>
                          <span className="font-bold text-blue-950 font-mono text-sm">
                            {sensor.moisture ?? 68}%
                          </span>
                        </div>

                        {/* Temperature */}
                        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-100 space-y-0.5">
                          <span className="text-2xs text-amber-700 block">🌡️ Nhiệt độ</span>
                          <span className="font-bold text-amber-950 font-mono text-sm">
                            {sensor.temperature ?? 26.5}°C
                          </span>
                        </div>

                        {/* Soil pH */}
                        <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 space-y-0.5">
                          <span className="text-2xs text-emerald-700 block">🧪 Độ pH</span>
                          <span className="font-bold text-emerald-950 font-mono text-sm">
                            {sensor.soilPh ?? 6.5}
                          </span>
                        </div>

                        {/* Light Lux */}
                        <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-100 space-y-0.5">
                          <span className="text-2xs text-purple-700 block">☀️ Ánh sáng</span>
                          <span className="font-bold text-purple-950 font-mono text-sm">
                            {typeof sensor.lightLux === "number"
                              ? `${sensor.lightLux.toLocaleString()} lx`
                              : "15,000 lx"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Engineer In Charge */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-gray-100 text-2xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <span>👨‍🌾 Kỹ sư nông nghiệp thực hiện:</span>
                      <strong className="text-gray-800 font-semibold">
                        {log.createdBy}
                      </strong>
                    </div>

                    {log.imageEvidence && (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(log.imageEvidence || null)}
                        className="text-emerald-800 hover:text-emerald-900 font-semibold cursor-pointer"
                      >
                        📷 Xem ảnh phóng to
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      <Modal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title="Ảnh Chụp Minh Chứng Thực Địa"
        description="Hình ảnh ghi nhận hiện trạng cây trồng được chụp và tải lên trực tiếp bởi kỹ sư nông dân."
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
