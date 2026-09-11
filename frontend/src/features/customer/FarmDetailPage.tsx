import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";
import { Navbar } from "../../components/layout";
import { Card, Badge, Button, StatCard, EmptyState, Modal } from "../../components/ui";

interface Farm {
  id: string;
  name: string;
  location: string;
  totalArea: string;
  plotCount: number;
  status: "active" | "inactive";
  description: string;
  createdAt: string;
}

type PlotStatus = "AVAILABLE" | "RENTED";

interface Plot {
  id: string;
  code: string;
  area: string;
  pricePerMonth: number; // đơn vị VNĐ, để tiện tính toán
  status: PlotStatus;
  suitableCrops: string[];
}

const RENTAL_DURATIONS = [
  { label: "3 tháng", months: 3 },
  { label: "6 tháng", months: 6 },
  { label: "12 tháng", months: 12 },
];

/* ================== MOCK DATA ================== */

const MOCK_FARMS: Record<string, Farm> = {
  "1": {
    id: "1",
    name: "Nông trại Đồng Xanh",
    location: "Long An",
    totalArea: "12.500 m²",
    plotCount: 3,
    status: "active",
    description:
      "Nông trại chuyên canh tác lúa ST25 đặc sản, áp dụng hệ thống tưới tiêu tự động và cảm biến IoT giám sát độ ẩm đất theo thời gian thực.",
    createdAt: "12/03/2024",
  },
  "2": {
    id: "2",
    name: "Nông trại Thung Lũng",
    location: "Đắk Lắk",
    totalArea: "8.000 m²",
    plotCount: 2,
    status: "active",
    description:
      "Khu vực trồng cà phê Robusta, kết hợp mô hình canh tác bền vững và theo dõi chu kỳ ra hoa qua nền tảng PlotFarm.",
    createdAt: "05/06/2024",
  },
};

const MOCK_PLOTS_BY_FARM: Record<string, Plot[]> = {
  "1": [
    {
      id: "p1",
      code: "PLOT-A1",
      area: "50m²",
      pricePerMonth: 1500000,
      status: "AVAILABLE",
      suitableCrops: ["Dưa lưới", "Cà chua Cherry"],
    },
    {
      id: "p2",
      code: "PLOT-A2",
      area: "50m²",
      pricePerMonth: 1500000,
      status: "RENTED",
      suitableCrops: ["Dưa lưới", "Rau xà lách"],
    },
    {
      id: "p3",
      code: "PLOT-A3",
      area: "80m²",
      pricePerMonth: 2200000,
      status: "AVAILABLE",
      suitableCrops: ["Cà chua Cherry", "Dâu tây"],
    },
    {
      id: "p4",
      code: "PLOT-B1",
      area: "100m²",
      pricePerMonth: 2800000,
      status: "AVAILABLE",
      suitableCrops: ["Rau củ hữu cơ", "Dưa leo"],
    },
    {
      id: "p5",
      code: "PLOT-B2",
      area: "60m²",
      pricePerMonth: 1800000,
      status: "RENTED",
      suitableCrops: ["Rau xà lách", "Cải bó xôi"],
    },
    {
      id: "p6",
      code: "PLOT-B3",
      area: "50m²",
      pricePerMonth: 1500000,
      status: "AVAILABLE",
      suitableCrops: ["Dưa lưới"],
    },
  ],
  "2": [
    {
      id: "p7",
      code: "PLOT-C1",
      area: "70m²",
      pricePerMonth: 2000000,
      status: "AVAILABLE",
      suitableCrops: ["Cà phê Robusta"],
    },
    {
      id: "p8",
      code: "PLOT-C2",
      area: "70m²",
      pricePerMonth: 2000000,
      status: "RENTED",
      suitableCrops: ["Cà phê Robusta"],
    },
  ],
};

const CROP_OPTIONS = [
  "Dưa lưới",
  "Cà chua Cherry",
  "Rau xà lách",
  "Dâu tây",
  "Rau củ hữu cơ",
  "Dưa leo",
  "Cải bó xôi",
  "Cà phê Robusta",
];

function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}đ`;
}

/* ================== COMPONENT ================== */

export default function FarmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());

  const farm = id ? MOCK_FARMS[id] : undefined;

  const [plots, setPlots] = useState<Plot[]>(() =>
    id ? MOCK_PLOTS_BY_FARM[id] ?? [] : [],
  );

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [selectedCrop, setSelectedCrop] = useState(CROP_OPTIONS[0]);
  const [selectedDurationMonths, setSelectedDurationMonths] = useState(
    RENTAL_DURATIONS[0].months,
  );
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [bookingSuccessMessage, setBookingSuccessMessage] = useState<string | null>(null);

  const totalPrice = useMemo(() => {
    if (!selectedPlot) return 0;
    return selectedPlot.pricePerMonth * selectedDurationMonths;
  }, [selectedPlot, selectedDurationMonths]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleOpenBookingModal(plot: Plot) {
    if (plot.status !== "AVAILABLE") return; // Rule: không thể thuê Plot đã RENTED
    setSelectedPlot(plot);
    setSelectedCrop(plot.suitableCrops[0] ?? CROP_OPTIONS[0]);
    setSelectedDurationMonths(RENTAL_DURATIONS[0].months);
    setIsBookingModalOpen(true);
  }

  function handleCloseBookingModal() {
    if (isProcessingPayment) return;
    setIsBookingModalOpen(false);
    setSelectedPlot(null);
  }

  function handleConfirmPayment() {
    if (!selectedPlot) return;

    setIsProcessingPayment(true);

    // Giả lập gọi API thanh toán (PAYMENT = PAID)
    setTimeout(() => {
      setPlots((prev) =>
        prev.map((p) =>
          p.id === selectedPlot.id ? { ...p, status: "RENTED" } : p,
        ),
      );

      // TODO: Khi có API thật — gọi API thêm Plot này vào danh sách
      // "Thửa đất của tôi" ở CustomerPage, ví dụ:
      // await api.post("/customer/plots", { plotId: selectedPlot.id, cropType: selectedCrop, durationMonths: selectedDurationMonths });

      setIsProcessingPayment(false);
      setIsBookingModalOpen(false);
      setBookingSuccessMessage(
        `Thuê thành công ${selectedPlot.code} — cây trồng "${selectedCrop}" trong ${selectedDurationMonths} tháng! Thửa đất đã được thêm vào danh sách của bạn.`,
      );
      setSelectedPlot(null);
    }, 1200);
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
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/customer/farms")}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Quay lại Danh sách Nông Trại
            </button>
          </div>

          {!farm ? (
            <Card>
              <div className="p-8">
                <EmptyState
                  title="Không tìm thấy nông trại"
                  description={`Không có nông trại nào với mã "${id}".`}
                />
              </div>
            </Card>
          ) : (
            <>
              {bookingSuccessMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-start justify-between gap-3">
                  <span>{bookingSuccessMessage}</span>
                  <button
                    onClick={() => setBookingSuccessMessage(null)}
                    className="text-emerald-600 hover:text-emerald-800 shrink-0"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Banner thông tin nông trại */}
              <div className="rounded-2xl bg-linear-to-r from-emerald-700 via-teal-700 to-emerald-800 p-6 sm:p-8 text-white shadow-lg">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <span className="inline-block rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-medium uppercase tracking-wider text-emerald-200 mb-2">
                      Chi tiết Nông Trại
                    </span>
                    <h1 className="text-2xl font-bold sm:text-3xl">
                      {farm.name}
                    </h1>
                    <p className="mt-2 text-sm text-emerald-100">
                      {farm.description}
                    </p>
                  </div>
                  <Badge
                    variant={farm.status === "active" ? "success" : "warning"}
                    size="md"
                  >
                    {farm.status === "active"
                      ? "Đang hoạt động"
                      : "Ngừng hoạt động"}
                  </Badge>
                </div>
              </div>

              {/* Thống kê nông trại */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Khu vực"
                  value={farm.location}
                  iconBgColor="bg-emerald-100 text-emerald-600"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                  }
                />
                <StatCard
                  title="Tổng diện tích"
                  value={farm.totalArea}
                  iconBgColor="bg-blue-100 text-blue-600"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                      />
                    </svg>
                  }
                />
                <StatCard
                  title="Tổng số thửa"
                  value={`${plots.length} Thửa`}
                  iconBgColor="bg-amber-100 text-amber-600"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
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
                  title="Còn trống"
                  value={`${plots.filter((p) => p.status === "AVAILABLE").length} Thửa`}
                  valueClassName="text-emerald-600"
                  iconBgColor="bg-emerald-100 text-emerald-600"
                  icon={
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  }
                />
              </div>

              {/* Plot Grid */}
              <Card>
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">
                    Danh sách Thửa Đất trong Nông Trại
                  </h2>
                  <span className="text-xs text-gray-500">
                    {plots.filter((p) => p.status === "AVAILABLE").length}/
                    {plots.length} thửa còn trống
                  </span>
                </div>

                {plots.length === 0 ? (
                  <div className="p-8">
                    <EmptyState
                      title="Chưa có thửa đất nào"
                      description="Nông trại này hiện chưa có dữ liệu thửa đất."
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    {plots.map((plot) => {
                      const isAvailable = plot.status === "AVAILABLE";
                      return (
                        <div
                          key={plot.id}
                          className={`rounded-xl border p-4 transition-all ${
                            isAvailable
                              ? "border-emerald-200 bg-white hover:shadow-md"
                              : "border-gray-200 bg-gray-50 opacity-70"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {plot.code}
                              </p>
                              <p className="text-xs text-gray-500">
                                Diện tích: {plot.area}
                              </p>
                            </div>
                            <Badge
                              variant={isAvailable ? "success" : "warning"}
                              size="sm"
                              className={
                                isAvailable
                                  ? ""
                                  : "bg-gray-200 text-gray-600"
                              }
                            >
                              {isAvailable ? "CÒN TRỐNG" : "ĐÃ THUÊ"}
                            </Badge>
                          </div>

                          <div className="mt-3">
                            <p className="text-lg font-bold text-emerald-700">
                              {formatCurrency(plot.pricePerMonth)}
                              <span className="text-xs font-normal text-gray-500">
                                {" "}
                                / tháng
                              </span>
                            </p>
                          </div>

                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1.5">
                              Cây trồng gợi ý:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {plot.suitableCrops.map((crop) => (
                                <span
                                  key={crop}
                                  className="rounded-full bg-emerald-50 px-2 py-0.5 text-2xs text-emerald-700 border border-emerald-100"
                                >
                                  {crop}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4">
                            {isAvailable ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleOpenBookingModal(plot)}
                              >
                                Thuê ngay
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled
                                className="cursor-not-allowed"
                              >
                                Đã thuê
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </main>

      {/* Modal Đặt thuê & Thanh toán */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        title="Đặt thuê thửa đất"
        description="Xác nhận thông tin thuê đất và tiến hành thanh toán."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={handleCloseBookingModal}
              disabled={isProcessingPayment}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleConfirmPayment}
              loading={isProcessingPayment}
              loadingText="Đang xử lý thanh toán..."
            >
              Xác nhận Thanh toán Online
            </Button>
          </>
        }
      >
        {selectedPlot && (
          <div className="space-y-4 text-sm">
            {/* Thông tin Plot đã chọn */}
            <div className="rounded-lg border border-gray-200 p-3 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">
                  {selectedPlot.code}
                </span>
                <Badge variant="success" size="sm">
                  CÒN TRỐNG
                </Badge>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Diện tích: {selectedPlot.area} • Đơn giá:{" "}
                {formatCurrency(selectedPlot.pricePerMonth)}/tháng
              </p>
            </div>

            {/* Dropdown chọn cây trồng */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Loại cây muốn trồng
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                disabled={isProcessingPayment}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none disabled:opacity-60"
              >
                {CROP_OPTIONS.map((crop) => (
                  <option key={crop} value={crop}>
                    {crop}
                  </option>
                ))}
              </select>
            </div>

            {/* Dropdown chọn thời gian thuê */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-700">
                Thời gian thuê
              </label>
              <select
                value={selectedDurationMonths}
                onChange={(e) =>
                  setSelectedDurationMonths(Number(e.target.value))
                }
                disabled={isProcessingPayment}
                className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none disabled:opacity-60"
              >
                {RENTAL_DURATIONS.map((d) => (
                  <option key={d.months} value={d.months}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tổng tiền */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-center justify-between">
              <span className="text-sm font-medium text-emerald-800">
                Tổng tiền thanh toán:
              </span>
              <span className="text-lg font-bold text-emerald-700">
                {formatCurrency(totalPrice)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}