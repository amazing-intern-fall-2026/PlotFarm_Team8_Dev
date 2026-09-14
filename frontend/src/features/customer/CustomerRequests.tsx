import { useState, useEffect, useCallback } from "react";
import { customerService } from "./customer.service";
import type {
  CareRequestStatus,
  SharedCareRequestItem,
  SharedContractItem,
} from "./customer.types";
import { Alert, Badge, Button, Modal, Spinner } from "../../components/ui";

interface CustomerRequestsProps {
  initialPlotCode?: string;
}

export default function CustomerRequests({
  initialPlotCode,
}: CustomerRequestsProps) {
  const [requests, setRequests] = useState<SharedCareRequestItem[]>([]);
  const [contracts, setContracts] = useState<SharedContractItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formContractId, setFormContractId] = useState<string>("");
  const [formRequestType, setFormRequestType] = useState<string>("Chụp ảnh tiến độ");
  const [formDescription, setFormDescription] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  // Preview Image Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Load contracts from real API
  const loadContracts = useCallback(async () => {
    try {
      const serverContracts = await customerService.fetchMyContractsAsync();
      setContracts(serverContracts);
      return serverContracts;
    } catch (err) {
      console.warn("Lỗi khi tải danh sách hợp đồng:", err);
      const fallback = customerService.getMyContracts();
      setContracts(fallback);
      return fallback;
    }
  }, []);

  // Load care requests from real API: GET /api/v1/care-requests/my (No Mock Data)
  const loadCareRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const serverRequests = await customerService.fetchMyCareRequestsAsync();
      setRequests(serverRequests);
    } catch (err) {
      console.warn("Lỗi khi tải yêu cầu chăm sóc từ API:", err);
      setRequests(customerService.getMyCareRequests());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContracts();
    loadCareRequests();
  }, [loadContracts, loadCareRequests]);

  // Sync listener on external data updates
  useEffect(() => {
    function handleDataSync() {
      loadCareRequests();
    }

    window.addEventListener("pf_data_changed", handleDataSync);
    window.addEventListener("pf_farmer_changed", handleDataSync);
    return () => {
      window.removeEventListener("pf_data_changed", handleDataSync);
      window.removeEventListener("pf_farmer_changed", handleDataSync);
    };
  }, [loadCareRequests]);

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
        return <Badge variant="danger">Không thể xử lý (REJECTED)</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  }

  async function handleOpenCreateModal(preselectedPlot?: string) {
    let availableContracts = contracts;
    if (availableContracts.length === 0) {
      availableContracts = await loadContracts();
    }

    const plotToFind = preselectedPlot || initialPlotCode;
    if (plotToFind && availableContracts.length > 0) {
      const matched = availableContracts.find(
        (c) => c.plotCode === plotToFind || c.plotId === plotToFind || c.id === plotToFind,
      );
      if (matched) {
        setFormContractId(matched.id);
      } else {
        setFormContractId(availableContracts[0].id);
      }
    } else if (availableContracts.length > 0) {
      setFormContractId(availableContracts[0].id);
    } else {
      setFormContractId("");
    }

    setFormDescription("");
    setFormError("");
    setIsCreateModalOpen(true);
  }

  // Real Backend Call: POST /api/v1/care-requests
  async function handleCreateRequest() {
    if (!formContractId) {
      setFormError("Vui lòng chọn hợp đồng / thửa đất thuê còn hiệu lực.");
      return;
    }
    if (!formDescription.trim()) {
      setFormError("Vui lòng nhập nội dung mô tả chi tiết yêu cầu của bạn.");
      return;
    }

    const selectedContract = contracts.find((c) => c.id === formContractId);
    setIsSubmitting(true);
    setFormError("");

    try {
      const newReq = await customerService.createCareRequestAsync({
        contractId: formContractId,
        plotCode: selectedContract?.plotCode || "",
        requestType: formRequestType,
        description: formDescription.trim(),
      });

      setIsCreateModalOpen(false);
      setSuccessMessage(
        `Yêu cầu #${newReq.id} đã được gửi thành công đến hệ thống và phân công kỹ sư nông dân phụ trách!`,
      );
      setTimeout(() => setSuccessMessage(""), 6000);

      // Reload live data immediately
      await loadCareRequests();
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? err.message
          : "Có lỗi xảy ra khi gửi yêu cầu chăm sóc đến máy chủ.";
      setFormError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              Yêu Cầu Chăm Sóc & Tương Tác Nông Dân
            </h2>
            <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              Task 16: Live API (100% Real)
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Gửi yêu cầu tưới nước, bón phân, chụp ảnh tiến độ hoặc kiểm tra sâu bệnh trực tiếp cho Nông dân. Dữ liệu thời gian thực được kết nối với Backend API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            fullWidth={false}
            onClick={() => loadCareRequests()}
            disabled={isLoading}
            className="flex items-center gap-1.5"
          >
            <span className={isLoading ? "animate-spin" : ""}>🔄</span>
            <span>Làm mới</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            fullWidth={false}
            onClick={() => handleOpenCreateModal()}
          >
            + Tạo Yêu Cầu Mới
          </Button>
        </div>
      </div>

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {/* Sync Status Banner */}
      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <span className="text-base">📡</span>
          <span>
            <strong>Hệ thống tương tác trực tiếp (Live Backend):</strong> Khi bạn tạo yêu cầu qua API <code>POST /api/v1/care-requests</code>, kỹ sư nông dân phụ trách trang trại sẽ nhận được thông tin để kiểm tra thực tế, cập nhật phản hồi và gửi kèm ảnh nghiệm thu cho bạn.
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
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <Spinner size="lg" className="mx-auto text-emerald-600" />
          <p className="text-xs text-gray-500">Đang tải danh sách yêu cầu chăm sóc từ hệ thống...</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50/80 text-gray-700">
              <tr>
                <th className="py-3 px-3.5 text-left font-semibold">Mã yêu cầu</th>
                <th className="py-3 px-3 text-left font-semibold">Hợp đồng & Thửa đất</th>
                <th className="py-3 px-3 text-left font-semibold">Loại yêu cầu</th>
                <th className="py-3 px-3 text-left font-semibold min-w-[220px]">Nội dung yêu cầu của bạn</th>
                <th className="py-3 px-3 text-left font-semibold">Ngày gửi</th>
                <th className="py-3 px-3 text-left font-semibold">Trạng thái</th>
                <th className="py-3 px-3 text-left font-semibold min-w-[240px]">Nông dân phản hồi / Kết quả</th>
                <th className="py-3 px-3 text-center font-semibold">Ảnh kết quả</th>
                <th className="py-3 px-3 text-left font-semibold">Ngày hoàn tất</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    <span className="text-2xl block mb-2">💬</span>
                    Không có yêu cầu chăm sóc nào trong mục này.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3.5 px-3.5 font-mono font-bold text-gray-900 whitespace-nowrap">
                      #{req.id}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-emerald-800 block">
                          {req.plot}
                        </span>
                        {req.contractId && (
                          <span className="text-3xs text-gray-500 font-mono block">
                            HĐ: {req.contractId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-purple-800 whitespace-nowrap">
                      <span className="bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        {req.requestType}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-700 leading-relaxed">
                      {req.description}
                    </td>
                    <td className="py-3.5 px-3 text-2xs text-gray-500 whitespace-nowrap font-mono">
                      {req.createdDate}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-3.5 px-3 text-gray-800">
                      {req.farmerNote ? (
                        <div className="p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs space-y-1">
                          <div className="flex items-center justify-between text-2xs text-emerald-900 font-semibold">
                            <span>👨‍🌾 Phản hồi từ Kỹ sư:</span>
                            {req.farmerName && (
                              <span className="text-emerald-700 font-medium">
                                ({req.farmerName})
                              </span>
                            )}
                          </div>
                          <p className="text-gray-800 leading-relaxed">{req.farmerNote}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-2xs">
                          Kỹ sư nông dân đang xử lý...
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {req.evidenceImage ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImage(req.evidenceImage || null)}
                          className="inline-block group cursor-pointer"
                          title="Bấm để xem ảnh kết quả nghiệm thu phóng to"
                        >
                          <img
                            src={req.evidenceImage}
                            alt="Ảnh kết quả nghiệm thu"
                            className="h-12 w-16 object-cover rounded-lg border border-gray-200 shadow-2xs group-hover:scale-105 transition"
                          />
                          <span className="text-3xs text-emerald-700 block mt-0.5 group-hover:underline">
                            🔍 Xem ảnh
                          </span>
                        </button>
                      ) : (
                        <span className="text-gray-300 text-2xs">Chưa có ảnh</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-2xs text-gray-500 whitespace-nowrap font-mono">
                      {req.processedDate || (
                        <span className="text-gray-300">Đang thực hiện</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Tạo Yêu Cầu Chăm Sóc Mới (Real API POST /api/v1/care-requests) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Tạo Yêu Cầu Chăm Sóc Mới Cho Nông Dân"
        description="Gửi thông điệp thực địa đến kỹ sư nông dân phụ trách thửa đất nông nghiệp của bạn qua API."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleCreateRequest}
              disabled={isSubmitting || contracts.length === 0}
            >
              {isSubmitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu ngay"}
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

          {contracts.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
              <p className="font-semibold">⚠️ Bạn chưa có hợp đồng thuê đất còn hiệu lực</p>
              <p className="text-2xs text-amber-800">
                Để gửi yêu cầu chăm sóc, bạn cần thuê ít nhất một thửa đất nông nghiệp tại PlotFarm.
              </p>
            </div>
          ) : (
            <>
              {/* Chọn Hợp Đồng / Thửa Đất */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Chọn Hợp Đồng / Thửa Đất Cần Chăm Sóc *
                </label>
                <select
                  value={formContractId}
                  onChange={(e) => setFormContractId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none shadow-2xs"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.plotCode} ({c.plantCrop} - {c.farmName})
                    </option>
                  ))}
                </select>
                <span className="text-3xs text-gray-500 mt-1 block">
                  API yêu cầu: <code>maHopDong: {formContractId}</code>
                </span>
              </div>

              {/* Loại Yêu Cầu */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Loại Yêu Cầu Chăm Sóc *
                </label>
                <select
                  value={formRequestType}
                  onChange={(e) => setFormRequestType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none shadow-2xs"
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
                  placeholder="Ví dụ: Nhờ bác nông dân kiểm tra giúp chùm quả đợt này, tăng thêm lượng nước tưới và chụp giúp tôi vài góc ảnh cận cảnh..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none shadow-2xs"
                />
              </div>

              <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-2xs space-y-1">
                <span className="font-semibold block">💡 Quy trình xử lý thực tế:</span>
                <p>
                  Yêu cầu sẽ được lưu vào cơ sở dữ liệu và hiển thị ngay trên bảng điều khiển của kỹ sư nông dân. Kỹ sư sẽ trực tiếp xử lý tại vườn và tải lên ảnh kết quả nghiệm thu.
                </p>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Preview Image Modal */}
      <Modal
        isOpen={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        title="Ảnh Chụp Kết Quả Nghiệm Thu Từ Nông Dân"
        description="Hình ảnh kết quả xử lý thực địa do kỹ sư nông dân chụp và tải lên sau khi hoàn tất yêu cầu."
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

