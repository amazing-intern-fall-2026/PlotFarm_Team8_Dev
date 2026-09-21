import { useState, useRef, useEffect, useMemo } from "react";
import { farmerService } from "./farmer.service";
import type { CareRequestItem } from "./farmer.types";

export interface FarmerNotificationItem {
  id: string;
  type: "care_request" | "new_booking";
  title: string;
  customerName: string;
  plotName: string;
  description: string;
  timestamp: string;
  statusBadge: string;
  statusColor: "amber" | "blue" | "emerald" | "slate";
  targetTab: "requests" | "plots";
}

export interface FarmerNotificationBellProps {
  onNavigate: (tab: "requests" | "plots") => void;
}

const STORAGE_KEY = "pf_farmer_read_notif_ids";

function getStoredReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function saveStoredReadIds(ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.warn("Could not save read notification IDs:", err);
  }
}

export default function FarmerNotificationBell({ onNavigate }: FarmerNotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "care_request" | "new_booking">("all");
  const [readIds, setReadIds] = useState<Set<string>>(() => getStoredReadIds());
  const [tick, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync data on events and periodically
  useEffect(() => {
    function handleUpdate() {
      setTick((t) => t + 1);
    }
    window.addEventListener("pf_data_changed", handleUpdate);
    window.addEventListener("pf_farmer_changed", handleUpdate);

    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);

    return () => {
      window.removeEventListener("pf_data_changed", handleUpdate);
      window.removeEventListener("pf_farmer_changed", handleUpdate);
      clearInterval(timer);
    };
  }, []);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Build notifications from active farmer's care requests & plot bookings
  const notifications: FarmerNotificationItem[] = useMemo(() => {
    void tick; // depend on tick
    const activeFarmerId = farmerService.getActiveFarmerId();
    const careRequests = farmerService.getCareRequests(activeFarmerId);
    const plots = farmerService.getPlots(activeFarmerId);
    const contracts = farmerService.getContracts();

    const items: FarmerNotificationItem[] = [];

    // 1. Map Care Requests
    careRequests.forEach((req: CareRequestItem) => {
      let statusColor: "amber" | "blue" | "emerald" | "slate" = "amber";
      let statusBadge = "Chờ xử lý";

      if (req.status === "IN_PROGRESS") {
        statusColor = "blue";
        statusBadge = "Đang xử lý";
      } else if (req.status === "COMPLETED") {
        statusColor = "emerald";
        statusBadge = "Đã hoàn thành";
      } else if (req.status === "CANNOT_RESOLVE") {
        statusColor = "slate";
        statusBadge = "Không xử lý";
      }

      items.push({
        id: `req-${req.id}`,
        type: "care_request",
        title: `Yêu cầu chăm sóc: ${req.requestType}`,
        customerName: req.customer || "Khách hàng",
        plotName: req.plot || "Ô đất",
        description: req.description || `Khách hàng yêu cầu hỗ trợ nông nghiệp: ${req.requestType}.`,
        timestamp: req.createdDate || "Gần đây",
        statusBadge,
        statusColor,
        targetTab: "requests",
      });
    });

    // 2. Map New Bookings / Rented Plots
    // Check contracts
    contracts.forEach((c: any) => {
      if (c.TrangThai === "ACTIVE" || c.TrangThai === "CHO_DUYET" || c.TrangThai === "HIEU_LUC") {
        const plotName = c.TenODat || c.MaODat || "Thửa đất";
        const customerName = c.TenKH || c.TenKhachHang || "Khách hàng";
        const cropName = c.TenCayTrong || "Rau sạch";
        const dateStr = c.NgayBatDau ? new Date(c.NgayBatDau).toLocaleDateString("vi-VN") : "Gần đây";

        items.push({
          id: `contract-${c.MaHopDong}`,
          type: "new_booking",
          title: "Thửa đất có lượt thuê mới",
          customerName,
          plotName,
          description: `Khách hàng ${customerName} đã đăng ký thuê ${plotName} (Canh tác: ${cropName}).`,
          timestamp: dateStr,
          statusBadge: c.TrangThai === "CHO_DUYET" ? "Chờ duyệt" : "Đã kích hoạt",
          statusColor: c.TrangThai === "CHO_DUYET" ? "amber" : "emerald",
          targetTab: "plots",
        });
      }
    });

    // If no contracts were loaded yet, also check plots marked IN_USE
    if (items.filter((i) => i.type === "new_booking").length === 0) {
      plots
        .filter((p) => p.plotStatus === "IN_USE" && p.customerName && p.customerName !== "Chưa có khách")
        .forEach((p) => {
          items.push({
            id: `plot-${p.id}`,
            type: "new_booking",
            title: "Thửa đất có khách thuê",
            customerName: p.customerName,
            plotName: p.plotCode,
            description: `Khách hàng ${p.customerName} đã thuê ${p.plotCode} thuộc ${p.farmName} (${p.plantCrop}).`,
            timestamp: p.startDate || "Vừa xong",
            statusBadge: "Đang canh tác",
            statusColor: "emerald",
            targetTab: "plots",
          });
        });
    }

    return items;
  }, [tick]);

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    return notifications.filter((item) => item.type === filter);
  }, [notifications, filter]);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !readIds.has(item.id)).length;
  }, [notifications, readIds]);

  function markAsRead(id: string) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveStoredReadIds(next);
      return next;
    });
  }

  function markAllAsRead() {
    const next = new Set(readIds);
    notifications.forEach((item) => next.add(item.id));
    setReadIds(next);
    saveStoredReadIds(next);
  }

  function handleItemClick(item: FarmerNotificationItem) {
    markAsRead(item.id);
    setIsOpen(false);
    onNavigate(item.targetTab);
  }

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Bell Button Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative flex items-center justify-center h-9 w-9 rounded-xl border transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? "border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20"
            : unreadCount > 0
            ? "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50/50"
            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800"
        }`}
        title={`Thông báo Nông vụ (${unreadCount} chưa đọc)`}
        aria-expanded={isOpen}
      >
        {/* Bell SVG */}
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Badge Indicator */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Floating Notification Popover Box */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <div>
                <h3 className="text-xs font-bold leading-tight">
                  Thông Báo Nông Vụ
                </h3>
                <p className="text-[10px] text-emerald-200">
                  {unreadCount > 0
                    ? `${unreadCount} yêu cầu & lượt thuê mới`
                    : "Đã cập nhật toàn bộ thông báo"}
                </p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[10px] bg-white/20 hover:bg-white/30 text-white font-medium px-2 py-1 rounded-lg transition cursor-pointer"
              >
                Đã đọc tất cả
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-medium text-xs transition cursor-pointer ${
                filter === "all"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-200/70"
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("care_request")}
              className={`px-2.5 py-1 rounded-lg font-medium text-xs transition cursor-pointer ${
                filter === "care_request"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-200/70"
              }`}
            >
              Yêu cầu ({notifications.filter((n) => n.type === "care_request").length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("new_booking")}
              className={`px-2.5 py-1 rounded-lg font-medium text-xs transition cursor-pointer ${
                filter === "new_booking"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-600 hover:bg-gray-200/70"
              }`}
            >
              Thuê mới ({notifications.filter((n) => n.type === "new_booking").length})
            </button>
          </div>

          {/* Notification Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <span className="text-3xl block mb-2">🌿</span>
                <p className="text-xs font-semibold text-gray-700">
                  Không có thông báo mới
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Khi khách hàng tạo yêu cầu chăm sóc hoặc thuê thửa đất mới, thông tin sẽ hiển thị tại đây.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isRead = readIds.has(item.id);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 transition cursor-pointer flex items-start gap-3 relative group ${
                      isRead ? "bg-white hover:bg-slate-50" : "bg-emerald-50/40 hover:bg-emerald-50/70"
                    }`}
                  >
                    {/* Unread indicator dot */}
                    {!isRead && (
                      <span className="absolute top-4 left-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}

                    {/* Icon */}
                    <div
                      className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-sm shadow-2xs ${
                        item.type === "care_request"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.type === "care_request" ? "💬" : "🌱"}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-gray-900 truncate group-hover:text-emerald-700">
                          {item.title}
                        </p>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.2 text-[9px] font-semibold rounded-md shrink-0 ${
                            item.statusColor === "amber"
                              ? "bg-amber-100 text-amber-800"
                              : item.statusColor === "blue"
                              ? "bg-blue-100 text-blue-800"
                              : item.statusColor === "emerald"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.statusBadge}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">
                        {item.description}
                      </p>

                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400">
                        <span className="font-medium text-emerald-800">
                          {item.plotName} • {item.customerName}
                        </span>
                        <span>{item.timestamp}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="p-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-2xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate("requests");
              }}
              className="text-emerald-700 hover:text-emerald-900 font-semibold px-2 py-1 rounded-md hover:bg-emerald-100/50 transition cursor-pointer"
            >
              Xem tất cả Yêu cầu ➔
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onNavigate("plots");
              }}
              className="text-gray-600 hover:text-gray-900 font-semibold px-2 py-1 rounded-md hover:bg-gray-200/50 transition cursor-pointer"
            >
              Quản lý Thửa đất ➔
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
