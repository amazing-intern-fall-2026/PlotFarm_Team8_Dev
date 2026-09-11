export type PlotStatus = "ACTIVE" | "IN_USE" | "RESTING" | "MAINTENANCE";

export type PlantGrowthStage =
  | "Đang gieo trồng"
  | "Phát triển tốt"
  | "Đang ra hoa"
  | "Chuẩn bị thu hoạch"
  | "Cần chú ý chăm sóc";

export type CareRequestStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANNOT_RESOLVE";
export type HarvestStatus = "SCHEDULED" | "IN_PROGRESS" | "HARVESTED" | "CANCELLED";
export type PackageStatus = "NOT_PACKED" | "PACKED" | "STORAGE_COOL";
export type DeliveryStatus = "WAITING_PICKUP" | "DELIVERING" | "DELIVERED";

export interface PlotSensorData {
  moisture: number;      // % Độ ẩm đất (e.g., 68%)
  temperature: number;   // °C Nhiệt độ (e.g., 28.5)
  soilPh: number;        // pH đất (e.g., 6.5)
  lightLux: number;      // Ánh sáng (lux)
  lastUpdated: string;
}

export interface SharedFarmItem {
  id: string;
  name: string;
  location: string;
  totalArea: string;
  totalAreaNum: number;  // m²
  plotCount: number;
  status: "active" | "inactive";
  description: string;
  createdAt: string;
  imageUrl: string;
  farmerInChargeId: string;
  farmerInChargeName: string;
  specialties: string[];
}

export interface SharedPlotItem {
  id: string;
  assignedFarmerId: string;
  farmerName: string;
  farmId: string;
  farmName: string;
  plotCode: string;
  plotStatus: PlotStatus;
  customerId: string;
  customerName: string;
  contractId: string;
  plantCrop: string;
  startDate: string;
  endDate: string;
  plantStatus: PlantGrowthStage;
  progress: number; // 0 to 100
  lastUpdate: string;
  areaSquareMeter: number;
  rentalPricePerMonth: number; // VND
  sensorData: PlotSensorData;
  cameraFeedUrl: string;
  plotThumbnail: string;
}

export interface SharedContractItem {
  id: string;
  plotId: string;
  plotCode: string;
  farmName: string;
  customerId: string;
  customerName: string;
  assignedFarmerName: string;
  plantCrop: string;
  startDate: string;
  endDate: string;
  monthlyFee: number;
  status: "ACTIVE" | "EXPIRED" | "TERMINATED";
  depositAmount: number;
  signedDate: string;
}

export interface SharedFarmingLogItem {
  id: string;
  plot: string;
  date: string;
  activity: string;
  plantStatus: string;
  description: string;
  imageEvidence?: string;
  createdBy: string;
}

export interface SharedCareRequestItem {
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

export interface SharedHarvestItem {
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

export interface SharedCustomerProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  shippingAddress: string;
  ownedPlotCodes: string[];
  avatarIcon: string;
}

// 4 Chuẩn Nông Trại cốt lõi của hệ thống PlotFarm
export const INITIAL_SHARED_FARMS: SharedFarmItem[] = [
  {
    id: "farm-1",
    name: "Nông trại Thung Lũng Xanh (Lâm Đồng)",
    location: "Đức Trọng, Lâm Đồng",
    totalArea: "25.000 m²",
    totalAreaNum: 25000,
    plotCount: 4,
    status: "active",
    description:
      "Khu vực chuyên canh tác lúa ST25 hữu cơ và rau củ ôn đới công nghệ cao với khí hậu mát mẻ quanh năm, hệ thống tưới nhỏ giọt Israel và trạm đo IoT tự động.",
    createdAt: "12/01/2024",
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80",
    farmerInChargeId: "NV0001",
    farmerInChargeName: "Lê Văn Canh Tác",
    specialties: ["Lúa ST25 Đặc sản", "Cà chua bi hữu cơ", "Dưa lưới nhà màng"],
  },
  {
    id: "farm-2",
    name: "Trang trại Đồi Chè & Cây Ăn Quả (Bảo Lộc)",
    location: "Bảo Lộc, Lâm Đồng",
    totalArea: "18.000 m²",
    totalAreaNum: 18000,
    plotCount: 3,
    status: "active",
    description:
      "Trang trại nông nghiệp sinh thái kết hợp dưa lưới Ichiba Nhật Bản và rau củ thủy canh tuần hoàn, đất đỏ bazan giàu khoáng chất hữu cơ.",
    createdAt: "05/03/2024",
    imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800&auto=format&fit=crop&q=80",
    farmerInChargeId: "NV0001",
    farmerInChargeName: "Lê Văn Canh Tác",
    specialties: ["Dưa lưới Ichiba", "Cải bẹ thủy canh", "Cà phê sạch"],
  },
  {
    id: "farm-3",
    name: "Nông trại Hữu Cơ Củ Chi (TP.HCM)",
    location: "Củ Chi, TP. Hồ Chí Minh",
    totalArea: "15.000 m²",
    totalAreaNum: 15000,
    plotCount: 4,
    status: "active",
    description:
      "Vành đai nông nghiệp sinh học sạch cung cấp rau ăn lá ngắn ngày và quả nhiệt đới, khoảng cách gần trung tâm TP.HCM giúp giao hàng tươi trong ngày sau thu hoạch.",
    createdAt: "18/06/2024",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80",
    farmerInChargeId: "NV0002",
    farmerInChargeName: "Nguyễn Thị Đồng Ruộng",
    specialties: ["Rau muống cao sản", "Rau dền đỏ", "Bầu sao, mướp hương"],
  },
  {
    id: "farm-4",
    name: "Khu Nông Nghiệp Công Nghệ Cao Mê Kông (Tiền Giang)",
    location: "Cái Bè, Tiền Giang",
    totalArea: "30.000 m²",
    totalAreaNum: 30000,
    plotCount: 3,
    status: "active",
    description:
      "Vựa cây ăn trái đặc sản đồng bằng sông Cửu Long ứng dụng cảm biến IoT đo độ mặn và độ ẩm rễ sâu, chuyên Xoài Cát Hòa Lộc và Bưởi Da Xanh xuất khẩu.",
    createdAt: "10/08/2024",
    imageUrl: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&auto=format&fit=crop&q=80",
    farmerInChargeId: "NV0003",
    farmerInChargeName: "Trần Văn Vườn",
    specialties: ["Xoài Cát Hòa Lộc", "Bưởi Da Xanh", "Mít ruột đỏ"],
  },
];

// Danh sách Demo Customers
export const DEMO_CUSTOMERS: Record<string, SharedCustomerProfile> = {
  KH0001: {
    id: "KH0001",
    username: "customer",
    name: "Nguyễn Văn Nông",
    email: "customer@plotfarm.com",
    phone: "0918 888 999",
    shippingAddress: "Số 123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM",
    ownedPlotCodes: ["#PL-0192"],
    avatarIcon: "👨‍💼",
  },
  KH0002: {
    id: "KH0002",
    username: "customer2",
    name: "Trần Thị Mai",
    email: "mai.tran@gmail.com",
    phone: "0909 234 567",
    shippingAddress: "Số 45 Thảo Điền, TP. Thủ Đức, TP.HCM",
    ownedPlotCodes: ["#PL-0205"],
    avatarIcon: "👩‍💼",
  },
  KH0003: {
    id: "KH0003",
    username: "customer3",
    name: "Hoàng Minh Tuấn",
    email: "tuan.hoang@gmail.com",
    phone: "0982 777 666",
    shippingAddress: "Số 88 Lê Lợi, Phường 4, TP. Vũng Tàu",
    ownedPlotCodes: ["#PL-0311"],
    avatarIcon: "🧑‍💻",
  },
};
