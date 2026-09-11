import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";
import { Navbar } from "../../components/layout";
import { Card, Badge, Button, StatCard, EmptyState, Modal, Alert } from "../../components/ui";
import { customerService } from "./customer.service";
import type { SharedFarmItem, SharedPlotItem } from "./customer.types";

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
  const [farmData, setFarmData] = useState<{ farm: SharedFarmItem; plots: SharedPlotItem[] } | null>(() => {
    if (!id) return null;
    return customerService.getFarmDetail(id) || null;
  });

  // Rental modal state
  const [rentingPlot, setRentingPlot] = useState<SharedPlotItem | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>("Rau củ hữu cơ cao cấp");
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    function handleSync() {
      if (id) {
        setFarmData(customerService.getFarmDetail(id) || null);
      }
    }
    window.addEventListener("pf_data_changed", handleSync);
    return () => window.removeEventListener("pf_data_changed", handleSync);
  }, [id]);

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

  function handleOpenRentModal(plot: SharedPlotItem) {
    setRentingPlot(plot);
    setSelectedCrop(farmData?.farm.specialties[0] || "Rau củ hữu cơ cao cấp");
    setDurationMonths(6);
    setErrorMessage("");
  }

  function handleConfirmRent() {
    if (!rentingPlot) return;
    try {
      const result = customerService.rentPlot({
        plotId: rentingPlot.id,
        cropType: selectedCrop,
        durationMonths,
      });

      setSuccessMessage(
        `Chúc mừng bạn đã thuê thành công thửa đất ${result.plot.plotCode} (${result.plot.plantCrop}) với hợp đồng ${result.contract.id}! Kỹ sư nông dân ${result.plot.farmerName} đã nhận bàn giao quản lý.`,
      );
      setRentingPlot(null);

      // Refresh view data
      if (id) {
        setFarmData(customerService.getFarmDetail(id) || null);
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || "Lỗi khi thuê thửa đất.");
    }
  }

  if (!farmData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar onLogout={handleLogout} />
        <main className="flex-1 py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Card>
              <div className="p-8">
                <EmptyState
                  title="Không tìm thấy nông trại"
                  description={`Không có nông trại nào với mã "${id}".`}
                />
                <div className="mt-4 text-center">
                  <Button variant="outline" size="sm" fullWidth={false} onClick={() => navigate("/customer/farms")}>
                    ← Quay lại danh sách nông trại
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const { farm, plots } = farmData;
  const activeCustomer = customerService.getActiveCustomerProfile();

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
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-emerald-700 transition cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Quay lại Danh sách Nông Trại
            </button>

            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => navigate("/customer")}
            >
              Về Bảng Điều Khiển Của Tôi
            </Button>
          </div>

          {successMessage && (
            <Alert variant="success" onClose={() => setSuccessMessage("")}>
              {successMessage}
            </Alert>
          )}

          {/* Banner thông tin nông trại */}
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 p-6 sm:p-8 text-white shadow-lg">
            <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <span className="inline-block rounded-full bg-emerald-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-200 mb-2">
                  Trang Trại Công Nghệ Cao
                </span>
                <h1 className="text-2xl font-bold sm:text-3xl">
                  {farm.name}
                </h1>
                <p className="mt-2 text-sm text-emerald-100 leading-relaxed">
                  {farm.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {farm.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="text-xs px-2.5 py-1 rounded-md bg-white/15 text-emerald-100 border border-white/20"
                    >
                      🌿 {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <Badge variant={farm.status === "active" ? "success" : "warning"} size="md">
                  {farm.status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"}
                </Badge>
                <span className="text-xs text-emerald-200">
                  Kỹ sư: <strong>👨‍🌾 {farm.farmerInChargeName}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Thống kê nhanh */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Vị trí nông trại"
              value={farm.location}
              iconBgColor="bg-emerald-100 text-emerald-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              }
            />
            <StatCard
              title="Tổng quy mô"
              value={farm.totalArea}
              iconBgColor="bg-blue-100 text-blue-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              }
            />
            <StatCard
              title="Số thửa đất"
              value={`${plots.length} Thửa`}
              subtext={`${plots.filter((p) => p.plotStatus !== "IN_USE").length} thửa còn trống`}
              subtextClassName="text-emerald-700 font-semibold"
              iconBgColor="bg-amber-100 text-amber-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
            />
            <StatCard
              title="Kỹ sư phụ trách"
              value={farm.farmerInChargeName}
              subtext={`Mã: ${farm.farmerInChargeId}`}
              subtextClassName="text-gray-600 font-medium"
              iconBgColor="bg-purple-100 text-purple-700"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
          </div>

          {/* Danh sách Thửa Đất thuộc nông trại này */}
          <Card>
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Danh Sách Thửa Đất Trong Nông Trại ({plots.length})
                </h2>
                <p className="text-xs text-gray-500">
                  Bạn có thể chọn thuê trực tiếp các thửa đất đang ở trạng thái Trống hoặc Sẵn sàng canh tác.
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {plots.map((plot) => {
                const isOccupied = plot.plotStatus === "IN_USE";
                const isMyPlot =
                  plot.customerId === activeCustomer.id ||
                  plot.customerName.toLowerCase().includes(activeCustomer.name.toLowerCase());

                return (
                  <div
                    key={plot.id}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/70 transition"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded">
                          {plot.plotCode}
                        </span>
                        {isOccupied ? (
                          isMyPlot ? (
                            <Badge variant="success" size="sm">
                              ✓ Thửa đất của bạn
                            </Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">
                              Đang canh tác
                            </Badge>
                          )
                        ) : (
                          <Badge variant="info" size="sm">
                            ⭐ Sẵn sàng cho thuê
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {plot.areaSquareMeter.toLocaleString()} m²
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-gray-900">
                        {plot.plantCrop}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                        <span>Giá thuê: <strong className="text-emerald-800">{(plot.rentalPricePerMonth || 2500000).toLocaleString()} đ/tháng</strong></span>
                        <span>•</span>
                        <span>Kỹ sư: <strong>👨‍🌾 {plot.farmerName || farm.farmerInChargeName}</strong></span>
                        {isOccupied && (
                          <>
                            <span>•</span>
                            <span>Khách thuê: <strong>{plot.customerName}</strong></span>
                            <span>•</span>
                            <span>Tiến độ: <strong className="text-emerald-700">{plot.progress}%</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isOccupied ? (
                        isMyPlot ? (
                          <Button
                            variant="outline"
                            size="sm"
                            fullWidth={false}
                            onClick={() => navigate("/customer/plots")}
                          >
                            Xem Cảm Biến & Chi Tiết →
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 italic px-3 py-1 bg-gray-100 rounded-lg">
                            Đã có khách thuê
                          </span>
                        )
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          fullWidth={false}
                          onClick={() => handleOpenRentModal(plot)}
                        >
                          + Thuê Thửa Đất Này
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </main>

      {/* Modal Thuê Thửa Đất */}
      <Modal
        isOpen={Boolean(rentingPlot)}
        onClose={() => setRentingPlot(null)}
        title={`Đăng Ký Thuê Thửa Đất: ${rentingPlot?.plotCode}`}
        description={`Ký hợp đồng canh tác nông nghiệp với kỹ sư ${rentingPlot?.farmerName || farm.farmerInChargeName} tại ${farm.name}.`}
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => setRentingPlot(null)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleConfirmRent}
            >
              Xác Nhận Thuê & Ký Hợp Đồng
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {errorMessage && (
            <Alert variant="error" onClose={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}

          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 space-y-1">
            <span className="font-bold text-emerald-950 block">
              Thông tin khách hàng đứng tên hợp đồng:
            </span>
            <p className="text-emerald-900">
              Khách hàng: <strong>{activeCustomer.name}</strong> ({activeCustomer.phone})
            </p>
            <p className="text-emerald-800 text-2xs">
              Địa chỉ nhận nông sản: {activeCustomer.shippingAddress}
            </p>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Loại cây trồng mong muốn canh tác *
            </label>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            >
              {farm.specialties.map((spec, i) => (
                <option key={i} value={spec}>
                  {spec}
                </option>
              ))}
              <option value="Rau củ hữu cơ cao cấp">Rau củ hữu cơ cao cấp</option>
              <option value="Cây ăn trái đặc sản">Cây ăn trái đặc sản</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Thời hạn hợp đồng thuê đất *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 6, 12].map((months) => (
                <button
                  key={months}
                  type="button"
                  onClick={() => setDurationMonths(months)}
                  className={`p-2 rounded-lg border text-center font-semibold cursor-pointer transition ${
                    durationMonths === months
                      ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                      : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {months} Tháng
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-1.5 text-2xs text-gray-600">
            <div className="flex justify-between">
              <span>Đơn giá thuê hàng tháng:</span>
              <strong className="text-gray-900">
                {(rentingPlot?.rentalPricePerMonth || 2500000).toLocaleString()} đ/tháng
              </strong>
            </div>
            <div className="flex justify-between">
              <span>Tổng chi phí ({durationMonths} tháng):</span>
              <strong className="text-emerald-800 font-bold text-xs">
                {((rentingPlot?.rentalPricePerMonth || 2500000) * durationMonths).toLocaleString()} đ
              </strong>
            </div>
            <div className="flex justify-between text-2xs text-gray-400">
              <span>Tiền đặt cọc giữ thửa:</span>
              <span>{((rentingPlot?.rentalPricePerMonth || 2500000) * 2).toLocaleString()} đ</span>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}