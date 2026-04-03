import React, { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "../../utils/authStorage";
import { apiUrl } from "../../utils/apiClient";
import { USERS } from "../../constants/apiEndpoints";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { useNavigate } from "react-router-dom";

const UserManagement = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const itemsPerPage = 10;

  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const token = getAccessToken();
        const res = await fetch(apiUrl(USERS.LIST), {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (mounted) setAllUsers(Array.isArray(list) ? list : []);
      } catch {
        if (mounted) setAllUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter((user) => {
      const fullname = String(user.fullname ?? "").toLowerCase();
      const username = String(user.username ?? "").toLowerCase();
      const email = String(user.email ?? "").toLowerCase();
      const phone = String(user.phone ?? "");
      return fullname.includes(q) || username.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [allUsers, searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handleEditUser = (user) => {
    // Chuyển đến trang edit user với state chứa thông tin user
    navigate('/super-admin/users/edit', { state: { editUser: user } });
  };

  return (
    <AdminPanelPage
      icon="people"
      title="Người dùng"
      description="Khách hàng đã đăng ký trong hệ thống."
    >
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-list-ul text-primary"></i>
            Danh sách khách hàng
          </h4>
          <span className="text-muted small">Tổng: {filteredUsers.length}</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-search-wrapper mb-3" style={{ maxWidth: 420 }}>
            <i className="bi bi-search admin-search-icon" aria-hidden />
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm theo tên, username, email, SĐT..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Tìm người dùng"
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Tài khoản</th>
                  <th>Liên hệ</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      Không có dữ liệu người dùng.
                    </td>
                  </tr>
                ) : (
                  currentItems.map((user) => {
                    const isActive = user.status === 1 || user.status === "Active";
                    return (
                      <tr key={user.userId ?? user.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={user.avatar}
                              alt=""
                              className="rounded-circle border flex-shrink-0"
                              style={{ width: 40, height: 40, objectFit: "cover" }}
                            />
                            <div>
                              <div className="fw-semibold">{user.fullname}</div>
                              <div className="small text-muted">ID: #{user.userId}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="fw-medium">@{user.username}</span>
                        </td>
                        <td>
                          <div className="small text-muted">
                            <div>
                              <i className="bi bi-envelope me-2"></i>
                              {user.email}
                            </div>
                            <div>
                              <i className="bi bi-telephone me-2"></i>
                              {user.phone}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={isActive ? "admin-badge admin-badge-success" : "admin-badge admin-badge-danger"}>
                            {isActive ? "Đang hoạt động" : "Đã khóa"}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-1 justify-content-center">
                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-outline-primary"
                              onClick={() => handleEditUser(user)}
                              title="Sửa thông tin"
                            >
                              <i className="bi bi-pencil"></i>
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-sm admin-btn-outline"
                              onClick={() => {
                                setSelectedItem(user);
                                setShowModal(true);
                              }}
                              title="Xem chi tiết"
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="admin-pagination-wrap mt-3">
              <div className="admin-pagination-meta text-muted small mb-2">
                Hiển thị <b>{currentItems.length}</b> trên <b>{filteredUsers.length}</b> khách hàng
              </div>
              <div className="admin-pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    type="button"
                    className={`admin-pagination-btn ${currentPage === i + 1 ? "active" : ""}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedItem && (
        <div className="admin-modal-overlay" role="presentation" onClick={() => setShowModal(false)}>
          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3>Thông tin khách hàng</h3>
              <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="text-center mb-4">
                <img
                  src={selectedItem.avatar}
                  alt=""
                  className="rounded-circle border mb-3"
                  style={{ width: 120, height: 120, objectFit: "cover", borderWidth: 4 }}
                />
                <h5 className="mb-2">{selectedItem.fullname}</h5>
                <span className={`admin-badge ${selectedItem.status === 1 || selectedItem.status === "Active" ? "admin-badge-success" : "admin-badge-danger"}`}>
                  {selectedItem.status === 1 || selectedItem.status === "Active" ? "Đang hoạt động" : "Đã khóa"}
                </span>
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <p className="admin-form-label mb-1">ID Người dùng</p>
                  <p className="fw-semibold mb-3">#{selectedItem.userId || selectedItem.id}</p>
                </div>
                <div className="col-md-6">
                  <p className="admin-form-label mb-1">Username</p>
                  <p className="fw-semibold mb-3">@{selectedItem.username}</p>
                </div>
                <div className="col-md-6">
                  <p className="admin-form-label mb-1">Email</p>
                  <p className="mb-3">{selectedItem.email}</p>
                </div>
                <div className="col-md-6">
                  <p className="admin-form-label mb-1">Số điện thoại</p>
                  <p className="mb-3">{selectedItem.phone || "Chưa cung cấp"}</p>
                </div>
                <div className="col-md-6">
                  <p className="admin-form-label mb-1">Ngày sinh</p>
                  <p className="mb-3">{selectedItem.birthday || "Chưa cung cấp"}</p>
                </div>
                <div className="col-md-6">
                  <p className="admin-form-label mb-1">Điểm tích lũy</p>
                  <p className="mb-3">
                    <span className="badge bg-warning text-dark">{selectedItem.points || 0} điểm</span>
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="admin-form-label mb-1">Tổng chi tiêu</p>
                  <p className="mb-3">
                    <span className="text-success fw-bold">
                      {selectedItem.totalSpending ? `${Number(selectedItem.totalSpending).toLocaleString('vi-VN')} VNĐ` : "0 VNĐ"}
                    </span>
                  </p>
                </div>
                <div className="col-md-6">
                  <p className="admin-form-label mb-1">Ngày tham gia</p>
                  <p className="mb-3">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleDateString('vi-VN') : "Không rõ"}</p>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="admin-btn admin-btn-primary" onClick={() => setShowModal(false)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPanelPage>
  );
};

export default UserManagement;
