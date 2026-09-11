import { useState, useEffect } from "react";
import { customerService } from "./customer.service";
import type {
  SharedFarmingLogItem,
  SharedPlotItem,
} from "./customer.types";
import { Badge, Button, Card, Modal } from "../../components/ui";

interface CustomerPlotsProps {
  onOpenCreateRequest: (plotCode?: string) => void;
  onNavigateFarms: () => void;
}

export default function CustomerPlots({
  onOpenCreateRequest,
  onNavigateFarms,
}: CustomerPlotsProps) {
  const [plots, setPlots] = useState<SharedPlotItem[]>(() =>
    customerService.getMyPlots(),
  );
  const [selectedPlot, setSelectedPlot] = useState<SharedPlotItem | null>(() => {
    const list = customerService.getMyPlots();
    return list.length > 0 ? list[0] : null;
  });
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  useEffect(() => {
    function handleDataSync() {
      const updatedPlots = customerService.getMyPlots();
      setPlots(updatedPlots);
      if (selectedPlot) {
        const found = updatedPlots.find((p) => p.id === selectedPlot.id);
        if (found) setSelectedPlot(found);
      } else if (updatedPlots.length > 0) {
        setSelectedPlot(updatedPlots[0]);
      }
    }

    window.addEventListener("pf_data_changed", handleDataSync);
    window.addEventListener("pf_farmer_changed", handleDataSync);
    return () => {
      window.removeEventListener("pf_data_changed", handleDataSync);
      window.removeEventListener("pf_farmer_changed", handleDataSync);
    };
  }, [selectedPlot]);

  // Farming logs for selected plot
  const plotLogs: SharedFarmingLogItem[] = selectedPlot
    ? customerService
        .getMyFarmingLogs()
        .filter((l) => l.plot === selectedPlot.plotCode)
    : [];

  function getGrowthBadge(stage: string) {
    switch (stage) {
      case "Đang gieo trồng":
        return <Badge variant="neutral">🌱 {stage}</Badge>;
      case "Phát triển tốt":
        return <Badge variant="success">🌿 {stage}</Badge>;
      case "Đang ra hoa":
        return <Badge variant="info">🌸 {stage}</Badge>;
      case "Chuẩn bị thu hoạch":
        return <Badge variant="warning">🌾 {stage}</Badge>;
      case "Cần chú ý chăm sóc":
        return <Badge variant="danger">⚠️ {stage}</Badge>;
      default:
        return <Badge variant="neutral">{stage}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Thửa Đất & Hợp Đồng Của Tôi
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi tình trạng sinh trưởng cây trồng, số liệu cảm biến IoT và camera thực địa trực tuyến.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          fullWidth={false}
          onClick={onNavigateFarms}
        >
          + Khám phá & Thuê thêm thửa đất
        </Button>
      </div>

      {plots.length === 0 ? (
        <Card>
          <div className="p-12 text-center space-y-4">
            <span className="text-4xl">🌾</span>
            <h3 className="text-base font-bold text-gray-800">
              Bạn chưa có thửa đất canh tác nào
            </h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              Hãy dạo qua danh sách các nông trại sinh thái công nghệ cao của PlotFarm để chọn thửa đất phù hợp và đăng ký canh tác cùng kỹ sư nông dân.
            </p>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={onNavigateFarms}
            >
              Duyệt Danh Sách Nông Trại
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Plot Selector List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
              Danh sách thửa đất ({plots.length})
            </span>

            <div className="space-y-2.5">
              {plots.map((plot) => {
                const isSelected = selectedPlot?.id === plot.id;
                return (
                  <div
                    key={plot.id}
                    onClick={() => setSelectedPlot(plot)}
                    className={`p-4 rounded-xl border transition cursor-pointer text-left ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-600"
                        : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-emerald-800">
                        {plot.plotCode}
                      </span>
                      {getGrowthBadge(plot.plantStatus)}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 mt-1.5">
                      {plot.plantCrop}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {plot.farmName}
                    </p>

                    <div className="mt-3">
                      <div className="flex justify-between text-2xs font-semibold text-gray-600 mb-1">
                        <span>Tiến độ:</span>
                        <span className="text-emerald-700">{plot.progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${plot.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Plot View & IoT Sensors (8 cols) */}
          {selectedPlot && (
            <div className="lg:col-span-8 space-y-6">
              {/* Plot Header Banner */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                        {selectedPlot.plotCode}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        Hợp đồng: <strong>{selectedPlot.contractId}</strong>
                      </span>
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 mt-2">
                      {selectedPlot.plantCrop}
                    </h1>
                    <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5">
                      <span>📍</span>
                      <span>{selectedPlot.farmName}</span>
                      <span>•</span>
                      <span>Diện tích: {selectedPlot.areaSquareMeter.toLocaleString()} m²</span>
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth={false}
                      onClick={() => onOpenCreateRequest(selectedPlot.plotCode)}
                    >
                      + Gửi Yêu Cầu Chăm Sóc
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth={false}
                      onClick={() => setIsCameraModalOpen(true)}
                    >
                      📹 Camera Trực Tuyến
                    </Button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-gray-700">
                      Giai đoạn: <strong className="text-emerald-800">{selectedPlot.plantStatus}</strong>
                    </span>
                    <span className="text-emerald-700 font-bold">{selectedPlot.progress}% Hoàn thành</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-600 transition-all duration-500"
                      style={{ width: `${selectedPlot.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-2xs text-gray-500">
                    <span>Ngày gieo trồng: {selectedPlot.startDate}</span>
                    <span>Nông dân cập nhật: {selectedPlot.lastUpdate}</span>
                    <span>Dự kiến thu hoạch: {selectedPlot.endDate}</span>
                  </div>
                </div>

                {/* Contract & Farmer Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                    <span className="text-2xs text-gray-400 block uppercase">Nông Dân Phụ Trách</span>
                    <span className="font-bold text-gray-800 block mt-0.5">
                      👨‍🌾 {selectedPlot.farmerName || "Lê Văn Canh Tác"}
                    </span>
                    <span className="text-2xs text-emerald-700">Kỹ sư thực địa</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                    <span className="text-2xs text-gray-400 block uppercase">Tiền Thuê Canh Tác</span>
                    <span className="font-bold text-emerald-800 block mt-0.5">
                      {(selectedPlot.rentalPricePerMonth || 3000000).toLocaleString()} đ/tháng
                    </span>
                    <span className="text-2xs text-gray-500">Bao trọn vật tư & công chăm</span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-gray-100">
                    <span className="text-2xs text-gray-400 block uppercase">Trạng Thái Hợp Đồng</span>
                    <span className="font-bold text-emerald-700 block mt-0.5">
                      Đang có hiệu lực
                    </span>
                    <span className="text-2xs text-gray-500">Thời hạn: 12 tháng</span>
                  </div>
                </div>
              </div>

              {/* IoT Sensors Panel */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📡</span>
                    <h3 className="text-base font-bold text-gray-900">
                      Chỉ Số Cảm Biến Đất & Môi Trường IoT
                    </h3>
                  </div>
                  <span className="text-2xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đang truyền tin: {selectedPlot.sensorData?.lastUpdated || "Thời gian thực"}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Moisture */}
                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 text-center space-y-1">
                    <span className="text-xs text-blue-900 font-medium block">Độ ẩm đất</span>
                    <span className="text-2xl font-bold text-blue-800 block">
                      {selectedPlot.sensorData?.moisture || 72}%
                    </span>
                    <span className="text-2xs text-blue-600 block">Tối ưu: 65 - 80%</span>
                  </div>

                  {/* Temperature */}
                  <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/50 text-center space-y-1">
                    <span className="text-xs text-amber-900 font-medium block">Nhiệt độ rễ</span>
                    <span className="text-2xl font-bold text-amber-800 block">
                      {selectedPlot.sensorData?.temperature || 27.5}°C
                    </span>
                    <span className="text-2xs text-amber-600 block">Ổn định mát mẻ</span>
                  </div>

                  {/* Soil pH */}
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/50 text-center space-y-1">
                    <span className="text-xs text-emerald-900 font-medium block">Độ pH đất</span>
                    <span className="text-2xl font-bold text-emerald-800 block">
                      {selectedPlot.sensorData?.soilPh || 6.4}
                    </span>
                    <span className="text-2xs text-emerald-600 block">Thích hợp cây trồng</span>
                  </div>

                  {/* Light Lux */}
                  <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/50 text-center space-y-1">
                    <span className="text-xs text-purple-900 font-medium block">Quang năng</span>
                    <span className="text-2xl font-bold text-purple-800 block">
                      {selectedPlot.sensorData?.lightLux ? (selectedPlot.sensorData.lightLux / 1000).toFixed(1) : 45}k Lux
                    </span>
                    <span className="text-2xs text-purple-600 block">Quang hợp tốt</span>
                  </div>
                </div>
              </div>

              {/* History of Farming Logs for this plot */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📋</span>
                    <h3 className="text-base font-bold text-gray-900">
                      Nhật Ký Canh Tác Thửa {selectedPlot.plotCode} ({plotLogs.length})
                    </h3>
                  </div>
                  <span className="text-xs text-gray-400">Ghi chép bởi Nông dân</span>
                </div>

                {plotLogs.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">
                    Chưa có nhật ký hoạt động nào cho thửa đất này.
                  </p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {plotLogs.map((log) => (
                      <div key={log.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-emerald-900">
                              {log.activity}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 font-medium">
                              {log.plantStatus}
                            </span>
                          </div>
                          <span className="text-2xs text-gray-500 font-mono">
                            {log.date}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed">
                          {log.description}
                        </p>
                        {log.imageEvidence && (
                          <div className="mt-2">
                            <img
                              src={log.imageEvidence}
                              alt="Ảnh thực địa"
                              className="h-24 w-36 object-cover rounded-lg border border-gray-200 shadow-2xs hover:scale-105 transition cursor-pointer"
                              onClick={() => window.open(log.imageEvidence, "_blank")}
                            />
                            <span className="text-2xs text-gray-400 mt-0.5 block">
                              Bấm để xem ảnh phóng to
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Simulated Live Camera Modal */}
      <Modal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        title={`Camera Thực Địa Trực Tuyến - Thửa ${selectedPlot?.plotCode}`}
        description="Hình ảnh truyền trực tiếp từ trạm camera giám sát nông nghiệp PlotFarm theo thời gian thực."
        footer={
          <Button
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => setIsCameraModalOpen(false)}
          >
            Đóng
          </Button>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="relative overflow-hidden rounded-xl bg-black aspect-video flex items-center justify-center">
            <img
              src={
                selectedPlot?.cameraFeedUrl ||
                "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80"
              }
              alt="Camera feed"
              className="w-full h-full object-cover opacity-90"
            />
            {/* Live Indicator Overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-2xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span>LIVE CAM • TRẠM #{selectedPlot?.plotCode.replace("#", "")}</span>
            </div>
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white px-3 py-1 rounded-md text-2xs font-mono">
              {selectedPlot?.farmName} • {new Date().toLocaleDateString("vi-VN")}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-gray-600">
            <span>Độ phân giải: <strong>Full HD 1080p (30fps)</strong></span>
            <span>Tình trạng mắt camera: <strong className="text-emerald-700">Rõ nét, sạch bụi</strong></span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
