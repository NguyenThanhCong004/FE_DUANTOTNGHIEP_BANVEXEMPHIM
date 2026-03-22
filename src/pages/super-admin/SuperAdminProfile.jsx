import React from "react";
import StaffProfileCard from "../../components/staff/StaffProfileCard";

export default function SuperAdminProfile() {
  return (
    <StaffProfileCard
      title="Hồ sơ Super Admin"
      roleLabel="Điều hành toàn hệ thống — chỉnh sửa thông tin và đổi mật khẩu (API nhân viên)."
    />
  );
}
