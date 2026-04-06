import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../../utils/apiClient";
import { USERS } from "../../constants/apiEndpoints";
import AdminPanelPage from "../../components/admin/AdminPanelPage";

export default function EditUser() {
  const navigate = useNavigate();
  const location = useLocation();
  const editUser = location.state?.editUser;
  
  const [formData, setFormData] = useState({
    userId: "",
    fullname: "",
    email: "",
    phone: "",
    status: 1,
    username: "",
    rankName: "",
    totalSpending: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (editUser) {
      setFormData({
        userId: editUser.userId || editUser.id || "",
        fullname: editUser.fullname || "",
        email: editUser.email || "",
        phone: editUser.phone || "",
        status: editUser.status === 0 || editUser.status === "Inactive" ? 0 : 1,
        username: editUser.username || "",
        rankName: editUser.rankName || "Hạng đồng",
        totalSpending: editUser.totalSpending || 0,
      });
    }
  }, [editUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setServerError("");
    setSuccess("");

    try {
      const body = {
        status: Number(formData.status),
      };

      const res = await apiFetch(USERS.BY_ID(formData.userId), {
        method: "PUT",
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setServerError(json?.message || "Cập nhật người dùng thất bại");
        setSubmitting(false);
        return;
      }

      setSuccess("Cập nhật trạng thái người dùng thành công! Hạng thành viên đã được tự động kiểm tra.");
      setTimeout(() => {
        navigate("/super-admin/users");
      }, 1500);
    } catch {
      setServerError("Không thể kết nối tới server");
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setServerError("");
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
    <AdminPanelPage
      icon="person-gear"
      title="Cập nhật trạng thái khách hàng"
      description={`Chỉnh sửa quyền truy cập cho tài khoản: ${formData.fullname}`}
    >
      <div className="admin-card admin-slide-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="admin-card-header">
          <h4 className="mb-0">
            <i className="bi bi-shield-lock text-primary me-2"></i>
            Quản lý trạng thái & Hạng
          </h4>
        </div>
        
        <div className="admin-card-body p-4">
          {serverError && (
            <div className="alert alert-danger mb-4 admin-slide-up">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              {serverError}
            </div>
          )}
          {success && (
            <div className="alert alert-success mb-4 admin-slide-up">
              <i className="bi bi-check-circle-fill me-2"></i>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              {/* Read-only info section */}
              <div className="col-md-6">
                <label className="admin-form-label">Tên khách hàng</label>
                <div className="admin-search-wrapper w-100 mt-1 opacity-75">
                  <i className="bi bi-person admin-search-icon" style={{ left: '15px' }}></i>
                  <input type="text" className="admin-search-input w-100" style={{ paddingLeft: '45px', background: '#f8f9fa' }} value={formData.fullname} disabled />
                </div>
              </div>

              <div className="col-md-6">
                <label className="admin-form-label">Tên đăng nhập</label>
                <div className="admin-search-wrapper w-100 mt-1 opacity-75">
                  <i className="bi bi-at admin-search-icon" style={{ left: '15px' }}></i>
                  <input type="text" className="admin-search-input w-100" style={{ paddingLeft: '45px', background: '#f8f9fa' }} value={formData.username} disabled />
                </div>
              </div>

              <div className="col-md-6">
                <label className="admin-form-label">Tổng chi tiêu</label>
                <div className="admin-search-wrapper w-100 mt-1 opacity-75">
                  <i className="bi bi-cash-stack admin-search-icon" style={{ left: '15px' }}></i>
                  <input type="text" className="admin-search-input w-100 fw-bold text-success" style={{ paddingLeft: '45px', background: '#f8f9fa' }} value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.totalSpending)} disabled />
                </div>
              </div>

              <div className="col-md-6">
                <label className="admin-form-label">Hạng hiện tại (Tự động)</label>
                <div className="admin-search-wrapper w-100 mt-1 opacity-75">
                  <i className="bi bi-star-fill admin-search-icon text-warning" style={{ left: '15px' }}></i>
                  <input type="text" className="admin-search-input w-100 fw-bold text-primary" style={{ paddingLeft: '45px', background: '#f8f9fa' }} value={formData.rankName} disabled />
                </div>
                <small className="text-muted italic">Hạng được hệ thống tự động cập nhật dựa trên chi tiêu.</small>
              </div>

              {/* Editable section */}
              <div className="col-12 mt-2 pt-3 border-top">
                <div className="row justify-content-center">
                  <div className="col-md-6">
                    <label className="admin-form-label fw-bold text-dark">
                      Trạng thái hoạt động <span className="text-danger">*</span>
                    </label>
                    <div className="mt-1">
                      <select 
                        name="status"
                        className="admin-search-input w-100 border-primary"
                        style={{ background: 'white', padding: '0 15px', height: '50px', border: '2px solid' }}
                        value={formData.status}
                        onChange={handleChange}
                        disabled={submitting}
                      >
                        <option value={1}>Đang hoạt động (Active)</option>
                        <option value={0}>Đã khóa tài khoản (Locked)</option>
                      </select>
                    </div>
                    <p className="small text-muted mt-2">
                      <i className="bi bi-info-circle me-1"></i>
                      Khóa tài khoản sẽ ngăn người dùng đăng nhập vào hệ thống.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 d-flex justify-content-center gap-3">
              <button 
                type="button" 
                className="admin-btn admin-btn-outline" 
                style={{ minWidth: '140px' }}
                onClick={() => navigate('/super-admin/users')}
                disabled={submitting}
              >
                <i className="bi bi-x-circle me-2"></i>
                Hủy bỏ
              </button>
              <button 
                type="submit" 
                className="admin-btn admin-btn-primary"
                style={{ minWidth: '200px' }}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-2"></i>
                    Cập nhật trạng thái
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPanelPage>
  );
}
