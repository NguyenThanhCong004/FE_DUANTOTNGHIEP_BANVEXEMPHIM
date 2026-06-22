import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Modal, Button, Badge, Row, Col, Spinner } from 'react-bootstrap';
import { apiFetch, withQuery } from '../../utils/apiClient';
import { USERS } from '../../constants/apiEndpoints';
import { formatDate } from '../../utils/formatters';
import AdminPagination from '../../components/admin/AdminPagination';

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailUser, setDetailUser] = useState(null);

  const openUserDetail = async (userId) => {
    setShowDetailModal(true);
    setDetailUser(null);
    setDetailLoading(true);
    try {
      const res = await apiFetch(USERS.BY_ID(userId));
      const json = await res.json().catch(() => null);
      const found = json?.data ?? json;
      if (res.ok && found) {
        setDetailUser({
          userId: found.userId,
          fullname: found.fullname ?? '',
          email: found.email ?? '',
          phone: found.phone ?? '',
          birthday: found.birthday ?? '',
          points: found.points ?? 0,
          status: found.status ?? 1,
          avatar: found.avatar || 'https://via.placeholder.com/160',
        });
      }
    } catch {
      setDetailUser(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeUserDetail = () => {
    setShowDetailModal(false);
    setDetailUser(null);
  };

  const formatBirthday = (d) => formatDate(d, { day: '2-digit', month: '2-digit', year: 'numeric', fallback: '' });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(withQuery(USERS.LIST, { search: searchTerm }));
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        if (!mounted) return;
        const arr = Array.isArray(list) ? list : [];
        setUsers(
          arr.map((u) => ({
            userId: u.userId ?? u.id,
            fullname: u.fullname ?? u.username ?? '',
            email: u.email ?? '',
            phone: u.phone ?? '',
            birthday: u.birthday,
            status: u.status ?? 1,
            points: u.points ?? 0,
          }))
        );
      } catch {
        if (mounted) setUsers([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [searchTerm]);

  const filteredUsers = useMemo(() => {
    return [...users].sort((a, b) => (Number(b.userId) || 0) - (Number(a.userId) || 0));
  }, [users]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 1:
        return <span className="admin-badge admin-badge-success">Hoạt động</span>;
      case 0:
        return <span className="admin-badge admin-badge-danger">Đã khóa</span>;
      default:
        return <span className="admin-badge admin-badge-neutral">Không xác định</span>;
    }
  };

  return (
    <div className="admin-page superadmin-page admin-fade-in">
      <div className="admin-header">
        <div className="admin-header-content">
          <div>
            <h1>
              <i className="bi bi-people-fill me-3"></i>
              Quản lý Khách hàng
            </h1>
            <p className="lead">Quản lý thông tin và tài khoản người dùng</p>
          </div>
          <div className="d-flex align-items-center gap-3 flex-wrap justify-content-end">
            <div className="admin-search-wrapper admin-search-on-gradient" style={{ maxWidth: 400, minWidth: 200 }}>
              <i className="bi bi-search admin-search-icon" aria-hidden />
              <input
                type="search"
                className="admin-search-input"
                placeholder="Tìm khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Tìm khách hàng"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4>
            <i className="bi bi-people me-2 text-primary"></i>
            Danh sách Khách hàng
          </h4>
        </div>
        <div className="admin-card-body p-0">
          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>STT</th>
                  <th>Khách hàng</th>
                  <th>Liên hệ</th>
                  <th>Ngày sinh</th>
                  <th>Điểm</th>
                  <th>Trạng thái</th>
                  <th className="text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4">
                      <div className="spinner-border text-primary me-2" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="admin-empty">
                        <div className="admin-empty-icon">
                          <i className="bi bi-people"></i>
                        </div>
                        <h5 className="mb-2">Không có khách hàng</h5>
                        <p className="mb-0">Chưa có khách hàng nào trong hệ thống</p>
                      </div>
                    </td>
                  </tr>
                ) : currentItems.map((user, index) => (
                  <tr key={user.userId}>
                    <td className="fw-semibold text-muted">{indexOfFirstItem + index + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="admin-table-icon-tile">
                          <i className="bi bi-person"></i>
                        </div>
                        <div>
                          <div className="fw-semibold text-dark">{user.fullname}</div>
                          <small className="text-muted">{user.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <i className="bi bi-telephone"></i>
                          {user.phone || 'Chưa có'}
                        </div>
                        <div className="d-flex align-items-center gap-2 text-muted small">
                          <i className="bi bi-envelope"></i>
                          {user.email || 'Chưa có'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-calendar-event text-muted"></i>
                        <span>{formatBirthday(user.birthday)}</span>
                      </div>
                    </td>
                    <td>
                      <span className="admin-points-badge">
                        <i className="bi bi-star-fill"></i>
                        {user.points || 0} điểm
                      </span>
                    </td>
                    <td>{getStatusBadge(user.status)}</td>
                    <td>
                      <div className="admin-table-action-group">
                        <button
                          type="button"
                          className="admin-table-action-btn admin-table-action-btn--view"
                          title="Xem chi tiết"
                          onClick={() => openUserDetail(user.userId)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <Link
                          to={`${prefix}/users/edit/${user.userId}`}
                          className="admin-table-action-btn admin-table-action-btn--edit"
                          title="Chỉnh sửa"
                        >
                          <i className="bi bi-pencil"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredUsers.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        itemLabel="khách hàng"
      />

      <Modal show={showDetailModal} onHide={closeUserDetail} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="fw-bold text-primary">Chi tiết khách hàng</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-dark pt-0">
          {detailLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" className="me-2" />
              Đang tải…
            </div>
          ) : !detailUser ? (
            <p className="text-muted mb-0 py-3">Không tìm thấy thông tin khách hàng.</p>
          ) : (
            <Row className="g-4 align-items-start">
              <Col md={4} className="text-center">
                <img
                  src={detailUser.avatar}
                  alt={detailUser.fullname}
                  className="rounded-circle border"
                  style={{ width: 140, height: 140, objectFit: 'cover' }}
                />
                <h5 className="fw-bold mt-3 mb-1">{detailUser.fullname}</h5>
                <Badge bg={Number(detailUser.status) === 1 ? 'success' : 'danger'}>
                  {Number(detailUser.status) === 1 ? 'Hoạt động' : 'Khóa'}
                </Badge>
              </Col>
              <Col md={8}>
                <Row className="g-3">
                  <Col sm={6}>
                    <div className="small text-muted fw-bold">Mã khách hàng</div>
                    <div className="fw-semibold">#{detailUser.userId}</div>
                  </Col>
                  <Col sm={6}>
                    <div className="small text-muted fw-bold">Email</div>
                    <div className="fw-semibold">{detailUser.email || '—'}</div>
                  </Col>
                  <Col sm={6}>
                    <div className="small text-muted fw-bold">Số điện thoại</div>
                    <div className="fw-semibold">{detailUser.phone || '—'}</div>
                  </Col>
                  <Col sm={6}>
                    <div className="small text-muted fw-bold">Ngày sinh</div>
                    <div className="fw-semibold">{formatBirthday(detailUser.birthday) || '—'}</div>
                  </Col>
                  <Col sm={6}>
                    <div className="small text-muted fw-bold">Điểm tích lũy</div>
                    <div className="fw-semibold">{detailUser.points} điểm</div>
                  </Col>
                </Row>
                <p className="small text-muted mt-3 mb-0">
                  Thông tin đăng nhập và mật khẩu không hiển thị tại đây.
                </p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="secondary" onClick={closeUserDetail}>
            Đóng
          </Button>
          {detailUser ? (
            <Button variant="primary" as={Link} to={`${prefix}/users/edit/${detailUser.userId}`} onClick={closeUserDetail}>
              <i className="bi bi-pencil me-2"></i>
              Chỉnh sửa
            </Button>
          ) : null}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default UserManagement;
