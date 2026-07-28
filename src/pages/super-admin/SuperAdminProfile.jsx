import React from "react";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import StaffProfileCard from "../../components/staff/StaffProfileCard";

export default function SuperAdminProfile() {
  return (
    <AdminPanelPage
      icon="person-circle"
      title="Hồ sơ Super Admin"
    >
      <StaffProfileCard variant="light" hideHeader title="" roleLabel="" />
    </AdminPanelPage>
  );
}
