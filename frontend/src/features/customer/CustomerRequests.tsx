import { useState, useEffect } from "react";
import { customerService } from "./customer.service";
import type {
  CareRequestStatus,
  SharedCareRequestItem,
  SharedPlotItem,
} from "./customer.types";
import { Alert, Badge, Button, Modal } from "../../components/ui";

interface CustomerRequestsProps {
  initialPlotCode?: string;
}

export default function CustomerRequests({
  initialPlotCode,
}: CustomerRequestsProps) {
  const [requests, setRequests] = useState<SharedCareRequestItem[]>(() =>
    customerService.getMyCareRequests(),
  );
  const [plots] = useState<SharedPlotItem[]>(() => customerService.getMyPlots());
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formPlotCode, setFormPlotCode] = useState<string>(
    initialPlotCode || (plots.length > 0 ? plots[0].plotCode : ""),
  );
  const [formRequestType, setFormRequestType] = useState<string>("Chụp ảnh tiến độ");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  // Preview Image Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    function handleDataSync() {
      setRequests(customerService.getMyCareRequests());
    }

    window.addEventListener("pf_data_changed", handleDataSync);
    window.addEventListener("pf_farmer_changed", handleDataSync);
    return () => {
      window.removeEventListener("pf_data_changed", handleDataSync);
      window.removeEventListener("pf_farmer_changed", handleDataSync);
    };
  }, []);

  const filteredRequests = requests.filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.status === statusFilter;
  });

  function getStatusBadge(status: CareRequestStatus) {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning">Chờ xử lý (PENDING)</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="info">Đang thực hiện (IN_PROGRESS)</Badge>;
      case "COMPLETED":
        return <Badge variant="success">Đã hoàn thành (COMPLETED)</Badge>;
      case "CANNOT_RESOLVE":
        return <Badge variant="danger">Không thể xử lý (CANNOT_RESOLVE)</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  }

  function handleOpenCreateModal(preselectedPlot?: string) {
    if (preselectedPlot) {
      setFormPlotCode(preselectedPlot);
    } else if (plots.length > 0) {
      setFormPlotCode(plots[0].plotCode);
    }
    setFormDescription("");
    setFormError("");
    setIsCreateModalOpen(true);
  }

  function handleCreateRequest() {
    if (!formPlotCode) {
      setFormError("Vui lòng chọn thửa đất cần chăm sóc.");
      return;
    }
    if (!formDescription.trim()) {
      setFormError("Vui lòng nhập chi tiết mô tả yêu cầu.");
      return;
    }

    const newReq = customerService.createCareRequest({
      plotCode: formPlotCode,
      requestType: formRequestType,
      description: formDescription.trim(),
    });

    setRequests((prev) => [newReq, ...prev]);
    setIsCreateModalOpen(false);
    setSuccessMessage(
      `Yêu cầu #${newReq.id} đã được gửi trực tiếp đến Nông dân phụ trách thửa ${newReq.plot}!`,
    );
    setTimeout(() => setSuccessMessage(""), 5000);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Yêu Cầu Chăm Sóc & Tương Tác Nông Dân (Care Requests)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Gửi yêu cầu tưới nước, bón phân, chụp ảnh hoặc kiểm tra sâu bệnh trực tiếp cho kỹ sư nông dân phụ trách thửa đất của bạn.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          fullWidth={false}
          onClick={() => handleOpenCreateModal()}
        >
          + Tạo Yêu Cầu Chăm Sóc Mới
        </Button>
      </div>

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {/* Sync Status Banner */}
      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <span className="text-base">🔄</span>
          <span>
            <strong>Đồng bộ nghiệp vụ hai chiều:</strong> Khi bạn tạo yêu cầu, Nông dân phụ trách sẽ nhận thông báo trên Cổng Farmer ngay lập tức. Sau khi xử lý tại vườn, Nông dân sẽ cập nhật ghi chú nghiệm thu và hình ảnh kết quả cho bạn.
          </span>
        </div>
        <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 shrink-0">
          {requests.length} yêu cầu
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("ALL")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-emerald-700 text-white shadow-xs"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          Tất cả ({requests.length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === "PENDING"
              ? "bg-amber-600 text-white shadow-xs"
              : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
          }`}
        >
          Chờ xử lý ({requests.filter((r) => r.status === "PENDING").length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("IN_PROGRESS")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === "IN_PROGRESS"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-blue-800 border border-blue-200 hover:bg-blue-50"
          }`}
        >
          Đang thực hiện ({requests.filter((r) => r.status === "IN_PROGRESS").length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("COMPLETED")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === "COMPLETED"
              ? "bg-emerald-600 text-white shadow-xs"
              : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          Đã hoàn thành ({requests.filter((r) => r.status === "COMPLETED").length})
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("CANNOT_RESOLVE")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            statusFilter === "CANNOT_RESOLVE"
              ? "bg-red-600 text-white shadow-xs"
              : "bg-white text-red-800 border border-red-200 hover:bg-red-50"
          }`}
        >
          Không thể xử lý ({requests.filter((r) => r.status === "CANNOT_RESOLVE").length})
        </button>
      </div>

      {/* Requests Table / Cards */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50/80 text-gray-700">
            <tr>
              <th className="py-3 px-3.5 text-left font-semibold">Mã yêu cầu</th>
              <th className="py-3 px-3 text-left font-semibold">Thửa đất</th>
              <th className="py-3 px-3 text-left font-semibold">Loại yêu cầu</th>
              <th className="py-3 px-3 text-left font-semibold min-w-[220px]">Nội dung yêu cầu của bạn</th>
              <th className="py-3 px-3 text-left font-semibold">Ngày gửi</th>
              <th className="py-3 px-3 text-left font-semibold">Trạng thái</th>
              <th className="py-3 px-3 text-left font-semibold min-w-[240px]">Nông dân phản hồi / Kết quả</th>
              <th className="py-3 px-3 text-center font-semibold">Ảnh nghiệm thu</th>
              <th className="py-3 px-3 text-left font-semibold">Ngày hoàn tất</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-10 text-center text-gray-400">
                  Không có yêu cầu chăm sóc nào trong mục này.
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/70 transition">
                  <td className="py-3.5 px-3.5 font-mono font-bold text-gray-900 whitespace-nowrap">
                    #{req.id}
                  </td>
                  <td className="py-3.5 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                    {req.plot}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-purple-800 whitespace-nowrap">
                    {req.requestType}
                  </td>
                  <td className="py-3.5 px-3 text-gray-700 leading-relaxed">
                    {req.description}
                  </td>
                  <td className="py-3.5 px-3 text-2xs text-gray-500 whitespace-nowrap">
                    {req.createdDate}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getStatusBadge(req.status)}
                  </td>
                  <td className="py-3.5 px-3 text-gray-800">
                    {req.farmerNote ? (
                      <div className="p-2 rounded-lg bg-emerald-50/60 border border-emerald-100 text-xs">
                        <span className="font-semibold text-emerald-900 block mb-0.5">
                          Ghi chú từ Nông dân:
                        </span>
                        <p className="text-gray-800">{req.farmerNote}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-2xs">
                        Nông dân chưa phản hồi
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    {req.evidenceImage ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(req.evidenceImage || null)}
                        className="inline-block group cursor-pointer"
                        title="Bấm để xem ảnh nghiệm thu phóng to"
                      >
                        <img
                          src={req.evidenceImage}
                          alt="Ảnh nghiệm thu"
                          className="h-11 w-16 object-cover rounded-md border border-gray-200 shadow-2xs group-hover:scale-105 transition"
                        />
                        <span className="text-2xs text-emerald-700 block mt-0.5 group-hover:underline">
                          Xem ảnh
                        </span>
                      </button>
                    ) : (
                      <span className="text-gray-300 text-2xs">--</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-2xs text-gray-500 whitespace-nowrap">
                    {req.processedDate || (
                      <span className="text-gray-300">Đang xử lý</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tạo Yêu Cầu Chăm Sóc Mới */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo Yêu Cầu Chăm Sóc Mới Cho Nông Dân"
        description="Gửi thông điệp thực địa đến kỹ sư nông dân phụ trách thửa đất nông nghiệp của bạn."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => setIsCreateModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleCreateRequest}
            >
              Gửi yêu cầu ngay
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {formError && (
            <Alert variant="error" onClose={() => setFormError("")}>
              {formError}
            </Alert>
          )}

          {/* Chọn Thửa Đất */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Chọn Thửa Đất Cần Chăm Sóc *
            </label>
            <select
              value={formPlotCode}
              onChange={(e) => setFormPlotCode(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            >
              {plots.map((p) => (
                <option key={p.id} value={p.plotCode}>
                  {p.plotCode} - {p.plantCrop} ({p.farmName})
                </option>
              ))}
            </select>
          </div>

          {/* Loại Yêu Cầu */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Loại Yêu Cầu Chăm Sóc *
            </label>
            <select
              value={formRequestType}
              onChange={(e) => setFormRequestType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            >
              <option value="Chụp ảnh tiến độ">Chụp ảnh tiến độ cây trồng</option>
              <option value="Tưới thêm nước">Tưới thêm nước / Điều chỉnh độ ẩm</option>
              <option value="Bón phân bổ sung">Bón phân hữu cơ bổ sung</option>
              <option value="Kiểm tra sâu bệnh">Kiểm tra sâu bệnh & dịch hại</option>
              <option value="Tỉa cành tạo tán">Tỉa cành / Vặt chồi nhánh</option>
              <option value="Thu hoạch sớm">Thu hoạch kiểm tra thử sản lượng</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          {/* Mô tả chi tiết */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Chi Tiết Yêu Cầu Gửi Nông Dân *
            </label>
            <textarea
              rows={4}
              placeholder="Ví dụ: Nhờ bác nông dân kiểm tra giúp chùm quả đợt này và chụp giúp tôi vài góc ảnh đẹp để đăng lên trang cá nhân..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-100 text-emerald-900 text-2xs space-y-1">
            <span className="font-semibold block">💡 Lưu ý:</span>
            <p>
              Kỹ sư nông dân thực địa trực tiếp kiểm tra và cập nhật tình trạng cũng như hình ảnh nghiệm thu thực tế sau khi hoàn tất.
            </p>
          </div>
        </div>
      </Modal>

      {/* Preview Image Modal */}
      <Modal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title="Ảnh Chụp Nghiệm Thu Từ Nông Dân"
        description="Hình ảnh kết quả xử lý thực địa do nông dân chụp và tải lên sau khi hoàn thành yêu cầu."
        footer={
          <Button
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => setPreviewImage(null)}
          >
            Đóng
          </Button>
        }
      >
        {previewImage && (
          <div className="space-y-3">
            <img
              src={previewImage}
              alt="Ảnh nghiệm thu"
              className="w-full rounded-xl object-contain max-h-96"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
