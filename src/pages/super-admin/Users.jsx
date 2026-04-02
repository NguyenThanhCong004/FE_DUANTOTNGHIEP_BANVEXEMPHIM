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
    navigate('/super-admin/users/edit', { state: { editUser: user } });
  };

  return (
    <AdminPanelPage
      icon="people"
      title="Quản lý khách hàng"
      description="Xem thông tin chi tiết, lịch sử chi tiêu và hạng thành viên của khách hàng."
    >
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-list-ul text-primary"></i>
            Danh sách khách hàng
          </h4>
          <span className="text-muted small">Tổng cộng: {filteredUsers.length}</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-search-wrapper mb-4" style={{ maxWidth: 420 }}>
            <i className="bi bi-search admin-search-icon"></i>
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm theo tên, username, email, SĐT..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Hạng</th>
                  <th>Liên hệ</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-5">Đang tải dữ liệu...</td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-5">Không có dữ liệu người dùng.</td></tr>
                ) : (
                  currentItems.map((user) => {
                    const isActive = user.status === 1 || user.status === "Active";
                    return (
                      <tr key={user.userId ?? user.id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <img
                              src={user.avatar || 'https://via.placeholder.com/40'}
                              alt=""
                              className="rounded-circle border"
                              style={{ width: 40, height: 40, objectFit: "cover" }}
                            />
                            <div>
                              <div className="fw-semibold">{user.fullname}</div>
                              <div className="small text-muted">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-primary border">
                            {user.rankName || "Hạng đồng"}
                          </span>
                        </td>
                        <td>
                          <div className="small">
                            <div><i className="bi bi-envelope me-1"></i> {user.email}</div>
                            <div><i className="bi bi-telephone me-1"></i> {user.phone || 'N/A'}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`admin-badge ${isActive ? "admin-badge-success" : "admin-badge-danger"}`}>
                            {isActive ? "Hoạt động" : "Đã khóa"}
                          </span>
                        </td>
                        <td className="text-center">
                          <div className="d-flex gap-2 justify-content-center">
                            <button
                              className="admin-btn admin-btn-sm admin-btn-outline"
                              onClick={() => { setSelectedItem(user); setShowModal(true); }}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              className="admin-btn admin-btn-sm admin-btn-primary"
                              onClick={() => handleEditUser(user)}
                            >
                              <i className="bi bi-pencil"></i>
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
            <div className="admin-pagination-wrap mt-4">
              <div className="admin-pagination">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
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

      {/* Modal chi tiết - Đồng bộ với quản lý nhân sự */}
      {showModal && selectedItem && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3><i className="bi bi-person-badge me-2 text-primary"></i>Chi tiết khách hàng</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}><i className="bi bi-x-lg"></i></button>
            </div>
            <div className="admin-modal-body">
              <div className="row g-4">
                <div className="col-md-4 text-center">
                  <div className="position-relative d-inline-block mb-3">
                    <img
                      src={selectedItem.avatar || 'https://via.placeholder.com/150'}
                      alt=""
                      className="rounded-circle border"
                      style={{ width: 150, height: 150, objectFit: "cover", borderWidth: 4, borderColor: '#f8f9fa' }}
                    />
                    <div className="position-absolute bottom-0 end-0">
                      <span className={`admin-badge ${selectedItem.status === 1 || selectedItem.status === "Active" ? "admin-badge-success" : "admin-badge-danger"} border-2 border-white`}>
                        {selectedItem.status === 1 || selectedItem.status === "Active" ? "Active" : "Locked"}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 bg-light rounded-3">
                    <div className="small text-muted mb-1">Hạng thành viên</div>
                    <div className="fw-bold text-primary">
                      <i className="bi bi-star-fill me-1 text-warning"></i>
                      {selectedItem.rankName || "Hạng đồng"}
                    </div>
                  </div>
                </div>
                
                <div className="col-md-8">
                  <h4 className="fw-bold mb-1">{selectedItem.fullname}</h4>
                  <p className="text-muted mb-4">@{selectedItem.username}</p>
                  
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="small text-muted">Mã người dùng</div>
                      <div className="fw-semibold">#{selectedItem.userId || selectedItem.id}</div>
                    </div>
                    <div className="col-6">
                      <div className="small text-muted">Số điện thoại</div>
                      <div className="fw-semibold">{selectedItem.phone || "Chưa cung cấp"}</div>
                    </div>
                    <div className="col-12">
                      <div className="small text-muted">Địa chỉ Email</div>
                      <div className="fw-semibold">{selectedItem.email}</div>
                    </div>
                    <div className="col-6">
                      <div className="small text-muted">Ngày sinh</div>
                      <div className="fw-semibold">{selectedItem.birthday || "Chưa cung cấp"}</div>
                    </div>
                  </div>

                  <hr className="my-4 opacity-50" />

                  <div className="row text-center">
                    <div className="col-6 border-end">
                      <div className="small text-muted">Điểm tích lũy</div>
                      <div className="h4 mb-0 fw-bold text-warning">{selectedItem.points || 0}</div>
                    </div>
                    <div className="col-6">
                      <div className="small text-muted">Tổng chi tiêu</div>
                      <div className="h4 mb-0 fw-bold text-success">
                        {new Intl.NumberFormat('vi-VN').format(selectedItem.totalSpending || 0)} ₫
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Đóng</button>
              <button 
                className="admin-btn admin-btn-primary" 
                onClick={() => {
                  setShowModal(false);
                  handleEditUser(selectedItem);
                }}
              >
                <i className="bi bi-pencil-square me-2"></i>Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPanelPage>
  );
};

export default UserManagement;
