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

export const customerService = {
  // 1. Determine active customer ID from user session or default
  getActiveCustomerId(): string {
    const user = getCurrentUser();
    if (user?.id && (user.id === "KH0001" || user.id === "KH0002" || user.id === "KH0003")) {
      return user.id;
    }
    const username = (user?.username || "").toLowerCase();
    if (username.includes("customer3") || username.includes("tuan")) return "KH0003";
    if (username.includes("customer2") || username.includes("mai")) return "KH0002";
    return "KH0001"; // Nguyễn Văn Nông
  },

  getAllCustomerProfiles(): Record<string, SharedCustomerProfile> {
    return getStoredData<Record<string, SharedCustomerProfile>>(
      STORAGE_KEYS.CUSTOMERS,
      DEMO_CUSTOMERS,
    );
  },

  getActiveCustomerProfile(customerId?: string): SharedCustomerProfile {
    const id = customerId || this.getActiveCustomerId();
    const profiles = this.getAllCustomerProfiles();
    return profiles[id] || DEMO_CUSTOMERS.KH0001;
  },

  getAvailableDemoCustomers(): SharedCustomerProfile[] {
    const profiles = this.getAllCustomerProfiles();
    return Object.values(profiles);
  },

  switchActiveCustomer(id: string): SharedCustomerProfile {
    const profiles = this.getAllCustomerProfiles();
    const target = profiles[id] || DEMO_CUSTOMERS.KH0001;

    // Update authUser session in auth.api to seamlessly match
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

  // 2. Plots owned / rented by Customer
  getAllPlots(): SharedPlotItem[] {
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
    return all.find((p) => p.plotCode === plotCode);
  },

  // 3. Contracts
  getMyContracts(customerId?: string): SharedContractItem[] {
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

  // 4. Farming Logs updated by Farmer for Customer's plots
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

  // 5. Care Requests (Customer creates -> Farmer receives & resolves)
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

    // Instant bi-directional notification to all views
    notifyDataChanged("care_request_created", newRequest);
    return newRequest;
  },

  // 6. Harvests (Customer views crop yields & delivery tracking)
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

  // 7. Farms (Shared standard 4 farms)
  getAllFarms(): SharedFarmItem[] {
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

  // 8. Rent an available plot (Customer rents plot -> assigned to Customer & Farmer)
  rentPlot(payload: RentPlotPayload): { plot: SharedPlotItem; contract: SharedContractItem } {
    const activeProfile = this.getActiveCustomerProfile();
    const allPlots = this.getAllPlots();
    const index = allPlots.findIndex((p) => p.id === payload.plotId || p.plotCode === payload.plotId);

    if (index === -1) {
      throw new Error("Không tìm thấy thửa đất để thuê.");
    }

    const plot = allPlots[index];
    if (plot.plotStatus === "IN_USE") {
      throw new Error("Thửa đất này hiện đang được canh tác bởi khách hàng khác.");
    }

    const now = new Date();
    const startDateStr = `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}/${now.getFullYear()}`;

    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + payload.durationMonths);
    const endDateStr = `${String(endDate.getDate()).padStart(2, "0")}/${String(
      endDate.getMonth() + 1,
    ).padStart(2, "0")}/${endDate.getFullYear()}`;

    const contractCode = `#HD-2026-${Math.floor(Math.random() * 900) + 100}`;

    const updatedPlot: SharedPlotItem = {
      ...plot,
      plotStatus: "IN_USE",
      customerId: activeProfile.id,
      customerName: activeProfile.name,
      contractId: contractCode,
      plantCrop: payload.cropType,
      startDate: startDateStr,
      endDate: endDateStr,
      plantStatus: "Đang gieo trồng",
      progress: 5,
      lastUpdate: "Vừa ký hợp đồng",
    };

    allPlots[index] = updatedPlot;
    setStoredData(STORAGE_KEYS.PLOTS, allPlots);

    // Update customer's ownedPlotCodes in profile
    const allProfiles = this.getAllCustomerProfiles();
    if (allProfiles[activeProfile.id]) {
      allProfiles[activeProfile.id] = {
        ...allProfiles[activeProfile.id],
        ownedPlotCodes: Array.from(new Set([...allProfiles[activeProfile.id].ownedPlotCodes, plot.plotCode])),
      };
      setStoredData(STORAGE_KEYS.CUSTOMERS, allProfiles);
    }

    // Add initial farming log from farmer
    const logNowStr = `${String(now.getDate()).padStart(2, "0")}/${String(
      now.getMonth() + 1,
    ).padStart(2, "0")}/${now.getFullYear()}`;
    const allLogs = this.getAllFarmingLogs();
    const initialLog: SharedFarmingLogItem = {
      id: `log-${Date.now()}`,
      plot: plot.plotCode,
      date: logNowStr,
      activity: "Tiếp nhận canh tác",
      plantStatus: "Đang làm đất và xuống giống",
      description: `Tiếp nhận hợp đồng ${contractCode} từ khách hàng ${activeProfile.name}. Kỹ sư ${plot.farmerName || "nông dân"} bắt đầu cày xới, bón lót hữu cơ và xuống giống ${payload.cropType}.`,
      createdBy: `${plot.farmerName || "Kỹ sư canh tác"} (Nông Dân)`,
    };
    setStoredData(STORAGE_KEYS.LOGS, [initialLog, ...allLogs]);

    const newContract: SharedContractItem = {
      id: contractCode,
      plotId: plot.id,
      plotCode: plot.plotCode,
      farmName: plot.farmName,
      customerId: activeProfile.id,
      customerName: activeProfile.name,
      assignedFarmerName: plot.farmerName || "Kỹ sư canh tác",
      plantCrop: payload.cropType,
      startDate: startDateStr,
      endDate: endDateStr,
      monthlyFee: plot.rentalPricePerMonth || 2500000,
      status: "ACTIVE",
      depositAmount: (plot.rentalPricePerMonth || 2500000) * 2,
      signedDate: startDateStr,
    };

    notifyDataChanged("plot_rented", { plot: updatedPlot, contract: newContract });
    return { plot: updatedPlot, contract: newContract };
  },

  // 9. KPI Summary for Customer Dashboard
  getKPISummary(customerId?: string): CustomerKPISummary {
    const myPlots = this.getMyPlots(customerId);
    const myRequests = this.getMyCareRequests(customerId);
    const myHarvests = this.getMyHarvests(customerId);

    const totalArea = myPlots.reduce((acc, p) => acc + (p.areaSquareMeter || 0), 0);
    const avgProgress =
      myPlots.length > 0
        ? Math.round(myPlots.reduce((acc, p) => acc + (p.progress || 0), 0) / myPlots.length)
        : 0;

    return {
      totalOwnedPlots: myPlots.length,
      totalAreaSquareMeter: totalArea,
      activeContractsCount: myPlots.filter((p) => p.plotStatus === "IN_USE").length,
      pendingCareRequests: myRequests.filter((r) => r.status === "PENDING" || r.status === "IN_PROGRESS").length,
      completedCareRequests: myRequests.filter((r) => r.status === "COMPLETED").length,
      upcomingHarvests: myHarvests.filter((h) => h.harvestStatus === "SCHEDULED").length,
      averageCropProgress: avgProgress,
    };
  },
};
