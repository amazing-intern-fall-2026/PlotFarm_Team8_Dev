import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { INITIAL_SHARED_FARMS, type SharedFarmItem } from "../shared/sharedDomain";
import { customerService } from "../customer/customer.service";
import { isAuthenticated, getCurrentUser, getRedirectPathByRole, logout } from "../auth/auth.api";

interface AvailablePlotPreview {
  id: string;
  code: string;
  farmName: string;
  crop: string;
  price: number;
  area: number;
  moisture: number;
  temp: number;
  thumbnail: string;
}

const SAMPLE_AVAILABLE_PLOTS: AvailablePlotPreview[] = [
  {
    id: "OD001",
    code: "#A1-DALAT",
    farmName: "Nông trại Thung Lũng Xanh (Lâm Đồng)",
    crop: "Cà chua bi & Dâu tây",
    price: 3000000,
    area: 500,
    moisture: 68,
    temp: 24.5,
    thumbnail: "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "OD002",
    code: "#A2-ISRAEL",
    farmName: "Trang trại Đồi Chè (Bảo Lộc)",
    crop: "Dưa lưới nhà màng",
    price: 3500000,
    area: 600,
    moisture: 65,
    temp: 25.0,
    thumbnail: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "OD004",
    code: "#B1-KALE",
    farmName: "Nông trại Hữu Cơ Củ Chi (TP.HCM)",
    crop: "Cải xoăn Kale & Xà lách",
    price: 2500000,
    area: 400,
    moisture: 62,
    temp: 28.0,
    thumbnail: "https://images.unsplash.com/photo-1524179091875-bf99a9a6fa97?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "OD008",
    code: "#D1-MEKONG",
    farmName: "Khu Nông Nghiệp Công Nghệ Cao (Tiền Giang)",
    crop: "Rau thủy canh tuần hoàn",
    price: 4200000,
    area: 800,
    moisture: 72,
    temp: 29.5,
    thumbnail: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&auto=format&fit=crop&q=80",
  },
];

const CROPS_CATALOG = [
  {
    name: "Cà chua bi hữu cơ",
    category: "Rau ăn quả",
    days: "45 ngày",
    image: "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=500&auto=format&fit=crop&q=80",
    desc: "Giàu lycopene, vị ngọt thanh, canh tác hữu cơ không thuốc bảo vệ thực vật.",
  },
  {
    name: "Dưa lưới nhà màng",
    category: "Trái cây cao cấp",
    days: "75 ngày",
    image: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?w=500&auto=format&fit=crop&q=80",
    desc: "Độ ngọt Brix từ 14-16, ruột cam giòn tan, chuẩn xuất khẩu Nhật Bản.",
  },
  {
    name: "Dâu tây New Zealand",
    category: "Trái cây ôn đới",
    days: "90 ngày",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=500&auto=format&fit=crop&q=80",
    desc: "Trồng trong nhà kính Đà Lạt, quả mọng đỏ đậm, thơm ngát tự nhiên.",
  },
  {
    name: "Cải xoăn Kale & Xà lách",
    category: "Rau ăn lá dinh dưỡng",
    days: "30 ngày",
    image: "https://images.unsplash.com/photo-1524179091875-bf99a9a6fa97?w=500&auto=format&fit=crop&q=80",
    desc: "Siêu thực phẩm xanh, thu hoạch định kỳ hàng tuần giao tận bàn ăn.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [farms, setFarms] = useState<SharedFarmItem[]>(INITIAL_SHARED_FARMS);

  const isAuth = isAuthenticated();
  const currentUser = getCurrentUser();

  useEffect(() => {
    // Fetch live farms from server
    customerService.fetchFarmsAsync().then((liveFarms) => {
      if (liveFarms && liveFarms.length > 0) {
        setFarms(liveFarms);
      }
    }).catch(() => {});
  }, []);

  function handleStartRent() {
    if (isAuth) {
      navigate("/customer/farms");
    } else {
      navigate("/login");
    }
  }

  function scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans selection:bg-emerald-200">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌱</span>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-emerald-900">
                PlotFarm
              </span>
              <span className="hidden sm:inline-block ml-2 text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Nông Nghiệp Số 4.0
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-gray-700">
            <button
              type="button"
              onClick={() => scrollToSection("model")}
              className="hover:text-emerald-700 transition cursor-pointer"
            >
              Mô hình thuê đất
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("farms")}
              className="hover:text-emerald-700 transition cursor-pointer"
            >
              Trang trại nổi bật
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("plots")}
              className="hover:text-emerald-700 transition cursor-pointer"
            >
              Thửa đất cho thuê
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("process")}
              className="hover:text-emerald-700 transition cursor-pointer"
            >
              Quy trình hoạt động
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("crops")}
              className="hover:text-emerald-700 transition cursor-pointer"
            >
              Cây trồng
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {isAuth ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600 font-medium hidden lg:inline">
                  Xin chào, <strong className="text-emerald-800">{currentUser?.fullName || currentUser?.username}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => navigate(getRedirectPathByRole(currentUser?.role))}
                  className="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-3.5 py-2 rounded-lg shadow-xs hover:shadow transition cursor-pointer flex items-center gap-1.5"
                >
                  <span>Cổng {currentUser?.role === "ADMIN" ? "Quản trị" : currentUser?.role === "FARMER" ? "Nông dân" : "Khách hàng"}</span>
                  <span>➔</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    window.location.reload();
                  }}
                  className="text-xs font-semibold text-gray-500 hover:text-rose-600 px-2.5 py-1.5 rounded-md hover:bg-rose-50 transition cursor-pointer"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-bold text-gray-700 hover:text-emerald-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-4 py-2 rounded-lg shadow-xs hover:shadow transition"
                >
                  Đăng ký ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 1. Hero Section ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-emerald-950 text-white py-20 lg:py-28">
        <div className="absolute inset-0 opacity-25">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&auto=format&fit=crop&q=80"
            alt="PlotFarm Organic Farming"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-r from-emerald-950 via-emerald-950/90 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <span>🌾</span>
              <span>Nền tảng Nông nghiệp Công nghệ cao & Thuê đất từ xa</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white">
              Sở Hữu Nông Trại Thông Minh Của Riêng Bạn
            </h1>

            <p className="text-base sm:text-lg text-emerald-100/90 leading-relaxed">
              Thuê thửa đất chuẩn VietGAP, theo dõi tiến độ sinh trưởng qua Camera 24/7 & Cảm biến IoT, nhận nông sản hữu cơ tươi lành giao tận cửa nhà mỗi vụ thu hoạch.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => scrollToSection("farms")}
                className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-emerald-950 font-bold text-sm shadow-lg shadow-emerald-900/30 transition transform hover:-translate-y-0.5 cursor-pointer"
              >
                Khám phá nông trại ➔
              </button>
              <button
                type="button"
                onClick={handleStartRent}
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm backdrop-blur-xs transition cursor-pointer"
              >
                Thuê đất ngay
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-emerald-800/60">
              <div>
                <p className="text-2xl font-black text-emerald-400">4+</p>
                <p className="text-xs text-emerald-200">Trang trại sinh thái</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-400">50+</p>
                <p className="text-xs text-emerald-200">Thửa đất chuẩn hóa</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-400">100%</p>
                <p className="text-xs text-emerald-200">Chuẩn sạch VietGAP</p>
              </div>
              <div>
                <p className="text-2xl font-black text-emerald-400">24/7</p>
                <p className="text-xs text-emerald-200">Camera & IoT trực tiếp</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Model Introduction ─────────────────────────────────────── */}
      <section id="model" className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xs font-extrabold uppercase tracking-wider text-emerald-700 mb-2">
              Mô hình nông nghiệp chia sẻ (Farm Sharing)
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              Giải pháp canh tác số minh bạch & an tâm tuyệt đối
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Bạn không cần có đất hay tốn công cuốc xới. PlotFarm kết nối bạn với những vùng đất màu mỡ nhất và người nông dân tận tụy nhất.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
              <span className="text-3xl">🏞️</span>
              <h3 className="font-bold text-gray-900 text-sm">Đất Sạch Đã Quy Hoạch</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Từng thửa đất được chia lô 400m² - 800m², thổ nhưỡng đạt chuẩn kiểm định, có sẵn hệ thống nước tưới và nhà màng che chắn.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-teal-50/60 border border-teal-100 space-y-3">
              <span className="text-3xl">👨‍🌾</span>
              <h3 className="font-bold text-gray-900 text-sm">Nông Dân Phụ Trách</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mỗi nông trại có bác nông dân và kỹ sư nông nghiệp chuyên nghiệp chăm sóc, làm đất, gieo hạt, tỉa cành và bảo vệ mùa màng.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
              <span className="text-3xl">📡</span>
              <h3 className="font-bold text-gray-900 text-sm">Giám Sát IoT & Camera 24/7</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Xem live camera từng luống rau và đọc chỉ số cảm biến độ ẩm đất, nhiệt độ, độ pH theo thời gian thực ngay trên smartphone.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-3">
              <span className="text-3xl">🚚</span>
              <h3 className="font-bold text-gray-900 text-sm">Giao Tận Cửa Gia Đình</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Khi đến kỳ thu hoạch, nông sản được cân đong thực tế, đóng gói thùng chuẩn lạnh và chuyển phát nhanh có mã vận đơn theo dõi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Featured Farms ─────────────────────────────────────────── */}
      <section id="farms" className="py-16 bg-slate-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xs font-extrabold uppercase tracking-wider text-emerald-700 mb-1">
                Địa điểm canh tác
              </h2>
              <p className="text-2xl sm:text-3xl font-black text-gray-900">
                Danh sách Trang Trại Nổi Bật
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Các vùng chuyên canh sinh thái trải dài từ Tây Nguyên đến Đồng Bằng Sông Cửu Long.
              </p>
            </div>
            <button
              type="button"
              onClick={handleStartRent}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả thửa đất đang mở ➔
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {farms.map((farm) => (
              <div
                key={farm.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={farm.imageUrl}
                      alt={farm.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-2xs font-bold text-emerald-800 shadow-xs">
                      {farm.plotCount} Thửa đất
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs">
                    <div className="flex items-center gap-1 text-2xs text-gray-500">
                      <span>📍</span>
                      <span className="truncate">{farm.location}</span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-emerald-700 transition">
                      {farm.name}
                    </h3>

                    <p className="text-gray-500 text-2xs line-clamp-2 leading-relaxed">
                      {farm.description}
                    </p>

                    <div className="pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                      {farm.specialties.map((spec, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-2xs font-medium"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={handleStartRent}
                    className="w-full py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition cursor-pointer"
                  >
                    Xem chi tiết thửa ➔
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Available Plots Preview ─────────────────────────────────── */}
      <section id="plots" className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xs font-extrabold uppercase tracking-wider text-emerald-700 mb-1">
              Thửa đất sẵn sàng
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              Các Plot Đang Mở Cho Thuê
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Đất sạch, hạ tầng hoàn thiện, đã kết nối trạm đo cảm biến IoT thời gian thực.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SAMPLE_AVAILABLE_PLOTS.map((plot) => (
              <div
                key={plot.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:border-emerald-400 transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={plot.thumbnail}
                      alt={plot.code}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-emerald-700 text-white font-mono font-bold text-2xs">
                      {plot.code}
                    </div>
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-white/95 text-emerald-900 font-semibold text-2xs">
                      AVAILABLE
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs">
                    <h4 className="font-bold text-gray-900 text-sm">
                      {plot.crop}
                    </h4>
                    <p className="text-2xs text-gray-500 truncate">
                      {plot.farmName}
                    </p>

                    <div className="flex items-center justify-between text-2xs text-gray-600 pt-1">
                      <span>Diện tích: <strong>{plot.area} m²</strong></span>
                      <span className="text-emerald-700 font-bold">
                        {(plot.price / 1000000).toFixed(1)} tr/tháng
                      </span>
                    </div>

                    {/* IoT Sensor summary */}
                    <div className="grid grid-cols-2 gap-1.5 p-2 rounded-lg bg-gray-50 text-2xs border border-gray-100">
                      <div>
                        <span className="text-gray-400">Độ ẩm đất:</span>{" "}
                        <strong className="text-emerald-700">{plot.moisture}%</strong>
                      </div>
                      <div>
                        <span className="text-gray-400">Nhiệt độ:</span>{" "}
                        <strong className="text-blue-700">{plot.temp}°C</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={handleStartRent}
                    className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Thuê thửa đất này
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. How It Works (Quy trình 4 bước) ────────────────────────── */}
      <section id="process" className="py-16 bg-slate-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xs font-extrabold uppercase tracking-wider text-emerald-700 mb-1">
              Trải nghiệm liền mạch
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              Quy Trình Hoạt Động 4 Bước Đơn Giản
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs relative">
              <span className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-sm flex items-center justify-center mb-4">
                1
              </span>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Chọn Farm & Plot</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Khám phá nông trại sinh thái yêu thích, xem diện tích, vị trí và lựa chọn ô đất đang còn trống.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs relative">
              <span className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-sm flex items-center justify-center mb-4">
                2
              </span>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Chọn Cây Trồng & Thuê</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Chọn giống cây trồng chuẩn VietGAP, thời hạn canh tác (3, 6, 12 tháng) và xác nhận ký hợp đồng.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs relative">
              <span className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-sm flex items-center justify-center mb-4">
                3
              </span>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Chăm Sóc & Giám Sát</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Nông dân thực hiện chăm bón, ghi nhật ký hình ảnh, bạn có thể gửi yêu cầu tưới hay bón phân bất kỳ lúc nào.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs relative">
              <span className="w-8 h-8 rounded-full bg-emerald-700 text-white font-black text-sm flex items-center justify-center mb-4">
                4
              </span>
              <h3 className="font-bold text-gray-900 text-sm mb-1">Thu Hoạch & Nhận Hàng</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Nông trại thu hoạch, cân đong, đóng thùng lạnh và giao thẳng đến địa chỉ của bạn kèm mã vận đơn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Crops Catalog ──────────────────────────────────────────── */}
      <section id="crops" className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xs font-extrabold uppercase tracking-wider text-emerald-700 mb-1">
              Đa dạng sinh học
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-gray-900">
              Cây Trồng Đang Cung Cấp
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Giống F1 thuần chủng, tỷ lệ nảy mầm cao và quy trình chăm sóc hữu cơ chuẩn kiểm định.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CROPS_CATALOG.map((crop, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition"
              >
                <img
                  src={crop.image}
                  alt={crop.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 space-y-1.5 text-xs">
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {crop.category}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm pt-1">{crop.name}</h4>
                  <p className="text-2xs text-gray-500 leading-relaxed">{crop.desc}</p>
                  <p className="text-2xs font-semibold text-emerald-700 pt-1">
                    ⏱️ Thời gian thu hoạch: {crop.days}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Call To Action Banner ──────────────────────────────────── */}
      <section className="py-16 bg-linear-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <span className="text-4xl">🌾</span>
          <h2 className="text-3xl sm:text-4xl font-black">
            Bắt Đầu Vụ Mùa Đầu Tiên Của Bạn Ngay Hôm Nay
          </h2>
          <p className="text-sm sm:text-base text-emerald-100 max-w-2xl mx-auto leading-relaxed">
            Hàng trăm gia đình đã có nguồn rau quả sạch an tâm tuyệt đối nhờ mô hình thuê thửa đất thông minh của PlotFarm.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleStartRent}
              className="px-8 py-3.5 rounded-xl bg-white text-emerald-950 font-extrabold text-sm shadow-lg hover:bg-emerald-50 transition cursor-pointer"
            >
              Thuê đất & Khám phá ngay ➔
            </button>
            <Link
              to="/register"
              className="px-8 py-3.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 border border-emerald-500/50 text-white font-bold text-sm transition"
            >
              Tạo tài khoản miễn phí
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-gray-400 py-12 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <span>🌱</span> PlotFarm
            </div>
            <p className="text-2xs text-gray-400 leading-relaxed">
              Nền tảng Nông nghiệp Công nghệ cao kết nối khách hàng thuê đất từ xa với các nông trại sinh thái chuẩn VietGAP.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3">Về PlotFarm</h4>
            <ul className="space-y-1.5 text-2xs">
              <li>Mô hình thuê đất</li>
              <li>Hệ thống trang trại</li>
              <li>Tiêu chuẩn VietGAP</li>
              <li>Chính sách bảo hành nông sản</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3">Hỗ Trợ & Liên Hệ</h4>
            <ul className="space-y-1.5 text-2xs">
              <li>Hotline: 1900 8888 (8h - 18h)</li>
              <li>Email: contact@plotfarm.com</li>
              <li>Văn phòng: Q1, TP. Hồ Chí Minh</li>
              <li>Trung tâm hỗ trợ kỹ thuật 24/7</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3">Tài Khoản</h4>
            <div className="space-y-2">
              <Link
                to="/login"
                className="block text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                Đăng nhập Cổng Khách Hàng / Nông Dân / Admin ➔
              </Link>
              <Link
                to="/register"
                className="block text-gray-300 hover:text-white"
              >
                Đăng ký tài khoản Khách hàng mới
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-800 text-center text-2xs text-gray-500">
          © 2026 PlotFarm Platform - Team 8. Bản quyền toàn bộ hệ thống nông nghiệp số.
        </div>
      </footer>
    </div>
  );
}
