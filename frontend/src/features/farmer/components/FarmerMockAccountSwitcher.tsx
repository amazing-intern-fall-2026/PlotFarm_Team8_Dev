import { Card, Badge, Button } from "../../../components/ui";
import { farmerService } from "../farmer.service";
import type { FarmerProfileData } from "../farmer.types";

interface FarmerMockAccountSwitcherProps {
  currentFarmerId: string;
  onFarmerSwitched: (newProfile: FarmerProfileData) => void;
}

export default function FarmerMockAccountSwitcher({
  currentFarmerId,
  onFarmerSwitched,
}: FarmerMockAccountSwitcherProps) {
  const availableFarmers = farmerService.getAvailableDemoFarmers();

  function handleSwitch(id: string) {
    if (id === currentFarmerId) return;
    const switched = farmerService.switchActiveFarmer(id as "NV0001" | "NV0002" | "NV0003");
    onFarmerSwitched(switched);
  }

  return (
    <Card className="p-5 border-emerald-200 bg-linear-to-br from-emerald-50/50 via-white to-teal-50/40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">🧪</span>
            <h4 className="font-bold text-gray-900 text-sm">
              Bộ chuyển đổi Tài khoản Nông Dân Kiểm Thử (Mock Switcher)
            </h4>
            <Badge variant="success" size="sm">
              Dành cho Test UI
            </Badge>
          </div>
          <p className="text-2xs text-gray-600 mt-1">
            Quy tắc: <strong>"Farmer chỉ thấy và thao tác trên Farm/Plot được Admin phân công"</strong>.
            Chuyển tài khoản bên dưới để kiểm tra việc cô lập dữ liệu giữa các Nông Dân.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {availableFarmers.map((f) => {
          const isActive = f.id === currentFarmerId;
          return (
            <div
              key={f.id}
              className={`p-3.5 rounded-xl border transition flex flex-col justify-between ${
                isActive
                  ? "border-emerald-600 bg-emerald-50/90 shadow-xs ring-2 ring-emerald-500/20"
                  : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50/80"
              }`}
            >
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{f.avatarIcon || "👨‍🌾"}</span>
                    <div>
                      <span className="font-bold text-gray-900 block leading-tight">
                        {f.name}
                      </span>
                      <span className="text-2xs font-mono text-gray-500">
                        ID: {f.id} • @{f.username}
                      </span>
                    </div>
                  </div>
                  {isActive && (
                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-600 text-white">
                      Đang chọn
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-2xs text-gray-600 border-t border-gray-100 pt-2">
                  <div>
                    <span className="font-semibold text-gray-700">Farm Admin giao:</span>
                    <ul className="list-disc list-inside mt-0.5 space-y-0.5 text-gray-600">
                      {f.assignedFarms.map((farm, i) => (
                        <li key={i} className="truncate" title={farm}>
                          {farm}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-semibold text-gray-700">Số thửa phụ trách:</span>
                    <strong className="text-emerald-800">{f.assignedPlotCount} Thửa đất</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  variant={isActive ? "secondary" : "outline"}
                  size="sm"
                  fullWidth={true}
                  disabled={isActive}
                  onClick={() => handleSwitch(f.id)}
                >
                  {isActive ? "✓ Đang đăng nhập" : `Chuyển sang ${f.name}`}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
