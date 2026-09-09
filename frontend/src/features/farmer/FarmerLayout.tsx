import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../auth/auth.api";
import {
  Sidebar,
  type SidebarMenuItem,
} from "../../components/layout";
import {
  StatCard,
  Badge,
  EmptyState,
  Modal,
  Button,
  Card,
  Input,
} from "../../components/ui";

type FarmerTab = "dashboard" | "plots" | "schedule" | "logs" | "requests";

interface FarmingTask {
  id: string;
  title: string;
  timeInfo: string;
  completed: boolean;
}

export default function FarmerLayout() {
  const navigate = useNavigate();
  const [user] = useState(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<FarmerTab>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  const [logPlot, setLogPlot] = useState("#PL-0192");
  const [logNote, setLogNote] = useState("");

  const [tasks, setTasks] = useState<FarmingTask[]>([
    {
      id: "1",
      title: "Bón thúc phân Kali & Lân đợt 2 (Thửa #PL-0192)",
      timeInfo: "Thời gian: 07:00 - Hoàn thành bởi Nông dân",
      completed: true,
    },
    {
      id: "2",
      title: "Vận hành hệ thống tưới phun sương (Thửa #PL-0311 - Rau hữu cơ)",
      timeInfo: "Thời gian: 15:30 - Khách hàng yêu cầu kiểm tra độ ẩm",
      completed: false,
    },
    {
      id: "3",
      title: "Chụp ảnh tiến độ lúa ST25 gửi chủ thửa đất #PL-0192",
      timeInfo: "Thời gian: 17:00 - Đính kèm báo cáo tuần",
      completed: false,
    },
  ]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleToggleTask(taskId: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
    );
  }

  const menuItems: SidebarMenuItem<FarmerTab>[] = [
    { id: "dashboard", label: "Tổng quan nông vụ", icon: "📊" },
    { id: "plots", label: "Thửa ruộng phụ trách", icon: "🌱", badge: "4 thửa" },
    { id: "schedule", label: "Lịch tưới & Bón phân", icon: "📅", badge: "3 lịch hôm nay" },
    { id: "logs", label: "Nhật ký mùa vụ & Sâu bệnh", icon: "📝" },
    { id: "requests", label: "Yêu cầu từ khách hàng", icon: "💬", badge: "2 mới" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Standardized Reusable Farmer Sidebar */}
      <Sidebar<FarmerTab>
        theme="emerald"
        brandTitle="PlotFarm"
        brandSubtitle="Cổng Nông Dân"
        brandShortName="PF"
        menuSectionTitle="Khu Vực Canh Tác"
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isOpenMobile={isMobileSidebarOpen}
        onToggleMobile={setIsMobileSidebarOpen}
        user={{
          name: user?.fullName || user?.username || "Nông Dân",
          emailOrStatus: "Đang trực đồng ruộng",
          avatarText: "👨‍🌾",
        }}
        onLogout={handleLogout}
        logoutText="Đăng xuất"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 py-3.5 px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {menuItems.find((i) => i.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-gray-500">
              Phụ trách cụm thửa ruộng Đồng Xanh & Thung Lũng
            </p>
          </div>

          {/* Weather & IoT sensor widget */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs text-emerald-800">
              <span className="text-base">☀️</span>
              <div>
                <span className="font-semibold">29°C Nắng tốt</span>
                <span className="text-gray-500 ml-1.5">• Độ ẩm đất: 68%</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={() => setIsLogModalOpen(true)}
            >
              + Ghi nhật ký
            </Button>
          </div>
        </header>

        {/* Content Body */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 space-y-6">
          {activeTab === "dashboard" && (
            <>
              {/* Stats Grid using StatCard */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Thửa phụ trách"
                  value="4 Thửa"
                  subtext="Diện tích: 18.000 m²"
                  subtextClassName="text-emerald-600"
                  icon="🌱"
                  iconBgColor="bg-emerald-100 text-emerald-700"
                />

                <StatCard
                  title="Việc cần làm hôm nay"
                  value="3 Nhiệm vụ"
                  subtext="2 việc cần hoàn thành trước 16h"
                  subtextClassName="text-amber-600"
                  icon="📋"
                  iconBgColor="bg-amber-100 text-amber-700"
                />

                <StatCard
                  title="Tình trạng cây trồng"
                  value="Bình thường"
                  subtext="Không phát hiện dịch hại"
                  subtextClassName="text-blue-600"
                  icon="🌾"
                  iconBgColor="bg-blue-100 text-blue-700"
                />

                <StatCard
                  title="Yêu cầu từ khách"
                  value="2 Yêu cầu"
                  subtext="Cần chụp ảnh tiến độ lúa"
                  valueClassName="text-purple-700"
                  icon="💬"
                  iconBgColor="bg-purple-100 text-purple-700"
                />
              </div>

              {/* Tasks schedule using Card & Badge */}
              <Card>
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">
                    Lịch trình canh tác & chăm sóc trong ngày
                  </h2>
                  <span className="text-xs text-emerald-700 font-medium">
                    Hôm nay: Vụ Hè Thu
                  </span>
                </div>
                <div className="divide-y divide-gray-200">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
                    >
                      <label className="flex items-center gap-3 cursor-pointer select-none flex-1">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => handleToggleTask(task.id)}
                          className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <p
                            className={`text-sm font-semibold transition ${
                              task.completed
                                ? "line-through text-gray-400"
                                : "text-gray-900"
                            }`}
                          >
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-400">{task.timeInfo}</p>
                        </div>
                      </label>
                      <div>
                        {task.completed ? (
                          <Badge variant="success" size="sm">
                            Đã xong
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            Chờ thực hiện
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}

          {/* Sub-tabs placeholder using EmptyState */}
          {activeTab !== "dashboard" && (
            <EmptyState
              icon={menuItems.find((i) => i.id === activeTab)?.icon}
              title={menuItems.find((i) => i.id === activeTab)?.label}
              description="Dữ liệu chi tiết cho phân hệ nông vụ đang được kết nối với trạm trung tâm IoT và dữ liệu cảm biến thực địa."
              action={
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth={false}
                  onClick={() => setActiveTab("dashboard")}
                >
                  Quay lại Tổng quan
                </Button>
              }
            />
          )}
        </main>
      </div>

      {/* Modal Ghi Nhật Ký Canh Tác */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Ghi nhật ký canh tác nông vụ"
        description="Lưu lại hoạt động bón phân, phun tưới hoặc kiểm tra sâu bệnh thực địa."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => setIsLogModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={() => {
                alert(`Đã lưu nhật ký thành công cho thửa ${logPlot}!`);
                setLogNote("");
                setIsLogModalOpen(false);
              }}
            >
              Lưu nhật ký
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div className="space-y-1.5 text-xs text-gray-700">
            <label className="block font-medium">Chọn thửa đất canh tác:</label>
            <select
              value={logPlot}
              onChange={(e) => setLogPlot(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="#PL-0192">Thửa #PL-0192 - Lúa ST25 (Khu Đồng Xanh)</option>
              <option value="#PL-0205">Thửa #PL-0205 - Cà phê Robusta (Khu Thung Lũng)</option>
              <option value="#PL-0311">Thửa #PL-0311 - Rau củ hữu cơ (Vườn Ươm)</option>
            </select>
          </div>

          <Input
            label="Nội dung công việc thực hiện"
            placeholder="Ví dụ: Đã bón đợt phân kali, độ ẩm đất đạt chuẩn"
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
