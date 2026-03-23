import React from "react";

/**
 * Vỏ nội dung thống nhất cho trang khách (trong Layout + Navbar/Footer).
 * Đồng bộ chiều ngang với Navbar: max-w-7xl / padding (xem public-theme.css).
 */
export default function CustomerPageShell({
  variant = "contained",
  className = "",
  innerClassName = "",
  style,
  children,
}) {
  if (variant === "full") {
    return (
      <div
        className={`customer-page customer-page--full w-full ${className}`.trim()}
        style={style}
      >
        {children}
      </div>
    );
  }
  return (
    <div className={`customer-page w-full ${className}`.trim()} style={style}>
      <div className={`customer-page-container ${innerClassName}`.trim()}>{children}</div>
    </div>
  );
}
