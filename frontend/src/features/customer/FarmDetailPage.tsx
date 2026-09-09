import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";
import { Navbar } from "../../components/layout";
import { Card, Badge, Button, StatCard, EmptyState } from "../../components/ui";

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

// Mock data - sau này thay bằng gọi API theo farmId
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

export default function FarmDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());

  const farm = id ? MOCK_FARMS[id] : undefined;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
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
                  title="Số thửa đất"
                  value={`${farm.plotCount} Thửa`}
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
                  title="Ngày tạo"
                  value={farm.createdAt}
                  iconBgColor="bg-gray-100 text-gray-600"
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  }
                />
              </div>

              {/* Khu vực mở rộng: danh sách thửa đất thuộc nông trại này */}
              <Card>
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">
                    Danh sách Thửa Đất trong Nông Trại
                  </h2>
                  <Button variant="outline" size="sm" fullWidth={false}>
                    + Thêm thửa đất
                  </Button>
                </div>
                <div className="p-6">
                  <p className="text-sm text-gray-500">
                    (Chưa có dữ liệu — có thể tích hợp API danh sách thửa đất
                    theo <code>farmId = {farm.id}</code> tại đây.)
                  </p>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}