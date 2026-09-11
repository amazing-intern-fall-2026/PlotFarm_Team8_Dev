export type PlotStatus = "ACTIVE" | "IN_USE" | "RESTING" | "MAINTENANCE";

export type PlantGrowthStage =
  | "Đang gieo trồng"
  | "Phát triển tốt"
  | "Đang ra hoa"
  | "Chuẩn bị thu hoạch"
  | "Cần chú ý chăm sóc";

export interface FarmerPlotItem {
  id: string;
  assignedFarmerId: string; // ID of the farmer assigned by Admin (e.g., NV0001, NV0002)
  farmerName?: string;
  farmId?: string;
  farmName: string;
  plotCode: string;
  plotStatus: PlotStatus;
  customerId?: string;
  customerName: string;
  contractId: string;
  plantCrop: string;
  startDate: string;
  endDate: string;
  plantStatus: PlantGrowthStage;
  progress: number; // 0 to 100
  lastUpdate: string;
  areaSquareMeter: number;
  rentalPricePerMonth?: number;
  sensorData?: {
    moisture: number;
    temperature: number;
    soilPh: number;
    lightLux: number;
    lastUpdated: string;
  };
  cameraFeedUrl?: string;
  plotThumbnail?: string;
}

export interface FarmingLogItem {
  id: string;
  plot: string;
  date: string;
  activity: string;
  plantStatus: string;
  description: string;
  imageEvidence?: string;
  createdBy: string;
}

export type CareRequestStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANNOT_RESOLVE";

export interface CareRequestItem {
  id: string;
  plot: string;
  customer: string;
  customerId?: string;
  requestType: string;
  description: string;
  createdDate: string;
  status: CareRequestStatus;
  farmerNote?: string;
  evidenceImage?: string;
  processedDate?: string;
}

export type HarvestStatus = "SCHEDULED" | "IN_PROGRESS" | "HARVESTED" | "CANCELLED";
export type PackageStatus = "NOT_PACKED" | "PACKED" | "STORAGE_COOL";
export type DeliveryStatus = "WAITING_PICKUP" | "DELIVERING" | "DELIVERED";

export interface HarvestItem {
  id: string;
  plot: string;
  customer: string;
  customerId?: string;
  plantCrop: string;
  expectedHarvestDate: string;
  actualHarvestDate?: string;
  expectedQuantity: string;
  actualQuantity?: string;
  harvestStatus: HarvestStatus;
  note?: string;
  packageStatus: PackageStatus;
  deliveryStatus: DeliveryStatus;
  deliveryAddress?: string;
  trackingCode?: string;
}

export interface FarmerProfileData {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  assignedFarms: string[];
  assignedPlotCount: number;
  bio?: string;
  joinedDate?: string;
  specialties?: string[];
  roleTitle?: string;
  avatarIcon?: string;
}

export interface FarmerKPISummary {
  totalFarms: number;
  totalAssignedPlots: number;
  cultivatingPlots: number;
  careRequestsPending: number;
  harvestPending: number;
  attentionIssues: number;
}
