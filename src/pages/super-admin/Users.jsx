import React, { useEffect, useMemo, useState } from "react";

import { apiFetch, withQuery } from "../../utils/apiClient";

import { USERS } from "../../constants/apiEndpoints";

import AdminPanelPage from "../../components/admin/AdminPanelPage";

import { useNavigate } from "react-router-dom";

import { isActiveStatus } from "../../utils/statusFormat";
import { formatVnd } from "../../utils/formatters";
import AdminPagination from "../../components/admin/AdminPagination";



const UserManagement = () => {

  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedItem, setSelectedItem] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const itemsPerPage = 5;



  const [allUsers, setAllUsers] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    let mounted = true;

    (async () => {

      setLoading(true);

      try {

        const res = await apiFetch(withQuery(USERS.LIST, { search: searchTerm }));

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

  }, [searchTerm]);



  const filteredUsers = useMemo(() => {

    return [...allUsers].sort((a, b) => (Number(b.userId ?? b.id) || 0) - (Number(a.userId ?? a.id) || 0));

  }, [allUsers]);



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

    >

      <div className="admin-card admin-slide-up">

        <div className="admin-card-header flex-wrap gap-2">

          <h4 className="mb-0 d-flex align-items-center gap-2">

            Danh sách khách hàng

          </h4>

          <span className="text-muted small">Tổng cộng: {filteredUsers.length}</span>

        </div>

        <div className="admin-card-body">

          <div className="admin-search-wrapper mb-4" style={{ maxWidth: 420 }}>

            <input

              type="search"

              className="admin-search-input"

              placeholder="Tìm theo tên, email, SĐT..."

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

                  <th style={{ width: 56 }}>STT</th>

                  <th>Khách hàng</th>

                  <th>Hạng</th>

                  <th>Liên hệ</th>

                  <th>Trạng thái</th>

                  <th className="text-center">Thao tác</th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr><td colSpan={6} className="text-center py-5">Đang tải dữ liệu...</td></tr>

                ) : currentItems.length === 0 ? (

                  <tr><td colSpan={6} className="text-center py-5">Không có dữ liệu người dùng.</td></tr>

                ) : (

                  currentItems.map((user, index) => {

                    const isActive = isActiveStatus(user.status);

                    return (

                      <tr key={user.userId ?? user.id}>

                        <td className="fw-semibold text-muted">{indexOfFirstItem + index + 1}</td>

                        <td>

                          <div className="d-flex align-items-center gap-2">

                            {user.avatar ? (

                              <img

                                src={user.avatar}

                                alt=""

                                className="rounded-circle border"

                                style={{ width: 40, height: 40, objectFit: "cover" }}

                              />

                            ) : (

                              <div

                                className="rounded-circle border d-flex align-items-center justify-content-center bg-light text-primary fw-bold"

                                style={{ width: 40, height: 40, fontSize: 16, flexShrink: 0 }}

                              >

                                {(user.fullname || '?').charAt(0).toUpperCase()}

                              </div>

                            )}

                            <div>

                              <div className="fw-semibold">{user.fullname}</div>

                              <div className="small text-muted">{user.email}</div>

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

                            <div> {user.email}</div>

                            <div> {user.phone || 'N/A'}</div>

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

                              title="Xem chi tiết"

                              onClick={() => { setSelectedItem(user); setShowModal(true); }}

                            >

                              Xem

                            </button>

                            <button

                              title="Thay đổi trạng thái"

                              className="admin-btn admin-btn-sm admin-btn-primary"

                              onClick={() => handleEditUser(user)}

                            >

                              Thay đổi trạng thái

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



          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredUsers.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="khách hàng"
          />

        </div>

      </div>



      {/* Modal chi tiết - Đồng bộ với quản lý nhân sự */}

      {showModal && selectedItem && (

        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>

          <div className="admin-modal" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>

            <div className="admin-modal-header">

              <h3>Chi tiết khách hàng</h3>

              <button className="admin-modal-close" onClick={() => setShowModal(false)}></button>

            </div>

            <div className="admin-modal-body">

              <div className="row g-4">

                <div className="col-md-4 text-center">

                  <div className="position-relative d-inline-block mb-3">

                    {selectedItem.avatar ? (

                      <img

                        src={selectedItem.avatar}

                        alt=""

                        className="rounded-circle border"

                        style={{ width: 150, height: 150, objectFit: "cover", borderWidth: 4, borderColor: '#f8f9fa' }}

                      />

                    ) : (

                      <div

                        className="rounded-circle border d-flex align-items-center justify-content-center bg-light text-primary fw-bold"

                        style={{ width: 150, height: 150, fontSize: 56, borderWidth: 4, borderColor: '#f8f9fa' }}

                      >

                        {(selectedItem.fullname || '?').charAt(0).toUpperCase()}

                      </div>

                    )}

                    <div className="position-absolute bottom-0 end-0">

                      <span className={`admin-badge ${isActiveStatus(selectedItem.status) ? "admin-badge-success" : "admin-badge-danger"} border-2 border-white`}>

                        {isActiveStatus(selectedItem.status) ? "Hoạt động" : "Đã khóa"}

                      </span>

                    </div>

                  </div>

                  <div className="p-2 bg-light rounded-3">

                    <div className="small text-muted mb-1">Hạng thành viên</div>

                    <div className="fw-bold text-primary">

                      {selectedItem.rankName || "Hạng đồng"}

                    </div>

                  </div>

                </div>

                

                <div className="col-md-8">

                  <h4 className="fw-bold mb-4">{selectedItem.fullname}</h4>

                  

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

                        {formatVnd(selectedItem.totalSpending)}

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

              >Chỉnh sửa

              </button>

            </div>

          </div>

        </div>

      )}

    </AdminPanelPage>

  );

};



export default UserManagement;

