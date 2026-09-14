import { useState, useEffect } from "react";
import { Modal, Button, Badge } from "../../components/ui";
import { customerService } from "./customer.service";
import { getCurrentUser } from "../auth/auth.api";
import { INITIAL_SHARED_FARMS, type SharedFarmItem, type SharedPlotItem } from "../shared/sharedDomain";

interface BookingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFarmId?: string;
  initialPlotId?: string;
  onSuccess?: (result: { contract: any; plot: SharedPlotItem }) => void;
}

const CROPS_LIST = [
  {
    id: "CT001",
    name: "Cà chua bi hữu cơ",
    type: "Rau ăn quả",
    durationDays: 45,
    icon: "🍅",
    desc: "Cây dễ trồng, sai quả, thu hoạch liên tục 4-5 đợt.",
  },
  {
    id: "CT002",
    name: "Dưa lưới nhà màng Israel",
    type: "Trái cây cao cấp",
    durationDays: 75,
    icon: "🍈",
    desc: "Vị ngọt thanh mát, độ đường Brix 14-16, quả nặng 1.5 - 2kg.",
  },
  {
    id: "CT003",
    name: "Dâu tây New Zealand",
    type: "Trái cây ôn đới",
    durationDays: 90,
    icon: "🍓",
    desc: "Trồng tại Lâm Đồng, quả mọng đỏ đậm, thơm dịu tự nhiên.",
  },
  {
    id: "CT004",
    name: "Cải xoăn Kale hữu cơ",
    type: "Rau ăn lá",
    durationDays: 30,
    icon: "🥬",
    desc: "Giàu vitamin và chất xơ, thu hoạch định kỳ cách tuần.",
  },
  {
    id: "CT005",
    name: "Xà lách thủy canh Carol",
    type: "Rau ăn lá",
    durationDays: 25,
    icon: "🥗",
    desc: "Cây non giòn ngọt, tuyệt vời cho món salad gia đình.",
  },
  {
    id: "CT006",
    name: "Ớt chuông Sweet Pepper",
    type: "Rau ăn quả",
    durationDays: 60,
    icon: "🫑",
    desc: "Quả dày thịt, 3 màu đỏ/vàng/xanh, chuẩn VietGAP.",
  },
];

export default function BookingWizardModal({
  isOpen,
  onClose,
  initialFarmId,
  initialPlotId,
  onSuccess,
}: BookingWizardModalProps) {
  const currentUser = getCurrentUser();

  // Wizard Steps: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> Complete (7)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Selections
  const [farms, setFarms] = useState<SharedFarmItem[]>(INITIAL_SHARED_FARMS);
  const [selectedFarmId, setSelectedFarmId] = useState<string>(initialFarmId || "farm-1");
  const [plots, setPlots] = useState<SharedPlotItem[]>([]);
  const [selectedPlotId, setSelectedPlotId] = useState<string>(initialPlotId || "");
  const [selectedCropId, setSelectedCropId] = useState<string>("CT001");
  const [durationMonths, setDurationMonths] = useState<number>(6);
  const [paymentMethod, setPaymentMethod] = useState<"VIETQR" | "VNPAY" | "MOMO">("VIETQR");
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);

  // Execution states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Load farms & plots on mount or when farm changes
  useEffect(() => {
    if (!isOpen) return;

    customerService.fetchFarmsAsync().then((liveFarms) => {
      if (liveFarms && liveFarms.length > 0) {
        setFarms(liveFarms);
      }
    }).catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (initialFarmId) setSelectedFarmId(initialFarmId);
    if (initialPlotId) {
      setSelectedPlotId(initialPlotId);
      setCurrentStep(3); // Skip directly to crop if both farm & plot are pre-selected
    } else {
      setCurrentStep(1);
    }
  }, [initialFarmId, initialPlotId, isOpen]);

  useEffect(() => {
    const farmDetail = customerService.getFarmDetail(selectedFarmId);
    if (farmDetail) {
      setPlots(farmDetail.plots);
      if (!initialPlotId) {
        const firstAvailable = farmDetail.plots.find(
          (p) => p.plotStatus === "ACTIVE" || (p as any).status === "TRONG"
        );
        setSelectedPlotId(firstAvailable?.id || farmDetail.plots[0]?.id || "");
      }
    }
  }, [selectedFarmId, initialPlotId]);

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];
  const selectedPlot = plots.find((p) => p.id === selectedPlotId) || plots[0];
  const selectedCrop = CROPS_LIST.find((c) => c.id === selectedCropId) || CROPS_LIST[0];

  // Price calculations
  const monthlyPrice = selectedPlot?.rentalPricePerMonth || 3000000;
  const rawTotal = monthlyPrice * durationMonths;
  const discount = durationMonths === 12 ? rawTotal * 0.1 : 0;
  const totalAmount = rawTotal - discount;
  const depositAmount = monthlyPrice; // 1 month deposit

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);

  const formatDate = (d: Date) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

  async function handleConfirmBooking() {
    if (!selectedPlot) {
      setErrorMsg("Vui lòng chọn thửa đất hợp lệ.");
      return;
    }
    if (!agreeTerms) {
      setErrorMsg("Vui lòng đồng ý với Điều khoản thuê đất để tiếp tục.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const result = await customerService.rentPlotAsync({
        plotId: selectedPlot.id,
        cropType: selectedCrop.id,
        durationMonths,
      });

      setBookingResult(result);
      setCurrentStep(7); // Complete view
      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      setErrorMsg(err?.message || "Lỗi khi xử lý hợp đồng thuê đất.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setCurrentStep(1);
    setBookingResult(null);
    setErrorMsg("");
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleReset}
      title="Quy Trình Đặt Thuê Thửa Đất (Booking Wizard)"
      description="Quy trình 6 bước thuê thửa đất nông nghiệp công nghệ cao và bàn giao cho kỹ sư phụ trách."
      size="xl"
    >
      <div className="space-y-6 text-xs">
        {/* ── Wizard Step Indicator ─────────────────────────────────── */}
        {currentStep <= 6 && (
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center justify-between text-2xs font-semibold text-gray-500">
              <span className={currentStep >= 1 ? "text-emerald-700 font-bold" : ""}>1. Nông trại</span>
              <span>➔</span>
              <span className={currentStep >= 2 ? "text-emerald-700 font-bold" : ""}>2. Thửa đất</span>
              <span>➔</span>
              <span className={currentStep >= 3 ? "text-emerald-700 font-bold" : ""}>3. Cây trồng</span>
              <span>➔</span>
              <span className={currentStep >= 4 ? "text-emerald-700 font-bold" : ""}>4. Thời hạn</span>
              <span>➔</span>
              <span className={currentStep >= 5 ? "text-emerald-700 font-bold" : ""}>5. Hợp đồng</span>
              <span>➔</span>
              <span className={currentStep >= 6 ? "text-emerald-700 font-bold" : ""}>6. Thanh toán</span>
            </div>
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 transition-all duration-300 rounded-full"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ── STEP 1: Chọn Nông Trại ────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">
                Bước 1: Lựa chọn Nông trại sinh thái mong muốn
              </h3>
              <span className="text-gray-500">{farms.length} trang trại</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {farms.map((farm) => {
                const isSelected = farm.id === selectedFarmId;
                return (
                  <div
                    key={farm.id}
                    onClick={() => setSelectedFarmId(farm.id)}
                    className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500/20"
                        : "border-gray-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={farm.imageUrl}
                        alt={farm.name}
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900 line-clamp-1">{farm.name}</h4>
                        </div>
                        <p className="text-2xs text-gray-500">📍 {farm.location}</p>
                        <p className="text-2xs text-emerald-800 font-semibold">
                          🌾 {farm.plotCount} thửa đất • Kỹ sư: {farm.farmerInChargeName}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setCurrentStep(2)}
              >
                Tiếp tục: Chọn thửa đất ➔
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Chọn Thửa Đất (Plot) ──────────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">
                  Bước 2: Chọn thửa đất đang còn trống tại {selectedFarm?.name}
                </h3>
                <p className="text-2xs text-gray-500 mt-0.5">
                  Chỉ các thửa có trạng thái <strong>AVAILABLE (Còn trống)</strong> mới có thể thuê.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {plots.map((plot) => {
                const isRented = plot.plotStatus === "IN_USE" || (plot as any).status === "DANG_THUE";
                const isSelected = plot.id === selectedPlotId;

                return (
                  <div
                    key={plot.id}
                    onClick={() => {
                      if (!isRented) setSelectedPlotId(plot.id);
                    }}
                    className={`p-3.5 rounded-xl border-2 transition ${
                      isRented
                        ? "opacity-60 bg-gray-100 border-gray-200 cursor-not-allowed"
                        : isSelected
                        ? "border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500/20 cursor-pointer"
                        : "border-gray-200 bg-white hover:border-emerald-300 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono font-bold text-emerald-800 text-sm">
                        {plot.plotCode}
                      </span>
                      {isRented ? (
                        <Badge variant="neutral" size="sm">ĐÃ THUÊ (RENTED)</Badge>
                      ) : (
                        <Badge variant="success" size="sm">CÒN TRỐNG (AVAILABLE)</Badge>
                      )}
                    </div>

                    <div className="space-y-1 text-2xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Diện tích:</span>
                        <strong className="text-gray-900">{plot.areaSquareMeter} m²</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Giá thuê:</span>
                        <strong className="text-emerald-700">
                          {plot.rentalPricePerMonth.toLocaleString("vi-VN")} đ / tháng
                        </strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-100 text-gray-500">
                        <span>Độ ẩm đất: {plot.sensorData?.moisture || 65}%</span>
                        <span>Nhiệt độ: {plot.sensorData?.temperature || 26}°C</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-3 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(1)}>
                ⬅ Quay lại
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  if (!selectedPlotId) {
                    setErrorMsg("Vui lòng chọn một thửa đất còn trống.");
                    return;
                  }
                  setErrorMsg("");
                  setCurrentStep(3);
                }}
              >
                Tiếp tục: Chọn cây trồng ➔
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Chọn Cây Trồng (Crop) ─────────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Bước 3: Lựa chọn loại cây trồng chuẩn VietGAP
              </h3>
              <p className="text-2xs text-gray-500 mt-0.5">
                Nông dân sẽ chuẩn bị hạt giống thuần chủng F1 và gieo trồng ngay sau khi ký hợp đồng.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {CROPS_LIST.map((crop) => {
                const isSelected = crop.id === selectedCropId;
                return (
                  <div
                    key={crop.id}
                    onClick={() => setSelectedCropId(crop.id)}
                    className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex items-start gap-3 ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/80 shadow-xs ring-1 ring-emerald-500/20"
                        : "border-gray-200 bg-white hover:border-emerald-300"
                    }`}
                  >
                    <span className="text-3xl shrink-0">{crop.icon}</span>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 text-xs">{crop.name}</h4>
                      </div>
                      <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-2xs">
                        {crop.type} • Vụ: {crop.durationDays} ngày
                      </span>
                      <p className="text-2xs text-gray-500 leading-relaxed">{crop.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between pt-3 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(2)}>
                ⬅ Quay lại
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setCurrentStep(4)}
              >
                Tiếp tục: Chọn thời hạn thuê ➔
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Chọn Thời Gian Thuê (Duration) ─────────────────── */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Bước 4: Lựa chọn thời hạn thuê thửa đất
              </h3>
              <p className="text-2xs text-gray-500 mt-0.5">
                Thời gian thuê càng dài, chi phí bình quân càng tối ưu và cây trồng sinh trưởng ổn định qua nhiều vụ.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setDurationMonths(3)}
                className={`p-4 rounded-xl border-2 transition cursor-pointer text-center space-y-2 ${
                  durationMonths === 3
                    ? "border-emerald-600 bg-emerald-50 shadow-xs ring-1 ring-emerald-500/20"
                    : "border-gray-200 bg-white hover:border-emerald-300"
                }`}
              >
                <span className="text-2xl">🌱</span>
                <h4 className="font-bold text-gray-900">3 Tháng</h4>
                <p className="text-2xs text-gray-500">Trải nghiệm 1 vụ mùa rau củ ngắn ngày</p>
                <p className="text-xs font-bold text-emerald-700 pt-1">
                  {(monthlyPrice * 3).toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div
                onClick={() => setDurationMonths(6)}
                className={`p-4 rounded-xl border-2 transition cursor-pointer text-center space-y-2 relative ${
                  durationMonths === 6
                    ? "border-emerald-600 bg-emerald-50 shadow-xs ring-1 ring-emerald-500/20"
                    : "border-gray-200 bg-white hover:border-emerald-300"
                }`}
              >
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-2xs">
                  Phổ biến nhất
                </div>
                <span className="text-2xl">🌿</span>
                <h4 className="font-bold text-gray-900">6 Tháng</h4>
                <p className="text-2xs text-gray-500">Trồng 2-3 vụ gối đầu, tặng 1 cữ phân vi sinh</p>
                <p className="text-xs font-bold text-emerald-700 pt-1">
                  {(monthlyPrice * 6).toLocaleString("vi-VN")} đ
                </p>
              </div>

              <div
                onClick={() => setDurationMonths(12)}
                className={`p-4 rounded-xl border-2 transition cursor-pointer text-center space-y-2 relative ${
                  durationMonths === 12
                    ? "border-emerald-600 bg-emerald-50 shadow-xs ring-1 ring-emerald-500/20"
                    : "border-gray-200 bg-white hover:border-emerald-300"
                }`}
              >
                <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-2xs">
                  Giảm 10%
                </div>
                <span className="text-2xl">🌳</span>
                <h4 className="font-bold text-gray-900">12 Tháng</h4>
                <p className="text-2xs text-gray-500">Thu hoạch trọn 4 mùa quanh năm tiết kiệm nhất</p>
                <p className="text-xs font-bold text-emerald-700 pt-1">
                  {((monthlyPrice * 12) * 0.9).toLocaleString("vi-VN")} đ
                </p>
              </div>
            </div>

            {/* Chi tiết tài chính */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-2 text-2xs">
              <div className="flex justify-between text-gray-600">
                <span>Đơn giá thuê mỗi tháng:</span>
                <strong className="text-gray-900">{monthlyPrice.toLocaleString("vi-VN")} đ/tháng</strong>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Thời hạn thuê:</span>
                <strong className="text-gray-900">{durationMonths} tháng ({formatDate(startDate)} ➔ {formatDate(endDate)})</strong>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Ưu đãi gói 12 tháng (10%):</span>
                  <span>- {discount.toLocaleString("vi-VN")} đ</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Tiền đặt cọc hoàn lại (1 tháng):</span>
                <strong className="text-gray-900">{depositAmount.toLocaleString("vi-VN")} đ</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-bold text-emerald-900">
                <span>Tổng giá trị hợp đồng:</span>
                <span className="text-base text-emerald-700">{totalAmount.toLocaleString("vi-VN")} đ</span>
              </div>
            </div>

            <div className="flex justify-between pt-3 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(3)}>
                ⬅ Quay lại
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setCurrentStep(5)}
              >
                Tiếp tục: Xem hợp đồng ➔
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Xác Nhận Hợp Đồng (Review) ─────────────────────── */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Bước 5: Kiểm tra và xác nhận thông tin Hợp đồng thuê thửa
              </h3>
              <p className="text-2xs text-gray-500 mt-0.5">
                Vui lòng kiểm tra kỹ thông tin người thuê và cam kết tiêu chuẩn chất lượng VietGAP.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-white space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div>
                  <span className="text-2xs font-semibold text-gray-500 uppercase tracking-wider">Hợp đồng điện tử</span>
                  <h4 className="font-bold text-gray-900 text-sm">HỢP ĐỒNG THUÊ ĐẤT CANH TÁC NÔNG NGHIỆP SỐ</h4>
                </div>
                <Badge variant="warning">CHỜ XÁC NHẬN</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-2xs">
                <div>
                  <span className="text-gray-500 block">Bên Thuê (Khách hàng):</span>
                  <strong className="text-gray-900">{currentUser?.fullName || "Nguyễn Văn Nông"}</strong>
                  <p className="text-gray-500">{currentUser?.email || "customer@plotfarm.com"}</p>
                </div>
                <div>
                  <span className="text-gray-500 block">Bên Cho Thuê:</span>
                  <strong className="text-gray-900">Hệ thống Nông nghiệp Số PlotFarm</strong>
                  <p className="text-gray-500">Đại diện: {selectedFarm.farmerInChargeName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 text-2xs">
                <div>
                  <span className="text-gray-500 block">Thửa đất:</span>
                  <strong className="text-emerald-800">{selectedPlot?.plotCode} ({selectedPlot?.areaSquareMeter}m²)</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Trang trại:</span>
                  <strong className="text-gray-900 truncate block">{selectedFarm?.name}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Cây trồng:</span>
                  <strong className="text-emerald-700">{selectedCrop?.name}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Thời hạn thuê:</span>
                  <strong className="text-gray-900">{durationMonths} Tháng</strong>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-2xs text-emerald-950 flex items-start gap-2">
                <span>🛡️</span>
                <span>
                  <strong>Cam kết VietGAP:</strong> Nông trại cam kết 100% không dùng thuốc bảo vệ thực vật độc hại, lắp đặt camera truyền hình ảnh trực tiếp 24/7 và hoàn tiền nếu nông sản không đạt tiêu chuẩn kiểm định an toàn vệ sinh thực phẩm.
                </span>
              </div>

              <label className="flex items-center gap-2 pt-2 text-2xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-gray-700">
                  Tôi đã đọc, hiểu rõ và đồng ý toàn bộ điều khoản hợp đồng thuê đất điện tử.
                </span>
              </label>
            </div>

            <div className="flex justify-between pt-3 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(4)}>
                ⬅ Quay lại
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setCurrentStep(6)}
              >
                Tiếp tục: Thanh toán ➔
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 6: Thanh Toán (Payment) ──────────────────────────── */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Bước 6: Lựa chọn phương thức thanh toán & Kích hoạt hợp đồng
              </h3>
              <p className="text-2xs text-gray-500 mt-0.5">
                Hợp đồng sẽ được kích hoạt ngay lập tức sau khi xác nhận thanh toán thành công.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setPaymentMethod("VIETQR")}
                className={`p-3.5 rounded-xl border-2 transition cursor-pointer text-center space-y-1.5 ${
                  paymentMethod === "VIETQR"
                    ? "border-emerald-600 bg-emerald-50 shadow-xs ring-1 ring-emerald-500/20"
                    : "border-gray-200 bg-white hover:border-emerald-300"
                }`}
              >
                <span className="text-2xl">📲</span>
                <h4 className="font-bold text-gray-900 text-xs">Chuyển Khoản VietQR</h4>
                <p className="text-2xs text-gray-500">Quét mã QR qua ứng dụng ngân hàng</p>
              </div>

              <div
                onClick={() => setPaymentMethod("VNPAY")}
                className={`p-3.5 rounded-xl border-2 transition cursor-pointer text-center space-y-1.5 ${
                  paymentMethod === "VNPAY"
                    ? "border-emerald-600 bg-emerald-50 shadow-xs ring-1 ring-emerald-500/20"
                    : "border-gray-200 bg-white hover:border-emerald-300"
                }`}
              >
                <span className="text-2xl">💳</span>
                <h4 className="font-bold text-gray-900 text-xs">Cổng VNPAY / Thẻ</h4>
                <p className="text-2xs text-gray-500">Thẻ ATM / Visa / Mastercard nội địa</p>
              </div>

              <div
                onClick={() => setPaymentMethod("MOMO")}
                className={`p-3.5 rounded-xl border-2 transition cursor-pointer text-center space-y-1.5 ${
                  paymentMethod === "MOMO"
                    ? "border-emerald-600 bg-emerald-50 shadow-xs ring-1 ring-emerald-500/20"
                    : "border-gray-200 bg-white hover:border-emerald-300"
                }`}
              >
                <span className="text-2xl">👛</span>
                <h4 className="font-bold text-gray-900 text-xs">Ví Điện Tử MoMo</h4>
                <p className="text-2xs text-gray-500">Thanh toán 1 chạm qua app MoMo</p>
              </div>
            </div>

            {/* VietQR Mock Display */}
            {paymentMethod === "VIETQR" && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-32 h-32 bg-white p-2 rounded-lg border border-gray-300 flex items-center justify-center shrink-0">
                  <div className="text-center font-mono text-2xs text-gray-600">
                    <span className="text-3xl block">📱</span>
                    [Mã VietQR]
                    <span className="block font-bold text-emerald-700">PlotFarm Demo</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-2xs text-gray-700 w-full">
                  <p><strong>Ngân hàng:</strong> TMCP Ngoại Thương Việt Nam (Vietcombank)</p>
                  <p><strong>Số tài khoản:</strong> <span className="font-mono font-bold text-emerald-800">0071000998877</span></p>
                  <p><strong>Chủ tài khoản:</strong> CÔNG TY CP NÔNG NGHIỆP SỐ PLOTFARM</p>
                  <p><strong>Số tiền:</strong> <span className="font-mono font-bold text-emerald-700 text-sm">{totalAmount.toLocaleString("vi-VN")} đ</span></p>
                  <p><strong>Nội dung:</strong> <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200 text-emerald-900">PF THUE {selectedPlot?.plotCode} {currentUser?.username || "KH"}</span></p>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-3 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => setCurrentStep(5)} disabled={isSubmitting}>
                ⬅ Quay lại
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xử lý tạo hợp đồng..." : "Xác nhận Thanh toán & Ký hợp đồng ➔"}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 7: Hoàn tất & Kích hoạt thành công ───────────────── */}
        {currentStep === 7 && (
          <div className="py-6 text-center space-y-4">
            <span className="text-5xl block animate-bounce">🎉</span>
            <h3 className="font-extrabold text-gray-900 text-lg">
              Chúc Mừng Bạn Đã Thuê Thửa Đất Thành Công!
            </h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
              Hợp đồng <strong>#{bookingResult?.contract?.id || "HD-001"}</strong> đã được ký kết và kích hoạt. Thửa đất <strong>{selectedPlot?.plotCode}</strong> tại <strong>{selectedFarm?.name}</strong> đã chuyển sang trạng thái <strong>ĐANG CANH TÁC</strong>.
            </p>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 max-w-md mx-auto text-left text-2xs space-y-1.5 text-emerald-950">
              <div className="flex justify-between">
                <span>Cây trồng:</span>
                <strong>{selectedCrop?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span>Kỹ sư phụ trách:</span>
                <strong>{selectedFarm?.farmerInChargeName}</strong>
              </div>
              <div className="flex justify-between">
                <span>Thời hạn vụ:</span>
                <strong>{durationMonths} Tháng (Đến {formatDate(endDate)})</strong>
              </div>
              <div className="flex justify-between">
                <span>Camera trực tiếp:</span>
                <span className="text-emerald-700 font-semibold">Đã kết nối 24/7</span>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                onClick={handleReset}
              >
                Hoàn tất & Đóng
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
