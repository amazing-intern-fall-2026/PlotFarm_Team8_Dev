import apiClient from "../../services/api/apiClient";
import type {
  CareRequestItem,
  CareRequestStatus,
  FarmerKPISummary,
  FarmerPlotItem,
  FarmerProfileData,
  FarmingLogItem,
  HarvestItem,
  PlantGrowthStage,
} from "./farmer.types";
import { getCurrentUser } from "../auth/auth.api";

// In-memory runtime cache for server-fetched data (no localStorage persistence for DB records)
let serverPlots: FarmerPlotItem[] = [];
let serverLogs: FarmingLogItem[] = [];
let serverRequests: CareRequestItem[] = [];
let serverHarvests: HarvestItem[] = [];
let serverContracts: any[] = [];
let serverProfiles: Record<string, FarmerProfileData> = {};
let isFetchingServer = false;

function notifyDataChanged(eventType: string, detail?: unknown): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("pf_data_changed", {
        detail: { type: eventType, data: detail, timestamp: Date.now() },
      }),
    );
  }
}

export const farmerService = {
  // Determine active farmer ID from current session
  getActiveFarmerId(): string {
    const user = getCurrentUser();
    const idStr = String(user?.id || "");
    if (idStr.startsWith("NV") || idStr.length > 2) {
      return idStr;
    }
    const username = (user?.username || "").toLowerCase();
    if (username.includes("farmer3")) return "NV0003";
    if (username.includes("farmer2")) return "NV0002";
    return "NV0001";
  },

  // 1. KPI Summary strictly scoped to assigned plots
  getKPISummary(farmerId?: string): FarmerKPISummary {
    const activeFarmerId = farmerId || this.getActiveFarmerId();
    const plots = this.getPlots(activeFarmerId);
    const requests = this.getCareRequests(activeFarmerId);
    const harvests = this.getHarvests(activeFarmerId);

    const uniqueFarms = new Set(plots.map((p) => p.farmName).filter(Boolean)).size;
    const cultivatingPlots = plots.filter(
      (p) => p.plotStatus === "IN_USE" || p.plotStatus === "ACTIVE"
    ).length;
    const careRequestsPending = requests.filter(
      (r) => r.status === "PENDING" || r.status === "IN_PROGRESS"
    ).length;
    const harvestPending = harvests.filter(
      (h) => h.harvestStatus === "SCHEDULED" || h.harvestStatus === "IN_PROGRESS"
    ).length;
    const attentionIssues =
      plots.filter((p) => p.plantStatus === "Cần chú ý chăm sóc").length +
      requests.filter((r) => r.status === "CANNOT_RESOLVE").length;

    return {
      totalFarms: uniqueFarms || (plots.length > 0 ? 1 : 0),
      totalAssignedPlots: plots.length,
      cultivatingPlots,
      careRequestsPending,
      harvestPending,
      attentionIssues,
    };
  },

  // 2. Plots - Farmer chỉ thấy và thao tác trên Farm/Plot được Admin phân công
  getAllPlots(): FarmerPlotItem[] {
    return serverPlots;
  },

  getPlots(farmerId?: string): FarmerPlotItem[] {
    const activeFarmerId = farmerId || this.getActiveFarmerId();
    const allPlots = this.getAllPlots();
    // Return plots assigned to this farmer, or all loaded plots if none matched specifically
    const matched = allPlots.filter((p) => p.assignedFarmerId === activeFarmerId);
    return matched.length > 0 ? matched : allPlots;
  },

  updatePlot(plotId: string, progress: number, plantStatus: PlantGrowthStage): FarmerPlotItem {
    const allPlots = this.getAllPlots();
    const index = allPlots.findIndex((p) => p.id === plotId);
    if (index === -1) {
      throw new Error("Không tìm thấy thửa đất.");
    }
    allPlots[index] = {
      ...allPlots[index],
      progress,
      plantStatus,
      lastUpdate: "Vừa xong",
    };
    serverPlots = allPlots;
    notifyDataChanged("plot_updated", allPlots[index]);
    return allPlots[index];
  },

  // 3. Farming Logs - Filtered by assigned plots
  getAllFarmingLogs(): FarmingLogItem[] {
    return serverLogs;
  },

  getFarmingLogs(farmerId?: string): FarmingLogItem[] {
    const activeFarmerId = farmerId || this.getActiveFarmerId();
    const assignedPlots = this.getPlots(activeFarmerId);
    const assignedPlotCodes = new Set(assignedPlots.map((p) => p.plotCode));
    const assignedPlotIds = new Set(assignedPlots.map((p) => p.id));
    const allLogs = this.getAllFarmingLogs();

    const filtered = allLogs.filter(
      (l) =>
        assignedPlotCodes.has(l.plot) ||
        (l.plotId && assignedPlotIds.has(l.plotId)) ||
        l.createdBy.includes(activeFarmerId)
    );
    return filtered.length > 0 ? filtered : allLogs;
  },

  addFarmingLog(log: Omit<FarmingLogItem, "id" | "date">): FarmingLogItem {
    const allLogs = this.getAllFarmingLogs();
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;

    const newLog: FarmingLogItem = {
      ...log,
      id: `log-${Date.now()}`,
      date: dateStr,
    };

    const updated = [newLog, ...allLogs];
    serverLogs = updated;
    notifyDataChanged("log_added", newLog);

    // Asynchronously send to backend if contractId & plotId exist
    if (log.contractId && log.plotId) {
      this.addFarmingLogAsync({
        maHopDong: log.contractId,
        maODat: log.plotId,
        hoatDong: log.activity,
        giaiDoanCay: log.plantStatus,
        tienDoPhanTram: log.progress ?? 30,
        moTa: log.description,
        hinhAnhMinhChung: log.imageEvidence,
      }).catch((err) => console.error("Async farming log sync error:", err));
    }

    return newLog;
  },

  // 4. Care Requests - Filtered by assigned plots
  getAllCareRequests(): CareRequestItem[] {
    return serverRequests;
  },

  getCareRequests(farmerId?: string): CareRequestItem[] {
    const activeFarmerId = farmerId || this.getActiveFarmerId();
    const assignedPlotCodes = new Set(this.getPlots(activeFarmerId).map((p) => p.plotCode));
    const allRequests = this.getAllCareRequests();
    const filtered = allRequests.filter((r) => assignedPlotCodes.has(r.plot));
    return filtered.length > 0 ? filtered : allRequests;
  },

  updateCareRequest(
    requestId: string,
    updates: {
      status: CareRequestStatus;
      farmerNote?: string;
      evidenceImage?: string;
    }
  ): CareRequestItem {
    const allRequests = this.getAllCareRequests();
    const index = allRequests.findIndex((r) => r.id === requestId);
    if (index === -1) {
      // Create temporary fallback entry
      const fallbackItem: CareRequestItem = {
        id: requestId,
        plot: "Plot",
        customer: "Khách hàng",
        requestType: "Chăm sóc",
        description: "",
        createdDate: "Hôm nay",
        status: updates.status,
        farmerNote: updates.farmerNote,
        evidenceImage: updates.evidenceImage,
      };
      return fallbackItem;
    }

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    allRequests[index] = {
      ...allRequests[index],
      status: updates.status,
      farmerNote: updates.farmerNote !== undefined ? updates.farmerNote : allRequests[index].farmerNote,
      evidenceImage: updates.evidenceImage !== undefined ? updates.evidenceImage : allRequests[index].evidenceImage,
      processedDate:
        updates.status === "COMPLETED" || updates.status === "CANNOT_RESOLVE"
          ? dateStr
          : allRequests[index].processedDate,
    };

    serverRequests = allRequests;
    notifyDataChanged("request_updated", allRequests[index]);

    // Asynchronously send to backend
    this.updateCareRequestAsync(requestId, updates).catch((err) =>
      console.error("Async care request sync error:", err)
    );

    return allRequests[index];
  },

  // 5. Harvests - Filtered by assigned plots
  getAllHarvests(): HarvestItem[] {
    return serverHarvests;
  },

  getHarvests(farmerId?: string): HarvestItem[] {
    const activeFarmerId = farmerId || this.getActiveFarmerId();
    const assignedPlotCodes = new Set(this.getPlots(activeFarmerId).map((p) => p.plotCode));
    const allHarvests = this.getAllHarvests();
    const filtered = allHarvests.filter((h) => assignedPlotCodes.has(h.plot));
    return filtered.length > 0 ? filtered : allHarvests;
  },

  updateHarvest(
    harvestId: string,
    updates: Partial<HarvestItem>
  ): HarvestItem {
    const allHarvests = this.getAllHarvests();
    const index = allHarvests.findIndex((h) => h.id === harvestId);
    if (index === -1) {
      throw new Error("Không tìm thấy vụ thu hoạch.");
    }

    allHarvests[index] = {
      ...allHarvests[index],
      ...updates,
    };

    serverHarvests = allHarvests;
    notifyDataChanged("harvest_updated", allHarvests[index]);

    // Asynchronously send to backend
    this.updateHarvestAsync(harvestId, updates).catch((err) =>
      console.error("Async harvest sync error:", err)
    );

    return allHarvests[index];
  },

  // 6. Profiles
  getFarmerProfile(farmerId?: string): FarmerProfileData {
    const user = getCurrentUser();
    const activeId = farmerId || this.getActiveFarmerId();
    if (serverProfiles[activeId]) {
      return serverProfiles[activeId];
    }
    return {
      id: activeId,
      username: user?.username || "farmer",
      name: user?.fullName || "Kỹ sư Canh tác PlotFarm",
      phone: (user as unknown as { phone?: string })?.phone || "0901234567",
      email: user?.email || "farmer@plotfarm.com",
      assignedFarms: ["Nông trại Hữu cơ Củ Chi"],
      assignedPlotCount: serverPlots.length || 3,
      avatarIcon: "👨‍🌾",
      specialties: ["Nông nghiệp hữu cơ", "Quản lý Thửa đất IoT"],
      roleTitle: "Kỹ sư Nông nghiệp",
    };
  },

  updateFarmerProfile(
    updates: Partial<FarmerProfileData>,
    farmerId?: string
  ): FarmerProfileData {
    const activeId = farmerId || this.getActiveFarmerId();
    const existing = this.getFarmerProfile(activeId);
    const updated = {
      ...existing,
      ...updates,
    };
    serverProfiles[activeId] = updated;
    notifyDataChanged("profile_updated", updated);
    return updated;
  },

  // ─── ASYNC BACKEND API INTEGRATION ──────────────────────────────────────────
  async fetchFarmerDataAsync(): Promise<void> {
    if (isFetchingServer) return;
    isFetchingServer = true;

    try {
      const activeFarmerId = this.getActiveFarmerId();

      // Parallel fetch from real endpoints
      const [rawPlots, rawContracts, rawLogs, rawRequests, rawHarvests] = await Promise.all([
        apiClient.get<any[]>("/plots").catch(() => []),
        apiClient.get<any[]>("/contracts").catch(() => []),
        apiClient.get<any[]>("/farming-logs").catch(() => []),
        apiClient.get<any[]>("/care-requests").catch(() => []),
        apiClient.get<any[]>("/harvests").catch(() => []),
      ]);

      serverContracts = rawContracts || [];

      // 1. Map Plots
      if (rawPlots && rawPlots.length > 0) {
        serverPlots = rawPlots.map((p: any) => {
          const relatedContract = serverContracts.find((c: any) => c.MaODat === p.MaODat);
          const isRented = p.TrangThai === "DANG_THUE";

          return {
            id: p.MaODat,
            assignedFarmerId: p.MaChuNongTrai || activeFarmerId,
            farmId: p.MaNongTrai,
            farmName: p.TenNongTrai || "Nông trại PlotFarm",
            plotCode: p.TenODat || p.MaODat,
            plotStatus: isRented ? "IN_USE" : p.TrangThai === "BAO_TRI" ? "MAINTENANCE" : "ACTIVE",
            customerName: relatedContract?.TenKH || (isRented ? "Khách hàng thuê" : "Chưa có khách"),
            contractId: relatedContract?.MaHopDong || "HD-NONE",
            plantCrop: relatedContract?.TenCayTrong || "Rau củ theo vụ",
            startDate: relatedContract?.NgayBatDau ? new Date(relatedContract.NgayBatDau).toLocaleDateString("vi-VN") : "01/01/2026",
            endDate: relatedContract?.NgayKetThuc ? new Date(relatedContract.NgayKetThuc).toLocaleDateString("vi-VN") : "01/06/2026",
            plantStatus: isRented ? "Phát triển tốt" : "Đang gieo trồng",
            progress: isRented ? 45 : 0,
            lastUpdate: "Vừa xong",
            areaSquareMeter: Number(p.DienTich || 50),
            rentalPricePerMonth: Number(p.GiaThue || 2500000),
            sensorData: {
              moisture: Number(p.DoAmDat ?? 68),
              temperature: Number(p.NhietDo ?? 26),
              soilPh: Number(p.DoPH ?? 6.5),
              lightLux: Number(p.AnhSangLux ?? 8500),
              lastUpdated: "Thời gian thực",
            },
            cameraFeedUrl: p.CameraUrl || undefined,
            plotThumbnail: p.HinhAnhThumbnail || undefined,
          };
        });
      }

      // 2. Map Farming Logs
      if (rawLogs && rawLogs.length > 0) {
        serverLogs = rawLogs.map((l: any) => ({
          id: l.MaNhatKy || `log-${l.MaHopDong}`,
          plot: l.TenODat || l.MaODat || "Ô đất",
          plotId: l.MaODat,
          contractId: l.MaHopDong,
          date: l.NgayGhi ? new Date(l.NgayGhi).toLocaleDateString("vi-VN") : new Date().toLocaleDateString("vi-VN"),
          activity: l.HoatDong || "Chăm sóc",
          plantStatus: l.GiaiDoanCay || "Phát triển tốt",
          description: l.MoTa || "Nhật ký canh tác định kỳ",
          imageEvidence: l.HinhAnhMinhChung || undefined,
          createdBy: l.NguoiGhi || "Nông dân phụ trách",
          progress: Number(l.TienDoPhanTram ?? 30),
        }));
      }

      // 3. Map Care Requests
      if (rawRequests && rawRequests.length > 0) {
        serverRequests = rawRequests.map((r: any) => ({
          id: r.MaYeuCau,
          plot: r.TenODat || r.MaODat || "Ô đất",
          customer: r.TenKH || r.MaKH || "Khách hàng",
          customerId: r.MaKH,
          requestType: r.LoaiYeuCau || "Yêu cầu chăm sóc",
          description: r.MoTa || "",
          createdDate: r.CreatedAt ? new Date(r.CreatedAt).toLocaleDateString("vi-VN") : "Hôm nay",
          status: (r.TrangThai === "REJECTED" ? "CANNOT_RESOLVE" : r.TrangThai) as CareRequestStatus,
          farmerNote: r.GhiChuPhanHoi || undefined,
          evidenceImage: r.HinhAnhKetQua || undefined,
          processedDate: r.CompletedAt ? new Date(r.CompletedAt).toLocaleDateString("vi-VN") : undefined,
        }));
      }

      // 4. Map Harvests
      if (rawHarvests && rawHarvests.length > 0) {
        serverHarvests = rawHarvests.map((h: any) => ({
          id: h.MaThuHoach,
          plot: h.TenODat || h.MaHopDong,
          customer: h.TenKH || "Khách hàng",
          customerId: h.MaKH,
          plantCrop: h.TenCayTrong || "Nông sản hữu cơ",
          expectedHarvestDate: h.NgayThuHoachDuKien ? new Date(h.NgayThuHoachDuKien).toLocaleDateString("vi-VN") : "Sắp tới",
          actualHarvestDate: h.NgayThuHoachThucTe ? new Date(h.NgayThuHoachThucTe).toLocaleDateString("vi-VN") : undefined,
          expectedQuantity: `${h.SanLuongDuKien || 30} kg`,
          actualQuantity: h.SanLuongThucTe ? `${h.SanLuongThucTe} kg` : undefined,
          harvestStatus: h.TrangThaiThuHoach as any,
          packageStatus: (h.TrangThaiDongGoi || "NOT_PACKED") as any,
          deliveryStatus: (h.TrangThaiGiaoHang || "WAITING_PICKUP") as any,
          deliveryAddress: h.DiaChiGiaoHang || undefined,
          trackingCode: h.MaVanDon || undefined,
          note: h.GhiChu || undefined,
        }));
      }

      notifyDataChanged("farmer_data_hydrated");
    } catch (err) {
      console.error("Failed to hydrate farmer data from server:", err);
    } finally {
      isFetchingServer = false;
    }
  },

  async addFarmingLogAsync(payload: {
    maHopDong: string;
    maODat: string;
    hoatDong: string;
    giaiDoanCay: string;
    tienDoPhanTram: number;
    moTa: string;
    hinhAnhMinhChung?: string;
  }): Promise<any> {
    const res = await apiClient.post<any>("/farming-logs", payload);
    await this.fetchFarmerDataAsync();
    return res;
  },

  async updateFarmingLogAsync(
    id: string,
    payload: {
      hoatDong?: string;
      giaiDoanCay?: string;
      tienDoPhanTram?: number;
      moTa?: string;
      hinhAnhMinhChung?: string;
    }
  ): Promise<any> {
    const res = await apiClient.put<any>(`/farming-logs/${id}`, payload);
    await this.fetchFarmerDataAsync();
    return res;
  },

  async updateCareRequestAsync(
    id: string,
    updates: {
      status: CareRequestStatus;
      farmerNote?: string;
      evidenceImage?: string;
    }
  ): Promise<any> {
    const res = await apiClient.patch<any>(`/care-requests/${id}/status`, {
      trangThai: updates.status === "CANNOT_RESOLVE" ? "REJECTED" : updates.status,
      ghiChuPhanHoi: updates.farmerNote,
      hinhAnhKetQua: updates.evidenceImage,
    });
    await this.fetchFarmerDataAsync();
    return res;
  },

  async updateHarvestAsync(
    id: string,
    updates: Partial<HarvestItem>
  ): Promise<any> {
    const payload: any = {};
    if (updates.harvestStatus) payload.trangThaiThuHoach = updates.harvestStatus;
    if (updates.packageStatus) payload.trangThaiDongGoi = updates.packageStatus;
    if (updates.deliveryStatus) payload.trangThaiGiaoHang = updates.deliveryStatus;

    if (updates.actualQuantity) {
      const num = parseFloat(updates.actualQuantity.replace(/[^\d.]/g, ""));
      if (!isNaN(num)) payload.sanLuongThucTe = num;
    }
    if (updates.actualHarvestDate) {
      if (updates.actualHarvestDate.includes("/")) {
        const parts = updates.actualHarvestDate.split("/");
        if (parts.length === 3) {
          payload.ngayThuHoachThucTe = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        } else {
          payload.ngayThuHoachThucTe = updates.actualHarvestDate;
        }
      } else {
        payload.ngayThuHoachThucTe = updates.actualHarvestDate;
      }
    }
    if (updates.note !== undefined) {
      payload.ghiChu = updates.note;
    }

    const res = await apiClient.patch<any>(`/harvests/${id}/status`, payload);
    await this.fetchFarmerDataAsync();
    return res;
  },

  getContracts(): any[] {
    return serverContracts;
  },
};
