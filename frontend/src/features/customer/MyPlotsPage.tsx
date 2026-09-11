import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";
import { Navbar } from "../../components/layout";
import { Card, Badge, Button, StatCard, EmptyState, Modal } from "../../components/ui";

/* ================== TYPES ================== */

type SeasonStage = "GROWING" | "NEAR_HARVEST";

interface Farmer {
  id: string;
  name: string;
}

interface DiaryEntry {
  id: string;
  date: string; // dd/mm/yyyy
  note: string;
}

interface RentedPlot {
  id: string;
  code: string;
  farmName: string;
  hasLiveCamera: boolean;
  cropName: string;
  farmer: Farmer;
  startDate: string; // dd/mm/yyyy
  expectedHarvestDate: string; // dd/mm/yyyy
  growthPercent: number; // 0 - 100
  pendingCareRequestCount: number;
}

type CareRequestType =
  | "PEST_CONTROL"
  | "EXTRA_WATERING"
  | "ORGANIC_FERTILIZER"
  | "PHOTO_REQUEST"
  | "OTHER";

const CARE_REQUEST_TYPES: { value: CareRequestType; label: string }[] = [
  { value: "PEST_CONTROL", label: "Bắt sâu / trừ sâu" },
  { value: "EXTRA_WATERING", label: "Tưới thêm nước" },
  { value: "ORGANIC_FERTILIZER", label: "Bón phân hữu cơ" },
  { value: "PHOTO_REQUEST", label: "Xin chụp ảnh thực tế" },
  { value: "OTHER", label: "Khác" },
];

/* ================== MOCK DATA ================== */

const MOCK_MY_PLOTS: RentedPlot[] = [
  {
    id: "plot-1",
    code: "PLOT-A102",
    farmName: "Nông trại Đồng Xanh",
    hasLiveCamera: true,
    cropName: "Dưa lưới Taki",
    farmer: { id: "farmer-1", name: "Nguyễn Văn A" },
    startDate: "20/07/2025",
    expectedHarvestDate: "18/09/2025",
    growthPercent: 62,
    pendingCareRequestCount: 1,
  },
  {
    id: "plot-2",
    code: "PLOT-B207",
    farmName: "Nông trại Thung Lũng",
    hasLiveCamera: false,
    cropName: "Cà chua Cherry",
    farmer: { id: "farmer-2", name: "Trần Thị B" },
    startDate: "05/06/2025",
    expectedHarvestDate: "14/09/2025",
    growthPercent: 91,
    pendingCareRequestCount: 0,
  },
];

const MOCK_DIARY_BY_PLOT: Record<string, DiaryEntry[]> = {
  "plot-1": [
    { id: "d1", date: "08/09/2025", note: "Đã tưới nước và kiểm tra lá, cây phát triển tốt." },
    { id: "d2", date: "03/09/2025", note: "Bón phân hữu cơ định kỳ, chưa phát hiện sâu bệnh." },
  ],
  "plot-2": [
    { id: "d3", date: "07/09/2025", note: "Cà chua bắt đầu chín đỏ ở nhánh dưới, dự kiến thu sớm." },
  ],
};

function getSeasonStage(growthPercent: number): SeasonStage {
  return growthPercent >= 85 ? "NEAR_HARVEST" : "GROWING";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

/* ================== PLOT CARD ================== */

interface PlotCardProps {
  plot: RentedPlot;
  onOpenCamera: (plot: RentedPlot) => void;
  onOpenDiary: (plot: RentedPlot) => void;
  onOpenCareRequest: (plot: RentedPlot) => void;
}

function PlotCard({ plot, onOpenCamera, onOpenDiary, onOpenCareRequest }: PlotCardProps) {
  const stage = getSeasonStage(plot.growthPercent);
  const progress = Math.min(100, Math.max(0, plot.growthPercent));

  return (
    <div className="rounded-xl border border-emerald-200 bg-white p-4 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{plot.code}</p>
          <p className="text-xs text-gray-500">{plot.farmName}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {plot.hasLiveCamera && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-2xs font-semibold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              LIVE CAM
            </span>
          )}
          <Badge variant={stage === "NEAR_HARVEST" ? "warning" : "success"} size="sm">
            {stage === "NEAR_HARVEST" ? "🌽 Sắp thu hoạch" : "🌱 Đang canh tác"}
          </Badge>
        </div>
      </div>

      {/* Body */}
      <p className="mt-3 text-base font-bold text-gray-900">{plot.cropName}</p>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
          {getInitials(plot.farmer.name)}
        </div>
        <div className="text-xs">
          <p className="text-gray-500">Nông dân phụ trách</p>
          <p className="font-medium text-gray-800">{plot.farmer.name}</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>Tiến độ sinh trưởng</span>
          <span className="font-semibold text-gray-700">{progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              stage === "NEAR_HARVEST" ? "bg-amber-500" : "bg-emerald-600"
            }`}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-2xs text-gray-400">
          <span>Bắt đầu: {plot.startDate}</span>
          <span>Dự kiến: {plot.expectedHarvestDate}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          fullWidth
          onClick={() => onOpenCamera(plot)}
          disabled={!plot.hasLiveCamera}
          className={!plot.hasLiveCamera ? "cursor-not-allowed" : undefined}
        >
          🎥 Camera
        </Button>
        <Button variant="outline" size="sm" fullWidth onClick={() => onOpenDiary(plot)}>
          📖 Nhật ký
        </Button>
        <button
          type="button"
          onClick={() => onOpenCareRequest(plot)}
          className="relative rounded-lg bg-amber-500 px-2 py-2 text-xs font-semibold text-white transition hover:bg-amber-600"
        >
          ⚠️ Yêu cầu
          {plot.pendingCareRequestCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {plot.pendingCareRequestCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

/* ================== COMPONENT ================== */

export default function MyPlotsPage() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());

  const [plots, setPlots] = useState<RentedPlot[]>(() => MOCK_MY_PLOTS);

  const [cameraPlot, setCameraPlot] = useState<RentedPlot | null>(null);
  const [diaryPlot, setDiaryPlot] = useState<RentedPlot | null>(null);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);

  const [careRequestPlot, setCareRequestPlot] = useState<RentedPlot | null>(null);
  const [careType, setCareType] = useState<CareRequestType | "">("");
  const [careDescription, setCareDescription] = useState("");
  const [isSubmittingCareRequest, setIsSubmittingCareRequest] = useState(false);
  const [careRequestSuccessMessage, setCareRequestSuccessMessage] = useState<string | null>(null);

  const totalRented = plots.length;
  const nearHarvestCount = useMemo(
    () => plots.filter((p) => getSeasonStage(p.growthPercent) === "NEAR_HARVEST").length,
    [plots],
  );
  const totalPendingCareRequests = useMemo(
    () => plots.reduce((sum, p) => sum + p.pendingCareRequestCount, 0),
    [plots],
  );

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleOpenCamera(plot: RentedPlot) {
    if (!plot.hasLiveCamera) return;
    setCameraPlot(plot);
  }

  function handleOpenDiary(plot: RentedPlot) {
    setDiaryEntries(MOCK_DIARY_BY_PLOT[plot.id] ?? []);
    setDiaryPlot(plot);
  }

  function handleOpenCareRequest(plot: RentedPlot) {
    setCareType("");
    setCareDescription("");
    setCareRequestPlot(plot);
  }

  function handleCloseCareRequest() {
    if (isSubmittingCareRequest) return;
    setCareRequestPlot(null);
  }

  const canSubmitCareRequest = careType !== "" && careDescription.trim().length > 0;

  function handleSubmitCareRequest() {
    if (!careRequestPlot || !canSubmitCareRequest) return;

    setIsSubmittingCareRequest(true);

    setTimeout(() => {
      const typeLabel = CARE_REQUEST_TYPES.find((t) => t.value === careType)?.label ?? "";

      setPlots((prev) =>
        prev.map((p) =>
          p.id === careRequestPlot.id
            ? { ...p, pendingCareRequestCount: p.pendingCareRequestCount + 1 }
            : p,
        ),
      );

      setIsSubmittingCareRequest(false);
      setCareRequestPlot(null);
      setCareRequestSuccessMessage(
        `Đã gửi yêu cầu "${typeLabel}" cho ${careRequestPlot.code} — đang chờ ${careRequestPlot.farmer.name} xử lý (PENDING).`,
      );
    }, 900);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        brandTitle="Plot"
        brandHighlight="Farm"
        portalBadge="Customer Portal"
        user={{
          name: user?.fullName || user?.username || "Khách hàng",
          email: user?.email || "customer@plotfarm.com",
          avatarText: (user?.fullName || user?.username || "C").charAt(0),
        }}
        onLogout={handleLogout}
        logoutText="Đăng xuất"
      />

      <main className="flex-1 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ô đất của tôi</h1>
              <p className="mt-1 text-sm text-gray-500">
                Theo dõi tiến độ canh tác, xem camera trực tiếp và gửi yêu cầu chăm sóc cho các ô đất bạn đang thuê.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                fullWidth={false}
                onClick={() => navigate("/customer")}
              >
                ← Quay lại Trang chủ
              </Button>

              <Button
                variant="primary"
                size="sm"
                fullWidth={false}
                onClick={() => navigate("/customer/farms")}
              >
                Khám phá Nông Trại
              </Button>

              <Badge variant="success" size="md">
                Đang thuê: {totalRented} ô đất
              </Badge>
            </div>
          </div>

          {careRequestSuccessMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start justify-between gap-3">
              <span>{careRequestSuccessMessage}</span>
              <button
                onClick={() => setCareRequestSuccessMessage(null)}
                className="text-emerald-600 hover:text-emerald-800 shrink-0"
              >
                ✕
              </button>
            </div>
          )}

          {/* Thống kê nhanh */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <StatCard
              title="Đang thuê"
              value={`${totalRented} Ô đất`}
              iconBgColor="bg-emerald-100 text-emerald-600"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              }
            />
            <StatCard
              title="Sắp thu hoạch"
              value={`${nearHarvestCount} Ô đất`}
              valueClassName="text-amber-600"
              iconBgColor="bg-amber-100 text-amber-600"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <StatCard
              title="Care Request đang chờ"
              value={`${totalPendingCareRequests} Yêu cầu`}
              valueClassName="text-red-600"
              iconBgColor="bg-red-100 text-red-600"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
          </div>

          {/* Plot Grid */}
          <Card>
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Danh sách Ô đất đang thuê</h2>
              <span className="text-xs text-gray-500">{totalRented} ô đất</span>
            </div>

            {plots.length === 0 ? (
              <div className="p-8 space-y-4">
                <EmptyState
                  title="Bạn chưa thuê ô đất nào"
                  description="Khám phá các nông trại đang có ô đất trống để bắt đầu canh tác từ xa."
                />
                <div className="flex justify-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth={false}
                    onClick={() => navigate("/customer")}
                  >
                    ← Quay lại Trang chủ
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth={false}
                    onClick={() => navigate("/customer/farms")}
                  >
                    Khám phá Nông Trại
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                {plots.map((plot) => (
                  <PlotCard
                    key={plot.id}
                    plot={plot}
                    onOpenCamera={handleOpenCamera}
                    onOpenDiary={handleOpenDiary}
                    onOpenCareRequest={handleOpenCareRequest}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>

      {/* Modal Camera (read-only) */}
      <Modal
        isOpen={!!cameraPlot}
        onClose={() => setCameraPlot(null)}
        title={cameraPlot ? `Camera trực tiếp — ${cameraPlot.code}` : ""}
        description="Hình ảnh trực tiếp từ camera gắn tại ô đất."
        footer={
          <Button variant="outline" size="sm" fullWidth={false} onClick={() => setCameraPlot(null)}>
            Đóng
          </Button>
        }
      >
        {cameraPlot && (
          <div className="space-y-3 text-sm">
            <div className="flex aspect-video w-full items-center justify-center rounded-lg bg-gray-900 text-gray-300">
              <div className="text-center">
                <p className="text-sm">📡 Đang kết nối luồng camera...</p>
                <p className="mt-1 text-xs text-gray-400">
                  {cameraPlot.farmName} • {cameraPlot.cropName}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Camera chỉ hiển thị hình ảnh trực tiếp, Khách hàng không thể điều khiển hay chỉnh sửa.
            </p>
          </div>
        )}
      </Modal>

      {/* Modal Nhật ký canh tác (read-only) */}
      <Modal
        isOpen={!!diaryPlot}
        onClose={() => setDiaryPlot(null)}
        title={diaryPlot ? `Nhật ký canh tác — ${diaryPlot.code}` : ""}
        description="Nhật ký do Farmer cập nhật. Khách hàng chỉ có quyền xem."
        footer={
          <Button variant="outline" size="sm" fullWidth={false} onClick={() => setDiaryPlot(null)}>
            Đóng
          </Button>
        }
      >
        {diaryPlot && (
          diaryEntries.length === 0 ? (
            <p className="text-sm text-gray-500">Farmer chưa cập nhật nhật ký cho ô đất này.</p>
          ) : (
            <ul className="space-y-3">
              {diaryEntries.map((entry) => (
                <li key={entry.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500">{entry.date}</p>
                  <p className="mt-1 text-sm text-gray-700">{entry.note}</p>
                </li>
              ))}
            </ul>
          )
        )}
      </Modal>

      {/* Modal Gửi yêu cầu chăm sóc (Flow 4) */}
      <Modal
        isOpen={!!careRequestPlot}
        onClose={handleCloseCareRequest}
        title="Gửi yêu cầu chăm sóc"
        description="Yêu cầu sẽ được gửi trực tiếp đến Farmer đang phụ trách ô đất."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={handleCloseCareRequest}
              disabled={isSubmittingCareRequest}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleSubmitCareRequest}
              loading={isSubmittingCareRequest}
              loadingText="Đang gửi..."
              disabled={!canSubmitCareRequest}
            >
              Gửi yêu cầu
            </Button>
          </>
        }
      >
        {careRequestPlot && (
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{careRequestPlot.code}</span>
                <Badge
                  variant={getSeasonStage(careRequestPlot.growthPercent) === "NEAR_HARVEST" ? "warning" : "success"}
                  size="sm"
                >
                  {getSeasonStage(careRequestPlot.growthPercent) === "NEAR_HARVEST"
                    ? "🌽 Sắp thu hoạch"
                    : "🌱 Đang canh tác"}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                {careRequestPlot.farmName} • Farmer phụ trách: {careRequestPlot.farmer.name}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Loại yêu cầu</label>
              <select
                value={careType}
                onChange={(e) => setCareType(e.target.value as CareRequestType)}
                disabled={isSubmittingCareRequest}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none disabled:opacity-60"
              >
                <option value="" disabled>
                  -- Chọn loại yêu cầu --
                </option>
                {CARE_REQUEST_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">Mô tả chi tiết</label>
              <textarea
                value={careDescription}
                onChange={(e) => setCareDescription(e.target.value)}
                rows={4}
                disabled={isSubmittingCareRequest}
                placeholder="Mô tả vấn đề bạn quan sát được, ví dụ: xuất hiện sâu ở lá phía dưới, đất khô..."
                className="w-full resize-none rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}