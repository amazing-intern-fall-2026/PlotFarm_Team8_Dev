import {
  INITIAL_CARE_REQUESTS,
  INITIAL_FARMER_PLOTS,
  INITIAL_HARVESTS,
  INITIAL_FARMING_LOGS,
  MOCK_FARMER_PROFILES,
} from "./farmer.mock";
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
import { getCurrentUser, saveAuthSession, DEMO_ACCOUNTS, type DemoRoleKey } from "../auth/auth.api";

const STORAGE_KEYS = {
  PLOTS: "pf_farmer_plots",
  LOGS: "pf_farmer_logs",
  REQUESTS: "pf_farmer_requests",
  HARVESTS: "pf_farmer_harvests",
  PROFILES: "pf_farmer_profiles",
};

// Generic storage helpers
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

export const farmerService = {
  // Determine active farmer ID from current session
  getActiveFarmerId(): string {
    const user = getCurrentUser();
    if (user?.id && (user.id === "NV0001" || user.id === "NV0002" || user.id === "NV0003")) {
      return user.id;
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

    const uniqueFarms = new Set(plots.map((p) => p.farmName)).size;
    const cultivatingPlots = plots.filter((p) => p.plotStatus === "IN_USE" || p.plotStatus === "ACTIVE").length;
    const careRequestsPending = requests.filter((r) => r.status === "PENDING" || r.status === "IN_PROGRESS").length;
    const harvestPending = harvests.filter((h) => h.harvestStatus === "SCHEDULED" || h.harvestStatus === "IN_PROGRESS").length;
    const attentionIssues = plots.filter((p) => p.plantStatus === "Cần chú ý chăm sóc").length;

    return {
      totalFarms: uniqueFarms,
      totalAssignedPlots: plots.length,
      cultivatingPlots,
      careRequestsPending,
      harvestPending,
      attentionIssues: attentionIssues + requests.filter((r) => r.status === "CANNOT_RESOLVE").length,
    };
  },

  // 2. Plots - RULE UI: Farmer chỉ thấy và thao tác trên Farm/Plot được Admin phân công
  getAllPlots(): FarmerPlotItem[] {
    return getStoredData<FarmerPlotItem[]>(STORAGE_KEYS.PLOTS, INITIAL_FARMER_PLOTS);
  },

  getPlots(farmerId?: string): FarmerPlotItem[] {
    const activeFarmerId = farmerId || this.getActiveFarmerId();
    const allPlots = this.getAllPlots();
    return allPlots.filter((p) => p.assignedFarmerId === activeFarmerId);
  },

  updatePlot(plotId: string, progress: number, plantStatus: PlantGrowthStage): FarmerPlotItem {
    const allPlots = this.getAllPlots();
    const index = allPlots.findIndex((p) => p.id === plotId);
    if (index === -1) throw new Error("Không tìm thấy thửa ruộng.");

    const now = new Date();
    const timeStr = `Hôm nay ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    allPlots[index] = {
      ...allPlots[index],
      progress,
      plantStatus,
      lastUpdate: timeStr,
    };

    setStoredData(STORAGE_KEYS.PLOTS, allPlots);
    return allPlots[index];
  },

  // 3. Farming Logs - Filtered by assigned plots
  getAllFarmingLogs(): FarmingLogItem[] {
    return getStoredData<FarmingLogItem[]>(STORAGE_KEYS.LOGS, INITIAL_FARMING_LOGS);
  },

  getFarmingLogs(farmerId?: string): FarmingLogItem[] {
    const activeFarmerId = farmerId || this.getActiveFarmerId();
    const assignedPlotCodes = new Set(this.getPlots(activeFarmerId).map((p) => p.plotCode));
    const allLogs = this.getAllFarmingLogs();
    return allLogs.filter((l) => assignedPlotCodes.has(l.plot));
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
    setStoredData(STORAGE_KEYS.LOGS, updated);
    return newLog;
  },

  // 4. Care Requests - Filtered by assigned plots
  getAllCareRequests(): CareRequestItem[] {
    return getStoredData<CareRequestItem[]>(STORAGE_KEYS.REQUESTS, INITIAL_CARE_REQUESTS);
  },

  getCareRequests(farmerId?: string): CareRequestItem[] {
    const activeFarmerId = farmerId || this.getActiveFarmerId();
    const assignedPlotCodes = new Set(this.getPlots(activeFarmerId).map((p) => p.plotCode));
    const allRequests = this.getAllCareRequests();
    return allRequests.filter((r) => assignedPlotCodes.has(r.plot));
  },

  updateCareRequest(
    requestId: string,
    updates: {
      status: CareRequestStatus;
      farmerNote?: string;
      evidenceImage?: string;
    },
  ): CareRequestItem {
    const allRequests = this.getAllCareRequests();
    const index = allRequests.findIndex((r) => r.id === requestId);
    if (index === -1) throw new Error("Không tìm thấy yêu cầu chăm sóc.");

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

    setStoredData(STORAGE_KEYS.REQUESTS, allRequests);
    return allRequests[index];
  },

  // 5. Harvests - Filtered by assigned plots
  getAllHarvests(): HarvestItem[] {
    return getStoredData<HarvestItem[]>(STORAGE_KEYS.HARVESTS, INITIAL_HARVESTS);
  },

  getHarvests(farmerId?: string): HarvestItem[] {
    const activeFarmerId = farmerId || this.getActiveFarmerId();
    const assignedPlotCodes = new Set(this.getPlots(activeFarmerId).map((p) => p.plotCode));
    const allHarvests = this.getAllHarvests();
    return allHarvests.filter((h) => assignedPlotCodes.has(h.plot));
  },

  updateHarvest(harvestId: string, updates: Partial<HarvestItem>): HarvestItem {
    const allHarvests = this.getAllHarvests();
    const index = allHarvests.findIndex((h) => h.id === harvestId);
    if (index === -1) throw new Error("Không tìm thấy thông tin thu hoạch.");

    allHarvests[index] = {
      ...allHarvests[index],
      ...updates,
    };

    setStoredData(STORAGE_KEYS.HARVESTS, allHarvests);
    return allHarvests[index];
  },

  // 6. Farmer Profiles
  getAllProfiles(): Record<string, FarmerProfileData> {
    return getStoredData<Record<string, FarmerProfileData>>(
      STORAGE_KEYS.PROFILES,
      MOCK_FARMER_PROFILES,
    );
  },

  getFarmerProfile(farmerId?: string): FarmerProfileData {
    const activeFarmerId = farmerId || this.getActiveFarmerId();
    const profiles = this.getAllProfiles();
    const defaultProfile = MOCK_FARMER_PROFILES[activeFarmerId] || MOCK_FARMER_PROFILES.NV0001;
    const current = profiles[activeFarmerId] || defaultProfile;

    // Dynamically calculate assigned farms and count to keep 100% consistent with Admin assignment
    const plots = this.getPlots(activeFarmerId);
    const assignedFarms = Array.from(new Set(plots.map((p) => p.farmName)));

    return {
      ...current,
      assignedFarms: assignedFarms.length > 0 ? assignedFarms : current.assignedFarms,
      assignedPlotCount: plots.length,
    };
  },

  updateFarmerProfile(updates: Partial<FarmerProfileData>, farmerId?: string): FarmerProfileData {
    const activeFarmerId = farmerId || this.getActiveFarmerId();
    const profiles = this.getAllProfiles();
    const current = this.getFarmerProfile(activeFarmerId);

    const updated = {
      ...current,
      ...updates,
    };

    profiles[activeFarmerId] = updated;
    setStoredData(STORAGE_KEYS.PROFILES, profiles);
    return updated;
  },

  // Switch demo farmer for instant UI testing
  switchActiveFarmer(targetFarmerId: "NV0001" | "NV0002" | "NV0003"): FarmerProfileData {
    const roleKeyMap: Record<string, DemoRoleKey> = {
      NV0001: "farmer1",
      NV0002: "farmer2",
      NV0003: "farmer3",
    };
    const demoUser = DEMO_ACCOUNTS[roleKeyMap[targetFarmerId]] || DEMO_ACCOUNTS.farmer;
    saveAuthSession({
      accessToken: `mock-jwt-token-farmer-${Date.now()}`,
      user: demoUser,
    });

    const profile = this.getFarmerProfile(targetFarmerId);
    // Dispatch custom browser event to notify all active views to re-read service data
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("pf_farmer_changed", { detail: { farmerId: targetFarmerId } }));
    }
    return profile;
  },

  getAvailableDemoFarmers(): FarmerProfileData[] {
    const profiles = this.getAllProfiles();
    return Object.keys(MOCK_FARMER_PROFILES).map((id) => {
      const p = profiles[id] || MOCK_FARMER_PROFILES[id];
      const plots = this.getPlots(id);
      return {
        ...p,
        assignedFarms: Array.from(new Set(plots.map((x) => x.farmName))),
        assignedPlotCount: plots.length,
      };
    });
  },
};

