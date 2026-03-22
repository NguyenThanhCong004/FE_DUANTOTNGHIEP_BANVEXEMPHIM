import React from "react";
import StaffProfileCard from "../../components/staff/StaffProfileCard";

export default function AdminProfile() {
  return (
    <StaffProfileCard
      title="Hồ sơ quản trị rạp"
      roleLabel="Thông tin tài khoản Admin — chỉnh sửa và đổi mật khẩu qua API nhân viên."
    />
  );
}
