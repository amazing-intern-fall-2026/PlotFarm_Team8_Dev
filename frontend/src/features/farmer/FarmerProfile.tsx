import { useState, useEffect } from "react";
import { getCurrentUser, saveAuthSession } from "../auth/auth.api";
import { farmerService } from "./farmer.service";
import type { FarmerProfileData, FarmerPlotItem } from "./farmer.types";
import { Card, Alert } from "../../components/ui";
import {
  FarmerProfileHeader,
  FarmerProfileForm,
  FarmerAssignedFarmsList,
  FarmerMockAccountSwitcher,
} from "./components";

export default function FarmerProfile() {
  const authUser = getCurrentUser();
  const [profile, setProfile] = useState<FarmerProfileData>(() =>
    farmerService.getFarmerProfile(),
  );
  const [plots, setPlots] = useState<FarmerPlotItem[]>(() =>
    farmerService.getPlots(),
  );

  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleFarmerChange() {
      setProfile(farmerService.getFarmerProfile());
      setPlots(farmerService.getPlots());
      setIsEditing(false);
    }
    window.addEventListener("pf_farmer_changed", handleFarmerChange);
    return () => window.removeEventListener("pf_farmer_changed", handleFarmerChange);
  }, []);

  function handleSaveProfile(formData: {
    name: string;
    email: string;
    phone: string;
    bio: string;
  }) {
    setLoading(true);
    try {
      const updated = farmerService.updateFarmerProfile({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
      });

      setProfile(updated);
      setIsEditing(false);

      // Sync auth session if matching current user
      if (authUser) {
        saveAuthSession({
          accessToken: localStorage.getItem("accessToken") || "",
          user: {
            ...authUser,
            fullName: updated.name,
            email: updated.email,
          },
        });
      }

      setSuccessMessage("Cập nhật thông tin hồ sơ Nông Dân thành công!");
      setTimeout(() => setSuccessMessage(""), 3500);
    } finally {
      setLoading(false);
    }
  }

  function handleFarmerSwitched(newProfile: FarmerProfileData) {
    setProfile(newProfile);
    setPlots(farmerService.getPlots(newProfile.id));
    setIsEditing(false);
    setSuccessMessage(`Đã chuyển sang tài khoản Nông Dân: ${newProfile.name} (${newProfile.id}) thành công!`);
    setTimeout(() => setSuccessMessage(""), 3500);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Hồ sơ Cá nhân Nông Dân (Farmer Profile)
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Thông tin liên hệ cá nhân, danh sách nông trại và số lượng thửa đất được Admin phân công.
        </p>
      </div>

      {successMessage && (
        <Alert variant="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      )}

      {/* Main Profile Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary Component */}
        <FarmerProfileHeader
          profile={profile}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(true)}
        />

        {/* Right Column: 5 Core Required Fields & Edit Form */}
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4 flex items-center justify-between">
              <span>Thông tin chi tiết Nông Dân</span>
              {isEditing ? (
                <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                  Đang chỉnh sửa
                </span>
              ) : (
                <span className="text-2xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                  {profile.assignedFarms.length} Trang trại được giao
                </span>
              )}
            </h3>

            {isEditing ? (
              <FarmerProfileForm
                profile={profile}
                loading={loading}
                onSave={handleSaveProfile}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <FarmerAssignedFarmsList
                profile={profile}
                plots={plots}
              />
            )}
          </Card>
        </div>
      </div>

      {/* Interactive Mock Account Switcher for Testing */}
      <FarmerMockAccountSwitcher
        currentFarmerId={profile.id}
        onFarmerSwitched={handleFarmerSwitched}
      />
    </div>
  );
}
