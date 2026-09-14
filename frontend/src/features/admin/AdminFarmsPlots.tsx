import { useState, useEffect } from 'react';
import { Button, Badge, Modal, Input, Spinner, Alert, Card } from '../../components/ui';
import { adminService } from './admin.service';
import type { AdminFarm, AdminPlot, AdminUser } from './admin.types';

export default function AdminFarmsPlots() {
  const [activeSubTab, setActiveSubTab] = useState<'farms' | 'plots'>('farms');

  // Farms state
  const [farms, setFarms] = useState<AdminFarm[]>([]);
  const [farmFilterStatus, setFarmFilterStatus] = useState<string>('ALL');
  const [isFarmsLoading, setIsFarmsLoading] = useState(false);

  // Plots state
  const [plots, setPlots] = useState<AdminPlot[]>([]);
  const [plotFilterFarm, setPlotFilterFarm] = useState<string>('ALL');
  const [plotFilterStatus, setPlotFilterStatus] = useState<string>('ALL');
  const [isPlotsLoading, setIsPlotsLoading] = useState(false);

  // Farmers list for assignment
  const [farmers, setFarmers] = useState<AdminUser[]>([]);

  // Modals state
  const [farmModalMode, setFarmModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingFarm, setEditingFarm] = useState<AdminFarm | null>(null);
  const [farmForm, setFarmForm] = useState({
    TenNongTrai: '',
    DiaChi: '',
    MaChuNongTrai: '',
    TrangThai: 'APPROVED' as 'APPROVED' | 'PENDING' | 'INACTIVE',
  });

  const [plotModalMode, setPlotModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingPlot, setEditingPlot] = useState<AdminPlot | null>(null);
  const [plotForm, setPlotForm] = useState({
    MaNongTrai: '',
    TenODat: '',
    DienTich: 50,
    GiaThue: 2500000,
    CameraUrl: '',
    HinhAnhThumbnail: '',
    TrangThai: 'TRONG' as 'TRONG' | 'DANG_THUE' | 'BAO_TRI',
  });

  const [sensorModalPlot, setSensorModalPlot] = useState<AdminPlot | null>(null);
  const [sensorForm, setSensorForm] = useState({
    DoAmDat: 65,
    NhietDo: 27,
    DoPH: 6.5,
    AnhSangLux: 8500,
  });

  const [deleteTarget, setDeleteTarget] = useState<{ type: 'farm' | 'plot'; id: string; name: string } | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Initial Data
  useEffect(() => {
    loadFarms();
    loadFarmers();
    loadPlots();
  }, []);

  async function loadFarmers() {
    try {
      const users = await adminService.fetchUsers({ role: 'FARMER' });
      setFarmers(users);
    } catch (e) {
      console.error('Failed to load farmers list:', e);
    }
  }

  async function loadFarms() {
    try {
      setIsFarmsLoading(true);
      const data = await adminService.fetchFarms(farmFilterStatus);
      setFarms(data);
    } catch (err: any) {
      console.error('Failed to fetch farms:', err);
      setActionError(err?.response?.data?.message || 'Không thể tải danh sách nông trại');
    } finally {
      setIsFarmsLoading(false);
    }
  }

  async function loadPlots() {
    try {
      setIsPlotsLoading(true);
      const data = await adminService.fetchPlots({
        farmId: plotFilterFarm,
        trangThai: plotFilterStatus,
      });
      setPlots(data);
    } catch (err: any) {
      console.error('Failed to fetch plots:', err);
      setActionError(err?.response?.data?.message || 'Không thể tải danh sách ô đất');
    } finally {
      setIsPlotsLoading(false);
    }
  }

  useEffect(() => {
    loadFarms();
  }, [farmFilterStatus]);

  useEffect(() => {
    loadPlots();
  }, [plotFilterFarm, plotFilterStatus]);

  function formatVND(val: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  }

  // Farm Actions
  function openCreateFarmModal() {
    setActionError(null);
    setFarmForm({
      TenNongTrai: '',
      DiaChi: '',
      MaChuNongTrai: farmers[0]?.id || '',
      TrangThai: 'APPROVED',
    });
    setEditingFarm(null);
    setFarmModalMode('create');
  }

  function openEditFarmModal(farm: AdminFarm) {
    setActionError(null);
    setEditingFarm(farm);
    setFarmForm({
      TenNongTrai: farm.TenNongTrai,
      DiaChi: farm.DiaChi,
      MaChuNongTrai: farm.MaChuNongTrai || '',
      TrangThai: farm.TrangThai || 'APPROVED',
    });
    setFarmModalMode('edit');
  }

  async function handleSaveFarm(e: React.FormEvent) {
    e.preventDefault();
    if (!farmForm.TenNongTrai.trim() || !farmForm.DiaChi.trim()) {
      setActionError('Vui lòng nhập tên nông trại và địa chỉ');
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);
      if (farmModalMode === 'create') {
        await adminService.createFarm(farmForm);
        setActionSuccess('Tạo nông trại mới thành công');
      } else if (editingFarm) {
        await adminService.updateFarm(editingFarm.MaNongTrai, farmForm);
        setActionSuccess('Cập nhật thông tin nông trại thành công');
      }
      setFarmModalMode(null);
      await loadFarms();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu nông trại');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Plot Actions
  function openCreatePlotModal() {
    setActionError(null);
    setPlotForm({
      MaNongTrai: farms[0]?.MaNongTrai || '',
      TenODat: '',
      DienTich: 50,
      GiaThue: 2500000,
      CameraUrl: '',
      HinhAnhThumbnail: '',
      TrangThai: 'TRONG',
    });
    setEditingPlot(null);
    setPlotModalMode('create');
  }

  function openEditPlotModal(plot: AdminPlot) {
    setActionError(null);
    setEditingPlot(plot);
    setPlotForm({
      MaNongTrai: plot.MaNongTrai,
      TenODat: plot.TenODat,
      DienTich: plot.DienTich,
      GiaThue: plot.GiaThue,
      CameraUrl: plot.CameraUrl || '',
      HinhAnhThumbnail: plot.HinhAnhThumbnail || '',
      TrangThai: plot.TrangThai,
    });
    setPlotModalMode('edit');
  }

  async function handleSavePlot(e: React.FormEvent) {
    e.preventDefault();
    if (!plotForm.TenODat.trim() || !plotForm.MaNongTrai) {
      setActionError('Vui lòng nhập tên ô đất và chọn nông trại');
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);
      if (plotModalMode === 'create') {
        await adminService.createPlot(plotForm);
        setActionSuccess('Tạo ô đất mới thành công');
      } else if (editingPlot) {
        await adminService.updatePlot(editingPlot.MaODat, plotForm);
        setActionSuccess('Cập nhật ô đất thành công');
      }
      setPlotModalMode(null);
      await loadPlots();
      await loadFarms();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu ô đất');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Sensor Action
  function openSensorModal(plot: AdminPlot) {
    setActionError(null);
    setSensorModalPlot(plot);
    setSensorForm({
      DoAmDat: plot.DoAmDat ?? 65,
      NhietDo: plot.NhietDo ?? 27,
      DoPH: plot.DoPH ?? 6.5,
      AnhSangLux: plot.AnhSangLux ?? 8500,
    });
  }

  async function handleSaveSensor(e: React.FormEvent) {
    e.preventDefault();
    if (!sensorModalPlot) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      await adminService.updatePlotSensor(sensorModalPlot.MaODat, sensorForm);
      setActionSuccess(`Cập nhật thông số cảm biến ô đất ${sensorModalPlot.TenODat} thành công`);
      setSensorModalPlot(null);
      await loadPlots();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Có lỗi khi cập nhật cảm biến');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Delete Action
  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      setIsSubmitting(true);
      setActionError(null);
      if (deleteTarget.type === 'farm') {
        await adminService.deleteFarm(deleteTarget.id);
        setActionSuccess(`Đã xóa nông trại ${deleteTarget.name}`);
        await loadFarms();
      } else {
        await adminService.deletePlot(deleteTarget.id);
        setActionSuccess(`Đã xóa ô đất ${deleteTarget.name}`);
        await loadPlots();
        await loadFarms();
      }
      setDeleteTarget(null);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Không thể xóa do liên kết dữ liệu hoặc hợp đồng');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {actionSuccess && (
        <Alert variant="success" title="Thành công">
          {actionSuccess}
        </Alert>
      )}
      {actionError && (
        <Alert variant="error" title="Lỗi xử lý">
          {actionError}
        </Alert>
      )}


      {/* Sub-tabs Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('farms')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'farms'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>🏡</span> Quản lý Nông trại ({farms.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('plots')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'plots'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            <span>🌱</span> Quản lý Thửa đất ({plots.length})
          </button>
        </div>

        <div>
          {activeSubTab === 'farms' ? (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
              onClick={openCreateFarmModal}
            >
              + Thêm Nông Trại Mới
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
              onClick={openCreatePlotModal}
            >
              + Thêm Ô Đất Mới
            </Button>
          )}
        </div>
      </div>

      {/* ===================== SUBTAB 1: FARMS LIST ===================== */}
      {activeSubTab === 'farms' && (
        <Card>
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Danh sách các cơ sở Nông trại</h3>
              <p className="text-xs text-gray-500">Phân công nông dân phụ trách và kiểm soát diện tích canh tác</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Trạng thái:</span>
              <select
                value={farmFilterStatus}
                onChange={(e) => setFarmFilterStatus(e.target.value)}
                className="text-xs rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 focus:outline-indigo-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="APPROVED">Đã phê duyệt (APPROVED)</option>
                <option value="PENDING">Chờ duyệt (PENDING)</option>
                <option value="INACTIVE">Ngừng hoạt động</option>
              </select>
            </div>
          </div>

          {isFarmsLoading ? (
            <div className="p-12 text-center">
              <Spinner size="md" className="text-indigo-600 mx-auto" />
              <p className="text-xs text-gray-500 mt-2 font-medium">Đang tải nông trại...</p>
            </div>
          ) : farms.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              Không tìm thấy nông trại nào phù hợp bộ lọc.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Mã & Tên Nông Trại</th>
                    <th className="px-5 py-3">Địa chỉ</th>
                    <th className="px-5 py-3">Nông dân phụ trách (Assignee)</th>
                    <th className="px-5 py-3">Số ô đất</th>
                    <th className="px-5 py-3">Tổng diện tích</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {farms.map((f) => (
                    <tr key={f.MaNongTrai} className="hover:bg-gray-50/70 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-gray-900 block">{f.TenNongTrai}</span>
                        <span className="text-2xs text-gray-400 font-mono">{f.MaNongTrai}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 max-w-[200px] truncate">{f.DiaChi}</td>
                      <td className="px-5 py-3.5">
                        {f.TenChuNongTrai ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-2xs">
                              FM
                            </span>
                            <div>
                              <p className="font-semibold text-gray-800">{f.TenChuNongTrai}</p>
                              <p className="text-2xs text-gray-400">{f.DienThoaiChuNongTrai || f.MaChuNongTrai}</p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-amber-600 font-medium text-2xs italic">Chưa gán nông dân</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{f.SoLuongPlot ?? 0} ô</td>
                      <td className="px-5 py-3.5 text-gray-700 font-medium">{f.TongDienTich ?? 0} m²</td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={f.TrangThai === 'APPROVED' ? 'success' : f.TrangThai === 'PENDING' ? 'warning' : 'neutral'}
                          size="sm"
                        >
                          {f.TrangThai}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditFarmModal(f)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-md transition cursor-pointer"
                        >
                          ✏️ Sửa / Phân công
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'farm', id: f.MaNongTrai, name: f.TenNongTrai })}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition cursor-pointer"
                        >
                          🗑️ Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ===================== SUBTAB 2: PLOTS LIST ===================== */}
      {activeSubTab === 'plots' && (
        <Card>
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Danh sách các thửa đất số hóa</h3>
              <p className="text-xs text-gray-500">
                Điều chỉnh giá thuê, camera giám sát thời gian thực và thông số cảm biến IoT
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Farm Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium">Nông trại:</span>
                <select
                  value={plotFilterFarm}
                  onChange={(e) => setPlotFilterFarm(e.target.value)}
                  className="text-xs rounded-lg border border-gray-300 py-1.5 px-2 bg-white text-gray-700 focus:outline-indigo-500"
                >
                  <option value="ALL">Tất cả nông trại</option>
                  {farms.map((farm) => (
                    <option key={farm.MaNongTrai} value={farm.MaNongTrai}>
                      {farm.TenNongTrai}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-500 font-medium">Trạng thái:</span>
                <select
                  value={plotFilterStatus}
                  onChange={(e) => setPlotFilterStatus(e.target.value)}
                  className="text-xs rounded-lg border border-gray-300 py-1.5 px-2 bg-white text-gray-700 focus:outline-indigo-500"
                >
                  <option value="ALL">Tất cả</option>
                  <option value="TRONG">Trống (TRONG)</option>
                  <option value="DANG_THUE">Đang thuê (DANG_THUE)</option>
                  <option value="BAO_TRI">Bảo trì (BAO_TRI)</option>
                </select>
              </div>
            </div>
          </div>

          {isPlotsLoading ? (
            <div className="p-12 text-center">
              <Spinner size="md" className="text-indigo-600 mx-auto" />
              <p className="text-xs text-gray-500 mt-2 font-medium">Đang tải thửa đất...</p>
            </div>
          ) : plots.length === 0 ? (
            <div className="p-12 text-center text-gray-500 text-sm">
              Không có ô đất nào phù hợp điều kiện lọc.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Mã & Tên Ô Đất</th>
                    <th className="px-5 py-3">Nông trại</th>
                    <th className="px-5 py-3">Diện tích</th>
                    <th className="px-5 py-3">Giá thuê / tháng</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Camera Live</th>
                    <th className="px-5 py-3">Chỉ số Cảm biến</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {plots.map((p) => (
                    <tr key={p.MaODat} className="hover:bg-gray-50/70 transition">
                      <td className="px-5 py-3.5">
                        <span className="font-bold text-gray-900 block">{p.TenODat}</span>
                        <span className="text-2xs text-gray-400 font-mono">{p.MaODat}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 font-medium">
                        {p.TenNongTrai || p.MaNongTrai}
                      </td>
                      <td className="px-5 py-3.5 text-gray-800 font-semibold">{p.DienTich} m²</td>
                      <td className="px-5 py-3.5 text-indigo-700 font-bold">{formatVND(p.GiaThue)}</td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant={
                            p.TrangThai === 'TRONG'
                              ? 'success'
                              : p.TrangThai === 'DANG_THUE'
                              ? 'indigo'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {p.TrangThai === 'TRONG'
                            ? 'Trống'
                            : p.TrangThai === 'DANG_THUE'
                            ? 'Đang thuê'
                            : 'Bảo trì'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        {p.CameraUrl ? (
                          <a
                            href={p.CameraUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-2xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-medium hover:underline"
                          >
                            📹 Xem luồng
                          </a>
                        ) : (
                          <span className="text-gray-400 text-2xs italic">Chưa gắn</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => openSensorModal(p)}
                          className="text-2xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded font-medium flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <span>📡</span>
                          <span>
                            {p.DoAmDat ?? '--'}% | {p.NhietDo ?? '--'}°C | pH {p.DoPH ?? '--'}
                          </span>
                        </button>
                      </td>
                      <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditPlotModal(p)}
                          className="px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded transition cursor-pointer"
                        >
                          ✏️ Sửa giá & Cam
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'plot', id: p.MaODat, name: p.TenODat })}
                          className="px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ===================== MODAL: CREATE / EDIT FARM ===================== */}
      <Modal
        isOpen={farmModalMode !== null}
        onClose={() => setFarmModalMode(null)}
        title={farmModalMode === 'create' ? 'Tạo Nông Trại Mới' : 'Chỉnh Sửa Nông Trại & Phân Công Nông Dân'}
        description="Quản trị thông tin vị trí và người chịu trách nhiệm kỹ thuật cho toàn bộ khu đất."
      >
        <form onSubmit={handleSaveFarm} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Tên Nông Trại *</label>
            <Input
              value={farmForm.TenNongTrai}
              onChange={(e) => setFarmForm({ ...farmForm, TenNongTrai: e.target.value })}
              placeholder="VD: Nông trại Hữu cơ Mộc Châu 01"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Địa chỉ Nông Trại *</label>
            <Input
              value={farmForm.DiaChi}
              onChange={(e) => setFarmForm({ ...farmForm, DiaChi: e.target.value })}
              placeholder="VD: Tiểu khu 68, Thị trấn Nông trường Mộc Châu, Sơn La"
              required
            />
          </div>

          {/* Assign Farmer Selector */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Phân công Nông dân phụ trách (Assign Farmer) *
            </label>
            <select
              value={farmForm.MaChuNongTrai}
              onChange={(e) => setFarmForm({ ...farmForm, MaChuNongTrai: e.target.value })}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 bg-white text-gray-700 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">-- Chưa gán nông dân --</option>
              {farmers.map((farmer) => (
                <option key={farmer.id} value={farmer.id}>
                  {farmer.fullName} ({farmer.username} - {farmer.phone || farmer.id})
                </option>
              ))}
            </select>
            <p className="text-2xs text-gray-400 mt-1">
              Nông dân được gán sẽ có toàn quyền giám sát nhật ký canh tác và chăm sóc các thửa đất trên farm này.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Trạng thái phê duyệt</label>
            <select
              value={farmForm.TrangThai}
              onChange={(e) => setFarmForm({ ...farmForm, TrangThai: e.target.value as any })}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 bg-white text-gray-700 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="APPROVED">Đã phê duyệt (APPROVED)</option>
              <option value="PENDING">Đang chờ thẩm định (PENDING)</option>
              <option value="INACTIVE">Tạm ngưng (INACTIVE)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFarmModalMode(null)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : farmModalMode === 'create' ? 'Tạo mới' : 'Lưu cập nhật'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================== MODAL: CREATE / EDIT PLOT ===================== */}
      <Modal
        isOpen={plotModalMode !== null}
        onClose={() => setPlotModalMode(null)}
        title={plotModalMode === 'create' ? 'Tạo Thửa Đất Mới' : 'Cập Nhật Ô Đất, Giá Thuê & Camera'}
        description="Điều chỉnh giá cho thuê trên tháng, diện tích và luồng RTSP / HLS camera theo dõi."
      >
        <form onSubmit={handleSavePlot} className="space-y-3.5 text-xs">
          {plotModalMode === 'create' && (
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Thuộc Nông Trại *</label>
              <select
                value={plotForm.MaNongTrai}
                onChange={(e) => setPlotForm({ ...plotForm, MaNongTrai: e.target.value })}
                className="w-full rounded-lg border border-gray-300 py-2 px-3 bg-white text-gray-700 text-xs focus:outline-none"
                required
              >
                {farms.map((f) => (
                  <option key={f.MaNongTrai} value={f.MaNongTrai}>
                    {f.TenNongTrai} ({f.MaNongTrai})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Tên Ô Đất *</label>
            <Input
              value={plotForm.TenODat}
              onChange={(e) => setPlotForm({ ...plotForm, TenODat: e.target.value })}
              placeholder="VD: Ô Đất Thông Minh A1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Diện tích (m²) *</label>
              <Input
                type="number"
                value={plotForm.DienTich}
                onChange={(e) => setPlotForm({ ...plotForm, DienTich: Number(e.target.value) })}
                min={1}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Giá thuê (VND / tháng) *</label>
              <Input
                type="number"
                value={plotForm.GiaThue}
                onChange={(e) => setPlotForm({ ...plotForm, GiaThue: Number(e.target.value) })}
                step={50000}
                min={0}
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Camera Stream URL (RTSP/WebRTC)</label>
            <Input
              value={plotForm.CameraUrl}
              onChange={(e) => setPlotForm({ ...plotForm, CameraUrl: e.target.value })}
              placeholder="https://live.plotfarm.com/stream/plot-a1"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Hình ảnh Thumbnail URL</label>
            <Input
              value={plotForm.HinhAnhThumbnail}
              onChange={(e) => setPlotForm({ ...plotForm, HinhAnhThumbnail: e.target.value })}
              placeholder="https://images.unsplash.com/photo-..."
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Trạng thái ô đất</label>
            <select
              value={plotForm.TrangThai}
              onChange={(e) => setPlotForm({ ...plotForm, TrangThai: e.target.value as any })}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 bg-white text-gray-700 text-xs focus:outline-none"
            >
              <option value="TRONG">Trống (Sẵn sàng thuê)</option>
              <option value="DANG_THUE">Đang có khách thuê</option>
              <option value="BAO_TRI">Đang cải tạo / bảo trì đất</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPlotModalMode(null)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang lưu...' : plotModalMode === 'create' ? 'Tạo mới' : 'Cập nhật'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================== MODAL: SENSOR IOT DATA ===================== */}
      <Modal
        isOpen={sensorModalPlot !== null}
        onClose={() => setSensorModalPlot(null)}
        title={`Cập Nhật Cảm Biến IoT — ${sensorModalPlot?.TenODat}`}
        description="Ghi nhận chỉ số đo thực địa từ trạm IoT kết nối vào cơ sở dữ liệu PlotFarm."
      >
        <form onSubmit={handleSaveSensor} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Độ ẩm đất (%)</label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={sensorForm.DoAmDat}
                onChange={(e) => setSensorForm({ ...sensorForm, DoAmDat: Number(e.target.value) })}
                required
              />
              <span className="text-2xs text-gray-400">Tiêu chuẩn: 60 - 80%</span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Nhiệt độ môi trường (°C)</label>
              <Input
                type="number"
                step="0.1"
                value={sensorForm.NhietDo}
                onChange={(e) => setSensorForm({ ...sensorForm, NhietDo: Number(e.target.value) })}
                required
              />
              <span className="text-2xs text-gray-400">Tiêu chuẩn: 22 - 30°C</span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Độ pH của đất</label>
              <Input
                type="number"
                step="0.1"
                min="1"
                max="14"
                value={sensorForm.DoPH}
                onChange={(e) => setSensorForm({ ...sensorForm, DoPH: Number(e.target.value) })}
                required
              />
              <span className="text-2xs text-gray-400">Tiêu chuẩn: 5.5 - 7.0</span>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Cường độ ánh sáng (Lux)</label>
              <Input
                type="number"
                step="100"
                min="0"
                value={sensorForm.AnhSangLux}
                onChange={(e) => setSensorForm({ ...sensorForm, AnhSangLux: Number(e.target.value) })}
                required
              />
              <span className="text-2xs text-gray-400">Tiêu chuẩn: 5000 - 15000 Lux</span>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSensorModalPlot(null)}
              disabled={isSubmitting}
            >
              Đóng
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang cập nhật...' : 'Lưu chỉ số cảm biến'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================== MODAL: DELETE CONFIRMATION ===================== */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xóa dữ liệu"
        description="Thao tác này sẽ xóa vĩnh viễn khỏi hệ thống máy chủ và không thể hoàn tác."
      >
        <div className="space-y-3 text-xs">
          <p className="text-gray-700">
            Bạn có chắc chắn muốn xóa {deleteTarget?.type === 'farm' ? 'Nông trại' : 'Ô đất'}{' '}
            <strong>{deleteTarget?.name}</strong> ({deleteTarget?.id})?
          </p>
          <p className="text-2xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
            Lưu ý: Không thể xóa nông trại khi còn ô đất bên trong, hoặc xóa ô đất đang có hợp đồng thuê hoạt động.
          </p>
          <div className="flex justify-end gap-2 pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
              disabled={isSubmitting}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xóa...' : 'Đồng ý xóa'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
