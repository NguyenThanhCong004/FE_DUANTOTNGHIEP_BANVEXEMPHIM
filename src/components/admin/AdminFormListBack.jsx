import { useNavigate } from "react-router-dom";

/** Nút quay về trang danh sách — đặt trong `headerRight` của AdminPanelPage. */
export default function AdminFormListBack({ to, label = "Danh sách" }) {
  const navigate = useNavigate();
  return (
    <button type="button" className="admin-btn admin-btn-outline text-nowrap" onClick={() => navigate(to)}>
      {label}
    </button>
  );
}
