import { useState, useEffect } from "react";
import { farmerService } from "./farmer.service";
import type { CareRequestItem, CareRequestStatus, FarmerProfileData } from "./farmer.types";
import { Badge, Button, Modal, Input, Alert } from "../../components/ui";

export default function FarmerRequests() {
  const [profile, setProfile] = useState<FarmerProfileData>(() => farmerService.getFarmerProfile());
  const [requests, setRequests] = useState<CareRequestItem[]>(() =>
    farmerService.getCareRequests(),
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    function handleFarmerChange() {
      setProfile(farmerService.getFarmerProfile());
      setRequests(farmerService.getCareRequests());
      setStatusFilter("ALL");
    }
    window.addEventListener("pf_farmer_changed", handleFarmerChange);
    return () => window.removeEventListener("pf_farmer_changed", handleFarmerChange);
  }, []);

  // Process Modal State
  const [processingReq, setProcessingReq] = useState<CareRequestItem | null>(null);
  const [formStatus, setFormStatus] = useState<CareRequestStatus>("IN_PROGRESS");
  const [formFarmerNote, setFormFarmerNote] = useState("");
  const [formEvidenceImage, setFormEvidenceImage] = useState("");

  const filteredRequests = requests.filter((req) => {
    if (statusFilter === "ALL") return true;
    return req.status === statusFilter;
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

  function handleOpenProcessModal(req: CareRequestItem) {
    setProcessingReq(req);
    // Auto advance status suggestion
    const nextStatus: CareRequestStatus =
      req.status === "PENDING"
        ? "IN_PROGRESS"
        : req.status === "IN_PROGRESS"
        ? "COMPLETED"
        : req.status;

    setFormStatus(nextStatus);
    setFormFarmerNote(req.farmerNote || "");
    setFormEvidenceImage(req.evidenceImage || "");
  }

  function handleSaveProcess() {
    if (!processingReq) return;

    const updated = farmerService.updateCareRequest(processingReq.id, {
      status: formStatus,
      farmerNote: formFarmerNote.trim(),
      evidenceImage: formEvidenceImage.trim(),
    });

    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setProcessingReq(null);
    setSuccessMessage(
      `Đã cập nhật trạng thái yêu cầu #${updated.id} thành [${updated.status}] thành công!`,
    );
    setTimeout(() => setSuccessMessage(""), 4000);
  }

  // Quick 1-click transition helper
  function handleQuickStatusChange(req: CareRequestItem, newStatus: CareRequestStatus) {
    let autoNote = req.farmerNote;
    if (!autoNote) {
      if (newStatus === "IN_PROGRESS") {
        autoNote = "Nông dân đã tiếp nhận và đang tiến hành xử lý thực địa.";
      } else if (newStatus === "COMPLETED") {
        autoNote = "Nông dân đã hoàn thành công việc theo đúng yêu cầu khách hàng.";
      }
    }

    const updated = farmerService.updateCareRequest(req.id, {
      status: newStatus,
      farmerNote: autoNote,
    });

    setRequests((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSuccessMessage(
      `Đã chuyển trạng thái yêu cầu #${req.id} sang [${newStatus}] thành công!`,
    );
    setTimeout(() => setSuccessMessage(""), 3500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Yêu cầu Chăm sóc từ Khách hàng (Care Requests)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Xử lý phản hồi, đổi trạng thái PENDING → IN_PROGRESS → COMPLETED và đính kèm ảnh bằng chứng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            Đang hiển thị: <strong className="text-emerald-700">{filteredRequests.length}</strong> yêu cầu
          </span>
        </div>
      </div>

      {/* Admin Assignment Rule Badge */}
      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <span>
            <strong>Phân quyền Admin:</strong> Chỉ hiển thị các yêu cầu chăm sóc thuộc {profile.assignedPlotCount} thửa đất do Nông dân <strong>{profile.name}</strong> quản lý ({profile.assignedFarms.join(", ")}).
          </span>
        </div>
        <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 shrink-0">
          {requests.length} yêu cầu liên quan
        </span>
      </div>

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {/* Filter Status Tabs */}
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

      {/* Requests Data Table containing all 10 required fields */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50/80 text-gray-700">
            <tr>
              <th className="py-3 px-3 text-left font-semibold">Request ID</th>
              <th className="py-3 px-3 text-left font-semibold">Plot</th>
              <th className="py-3 px-3 text-left font-semibold">Customer</th>
              <th className="py-3 px-3 text-left font-semibold">Request type</th>
              <th className="py-3 px-3 text-left font-semibold min-w-[200px]">Description</th>
              <th className="py-3 px-3 text-left font-semibold">Created date</th>
              <th className="py-3 px-3 text-left font-semibold">Status</th>
              <th className="py-3 px-3 text-left font-semibold min-w-[220px]">Farmer note / Result</th>
              <th className="py-3 px-3 text-center font-semibold">Evidence image</th>
              <th className="py-3 px-3 text-left font-semibold">Processed date</th>
              <th className="py-3 px-3 text-right font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-gray-400">
                  Không có yêu cầu chăm sóc nào trong mục này.
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/70 transition">
                  {/* Request ID */}
                  <td className="py-3.5 px-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                    #{req.id}
                  </td>

                  {/* Plot */}
                  <td className="py-3.5 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                    {req.plot}
                  </td>

                  {/* Customer */}
                  <td className="py-3.5 px-3 font-medium text-gray-900 whitespace-nowrap">
                    {req.customer}
                  </td>

                  {/* Request type */}
                  <td className="py-3.5 px-3 font-semibold text-purple-800 whitespace-nowrap">
                    {req.requestType}
                  </td>

                  {/* Description */}
                  <td className="py-3.5 px-3 text-gray-700 leading-relaxed">
                    {req.description}
                  </td>

                  {/* Created date */}
                  <td className="py-3.5 px-3 text-2xs text-gray-500 whitespace-nowrap">
                    {req.createdDate}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {getStatusBadge(req.status)}
                  </td>

                  {/* Farmer note / Result */}
                  <td className="py-3.5 px-3 text-gray-800 font-medium">
                    {req.farmerNote ? (
                      <span className="leading-relaxed">{req.farmerNote}</span>
                    ) : (
                      <span className="text-gray-400 italic text-2xs">Chưa có ghi chú phản hồi</span>
                    )}
                  </td>

                  {/* Evidence image */}
                  <td className="py-3.5 px-3 text-center whitespace-nowrap">
                    {req.evidenceImage ? (
                      <a
                        href={req.evidenceImage}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-block group"
                        title="Xem ảnh bằng chứng"
                      >
                        <img
                          src={req.evidenceImage}
                          alt="Bằng chứng xử lý"
                          className="h-10 w-14 object-cover rounded-md border border-gray-200 shadow-2xs group-hover:scale-105 transition"
                        />
                        <span className="text-2xs text-emerald-700 block mt-0.5 group-hover:underline">
                          Xem ảnh
                        </span>
                      </a>
                    ) : (
                      <span className="text-gray-300 text-2xs">--</span>
                    )}
                  </td>

                  {/* Processed date */}
                  <td className="py-3.5 px-3 text-2xs text-gray-500 whitespace-nowrap">
                    {req.processedDate || <span className="text-gray-300">Chưa xử lý</span>}
                  </td>

                  {/* Action buttons */}
                  <td className="py-3.5 px-3 text-right whitespace-nowrap space-x-1.5">
                    {req.status === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(req, "IN_PROGRESS")}
                        className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium text-2xs cursor-pointer"
                        title="Chuyển sang Đang thực hiện"
                      >
                        ▶ Bắt đầu
                      </button>
                    )}

                    {req.status === "IN_PROGRESS" && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatusChange(req, "COMPLETED")}
                        className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-medium text-2xs cursor-pointer"
                        title="Đánh dấu Hoàn thành"
                      >
                        ✓ Xong
                      </button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth={false}
                      onClick={() => handleOpenProcessModal(req)}
                    >
                      Chi tiết & Xử lý
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Xử lý / Cập nhật trạng thái Care Request */}
      <Modal
        isOpen={Boolean(processingReq)}
        onClose={() => setProcessingReq(null)}
        title={`Xử lý Yêu cầu chăm sóc: #${processingReq?.id} (Thửa ${processingReq?.plot})`}
        description="Đổi trạng thái xử lý, nhập ghi chú giải quyết và đính kèm ảnh chụp kết quả cho khách hàng."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              fullWidth={false}
              onClick={() => setProcessingReq(null)}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              size="sm"
              fullWidth={false}
              onClick={handleSaveProcess}
            >
              Lưu kết quả xử lý
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Thông tin yêu cầu ban đầu */}
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-900">
                Khách hàng: {processingReq?.customer}
              </span>
              <span className="text-purple-700 font-semibold">
                {processingReq?.requestType}
              </span>
            </div>
            <p className="text-gray-700 italic bg-white p-2 rounded border border-gray-200">
              "{processingReq?.description}"
            </p>
            <p className="text-2xs text-gray-400">
              Thời gian gửi: {processingReq?.createdDate}
            </p>
          </div>

          {/* Chọn trạng thái mới */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Trạng thái xử lý (Status) *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormStatus("PENDING")}
                className={`p-2 rounded-lg border text-left cursor-pointer transition ${
                  formStatus === "PENDING"
                    ? "border-amber-500 bg-amber-50 text-amber-900 font-bold"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                1. PENDING (Chờ xử lý)
              </button>

              <button
                type="button"
                onClick={() => setFormStatus("IN_PROGRESS")}
                className={`p-2 rounded-lg border text-left cursor-pointer transition ${
                  formStatus === "IN_PROGRESS"
                    ? "border-blue-500 bg-blue-50 text-blue-900 font-bold"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                2. IN_PROGRESS (Đang làm)
              </button>

              <button
                type="button"
                onClick={() => setFormStatus("COMPLETED")}
                className={`p-2 rounded-lg border text-left cursor-pointer transition ${
                  formStatus === "COMPLETED"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                3. COMPLETED (Hoàn tất)
              </button>

              <button
                type="button"
                onClick={() => setFormStatus("CANNOT_RESOLVE")}
                className={`p-2 rounded-lg border text-left cursor-pointer transition ${
                  formStatus === "CANNOT_RESOLVE"
                    ? "border-red-500 bg-red-50 text-red-900 font-bold"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                4. CANNOT_RESOLVE (Từ chối/Khó)
              </button>
            </div>
          </div>

          {/* Ghi chú phản hồi của nông dân */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Ghi chú phản hồi của Nông Dân (Farmer note / Result) *
            </label>
            <textarea
              rows={3}
              placeholder="Nhập chi tiết hành động đã thực hiện (ví dụ: Đã kiểm tra lá, xịt dầu neem lúc 15h, độ ẩm đo được 68%...)"
              value={formFarmerNote}
              onChange={(e) => setFormFarmerNote(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2.5 text-xs bg-white focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Ảnh minh chứng kết quả */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Ảnh chụp bằng chứng sau khi xử lý (Evidence Image URL):
            </label>
            <Input
              placeholder="https://..."
              value={formEvidenceImage}
              onChange={(e) => setFormEvidenceImage(e.target.value)}
            />
            <div className="flex gap-2 mt-1.5 text-2xs text-gray-500">
              <span>Mẫu ảnh:</span>
              <button
                type="button"
                className="text-emerald-700 underline cursor-pointer"
                onClick={() =>
                  setFormEvidenceImage(
                    "https://images.unsplash.com/photo-1592417817098-8f3d69106093?w=400&auto=format&fit=crop&q=80",
                  )
                }
              >
                Ảnh cà chua bi tưới
              </button>
              <span>•</span>
              <button
                type="button"
                className="text-emerald-700 underline cursor-pointer"
                onClick={() =>
                  setFormEvidenceImage(
                    "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&auto=format&fit=crop&q=80",
                  )
                }
              >
                Ảnh kiểm tra lá dưa
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
