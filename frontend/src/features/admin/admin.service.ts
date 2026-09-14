import apiClient from '../../services/api/apiClient';
import type {
  AdminKPIData,
  AdminFarm,
  AdminPlot,
  AdminContract,
  AdminCareRequest,
  AdminHarvest,
  AdminUser,
  CreateFarmPayload,
  UpdateFarmPayload,
  CreatePlotPayload,
  UpdatePlotPayload,
  UpdatePlotSensorPayload,
  UpdateCareRequestPayload,
  CreateHarvestPayload,
  UpdateHarvestStatusPayload,
  UpdateHarvestDeliveryPayload,
} from './admin.types';

function buildUrl(path: string, params?: Record<string, string | undefined>): string {
  if (!params) return path;
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== 'ALL' && v !== ''
  );
  if (filtered.length === 0) return path;
  const query = new URLSearchParams(filtered as [string, string][]).toString();
  return `${path}?${query}`;
}

export const adminService = {
  // ─── 1. KPI Stats ──────────────────────────────────────────────────────────
  async fetchKPI(): Promise<AdminKPIData> {
    return apiClient.get<AdminKPIData>('/admin/kpi');
  },

  // ─── 2. Farms Management ───────────────────────────────────────────────────
  async fetchFarms(status?: string): Promise<AdminFarm[]> {
    const url = buildUrl('/farms', { trangThai: status });
    return apiClient.get<AdminFarm[]>(url);
  },

  async createFarm(payload: CreateFarmPayload): Promise<AdminFarm> {
    return apiClient.post<AdminFarm>('/farms', payload);
  },

  async updateFarm(id: string, payload: UpdateFarmPayload): Promise<AdminFarm> {
    return apiClient.put<AdminFarm>(`/farms/${id}`, payload);
  },

  async deleteFarm(id: string): Promise<void> {
    await apiClient.delete(`/farms/${id}`);
  },

  // ─── 3. Plots Management ───────────────────────────────────────────────────
  async fetchPlots(filters?: { farmId?: string; trangThai?: string }): Promise<AdminPlot[]> {
    const url = buildUrl('/plots', {
      farmId: filters?.farmId,
      trangThai: filters?.trangThai,
    });
    return apiClient.get<AdminPlot[]>(url);
  },

  async createPlot(payload: CreatePlotPayload): Promise<AdminPlot> {
    return apiClient.post<AdminPlot>('/plots', payload);
  },

  async updatePlot(id: string, payload: UpdatePlotPayload): Promise<AdminPlot> {
    return apiClient.put<AdminPlot>(`/plots/${id}`, payload);
  },

  async deletePlot(id: string): Promise<void> {
    await apiClient.delete(`/plots/${id}`);
  },

  async updatePlotSensor(id: string, sensorData: UpdatePlotSensorPayload): Promise<AdminPlot> {
    return apiClient.patch<AdminPlot>(`/plots/${id}/sensor`, sensorData);
  },

  // ─── 4. Contracts Management ───────────────────────────────────────────────
  async fetchContracts(filters?: {
    trangThai?: string;
    farmId?: string;
    customerId?: string;
  }): Promise<AdminContract[]> {
    const url = buildUrl('/contracts', {
      trangThai: filters?.trangThai,
      farmId: filters?.farmId,
      customerId: filters?.customerId,
    });

    const contracts = await apiClient.get<any[]>(url);
    return (contracts || []).map((c: any) => ({
      ...c,
      depositAmount: Number(c.TongTien || 0) * 0.3,
    }));
  },

  async updateContractStatus(
    id: string,
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  ): Promise<AdminContract> {
    return apiClient.patch<AdminContract>(`/contracts/${id}/status`, { status });
  },

  // ─── 5. Care Requests Management ───────────────────────────────────────────
  async fetchCareRequests(filters?: {
    trangThai?: string;
    contractId?: string;
    plotId?: string;
    customerId?: string;
  }): Promise<AdminCareRequest[]> {
    const url = buildUrl('/care-requests', {
      trangThai: filters?.trangThai,
      contractId: filters?.contractId,
      plotId: filters?.plotId,
      customerId: filters?.customerId,
    });
    return apiClient.get<AdminCareRequest[]>(url);
  },

  async updateCareRequestStatus(
    id: string,
    payload: UpdateCareRequestPayload
  ): Promise<AdminCareRequest> {
    return apiClient.patch<AdminCareRequest>(`/care-requests/${id}/status`, payload);
  },

  // ─── 6. Harvest & Delivery Management ──────────────────────────────────────
  async fetchHarvests(filters?: {
    contractId?: string;
    status?: string;
    trangThaiDongGoi?: string;
    trangThaiGiaoHang?: string;
  }): Promise<AdminHarvest[]> {
    const url = buildUrl('/harvests', {
      contractId: filters?.contractId,
      status: filters?.status,
      trangThaiDongGoi: filters?.trangThaiDongGoi,
      trangThaiGiaoHang: filters?.trangThaiGiaoHang,
    });
    return apiClient.get<AdminHarvest[]>(url);
  },

  async createHarvest(payload: CreateHarvestPayload): Promise<AdminHarvest> {
    return apiClient.post<AdminHarvest>('/harvests', payload);
  },

  async updateHarvestStatus(
    id: string,
    payload: UpdateHarvestStatusPayload
  ): Promise<AdminHarvest> {
    return apiClient.patch<AdminHarvest>(`/harvests/${id}/status`, payload);
  },

  async updateHarvestDelivery(
    id: string,
    payload: UpdateHarvestDeliveryPayload
  ): Promise<AdminHarvest> {
    return apiClient.patch<AdminHarvest>(`/harvests/${id}/delivery`, payload);
  },

  // ─── 7. Users Management ───────────────────────────────────────────────────
  async fetchUsers(filters?: { role?: string; status?: string }): Promise<AdminUser[]> {
    const url = buildUrl('/admin/users', {
      role: filters?.role,
      status: filters?.status,
    });
    return apiClient.get<AdminUser[]>(url);
  },

  async updateUserStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<AdminUser> {
    return apiClient.patch<AdminUser>(`/admin/users/${id}/status`, { status });
  },

  // Customer History Lookup
  async fetchCustomerHistory(customerId: string): Promise<{
    contracts: AdminContract[];
    careRequests: AdminCareRequest[];
  }> {
    const [contracts, careRequests] = await Promise.all([
      adminService.fetchContracts({ customerId }),
      adminService.fetchCareRequests({ customerId }),
    ]);
    return { contracts, careRequests };
  },
};
