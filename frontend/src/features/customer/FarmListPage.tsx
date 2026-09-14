import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";
import { useAuth } from "../auth/AuthContext";
import { Navbar } from "../../components/layout";
import { Card, Badge, Button, Input, EmptyState } from "../../components/ui";
import { customerService } from "./customer.service";
import type { SharedFarmItem } from "./customer.types";

interface FarmListPageProps {
  isEmbedded?: boolean;
  onSelectFarm?: (farmId: string) => void;
}

export default function FarmListPage({
  isEmbedded = false,
  onSelectFarm,
}: FarmListPageProps) {
  const navigate = useNavigate();
  const { user: authUser, logout: authLogout } = useAuth();
  const user = authUser || getCurrentUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [farms, setFarms] = useState<SharedFarmItem[]>(() =>
    customerService.getAllFarms(),
  );

  useEffect(() => {
    function handleSync() {
      setFarms(customerService.getAllFarms());
    }
    window.addEventListener("pf_data_changed", handleSync);
    return () => window.removeEventListener("pf_data_changed", handleSync);
  }, []);

  const filteredFarms = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return farms;
    return farms.filter(
      (farm) =>
        farm.name.toLowerCase().includes(keyword) ||
        farm.location.toLowerCase().includes(keyword) ||
        farm.farmerInChargeName.toLowerCase().includes(keyword),
    );
  }, [farms, searchTerm]);

  function handleLogout() {
    authLogout();
    logout();
    navigate("/login", { replace: true });
  }

  function handleViewFarmDetail(farmId: string) {
    if (onSelectFarm) {
      onSelectFarm(farmId);
    } else {
      navigate(`/customer/farms/${farmId}`);
    }
  }

  const content = (
    <div className="space-y-6">
      {!isEmbedded && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Khám Phá Nông Trại & Thửa Đất Canh Tác
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Các nông trại sinh thái công nghệ cao áp dụng hệ thống IoT thông minh và kỹ sư nông dân giàu kinh nghiệm.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => navigate("/customer")}
          >
            ← Quay lại Bảng điều khiển
          </Button>
        </div>
      )}

      {/* Thanh tìm kiếm */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
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
                  d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
                />
              </svg>
            </span>
            <Input
              placeholder="Tìm theo tên nông trại, vị trí (Lâm Đồng, Củ Chi, Tiền Giang)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {filteredFarms.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="Không tìm thấy nông trại"
              description={`Không có nông trại nào khớp với từ khóa "${searchTerm}".`}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {filteredFarms.map((farm) => (
              <div
                key={farm.id}
                className="rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-xs hover:shadow-md hover:border-emerald-400 transition flex flex-col justify-between group cursor-pointer"
                onClick={() => handleViewFarmDetail(farm.id)}
              >
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                  <img
                    src={farm.imageUrl}
                    alt={farm.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant={farm.status === "active" ? "success" : "warning"} size="sm">
                      {farm.status === "active" ? "Đang mở cho thuê" : "Tạm ngưng"}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded-md text-2xs font-medium">
                    📍 {farm.location}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 space-y-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition">
                      {farm.name}
                    </h3>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                      {farm.description}
                    </p>
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-1.5">
                    {farm.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  {/* Metadata info */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-2xs text-gray-500">
                    <div>
                      <span>Tổng quy mô:</span>
                      <strong className="text-gray-800 block text-xs font-semibold">{farm.totalArea}</strong>
                    </div>
                    <div>
                      <span>Kỹ sư phụ trách:</span>
                      <strong className="text-gray-800 block text-xs font-semibold">👨‍🌾 {farm.farmerInChargeName}</strong>
                    </div>
                  </div>
                </div>

                {/* Footer action */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">
                    {farm.plotCount} Thửa đất trong trang trại
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth={false}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewFarmDetail(farm.id);
                    }}
                  >
                    Xem Chi Tiết & Thửa Đất →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  if (isEmbedded) {
    return content;
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {content}
        </div>
      </main>
    </div>
  );
}