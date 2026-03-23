import React, { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "../../utils/authStorage";
import { apiUrl } from "../../utils/apiClient";
import { USERS } from "../../constants/apiEndpoints";
import AdminPanelPage from "../../components/admin/AdminPanelPage";

const UserManagement = () => {
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
                          <button
                            type="button"
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            onClick={() => {
                              setSelectedItem(user);
                              setShowModal(true);
                            }}
                          >
                            Xem
                          </button>
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
            <div className="admin-modal-body text-center">
              <img
                src={selectedItem.avatar}
                alt=""
                className="rounded-circle border mb-3"
                style={{ width: 120, height: 120, objectFit: "cover", borderWidth: 4 }}
              />
              <p className="admin-form-label mb-1 text-start">Họ và tên</p>
              <p className="fw-bold text-start mb-3">{selectedItem.fullname}</p>
              <p className="admin-form-label mb-1 text-start">Username</p>
              <p className="fw-semibold text-start mb-3">@{selectedItem.username}</p>
              <p className="admin-form-label mb-1 text-start">Email</p>
              <p className="text-start mb-3">{selectedItem.email}</p>
              <p className="admin-form-label mb-1 text-start">Số điện thoại</p>
              <p className="text-start mb-3">{selectedItem.phone}</p>
              <p className="admin-form-label mb-1 text-start">Trạng thái</p>
              <div className="text-start">
                <span
                  className={
                    selectedItem.status === 1 || selectedItem.status === "Active"
                      ? "admin-badge admin-badge-success"
                      : "admin-badge admin-badge-danger"
                  }
                >
                  {selectedItem.status === 1 || selectedItem.status === "Active" ? "Đang hoạt động" : "Đã khóa"}
                </span>
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
