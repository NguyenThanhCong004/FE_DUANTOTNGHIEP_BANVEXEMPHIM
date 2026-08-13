import React, { useEffect, useMemo, useState } from 'react';

import { Link, useLocation } from 'react-router-dom';

import { Modal, Button, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';

import { apiFetch, withQuery } from '../../utils/apiClient';

import { STAFF } from '../../constants/apiEndpoints';

import { getStoredStaff } from '../../utils/authStorage';

import { useSuperAdminCinema } from '../../components/layout/useSuperAdminCinema';

import { isActiveStatus } from '../../utils/statusFormat';

import { useAdminToast } from '../../components/admin/AdminToast';
import { apiMessage, MESSAGES } from '../../utils/uiMessages';

import { formatDate } from '../../utils/formatters';
import AdminPagination from '../../components/admin/AdminPagination';

const staffStatusLabel = (value) => (
  isActiveStatus(value) ? 'Đang làm việc' : 'Tạm nghỉ / Khóa'
);



const StaffManagement = () => {

  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 5;



  const location = useLocation();

  const isSuperAdmin = location.pathname.startsWith("/super-admin");

  const prefix = isSuperAdmin ? "/super-admin" : "/admin";

  const staffSession = getStoredStaff();

  const { selectedCinemaId } = useSuperAdminCinema();



  const addPath = `${prefix}/staff/add`;

  const editPath = (id) => `${prefix}/staff/edit/${id}`;



  const [staffDtos, setStaffDtos] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const { showToast, ToastComponent } = useAdminToast();

  const [showDetailModal, setShowDetailModal] = useState(false);

  const [detailLoading, setDetailLoading] = useState(false);

  const [detailStaff, setDetailStaff] = useState(null);

  const [showToggleModal, setShowToggleModal] = useState(false);

  const [staffToToggle, setStaffToToggle] = useState(null);

  const [toggleError, setToggleError] = useState("");






  const formatBirthdayDetail = (d) => formatDate(d, { day: '2-digit', month: '2-digit', year: 'numeric', fallback: '' });



  const openStaffDetail = async (staffId) => {

    setShowDetailModal(true);

    setDetailStaff(null);

    setDetailLoading(true);

    try {

      const res = await apiFetch(STAFF.BY_ID(staffId));

      const json = await res.json().catch(() => null);

      const data = json?.data ?? json;

      if (res.ok && data) {

        setDetailStaff({

          staffId: data.staffId,

          fullname: data.fullname,

          email: data.email,

          phone: data.phone,

          status: data.status,

          role: data.role,

          birthday: data.birthday,

          avatar: data.avatar,

          cinemaId: data.cinemaId,

        });

      }

    } catch {

      setDetailStaff(null);

    } finally {

      setDetailLoading(false);

    }

  };



  const closeStaffDetail = () => {

    setShowDetailModal(false);

    setDetailStaff(null);

  };



  const openToggleModal = (staff) => {

    setStaffToToggle(staff);

    setToggleError("");

    setShowToggleModal(true);

  };



  const closeToggleModal = () => {

    setShowToggleModal(false);

    setStaffToToggle(null);

    setToggleError("");

  };



  const handleToggleStatus = async () => {

    if (!staffToToggle) return;

    const staff = staffToToggle;

    const isLocking = isActiveStatus(staff.status);

    const actionText = isLocking ? 'khóa' : 'mở khóa';



    try {

      // Tìm dữ liệu gốc từ staffDtos để lấy đầy đủ thông tin (email, phone, birthday...)

      const s = staffDtos.find(item => (item.staffId || item.id) === staff.id);

      if (!s) {

        setToggleError("Không tìm thấy dữ liệu nhân viên để cập nhật");

        return;

      }



      const updatedData = {
        status: isLocking ? 0 : 1,
      };



      const res = await apiFetch(STAFF.BY_ID(staff.id), {

        method: 'PUT',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(updatedData)

      });



      if (res.ok) {

        // Cập nhật lại state cục bộ

        setStaffDtos((prev) =>

          prev.map((item) => (item.staffId || item.id) === staff.id ? { ...item, status: isLocking ? 0 : 1 } : item)

        );



        closeToggleModal();

        if (isLocking) {

          showToast(

            `Đã khóa tài khoản của ${staff.name}. Các ca làm việc từ hôm nay của nhân viên đã được gỡ tự động.`,

            "warning",

            5000

          );

        } else {

          showToast(`Đã mở khóa tài khoản cho ${staff.name}.`, "success");

        }

      } else {

        const json = await res.json().catch(() => null);

        setToggleError(apiMessage(json, `Thao tác ${actionText} thất bại. Vui lòng kiểm tra lại dữ liệu.`));

      }

    } catch (err) {

      console.error("❌ Lỗi Toggle Status:", err);

      setToggleError(MESSAGES.networkError);

    }

  };



  useEffect(() => {

    let mounted = true;

    (async () => {

      setLoading(true);

      setError(null);

      try {

        const scopedCinemaId = !isSuperAdmin ? staffSession?.cinemaId : selectedCinemaId;
        const res = await apiFetch(withQuery(STAFF.LIST, {
          cinemaId: scopedCinemaId,
          search: searchTerm,
        }));

        const json = await res.json().catch(() => null);

        const list = json?.data ?? json ?? [];

        if (!mounted) return;

        let data = Array.isArray(list) ? list : [];

        const norm = (r) => String(r || "").replace(/^ROLE_/i, "").toUpperCase();

        // Danh sách nhân viên sàn: loại ADMIN / SUPER_ADMIN (họ nằm ở trang Quản trị viên rạp).

        data = data.filter((s) => {

          const r = norm(s.role);

          return r !== "ADMIN" && r !== "SUPER_ADMIN";

        });

        setStaffDtos(data);

      } catch {

        if (mounted) {

          setStaffDtos([]);

          setError('Không tải được danh sách nhân viên.');

        }

      } finally {

        if (mounted) setLoading(false);

      }

    })();

    return () => {

      mounted = false;

    };

  }, [isSuperAdmin, staffSession?.cinemaId, selectedCinemaId, searchTerm]);



  useEffect(() => {

    if (location.state?.message) {

      showToast(location.state.message, location.state.type || "success");

      window.history.replaceState({}, document.title);

    }

  }, [location.state, showToast]);



  const staffUI = useMemo(() => {

    return staffDtos.map((s) => ({

      id: s.staffId,

      name: s.fullname ?? "",

      email: s.email ?? "",

      phone: s.phone ?? "",

      role: s.role ?? "",

      status: s.status,

    }));

  }, [staffDtos]);



  const filteredStaff = staffUI;



  const indexOfLastItem = currentPage * itemsPerPage;

  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentItems = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);



  return (

    <div className="admin-page superadmin-page admin-fade-in">

      <div className="admin-header">

        <div className="admin-header-content">

          <div>

            <h1>

              Quản lý nhân viên rạp

            </h1>

          </div>

          <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">

            <div className="admin-search-wrapper admin-search-on-gradient" style={{ maxWidth: 400, minWidth: 200 }}>

              <input

                type="search"

                className="admin-search-input"

                placeholder="Tìm nhân viên..."

                value={searchTerm}

                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}

                aria-label="Tìm nhân viên"

              />

            </div>

            <Link to={addPath} className="admin-btn" style={{ background: "white", color: "#6366f1" }}>

              Thêm nhân viên

            </Link>

          </div>

        </div>

      </div>



      {error && (

        <div className="alert alert-danger py-2 mb-3" role="alert">

          {error}

        </div>

      )}



      <div className="admin-card admin-slide-up">

        <div className="admin-card-header">

          <h4>

            Danh sách nhân viên

          </h4>

        </div>

        <div className="admin-card-body p-0">

          <div className="table-responsive">

            <table className="admin-table mb-0">

              <thead>

                <tr>

                  <th style={{ width: 56 }}>STT</th>

                  <th>Nhân viên</th>

                  <th>Liên hệ</th>

                  <th>Trạng thái</th>

                  <th className="text-center">Thao tác</th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td colSpan={5} className="text-center py-4">

                      <div className="spinner-border text-primary me-2" role="status">

                        <span className="visually-hidden">Loading...</span>

                      </div>

                      Đang tải dữ liệu...

                    </td>

                  </tr>

                ) : error ? (

                  <tr>

                    <td colSpan={5} className="text-center py-4">

                      {error}

                    </td>

                  </tr>

                ) : currentItems.length === 0 ? (

                  <tr>

                    <td colSpan={5}>

                      <div className="admin-empty">

                        <div className="admin-empty-icon">

                        </div>

                        <h5 className="mb-2">Không có dữ liệu nhân viên</h5>

                        <p className="mb-0">Chưa có nhân viên nào trong hệ thống</p>

                      </div>

                    </td>

                  </tr>

                ) : (

                  currentItems.map((staff, index) => (

                    <tr key={staff.id}>

                      <td className="fw-semibold text-muted">{indexOfFirstItem + index + 1}</td>

                      <td>

                        <div className="d-flex align-items-center gap-3">

                          <div className="admin-table-avatar">

                            {staff.name.charAt(0).toUpperCase()}

                          </div>

                          <div>

                            <div className="fw-semibold text-dark">{staff.name}</div>

                            <small className="text-muted">{staff.email}</small>

                          </div>

                        </div>

                      </td>

                      <td>

                        <div>

                          <div className="d-flex align-items-center gap-2 mb-1">

                            <small className="text-muted">{staff.email}</small>

                          </div>

                          <div className="d-flex align-items-center gap-2">

                            <small className="text-muted">{staff.phone || 'Chưa có'}</small>

                          </div>

                        </div>

                      </td>

                      <td>

                        <span

                          className={

                            isActiveStatus(staff.status)

                              ? 'admin-badge admin-badge-success'

                              : 'admin-badge admin-badge-danger'

                          }

                        >

                          {staffStatusLabel(staff.status)}

                        </span>

                      </td>

                      <td>

                        <div className="d-flex justify-content-center gap-2">

                          <button

                            type="button"

                            className="admin-btn admin-btn-sm admin-btn-outline"

                            title="Xem chi tiết"

                            onClick={() => openStaffDetail(staff.id)}

                          >Xem</button>

                          <Link

                            to={editPath(staff.id)}

                            className="admin-btn admin-btn-sm admin-btn-primary"

                            title="Chỉnh sửa"

                          >Sửa</Link>

                          <button

                            type="button"

                            className={`admin-btn admin-btn-sm ${isActiveStatus(staff.status) ? 'admin-btn-danger' : 'admin-btn-success'}`}

                            title={isActiveStatus(staff.status) ? "Khóa tài khoản" : "Mở khóa tài khoản"}

                            onClick={() => openToggleModal(staff)}

                          >

                            {isActiveStatus(staff.status) ? "Khóa" : "Mở khóa"}

                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>



      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredStaff.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        itemLabel="nhân viên"
      />



      <ToastComponent />



      {showToggleModal && staffToToggle && (

        <div className="admin-modal-overlay" role="presentation" onClick={closeToggleModal}>

          <div className="admin-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>

            <div className="admin-modal-header">

              <h3 className="text-danger mb-0">

                {isActiveStatus(staffToToggle.status) ? "Xác nhận khóa tài khoản" : "Xác nhận mở khóa tài khoản"}

              </h3>

              <button type="button" className="admin-modal-close" aria-label="Đóng" onClick={closeToggleModal}>

                ×

              </button>

            </div>

            <div className="admin-modal-body">

              <p className="mb-3">

                Bạn có chắc chắn muốn {isActiveStatus(staffToToggle.status) ? "khóa" : "mở khóa"} tài khoản này?

              </p>

              <div className="alert alert-warning">

                <strong>Nhân viên:</strong> {staffToToggle.name} ({staffToToggle.email})

              </div>

              {isActiveStatus(staffToToggle.status) && (

                <p className="text-muted small mb-0">

                  Các ca làm việc từ hôm nay trở đi của nhân viên sẽ được gỡ tự động.

                </p>

              )}

              {toggleError && (

                <div className="alert alert-danger mt-3 mb-0">

                  {toggleError}

                </div>

              )}

            </div>

            <div className="admin-modal-footer">

              <button type="button" className="admin-btn admin-btn-outline" onClick={closeToggleModal}>

                Hủy

              </button>

              <button

                type="button"

                className={`admin-btn ${isActiveStatus(staffToToggle.status) ? "admin-btn-danger" : "admin-btn-primary"}`}

                onClick={handleToggleStatus}

              >

                {isActiveStatus(staffToToggle.status) ? "Khóa tài khoản" : "Mở khóa tài khoản"}

              </button>

            </div>

          </div>

        </div>

      )}



      <Modal show={showDetailModal} onHide={closeStaffDetail} centered size="lg">

        <Modal.Header closeButton className="border-0 pb-0">

          <Modal.Title className="fw-bold text-primary">Chi tiết nhân viên</Modal.Title>

        </Modal.Header>

        <Modal.Body className="text-dark pt-0">

          {detailLoading ? (

            <div className="text-center py-5">

              <Spinner animation="border" variant="primary" className="me-2" />

              Đang tải…

            </div>

          ) : !detailStaff ? (

            <p className="text-muted mb-0 py-3">Không có dữ liệu nhân viên.</p>

          ) : (

            <Row>

              <Col lg={4} className="text-center mb-3 mb-lg-0">

                {detailStaff.avatar ? (

                  <img

                    src={detailStaff.avatar}

                    alt={detailStaff.fullname ?? ''}

                    className="rounded-circle shadow-sm mb-2 border"

                    style={{ width: 160, height: 160, objectFit: 'cover' }}

                  />

                ) : (

                  <div

                    className="rounded-circle shadow-sm mb-2 border d-flex align-items-center justify-content-center bg-light text-primary fw-bold mx-auto"

                    style={{ width: 160, height: 160, fontSize: 56 }}

                  >

                    {(detailStaff.fullname || '?').charAt(0).toUpperCase()}

                  </div>

                )}

                <h5 className="fw-bold mb-1">{detailStaff.fullname ?? '—'}</h5>

                <p className="text-muted small mb-2">Ngày sinh: {formatBirthdayDetail(detailStaff.birthday) || '—'}</p>

                <Badge bg={isActiveStatus(detailStaff.status) ? 'success' : 'danger'} className="rounded-pill px-3 py-2">

                  {staffStatusLabel(detailStaff.status)}

                </Badge>

              </Col>

              <Col lg={8}>

                <Card className="border-0 bg-light">

                  <Card.Body>

                    <h6 className="fw-bold mb-3 border-bottom pb-2">Thông tin tài khoản</h6>

                    <Row className="g-3">

                      <Col md={6}>

                        <div className="small text-muted fw-bold text-uppercase">Mã nhân viên</div>

                        <div className="fw-bold">#{detailStaff.staffId}</div>

                      </Col>

                      <Col md={6}>

                        <div className="small text-muted fw-bold text-uppercase">Vai trò</div>

                        <div className="fw-bold">{detailStaff.role ?? '—'}</div>

                      </Col>

                      <Col md={6}>

                        <div className="small text-muted fw-bold text-uppercase">Email</div>

                        <div className="fw-bold">{detailStaff.email ?? '—'}</div>

                      </Col>

                      <Col md={6}>

                        <div className="small text-muted fw-bold text-uppercase">Số điện thoại</div>

                        <div className="fw-bold">{detailStaff.phone ?? '—'}</div>

                      </Col>

                      <Col md={6}>

                        <div className="small text-muted fw-bold text-uppercase">Mã rạp</div>

                        <div className="fw-bold">{detailStaff.cinemaId ?? '—'}</div>

                      </Col>

                    </Row>

                  </Card.Body>

                </Card>

              </Col>

            </Row>

          )}

        </Modal.Body>

        <Modal.Footer className="border-0">

          <Button variant="secondary" onClick={closeStaffDetail}>

            Đóng

          </Button>

          {detailStaff ? (

            <Button variant="primary" as={Link} to={editPath(detailStaff.staffId)} onClick={closeStaffDetail}>

              Chỉnh sửa

            </Button>

          ) : null}

        </Modal.Footer>

      </Modal>

    </div>

  );

};



export default StaffManagement;

