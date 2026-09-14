import { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input, Spinner, Alert } from '../../components/ui';
import { adminService } from './admin.service';
import type { AdminHarvest, AdminContract } from './admin.types';

export default function AdminHarvestDelivery() {
  const [harvests, setHarvests] = useState<AdminHarvest[]>([]);
  const [activeContracts, setActiveContracts] = useState<AdminContract[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    maHopDong: '',
    ngayThuHoachDuKien: new Date().toISOString().split('T')[0],
    sanLuongDuKien: 30,
    diaChiGiaoHang: '',
    ghiChu: '',
  });

  // Update Harvest Modal state
  const [editingHarvest, setEditingHarvest] = useState<AdminHarvest | null>(null);
  const [editForm, setEditForm] = useState({
    sanLuongThucTe: 0,
    ngayThuHoachThucTe: '',
    trangThaiThuHoach: 'SCHEDULED' as 'SCHEDULED' | 'IN_PROGRESS' | 'HARVESTED' | 'CANCELLED',
    trangThaiDongGoi: 'NOT_PACKED' as 'NOT_PACKED' | 'PACKED' | 'STORAGE_COOL',
    trangThaiGiaoHang: 'WAITING_PICKUP' as 'WAITING_PICKUP' | 'DELIVERING' | 'DELIVERED',
    maVanDon: '',
    diaChiGiaoHang: '',
    ghiChu: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadHarvests();
    loadContracts();
  }, [statusFilter]);

  async function loadHarvests() {
    try {
      setIsLoading(true);
      setActionError(null);
      const data = await adminService.fetchHarvests({
        status: statusFilter,
      });
      setHarvests(data);
    } catch (err: any) {
      console.error('Failed to load harvests:', err);
      setActionError(err?.response?.data?.message || 'Không thể tải danh sách thu hoạch & giao hàng');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadContracts() {
    try {
      const list = await adminService.fetchContracts({ trangThai: 'ACTIVE' });
      setActiveContracts(list);
    } catch (e) {
      console.error('Failed to load active contracts:', e);
    }
  }

  // Open Create Modal
  function openCreateModal() {
    setActionError(null);
    const firstContract = activeContracts[0];
    setCreateForm({
      maHopDong: firstContract?.MaHopDong || '',
      ngayThuHoachDuKien: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      sanLuongDuKien: 35,
      diaChiGiaoHang: firstContract ? `${firstContract.TenKH} - ${firstContract.DienThoai || ''}` : '',
      ghiChu: 'Vụ thu hoạch định kỳ theo tiến độ nông vụ',
    });
    setIsCreateModalOpen(true);
  }

  async function handleCreateHarvest(e: React.FormEvent) {
    e.preventDefault();
    if (!createForm.maHopDong || !createForm.diaChiGiaoHang.trim()) {
      setActionError('Vui lòng chọn hợp đồng và nhập địa chỉ giao hàng');
      return;
    }

    try {
      setIsSubmitting(true);
      setActionError(null);
      await adminService.createHarvest({
        maHopDong: createForm.maHopDong,
        ngayThuHoachDuKien: createForm.ngayThuHoachDuKien,
        sanLuongDuKien: Number(createForm.sanLuongDuKien),
        diaChiGiaoHang: createForm.diaChiGiaoHang.trim(),
        ghiChu: createForm.ghiChu.trim() || undefined,
      });
      setActionSuccess('Lên lịch thu hoạch thành công');
      setIsCreateModalOpen(false);
      await loadHarvests();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Lỗi khi tạo lịch thu hoạch');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Open Edit Modal
  function openEditModal(h: AdminHarvest) {
    setActionError(null);
    setEditingHarvest(h);
    setEditForm({
      sanLuongThucTe: h.SanLuongThucTe ?? h.SanLuongDuKien,
      ngayThuHoachThucTe: h.NgayThuHoachThucTe
        ? new Date(h.NgayThuHoachThucTe).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      trangThaiThuHoach: h.TrangThaiThuHoach,
      trangThaiDongGoi: h.TrangThaiDongGoi,
      trangThaiGiaoHang: h.TrangThaiGiaoHang,
      maVanDon: h.MaVanDon || '',
      diaChiGiaoHang: h.DiaChiGiaoHang || '',
      ghiChu: h.GhiChu || '',
    });
  }

  function handleGenerateTrackingCode() {
    const randomSix = Math.floor(100000 + Math.random() * 900000);
    const code = `VNPOST-PF${randomSix}`;
    setEditForm({ ...editForm, maVanDon: code });
  }

  async function handleSaveHarvest(e: React.FormEvent) {
    e.preventDefault();
    if (!editingHarvest) return;

    try {
      setIsSubmitting(true);
      setActionError(null);

      // 1. Update Harvest status & actual quantity
      await adminService.updateHarvestStatus(editingHarvest.MaThuHoach, {
        trangThaiThuHoach: editForm.trangThaiThuHoach,
        trangThaiDongGoi: editForm.trangThaiDongGoi,
        trangThaiGiaoHang: editForm.trangThaiGiaoHang,
        sanLuongThucTe: Number(editForm.sanLuongThucTe),
        ngayThuHoachThucTe: editForm.ngayThuHoachThucTe || undefined,
        ghiChu: editForm.ghiChu.trim() || undefined,
      });

      // 2. Update Delivery details (tracking code, delivery address, statuses)
      await adminService.updateHarvestDelivery(editingHarvest.MaThuHoach, {
        diaChiGiaoHang: editForm.diaChiGiaoHang.trim() || undefined,
        maVanDon: editForm.maVanDon.trim() || undefined,
        trangThaiGiaoHang: editForm.trangThaiGiaoHang,
        trangThaiDongGoi: editForm.trangThaiDongGoi,
      });

      setActionSuccess(`Cập nhật lịch thu hoạch & giao vận ${editingHarvest.MaThuHoach} thành công`);
      setEditingHarvest(null);
      await loadHarvests();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu lịch thu hoạch');
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatDate(d?: string | null) {
    if (!d) return '--';
    return new Date(d).toLocaleDateString('vi-VN');
  }

  const filteredHarvests = harvests.filter((h) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      h.MaThuHoach.toLowerCase().includes(term) ||
      h.MaHopDong.toLowerCase().includes(term) ||
      (h.TenKH && h.TenKH.toLowerCase().includes(term)) ||
      (h.TenODat && h.TenODat.toLowerCase().includes(term)) ||
      (h.TenCayTrong && h.TenCayTrong.toLowerCase().includes(term)) ||
      (h.MaVanDon && h.MaVanDon.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
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


      {/* Main Table Card */}
      <Card>
        {/* Controls Bar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/60">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Quản Trị Thu Hoạch & Logistics Giao Hàng</h3>
            <p className="text-xs text-gray-500">
              Lên lịch thu hoạch, cập nhật sản lượng thực tế, tình trạng đóng gói, giao vận và mã vận đơn
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <input
              type="text"
              placeholder="Tìm mã vụ, mã HĐ, khách hàng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 py-1.5 px-3 bg-white text-gray-700 w-48 sm:w-60 focus:outline-indigo-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 focus:outline-indigo-500"
            >
              <option value="ALL">Tất cả vụ mùa</option>
              <option value="SCHEDULED">Đã lên lịch (SCHEDULED)</option>
              <option value="IN_PROGRESS">Đang thu hoạch (IN_PROGRESS)</option>
              <option value="HARVESTED">Đã thu hoạch (HARVESTED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>

            <Button
              variant="primary"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
              onClick={openCreateModal}
            >
              + Lên Lịch Thu Hoạch
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Spinner size="md" className="text-indigo-600 mx-auto" />
            <p className="text-xs text-gray-500 mt-2 font-medium">Đang tải dữ liệu thu hoạch...</p>
          </div>
        ) : filteredHarvests.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            Không tìm thấy bản ghi thu hoạch nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Mã Vụ & HĐ</th>
                  <th className="px-4 py-3">Khách Hàng</th>
                  <th className="px-4 py-3">Thửa & Nông Sản</th>
                  <th className="px-4 py-3">Ngày Thu Hoạch</th>
                  <th className="px-4 py-3">Sản Lượng (Dự kiến / Thực tế)</th>
                  <th className="px-4 py-3">Đóng Gói</th>
                  <th className="px-4 py-3">Giao Hàng</th>
                  <th className="px-4 py-3">Mã Vận Đơn (Tracking)</th>
                  <th className="px-4 py-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredHarvests.map((h) => (
                  <tr key={h.MaThuHoach} className="hover:bg-gray-50/70 transition">
                    {/* ID */}
                    <td className="px-4 py-3 font-mono font-bold text-gray-900">
                      {h.MaThuHoach}
                      <span className="block text-2xs text-gray-400 font-normal">{h.MaHopDong}</span>
                    </td>

                    {/* Customer */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900 block">{h.TenKH || 'Khách hàng'}</span>
                      <span className="text-2xs text-gray-500">{h.DienThoaiKhachHang || ''}</span>
                    </td>

                    {/* Plot & Crop */}
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-800 block">{h.TenODat || 'Thửa đất'}</span>
                      <span className="text-2xs text-emerald-700 font-medium">🌱 {h.TenCayTrong || 'Nông sản'}</span>
                    </td>

                    {/* Dates */}
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      <div>Dự kiến: {formatDate(h.NgayThuHoachDuKien)}</div>
                      {h.NgayThuHoachThucTe && (
                        <div className="text-emerald-600 font-semibold">
                          Thực tế: {formatDate(h.NgayThuHoachThucTe)}
                        </div>
                      )}
                    </td>

                    {/* Yield */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-gray-500">{h.SanLuongDuKien} kg</span>
                      <span className="mx-1 text-gray-300">/</span>
                      {h.SanLuongThucTe !== null && h.SanLuongThucTe !== undefined ? (
                        <span className="font-bold text-indigo-700">{h.SanLuongThucTe} kg</span>
                      ) : (
                        <span className="text-amber-600 italic">Chưa cân</span>
                      )}
                    </td>

                    {/* Packaging */}
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          h.TrangThaiDongGoi === 'PACKED'
                            ? 'success'
                            : h.TrangThaiDongGoi === 'STORAGE_COOL'
                            ? 'indigo'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {h.TrangThaiDongGoi === 'PACKED'
                          ? 'Đã đóng thùng'
                          : h.TrangThaiDongGoi === 'STORAGE_COOL'
                          ? 'Kho lạnh'
                          : 'Chưa đóng gói'}
                      </Badge>
                    </td>

                    {/* Delivery */}
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          h.TrangThaiGiaoHang === 'DELIVERED'
                            ? 'success'
                            : h.TrangThaiGiaoHang === 'DELIVERING'
                            ? 'info'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {h.TrangThaiGiaoHang === 'DELIVERED'
                          ? 'Đã giao'
                          : h.TrangThaiGiaoHang === 'DELIVERING'
                          ? 'Đang giao'
                          : 'Chờ nhận'}
                      </Badge>
                    </td>

                    {/* Tracking Number */}
                    <td className="px-4 py-3">
                      {h.MaVanDon ? (
                        <span className="font-mono text-2xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                          {h.MaVanDon}
                        </span>
                      ) : (
                        <span className="text-2xs text-gray-400 italic">Chưa tạo mã</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2.5 py-1"
                        onClick={() => openEditModal(h)}
                      >
                        ⚙️ Cập nhật vận chuyển
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ===================== MODAL: CREATE HARVEST SCHEDULE ===================== */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Lên Lịch Thu Hoạch Mới"
        description="Chọn hợp đồng thuê đang hoạt động để ấn định thời gian thu hoạch và dự kiến sản lượng."
      >
        <form onSubmit={handleCreateHarvest} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">Hợp Đồng Thuê Hoạt Động *</label>
            <select
              value={createForm.maHopDong}
              onChange={(e) => {
                const cId = e.target.value;
                const c = activeContracts.find((x) => x.MaHopDong === cId);
                setCreateForm({
                  ...createForm,
                  maHopDong: cId,
                  diaChiGiaoHang: c ? `${c.TenKH} - SĐT: ${c.DienThoai || ''}` : createForm.diaChiGiaoHang,
                });
              }}
              className="w-full rounded-lg border border-gray-300 py-2 px-3 bg-white text-gray-700 text-xs focus:outline-none"
              required
            >
              {activeContracts.map((c) => (
                <option key={c.MaHopDong} value={c.MaHopDong}>
                  {c.MaHopDong} — {c.TenKH} ({c.TenODat} - {c.TenCayTrong})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Ngày thu hoạch dự kiến *</label>
              <Input
                type="date"
                value={createForm.ngayThuHoachDuKien}
                onChange={(e) => setCreateForm({ ...createForm, ngayThuHoachDuKien: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Sản lượng dự kiến (kg) *</label>
              <Input
                type="number"
                min={1}
                value={createForm.sanLuongDuKien}
                onChange={(e) => setCreateForm({ ...createForm, sanLuongDuKien: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Địa chỉ giao nhận tận nơi *</label>
            <Input
              value={createForm.diaChiGiaoHang}
              onChange={(e) => setCreateForm({ ...createForm, diaChiGiaoHang: e.target.value })}
              placeholder="VD: Số 123 Đường Nguyễn Huệ, Quận 1, TP.HCM"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Ghi chú yêu cầu đóng gói</label>
            <textarea
              rows={2}
              value={createForm.ghiChu}
              onChange={(e) => setCreateForm({ ...createForm, ghiChu: e.target.value })}
              placeholder="VD: Đóng thùng xốp có đá gel giữ tươi..."
              className="w-full rounded-lg border border-gray-300 py-2 px-3 text-xs focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
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
              {isSubmitting ? 'Đang tạo...' : 'Xác nhận tạo lịch'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ===================== MODAL: UPDATE HARVEST & LOGISTICS ===================== */}
      <Modal
        isOpen={editingHarvest !== null}
        onClose={() => setEditingHarvest(null)}
        title={`Cập Nhật Thu Hoạch & Logistics — ${editingHarvest?.MaThuHoach}`}
        description="Ghi nhận sản lượng thực tế, trạng thái bao gói và cấp mã vận đơn theo dõi."
      >
        <form onSubmit={handleSaveHarvest} className="space-y-4 text-xs">
          {/* Actual Yield & Date Section */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-gray-900 uppercase text-2xs tracking-wider">
              1. Kết Quả Thu Hoạch Thực Tế
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Sản lượng thực tế (kg) *</label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={editForm.sanLuongThucTe}
                  onChange={(e) => setEditForm({ ...editForm, sanLuongThucTe: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Ngày thu hoạch thực tế</label>
                <Input
                  type="date"
                  value={editForm.ngayThuHoachThucTe}
                  onChange={(e) => setEditForm({ ...editForm, ngayThuHoachThucTe: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Trạng thái thu hoạch</label>
              <select
                value={editForm.trangThaiThuHoach}
                onChange={(e) => setEditForm({ ...editForm, trangThaiThuHoach: e.target.value as any })}
                className="w-full rounded-lg border border-gray-300 py-1.5 px-3 bg-white text-gray-700 text-xs focus:outline-none"
              >
                <option value="SCHEDULED">SCHEDULED (Đã lên lịch)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Đang thu hoạch)</option>
                <option value="HARVESTED">HARVESTED (Đã thu hoạch xong)</option>
                <option value="CANCELLED">CANCELLED (Hủy bỏ)</option>
              </select>
            </div>
          </div>

          {/* Packing & Delivery Section */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="font-bold text-gray-900 uppercase text-2xs tracking-wider">
              2. Đóng Gói & Vận Chuyển (Packing & Delivery)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Trạng thái đóng gói</label>
                <select
                  value={editForm.trangThaiDongGoi}
                  onChange={(e) => setEditForm({ ...editForm, trangThaiDongGoi: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 text-xs focus:outline-none"
                >
                  <option value="NOT_PACKED">NOT_PACKED (Chưa đóng gói)</option>
                  <option value="PACKED">PACKED (Đã đóng thùng/hộp)</option>
                  <option value="STORAGE_COOL">STORAGE_COOL (Bảo quản kho lạnh)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Trạng thái giao hàng</label>
                <select
                  value={editForm.trangThaiGiaoHang}
                  onChange={(e) => setEditForm({ ...editForm, trangThaiGiaoHang: e.target.value as any })}
                  className="w-full rounded-lg border border-gray-300 py-1.5 px-2.5 bg-white text-gray-700 text-xs focus:outline-none"
                >
                  <option value="WAITING_PICKUP">WAITING_PICKUP (Chờ bưu tá lấy hàng)</option>
                  <option value="DELIVERING">DELIVERING (Đang trên đường giao)</option>
                  <option value="DELIVERED">DELIVERED (Đã giao thành công)</option>
                </select>
              </div>
            </div>

            {/* Tracking Number Generation */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Mã Vận Đơn (Tracking Number)</label>
              <div className="flex gap-2">
                <Input
                  value={editForm.maVanDon}
                  onChange={(e) => setEditForm({ ...editForm, maVanDon: e.target.value })}
                  placeholder="VD: VNPOST-PF123456"
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateTrackingCode}
                  className="shrink-0 text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100"
                >
                  ⚡ Tạo mã tự động
                </Button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Địa chỉ giao hàng nhận nông sản</label>
              <Input
                value={editForm.diaChiGiaoHang}
                onChange={(e) => setEditForm({ ...editForm, diaChiGiaoHang: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditingHarvest(null)}
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
              {isSubmitting ? 'Đang lưu...' : 'Lưu cập nhật'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
