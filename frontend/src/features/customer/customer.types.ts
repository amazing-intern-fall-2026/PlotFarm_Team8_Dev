import type {
  CareRequestStatus,
  HarvestStatus,
  PackageStatus,
  DeliveryStatus,
  PlantGrowthStage,
  PlotSensorData,
  PlotStatus,
  SharedCareRequestItem,
  SharedContractItem,
  SharedCustomerProfile,
  SharedFarmItem,
  SharedFarmingLogItem,
  SharedHarvestItem,
  SharedPlotItem,
} from "../shared/sharedDomain";

export type CustomerTab =
  | "dashboard"
  | "plots"
  | "logs"
  | "requests"
  | "harvest"
  | "farms";

export interface CustomerKPISummary {
  totalOwnedPlots: number;
  totalAreaSquareMeter: number;
  activeContractsCount: number;
  pendingCareRequests: number;
  completedCareRequests: number;
  upcomingHarvests: number;
  averageCropProgress: number;
}

export interface CreateCareRequestPayload {
  plotCode: string;
  requestType: string;
  description: string;
}

export interface RentPlotPayload {
  plotId: string;
  cropType: string;
  durationMonths: number;
  specialRequest?: string;
}

export type {
  CareRequestStatus,
  HarvestStatus,
  PackageStatus,
  DeliveryStatus,
  PlantGrowthStage,
  PlotSensorData,
  PlotStatus,
  SharedCareRequestItem,
  SharedContractItem,
  SharedCustomerProfile,
  SharedFarmItem,
  SharedFarmingLogItem,
  SharedHarvestItem,
  SharedPlotItem,
};

/**
 * Loại bỏ dấu '#' khỏi mã để hiển thị giao diện đồng bộ, sạch sẽ
 * Ví dụ: '#PL-0192' -> 'PL-0192', '#REQ-102' -> 'REQ-102'
 */
export function cleanCode(code: string | number | undefined | null): string {
  if (code === undefined || code === null) return "";
  return String(code).replace(/#/g, "").trim();
}
