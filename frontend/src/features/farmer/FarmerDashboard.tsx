import { useState, useEffect } from "react";
import { farmerService } from "./farmer.service";
import type { FarmerKPISummary, FarmerProfileData } from "./farmer.types";
import { Card, Badge, Alert } from "../../components/ui";
import { FarmerKpiCards, FarmerWeatherBanner } from "./components";

interface FarmerDashboardProps {
  onNavigateTab: (tab: "plots" | "logs" | "requests" | "harvest" | "profile") => void;
}

interface TaskItem {
  id: string;
  title: string;
  timeInfo: string;
  plotCode: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

function generateTasksForFarmer(farmerId: string): TaskItem[] {
  const currentPlots = farmerService.getPlots(farmerId);
  const p1 = currentPlots[0]?.plotCode || "#PL-0192";
  const p2 = currentPlots[1]?.plotCode || p1;
  return [
    {
      id: "t1",
      title: `Kiểm tra độ ẩm và cảm biến đất (Thửa ${p1})`,
      timeInfo: "07:30 Sáng • Định kỳ hàng ngày",
      plotCode: p1,
      completed: true,
      priority: "high",
    },
    {
      id: "t2",
      title: `Kiểm tra sâu bệnh & chăm sóc thực địa (Thửa ${p2})`,
      timeInfo: "10:00 Sáng • Theo quy trình VietGAP",
      plotCode: p2,
      completed: false,
      priority: "medium",
    },
    {
      id: "t3",
      title: `Ghi nhật ký canh tác cho các hoạt động trong ngày`,
      timeInfo: "14:30 Chiều • Báo cáo tới khách hàng",
      plotCode: p1,
      completed: false,
      priority: "high",
    },
    {
      id: "t4",
      title: `Xử lý yêu cầu chăm sóc gửi từ khách thuê thửa`,
      timeInfo: "16:00 Chiều • Cổng tương tác PlotFarm",
      plotCode: p2,
      completed: false,
      priority: "medium",
    },
  ];
}

export default function FarmerDashboard({ onNavigateTab }: FarmerDashboardProps) {
  const [profile, setProfile] = useState<FarmerProfileData>(() => farmerService.getFarmerProfile());
  const [kpis, setKpis] = useState<FarmerKPISummary>(() => farmerService.getKPISummary());
  const [tasks, setTasks] = useState<TaskItem[]>(() => generateTasksForFarmer(farmerService.getActiveFarmerId()));

  // Listen to farmer switch event for seamless testing
  useEffect(() => {
    function handleSync() {
      const nextProfile = farmerService.getFarmerProfile();
      setProfile(nextProfile);
      setKpis(farmerService.getKPISummary(nextProfile.id));
      setTasks(generateTasksForFarmer(nextProfile.id));
    }
    window.addEventListener("pf_farmer_changed", handleSync);
    window.addEventListener("pf_data_changed", handleSync);
    return () => {
      window.removeEventListener("pf_farmer_changed", handleSync);
      window.removeEventListener("pf_data_changed", handleSync);
    };
  }, []);

  function handleToggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }

  return (
    <div className="space-y-6">
      {/* Sensor & Field Weather Banner */}
      <FarmerWeatherBanner profile={profile} />

      {/* 6 KPI StatCards as required */}
      <FarmerKpiCards kpis={kpis} onNavigateTab={onNavigateTab} />

      {/* Urgent Warning Alert if any issue */}
      {kpis.attentionIssues > 0 && (
        <Alert
          variant="warning"
          title="Thông báo cảnh báo thực địa (Admin phân công):"
        >
          Hiện có <strong>{kpis.attentionIssues} vấn đề</strong> cần chú ý trên các thửa đất phụ trách ({profile.assignedFarms.join(", ")}). Vui lòng kiểm tra tab <strong>Quản lý Thửa đất</strong> hoặc <strong>Yêu cầu Chăm sóc</strong> để xử lý.
        </Alert>
      )}

      {/* Task Schedule & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Schedule List */}
        <div className="lg:col-span-2">
          <Card>
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Lịch trình công việc canh tác trong ngày
                </h2>
                <p className="text-xs text-gray-500">
                  Tích chọn để đánh dấu hoàn thành công việc
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {tasks.filter((t) => t.completed).length} / {tasks.length} Đã xong
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 flex items-center justify-between hover:bg-gray-50/70 transition"
                >
                  <label className="flex items-start gap-3 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => handleToggleTask(task.id)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
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
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span>{task.timeInfo}</span>
                        <span>•</span>
                        <span className="font-mono text-emerald-700 font-medium">
                          {task.plotCode}
                        </span>
                      </div>
                    </div>
                  </label>

                  <div className="shrink-0 ml-3">
                    {task.completed ? (
                      <Badge variant="success" size="sm">
                        Đã xong
                      </Badge>
                    ) : (
                      <Badge
                        variant={task.priority === "high" ? "warning" : "info"}
                        size="sm"
                      >
                        {task.priority === "high" ? "Ưu tiên cao" : "Bình thường"}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Operations shortcuts */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm">
              Lối tắt tác vụ nhanh
            </h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateTab("logs")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📝</span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">
                      Ghi nhật ký canh tác
                    </h4>
                    <p className="text-2xs text-gray-500">
                      Thêm hoạt động bón phân, tưới, tỉa
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-emerald-600">→</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("requests")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">💬</span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">
                      Xử lý yêu cầu khách hàng
                    </h4>
                    <p className="text-2xs text-gray-500">
                      {kpis.careRequestsPending} yêu cầu đang chờ giải quyết
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-emerald-600">→</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("harvest")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌾</span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">
                      Theo dõi vụ thu hoạch
                    </h4>
                    <p className="text-2xs text-gray-500">
                      Cập nhật sản lượng & đóng gói
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-emerald-600">→</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab("plots")}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📊</span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-700">
                      Cập nhật tiến độ thửa đất
                    </h4>
                    <p className="text-2xs text-gray-500">
                      Cập nhật % mùa vụ & tình trạng cây
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 group-hover:text-emerald-600">→</span>
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
