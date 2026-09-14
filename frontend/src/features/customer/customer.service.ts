import apiClient from "../../services/api/apiClient";
import {
  INITIAL_CARE_REQUESTS,
  INITIAL_FARMER_PLOTS,
  INITIAL_FARMING_LOGS,
  INITIAL_HARVESTS,
} from "../farmer/farmer.mock";
import {
  DEMO_CUSTOMERS,
  INITIAL_SHARED_FARMS,
  type SharedCareRequestItem,
  type SharedContractItem,
  type SharedCustomerProfile,
  type SharedFarmItem,
  type SharedFarmingLogItem,
  type SharedHarvestItem,
  type SharedPlotItem,
} from "../shared/sharedDomain";
import type {
  CreateCareRequestPayload,
  CustomerKPISummary,
  RentPlotPayload,
} from "./customer.types";
import { getCurrentUser, saveAuthSession } from "../auth/auth.api";

// ─── Backend DTO Interfaces ──────────────────────────────────────────────────
export interface BackendFarmDto {
  MaNongTrai: string;
  TenNongTrai: string;
  DiaChi: string;
  TrangThai: string;
  MaChuNongTrai: string;
  TenChuNongTrai?: string;
  EmailChuNongTrai?: string;
  DienThoaiChuNongTrai?: string;
  SoLuongPlot?: number;
  TongDienTich?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface BackendPlotDto {
  MaODat: string;
  MaNongTrai: string;
  TenODat: string;
  DienTich: number;
  TrangThai: "TRONG" | "DANG_THUE" | "BAO_TRI";
  GiaThue: number;
  CameraUrl?: string | null;
  HinhAnhThumbnail?: string | null;
  DoAmDat?: number | null;
  NhietDo?: number | null;
  DoPH?: number | null;
  AnhSangLux?: number | null;
  TenNongTrai?: string;
  MaChuNongTrai?: string;
  TenChuNongTrai?: string;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface BackendCropDto {
  MaCayTrong: string;
  TenCayTrong: string;
  LoaiCay: string;
  ThoiGianThuHoach: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface BackendContractDto {
  MaHopDong: string;
  MaKH: string;
  MaODat: string;
  MaCayTrong: string;
  NgayBatDau: string;
  NgayKetThuc: string;
  TongTien: number;
  TrangThai: string;
  TenKH?: string;
  Email?: string;
  DienThoai?: string;
  TenODat?: string;
  DienTich?: number;
  TenNongTrai?: string;
  DiaChiNongTrai?: string;
  MaChuNongTrai?: string;
  TenChuNongTrai?: string;
  TenCayTrong?: string;
  LoaiCay?: string;
  ThoiGianThuHoach?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
}

// ─── DTO to Domain Mappers ───────────────────────────────────────────────────
export function mapBackendFarmToShared(f: BackendFarmDto): SharedFarmItem {
  const areaNum = Number(f.TongDienTich || 20000);
  return {
    id: f.MaNongTrai,
    name: f.TenNongTrai,
    location: f.DiaChi,
    totalArea: `${areaNum.toLocaleString("vi-VN")} m²`,
    totalAreaNum: areaNum,
    plotCount: Number(f.SoLuongPlot || 0),
    status: f.TrangThai === "APPROVED" ? "active" : "inactive",
    description: `Nông trại sinh thái công nghệ cao tại ${f.DiaChi} với hệ thống canh tác thông minh, kiểm soát tưới tự động và kỹ sư giám sát 24/7.`,
    createdAt: f.CreatedAt ? new Date(f.CreatedAt).toLocaleDateString("vi-VN") : "01/01/2026",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80",
    farmerInChargeId: f.MaChuNongTrai || "NV001",
    farmerInChargeName: f.TenChuNongTrai || "Lê Văn Canh Tác",
    specialties: ["Rau củ hữu cơ cao cấp", "Cà chua bi Israel", "Dưa lưới nhà màng"],
  };
}

export function mapBackendPlotToShared(p: BackendPlotDto): SharedPlotItem {
  const isRented = p.TrangThai === "DANG_THUE";
  const isMaintenance = p.TrangThai === "BAO_TRI";

  return {
    id: p.MaODat,
    assignedFarmerId: p.MaChuNongTrai || "NV001",
    farmerName: p.TenChuNongTrai || "Kỹ sư nông dân",
    farmId: p.MaNongTrai,
    farmName: p.TenNongTrai || "Nông trại PlotFarm",
    plotCode: p.TenODat || `#PL-${p.MaODat}`,
    plotStatus: isRented ? "IN_USE" : (isMaintenance ? "MAINTENANCE" : "ACTIVE"),
    customerId: "",
    customerName: isRented ? "Khách hàng đang thuê" : "",
    contractId: "",
    plantCrop: isRented ? "Đang canh tác" : "Chưa gieo trồng",
    startDate: "",
    endDate: "",
    plantStatus: isRented ? "Phát triển tốt" : "Đang gieo trồng",
    progress: isRented ? 45 : 0,
    lastUpdate: isRented ? "Đang phát triển" : "Sẵn sàng cho thuê",
    areaSquareMeter: Number(p.DienTich || 500),
    rentalPricePerMonth: Number(p.GiaThue || 3000000),
    sensorData: {
      moisture: Number(p.DoAmDat ?? 68),
      temperature: Number(p.NhietDo ?? 26.5),
      soilPh: Number(p.DoPH ?? 6.5),
      lightLux: Number(p.AnhSangLux ?? 15000),
      lastUpdated: "Thời gian thực (IoT)",
    },
    cameraFeedUrl: p.CameraUrl || "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=1200&auto=format&fit=crop&q=80",
    plotThumbnail: p.HinhAnhThumbnail || "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&auto=format&fit=crop&q=80",
  };
}

export function mapBackendContractToShared(c: BackendContractDto): SharedContractItem {
  const startStr = c.NgayBatDau ? new Date(c.NgayBatDau).toLocaleDateString("vi-VN") : "";
  const endStr = c.NgayKetThuc ? new Date(c.NgayKetThuc).toLocaleDateString("vi-VN") : "";

  return {
    id: c.MaHopDong,
    plotId: c.MaODat,
    plotCode: c.TenODat || `#PL-${c.MaODat}`,
    farmName: c.TenNongTrai || "Nông trại PlotFarm",
    customerId: c.MaKH,
    customerName: c.TenKH || "Khách hàng",
    assignedFarmerName: c.TenChuNongTrai || "Kỹ sư canh tác PlotFarm",
    plantCrop: c.TenCayTrong || "Cây trồng nông nghiệp",
    startDate: startStr,
    endDate: endStr,
    monthlyFee: Number(c.TongTien) || 3000000,
    status: c.TrangThai === "ACTIVE" ? "ACTIVE" : (c.TrangThai === "COMPLETED" ? "EXPIRED" : "TERMINATED"),
    depositAmount: Number(c.TongTien) * 0.3,
    signedDate: startStr,
  };
}

// ─── Local Storage Keys & Event Dispatcher ────────────────────────────────────
const STORAGE_KEYS = {
  PLOTS: "pf_farmer_plots",
  LOGS: "pf_farmer_logs",
  REQUESTS: "pf_farmer_requests",
  HARVESTS: "pf_farmer_harvests",
  FARMS: "pf_shared_farms",
  CUSTOMERS: "pf_customer_profiles",
  CONTRACTS: "pf_customer_contracts",
};

function getStoredData<T>(key: string, defaultData: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultData));
      return defaultData;
    }
    return JSON.parse(raw) as T;
  } catch {
    return defaultData;
  }
}

function setStoredData<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function notifyDataChanged(eventType: string, detail?: unknown): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("pf_data_changed", {
        detail: { type: eventType, data: detail, timestamp: Date.now() },
      }),
    );
  }
}

// ─── In-memory Cache for Server-Fetched Data ─────────────────────────────────
let cachedFarms: SharedFarmItem[] = [];
let cachedPlots: SharedPlotItem[] = [];
let cachedCrops: BackendCropDto[] = [];
let cachedContracts: SharedContractItem[] = [];

// ─── Customer Service Object ─────────────────────────────────────────────────
export const customerService = {
  // 1. Determine active customer ID from user session or default
  getActiveCustomerId(): string {
    const user = getCurrentUser();
    if (user?.id) return String(user.id);
    return "KH001";
  },

  getAllCustomerProfiles(): Record<string, SharedCustomerProfile> {
    return getStoredData<Record<string, SharedCustomerProfile>>(
      STORAGE_KEYS.CUSTOMERS,
      DEMO_CUSTOMERS,
    );
  },

  getActiveCustomerProfile(customerId?: string): SharedCustomerProfile {
    const user = getCurrentUser();
    const id = customerId || this.getActiveCustomerId();
    const profiles = this.getAllCustomerProfiles();
    const existing = profiles[id];

    if (existing) {
      const isMatching =
        user &&
        (user.id === existing.id ||
          user.username === existing.username ||
          (user.role && user.role.toString().toUpperCase().includes("CUSTOMER")));
      return {
        ...existing,
        name: isMatching && user?.fullName ? user.fullName : existing.name,
        email: isMatching && user?.email ? user.email : existing.email,
      };
    }

    if (user) {
      return {
        id: String(user.id || id),
        username: user.username,
        name: user.fullName || user.username,
        email: user.email,
        phone: (user as unknown as { phone?: string }).phone || "",
        shippingAddress: (user as unknown as { shippingAddress?: string }).shippingAddress || "",
        ownedPlotCodes: [],
        avatarIcon: "👤",
      };
    }

    return DEMO_CUSTOMERS.KH0001;
  },

  switchActiveCustomer(id: string): SharedCustomerProfile {
    const profiles = this.getAllCustomerProfiles();
    const target = profiles[id] || DEMO_CUSTOMERS.KH0001;

    saveAuthSession({
      accessToken: `mock-jwt-token-customer-${Date.now()}`,
      user: {
        id: target.id,
        accountId: target.username,
        username: target.username,
        email: target.email,
        fullName: `${target.name} (Khách Hàng)`,
        role: "CUSTOMER",
        userType: "CUSTOMER",
      },
    });

    notifyDataChanged("customer_switched", { customerId: target.id });
    return target;
  },

  // ─── Task 13: Asynchronous Farm & Plot APIs ────────────────────────────────
  async fetchFarmsAsync(): Promise<SharedFarmItem[]> {
    try {
      const farmsDto = await apiClient.get<BackendFarmDto[]>("/farms");
      if (Array.isArray(farmsDto) && farmsDto.length > 0) {
        cachedFarms = farmsDto.map(mapBackendFarmToShared);
        setStoredData(STORAGE_KEYS.FARMS, cachedFarms);
        return cachedFarms;
      }
    } catch (err) {
      console.warn("Lỗi khi tải danh sách nông trại từ API, sử dụng dữ liệu dự phòng:", err);
    }
    cachedFarms = this.getAllFarms();
    return cachedFarms;
  },

  async fetchFarmDetailAsync(farmId: string): Promise<{ farm: SharedFarmItem; plots: SharedPlotItem[] } | undefined> {
    try {
      // 1. Fetch farm details
      const farmDto = await apiClient.get<BackendFarmDto>(`/farms/${farmId}`);
      const farm = farmDto ? mapBackendFarmToShared(farmDto) : undefined;

      // 2. Fetch plots of this farm
      const plotsDto = await apiClient.get<BackendPlotDto[]>(`/plots?farmId=${farmId}`);
      const plots = Array.isArray(plotsDto) ? plotsDto.map(mapBackendPlotToShared) : [];

      if (farm) {
        return { farm, plots };
      }
    } catch (err) {
      console.warn(`Lỗi khi tải chi tiết nông trại ${farmId} từ API, sử dụng dữ liệu dự phòng:`, err);
    }
    return this.getFarmDetail(farmId);
  },

  async fetchPlotsAsync(farmId?: string): Promise<SharedPlotItem[]> {
    try {
      const url = farmId ? `/plots?farmId=${farmId}` : "/plots";
      const plotsDto = await apiClient.get<BackendPlotDto[]>(url);
      if (Array.isArray(plotsDto)) {
        const mapped = plotsDto.map(mapBackendPlotToShared);
        cachedPlots = mapped;
        return mapped;
      }
    } catch (err) {
      console.warn("Lỗi khi tải danh sách thửa đất từ API:", err);
    }
    return this.getAllPlots();
  },

  async fetchPlotDetailAsync(plotId: string): Promise<SharedPlotItem | undefined> {
    try {
      const plotDto = await apiClient.get<BackendPlotDto>(`/plots/${plotId}`);
      if (plotDto) {
        return mapBackendPlotToShared(plotDto);
      }
    } catch (err) {
      console.warn(`Lỗi khi tải chi tiết thửa đất ${plotId} từ API:`, err);
    }
    return this.getPlotByCode(plotId);
  },

  async fetchCropsAsync(): Promise<BackendCropDto[]> {
    try {
      const crops = await apiClient.get<BackendCropDto[]>("/crops");
      if (Array.isArray(crops)) {
        cachedCrops = crops;
        return crops;
      }
    } catch (err) {
      console.warn("Lỗi khi tải danh mục cây trồng từ API:", err);
    }
    return cachedCrops;
  },

  // ─── Task 14: Asynchronous Contract & Rental APIs ──────────────────────────
  async fetchMyContractsAsync(): Promise<SharedContractItem[]> {
    try {
      const contractsDto = await apiClient.get<BackendContractDto[]>("/contracts/my");
      if (Array.isArray(contractsDto)) {
        cachedContracts = contractsDto.map(mapBackendContractToShared);
        setStoredData(STORAGE_KEYS.CONTRACTS, cachedContracts);
        return cachedContracts;
      }
    } catch (err) {
      console.warn("Lỗi khi tải danh sách hợp đồng của tôi từ API:", err);
    }
    return this.getMyContracts();
  },

  async fetchContractDetailAsync(contractId: string): Promise<SharedContractItem | undefined> {
    try {
      const contractDto = await apiClient.get<BackendContractDto>(`/contracts/${contractId}`);
      if (contractDto) {
        return mapBackendContractToShared(contractDto);
      }
    } catch (err) {
      console.warn(`Lỗi khi tải chi tiết hợp đồng ${contractId}:`, err);
    }
    return undefined;
  },

  async rentPlotAsync(payload: RentPlotPayload): Promise<{ plot: SharedPlotItem; contract: SharedContractItem }> {
    // Determine crop ID (support crop ID or resolve from crop type name)
    let cropId = payload.cropType;
    if (!cropId.startsWith("CT") && cachedCrops.length > 0) {
      const matched = cachedCrops.find(
        (c) => c.TenCayTrong.toLowerCase().includes(payload.cropType.toLowerCase()) ||
               payload.cropType.toLowerCase().includes(c.TenCayTrong.toLowerCase()),
      );
      if (matched) cropId = matched.MaCayTrong;
      else cropId = cachedCrops[0].MaCayTrong;
    } else if (!cropId.startsWith("CT")) {
      cropId = "CT001"; // Default fallback crop ID
    }

    // Call real Backend API: POST /api/v1/contracts
    const responseDto = await apiClient.post<BackendContractDto>("/contracts", {
      maODat: payload.plotId,
      maCayTrong: cropId,
      soThangThue: payload.durationMonths,
    });

    const contract = mapBackendContractToShared(responseDto);

    // Re-fetch plot details to get live server state: TRONG (AVAILABLE) -> DANG_THUE (RENTED)
    let updatedPlot = await this.fetchPlotDetailAsync(payload.plotId);
    if (!updatedPlot) {
      updatedPlot = {
        id: payload.plotId,
        assignedFarmerId: "NV001",
        farmerName: "Lê Văn Canh Tác",
        farmId: "",
        farmName: contract.farmName,
        plotCode: contract.plotCode,
        plotStatus: "IN_USE",
        customerId: contract.customerId,
        customerName: contract.customerName,
        contractId: contract.id,
        plantCrop: contract.plantCrop,
        startDate: contract.startDate,
        endDate: contract.endDate,
        plantStatus: "Đang gieo trồng",
        progress: 5,
        lastUpdate: "Vừa ký hợp đồng",
        areaSquareMeter: 500,
        rentalPricePerMonth: contract.monthlyFee,
        sensorData: {
          moisture: 68,
          temperature: 26,
          soilPh: 6.5,
          lightLux: 15000,
          lastUpdated: "Thời gian thực (IoT)",
        },
        cameraFeedUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=1200&auto=format&fit=crop&q=80",
        plotThumbnail: "https://images.unsplash.com/photo-1592417817098-8f3d6910985b?w=600&auto=format&fit=crop&q=80",
      };
    }

    notifyDataChanged("contract_created", { contract, plot: updatedPlot });
    return { plot: updatedPlot, contract };
  },

  // ─── Synchronous Fallback Methods ──────────────────────────────────────────
  getAllFarms(): SharedFarmItem[] {
    if (cachedFarms.length > 0) return cachedFarms;
    return getStoredData<SharedFarmItem[]>(STORAGE_KEYS.FARMS, INITIAL_SHARED_FARMS);
  },

  getFarmDetail(farmId: string): { farm: SharedFarmItem; plots: SharedPlotItem[] } | undefined {
    const farms = this.getAllFarms();
    const farm = farms.find((f) => f.id === farmId || f.name.toLowerCase().includes(farmId.toLowerCase()));
    if (!farm) return undefined;

    const allPlots = this.getAllPlots();
    const plotsInFarm = allPlots.filter(
      (p) => p.farmId === farm.id || p.farmName.toLowerCase().includes(farm.name.toLowerCase()),
    );

    return { farm, plots: plotsInFarm };
  },

  getAllPlots(): SharedPlotItem[] {
    if (cachedPlots.length > 0) return cachedPlots;
    return getStoredData<SharedPlotItem[]>(
      STORAGE_KEYS.PLOTS,
      INITIAL_FARMER_PLOTS as unknown as SharedPlotItem[],
    );
  },

  getMyPlots(customerId?: string): SharedPlotItem[] {
    const activeCustId = customerId || this.getActiveCustomerId();
    const profile = this.getActiveCustomerProfile(activeCustId);
    const allPlots = this.getAllPlots();

    return allPlots.filter(
      (plot) =>
        plot.customerId === activeCustId ||
        plot.customerName.toLowerCase().includes(profile.name.toLowerCase()) ||
        profile.ownedPlotCodes.includes(plot.plotCode),
    );
  },

  getPlotByCode(plotCode: string): SharedPlotItem | undefined {
    const all = this.getAllPlots();
    return all.find((p) => p.plotCode === plotCode || p.id === plotCode);
  },

  getMyContracts(customerId?: string): SharedContractItem[] {
    if (cachedContracts.length > 0) return cachedContracts;
    const myPlots = this.getMyPlots(customerId);
    const activeProfile = this.getActiveCustomerProfile(customerId);

    return myPlots.map((plot) => ({
      id: plot.contractId || `#HD-2026-${plot.plotCode.replace("#PL-", "")}`,
      plotId: plot.id,
      plotCode: plot.plotCode,
      farmName: plot.farmName,
      customerId: activeProfile.id,
      customerName: activeProfile.name,
      assignedFarmerName: plot.farmerName || "Kỹ sư canh tác PlotFarm",
      plantCrop: plot.plantCrop,
      startDate: plot.startDate || "15/01/2026",
      endDate: plot.endDate || "15/05/2026",
      monthlyFee: plot.rentalPricePerMonth || 3000000,
      status: "ACTIVE",
      depositAmount: (plot.rentalPricePerMonth || 3000000) * 2,
      signedDate: plot.startDate || "15/01/2026",
    }));
  },

  // 4. Farming Logs
  getAllFarmingLogs(): SharedFarmingLogItem[] {
    return getStoredData<SharedFarmingLogItem[]>(
      STORAGE_KEYS.LOGS,
      INITIAL_FARMING_LOGS,
    );
  },

  getMyFarmingLogs(customerId?: string): SharedFarmingLogItem[] {
    const myPlotCodes = new Set(this.getMyPlots(customerId).map((p) => p.plotCode));
    const allLogs = this.getAllFarmingLogs();
    return allLogs.filter((log) => myPlotCodes.has(log.plot));
  },

  // 5. Care Requests
  getAllCareRequests(): SharedCareRequestItem[] {
    return getStoredData<SharedCareRequestItem[]>(
      STORAGE_KEYS.REQUESTS,
      INITIAL_CARE_REQUESTS as unknown as SharedCareRequestItem[],
    );
  },

  getMyCareRequests(customerId?: string): SharedCareRequestItem[] {
    const activeCustId = customerId || this.getActiveCustomerId();
    const profile = this.getActiveCustomerProfile(activeCustId);
    const myPlotCodes = new Set(this.getMyPlots(activeCustId).map((p) => p.plotCode));
    const all = this.getAllCareRequests();

    return all.filter(
      (r) =>
        r.customerId === activeCustId ||
        r.customer.toLowerCase().includes(profile.name.toLowerCase()) ||
        myPlotCodes.has(r.plot),
    );
  },

  createCareRequest(payload: CreateCareRequestPayload): SharedCareRequestItem {
    const profile = this.getActiveCustomerProfile();
    const allRequests = this.getAllCareRequests();

    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(
      2,
      "0",
    )}:${String(now.getMinutes()).padStart(2, "0")}`;

    const randomSuffix = Math.floor(Math.random() * 900) + 100;
    const newRequest: SharedCareRequestItem = {
      id: `REQ-${randomSuffix}`,
      plot: payload.plotCode,
      customerId: profile.id,
      customer: profile.name,
      requestType: payload.requestType,
      description: payload.description.trim(),
      createdDate: dateStr,
      status: "PENDING",
      farmerNote: "",
      evidenceImage: "",
      processedDate: "",
    };

    const updated = [newRequest, ...allRequests];
    setStoredData(STORAGE_KEYS.REQUESTS, updated);

    notifyDataChanged("care_request_created", newRequest);
    return newRequest;
  },

  // 6. Harvests
  getAllHarvests(): SharedHarvestItem[] {
    return getStoredData<SharedHarvestItem[]>(
      STORAGE_KEYS.HARVESTS,
      INITIAL_HARVESTS as unknown as SharedHarvestItem[],
    );
  },

  getMyHarvests(customerId?: string): SharedHarvestItem[] {
    const activeCustId = customerId || this.getActiveCustomerId();
    const profile = this.getActiveCustomerProfile(activeCustId);
    const myPlotCodes = new Set(this.getMyPlots(activeCustId).map((p) => p.plotCode));
    const all = this.getAllHarvests();

    return all.filter(
      (h) =>
        h.customerId === activeCustId ||
        h.customer.toLowerCase().includes(profile.name.toLowerCase()) ||
        myPlotCodes.has(h.plot),
    );
  },

  // 7. KPI Summary
  getKPISummary(customerId?: string): CustomerKPISummary {
    const myPlots = this.getMyPlots(customerId);
    const myRequests = this.getMyCareRequests(customerId);
    const myHarvests = this.getMyHarvests(customerId);

    const totalArea = myPlots.reduce((acc, p) => acc + p.areaSquareMeter, 0);
    const pendingRequests = myRequests.filter((r) => r.status === "PENDING" || r.status === "IN_PROGRESS").length;
    const completedRequests = myRequests.filter((r) => r.status === "COMPLETED").length;
    const upcomingHarvests = myHarvests.filter((h) => h.harvestStatus === "SCHEDULED").length;

    const avgProgress =
      myPlots.length > 0
        ? Math.round(myPlots.reduce((acc, p) => acc + p.progress, 0) / myPlots.length)
        : 0;

    return {
      totalOwnedPlots: myPlots.length,
      totalAreaSquareMeter: totalArea,
      activeContractsCount: myPlots.filter((p) => p.plotStatus === "IN_USE").length,
      pendingCareRequests: pendingRequests,
      completedCareRequests: completedRequests,
      upcomingHarvests: upcomingHarvests,
      averageCropProgress: avgProgress,
    };
  },
};
