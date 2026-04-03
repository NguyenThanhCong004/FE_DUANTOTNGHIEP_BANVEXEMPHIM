import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAccessToken } from "../../utils/authStorage";
import { apiUrl } from "../../utils/apiClient";
import { USERS } from "../../constants/apiEndpoints";
import AdminPanelPage from "../../components/admin/AdminPanelPage";

export default function EditUser() {
  const navigate = useNavigate();
  const location = useLocation();
  const editUser = location.state?.editUser;
  
  const [form, setForm] = useState({
    userId: "",
    fullname: "",
    email: "",
    phone: "",
    birthday: "",
    status: 1,
    points: 0,
    avatar: "",
    username: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (editUser) {
      setForm({
        userId: editUser.userId || editUser.id || "",
        fullname: editUser.fullname || "",
        email: editUser.email || "",
        phone: editUser.phone || "",
        birthday: editUser.birthday || "",
        status: editUser.status === 0 || editUser.status === "Inactive" ? 0 : 1,
        points: editUser.points || 0,
        avatar: editUser.avatar || "",
        username: editUser.username || "",
      });
    }
  }, [editUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = getAccessToken();
      const res = await fetch(apiUrl(USERS.UPDATE(form.userId)), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: form.status,
        }),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.message || "Cập nhật người dùng thất bại");
        return;
      }

      setSuccess("Cập nhật thông tin người dùng thành công!");
      setTimeout(() => {
        navigate("/super-admin/users");
      }, 1500);
    } catch {
      setError("Không thể kết nối tới server");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    const value = field === "status" || field === "points" 
      ? (field === "status" ? parseInt(e.target.value) : parseInt(e.target.value) || 0)
      : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  if (!editUser) {
    return (
      <AdminPanelPage icon="people" title="Lỗi" description="Không tìm thấy thông tin người dùng">
        <div className="admin-card">
          <div className="admin-card-body text-center py-5">
            <p className="text-danger">Không tìm thấy thông tin người dùng để sửa.</p>
            <button 
              className="admin-btn admin-btn-primary"
              onClick={() => navigate("/super-admin/users")}
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </AdminPanelPage>
    );
  }

  return (
    <AdminPanelPage icon="people" title="Sửa trạng thái người dùng" description="Thay đổi trạng thái hoạt động của khách hàng">
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4 className="mb-0">Chỉnh sửa trạng thái người dùng</h4>
          <button 
            className="admin-btn admin-btn-outline-secondary"
            onClick={() => navigate("/super-admin/users")}
          >
            <i className="bi bi-arrow-left me-2"></i>
            Quay lại
          </button>
        </div>
        <div className="admin-card-body">
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="admin-form-label">Tên đăng nhập</label>
                <input
                  type="text"
                  className="admin-form-control"
                  value={form.username}
                  disabled
                  title="Tên đăng nhập không thể thay đổi"
                />
                <small className="text-muted">Tên đăng nhập không thể thay đổi</small>
              </div>
              
              <div className="col-md-6">
                <label className="admin-form-label">Họ và tên</label>
                <input
                  type="text"
                  className="admin-form-control"
                  value={form.fullname}
                  disabled
                  title="Họ và tên không thể thay đổi"
                />
                <small className="text-muted">Họ và tên không thể thay đổi</small>
              </div>

              <div className="col-md-6">
                <label className="admin-form-label">Email</label>
                <input
                  type="email"
                  className="admin-form-control"
                  value={form.email}
                  disabled
                  title="Email không thể thay đổi"
                />
                <small className="text-muted">Email không thể thay đổi</small>
              </div>

              <div className="col-md-6">
                <label className="admin-form-label">Số điện thoại</label>
                <input
                  type="tel"
                  className="admin-form-control"
                  value={form.phone}
                  disabled
                  title="Số điện thoại không thể thay đổi"
                />
                <small className="text-muted">Số điện thoại không thể thay đổi</small>
              </div>

              <div className="col-md-6">
                <label className="admin-form-label">Ngày sinh</label>
                <input
                  type="date"
                  className="admin-form-control"
                  value={form.birthday}
                  disabled
                  title="Ngày sinh không thể thay đổi"
                />
                <small className="text-muted">Ngày sinh không thể thay đổi</small>
              </div>

              <div className="col-md-6">
                <label className="admin-form-label">Điểm tích lũy</label>
                <input
                  type="number"
                  className="admin-form-control"
                  value={form.points}
                  disabled
                  title="Điểm tích lũy không thể thay đổi"
                />
                <small className="text-muted">Điểm tích lũy không thể thay đổi</small>
              </div>

              <div className="col-md-6">
                <label className="admin-form-label">Trạng thái <span className="text-danger">*</span></label>
                <select
                  className="admin-form-control"
                  value={form.status}
                  onChange={handleChange("status")}
                  required
                >
                  <option value={1}>Đang hoạt động</option>
                  <option value={0}>Đã khóa</option>
                </select>
                <small className="text-info">Chỉ có thể thay đổi trạng thái tài khoản</small>
              </div>

              <div className="col-md-6">
                <label className="admin-form-label">Avatar URL</label>
                <input
                  type="url"
                  className="admin-form-control"
                  value={form.avatar}
                  disabled
                  title="Avatar không thể thay đổi"
                />
                <small className="text-muted">Avatar không thể thay đổi</small>
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button
                type="submit"
                className="admin-btn admin-btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-2"></i>
                    Lưu thay đổi
                  </>
                )}
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-outline-secondary"
                onClick={() => navigate("/super-admin/users")}
              >
                <i className="bi bi-x-circle me-2"></i>
                Hủy
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPanelPage>
  );
}
