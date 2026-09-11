import type { FarmerProfileData } from "../farmer.types";
import { Card, Badge, Button } from "../../../components/ui";

interface FarmerProfileHeaderProps {
  profile: FarmerProfileData;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export default function FarmerProfileHeader({
  profile,
  isEditing,
  onToggleEdit,
}: FarmerProfileHeaderProps) {
  return (
    <Card className="p-6 text-center space-y-4">
      <div className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-800 text-4xl shadow-sm border-2 border-emerald-200">
        {profile.avatarIcon || "👨‍🌾"}
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-900">{profile.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{profile.email}</p>
        <div className="mt-2 flex justify-center gap-1.5 flex-wrap">
          <Badge variant="success">FARMER (Nông Dân)</Badge>
          <Badge variant="info">Admin phân công</Badge>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-2 text-xs text-left">
        <div className="flex justify-between py-1">
          <span className="text-gray-500">Mã nhân sự:</span>
          <span className="font-mono font-bold text-gray-900">{profile.id}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-500">Tài khoản (Username):</span>
          <span className="font-mono font-medium text-emerald-800">@{profile.username}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-500">Chức vụ:</span>
          <span className="font-medium text-gray-800 text-right">{profile.roleTitle || "Kỹ thuật viên Nông vụ"}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-500">Tham gia hệ thống:</span>
          <span className="font-medium text-gray-800">{profile.joinedDate || "10/01/2023"}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-gray-500">Trạng thái:</span>
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Đang trực đồng ruộng
          </span>
        </div>
      </div>

      {!isEditing && (
        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            fullWidth={true}
            onClick={onToggleEdit}
          >
            Chỉnh sửa thông tin liên hệ
          </Button>
        </div>
      )}
    </Card>
  );
}
