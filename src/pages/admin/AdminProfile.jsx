import React from "react";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import StaffProfileCard from "../../components/staff/StaffProfileCard";

export default function AdminProfile() {
  return (
    <AdminPanelPage
      icon="person-circle"
      title="Hồ sơ quản trị rạp"
    >
      <StaffProfileCard variant="light" hideHeader title="" roleLabel="" />
    </AdminPanelPage>
  );
}
