import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";
import { Navbar } from "../../components/layout";
import { Card, Badge, Button, Input, EmptyState } from "../../components/ui";

interface Farm {
  id: string;
  name: string;
  location: string;
  totalArea: string;
  plotCount: number;
  status: "active" | "inactive";
}

export default function FarmListPage() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [searchTerm, setSearchTerm] = useState("");

  const [farms] = useState<Farm[]>([
    {
      id: "1",
      name: "Nông trại Đồng Xanh",
      location: "Long An",
      totalArea: "12.500 m²",
      plotCount: 3,
      status: "active",
    },
    {
      id: "2",
      name: "Nông trại Thung Lũng",
      location: "Đắk Lắk",
      totalArea: "8.000 m²",
      plotCount: 2,
      status: "active",
    },
  ]);

  const filteredFarms = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return farms;
    return farms.filter((farm) =>
      farm.name.toLowerCase().includes(keyword),
    );
  }, [farms, searchTerm]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleViewFarmDetail(farmId: string) {
    console.log(">>> handleViewFarmDetail called with:", farmId);
    navigate(`/customer/farms/${farmId}`);
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Danh sách Nông Trại
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Quản lý các nông trại đang liên kết với tài khoản của bạn.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => navigate("/customer")}
            >
              ← Quay lại Trang chủ
            </Button>
          </div>

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
                  placeholder="Tìm kiếm theo tên nông trại..."
                  value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                
                  className="pl-9"
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
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Tên nông trại</th>
                      <th className="px-6 py-3">Khu vực</th>
                      <th className="px-6 py-3">Tổng diện tích</th>
                      <th className="px-6 py-3">Số thửa đất</th>
                      <th className="px-6 py-3">Trạng thái</th>
                      <th className="px-6 py-3">Hành động</th>
                      <th className="px-6 py-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {filteredFarms.map((farm) => (
                      <tr
                        key={farm.id}
                        onClick={() => handleViewFarmDetail(farm.id)}
        
                        className="cursor-pointer transition-colors hover:bg-emerald-50/60"
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {farm.name}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {farm.location}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {farm.totalArea}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {farm.plotCount}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              farm.status === "active" ? "success" : "warning"
                            }
                            size="sm"
                          >
                            {farm.status === "active"
                              ? "Đang hoạt động"
                              : "Ngừng hoạt động"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <Button
                            variant="outline"
                            size="sm"
                            fullWidth={false}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewFarmDetail(farm.id);
                            }}
                          >
                            Chi tiết
                          </Button>
                        </td>
                        <td className="px-6 py-4 text-gray-400">
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}