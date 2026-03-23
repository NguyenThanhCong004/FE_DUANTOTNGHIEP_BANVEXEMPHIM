import React from "react";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import StaffProfileCard from "../../components/staff/StaffProfileCard";

export default function SuperAdminProfile() {
  return (
    <AdminPanelPage
      icon="person-circle"
      title="Hồ sơ Super Admin"
      description="Điều hành toàn hệ thống — chỉnh sửa thông tin và đổi mật khẩu (API nhân viên)."
    >
      <StaffProfileCard variant="light" hideHeader title="" roleLabel="" />
    </AdminPanelPage>
  );
}
