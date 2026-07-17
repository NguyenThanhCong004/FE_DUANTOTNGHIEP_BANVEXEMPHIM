import React from "react";

/**
 * Vỏ trang quản trị thống nhất:
 * `admin-page` + `superadmin-page` + header gọn (`.admin-header`).
 *
 * @param {React.ReactNode} [title] - Tiêu đề (chuỗi hoặc node)
 * @param {React.ReactNode} [description] - Mô tả dưới tiêu đề (chuỗi → bọc `<p className="lead">`)
 * @param {React.ReactNode} [headerRight] - Nút / nhóm bên phải header
 * @param {string} [className] - Thêm class cho wrapper (vd: `showtime-schedule-page`)
 */
export default function AdminPanelPage({
  title,
  description,
  headerRight,
  children,
  className = "",
}) {
  const descNode =
    description == null || description === false ? null : typeof description === "string" ? (
      <p className="lead mb-0">{description}</p>
    ) : (
      description
    );

  return (
    <div className={`admin-page superadmin-page admin-fade-in ${className}`.trim()}>
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>
              {title}
            </h1>
            {descNode}
          </div>
          {headerRight}
        </div>
      </div>
      {children}
    </div>
  );
}
