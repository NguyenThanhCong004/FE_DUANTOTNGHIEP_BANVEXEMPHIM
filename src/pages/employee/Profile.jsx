import React from "react";
import StaffProfileCard from "../../components/staff/StaffProfileCard";

export default function EmployeeProfile() {
  return (
    <div
      style={{
        flex: 1,
        overflow: "auto",
        padding: "24px",
        background: "#0f172a",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
        <StaffProfileCard
          title="Hồ sơ nhân viên"
          roleLabel="Cập nhật thông tin cá nhân và đổi mật khẩu tài khoản staff."
          variant="dark"
        />
      </div>
    </div>
  );
}
