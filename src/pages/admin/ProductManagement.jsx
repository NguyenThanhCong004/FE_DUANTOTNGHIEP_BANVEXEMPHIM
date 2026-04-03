import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Badge, Button, Form, Spinner, Table, Row, Col, Pagination } from "react-bootstrap";
import { ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { apiFetch } from "../../utils/apiClient";
import { CINEMAS } from "../../constants/apiEndpoints";
import { getStoredStaff } from "../../utils/authStorage";
import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";

function formatMoney(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  return `${Number(v).toLocaleString("vi-VN")} đ`;
}

function isComboCategory(name) {
  return String(name || "")
    .toLowerCase()
    .includes("combo");
}

export default function ProductManagement() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const staffSession = getStoredStaff();
  const { selectedCinemaId, selectedCinemaName } = useSuperAdminCinema();
  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : staffSession?.cinemaId ?? null;

  const [onSale, setOnSale] = useState([]);
  const [notOnSale, setNotOnSale] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");

  // Pagination states
  const [pageA, setPageA] = useState(1);
  const [pageB, setPageB] = useState(1);
  const itemsPerPage = 5;

  const loadMenu = useCallback(async () => {
    if (effectiveCinemaId == null) {
      setOnSale([]);
      setNotOnSale([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(CINEMAS.PRODUCT_MENU(effectiveCinemaId));
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setOnSale([]);
        setNotOnSale([]);
        return;
      }
      const data = json?.data ?? json;
      setOnSale(Array.isArray(data?.onSale) ? data.onSale : []);
      setNotOnSale(Array.isArray(data?.notOnSale) ? data.notOnSale : []);
    } catch {
      setOnSale([]);
      setNotOnSale([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveCinemaId]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  const toggleSelling = async (productId, selling) => {
    if (effectiveCinemaId == null) return;
    setBusyId(productId);
    try {
      const res = await apiFetch(CINEMAS.PRODUCT_MENU_SELLING(effectiveCinemaId, productId), {
        method: "PUT",
        body: JSON.stringify({ selling }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message || "Cập nhật thất bại");
        return;
      }

      // Cập nhật local state để sản phẩm "nhảy" qua lại ngay lập tức
      if (selling) {
        // Chuyển từ "Chưa bán" -> "Đang bán"
        const item = notOnSale.find((p) => p.productId === productId);
        if (item) {
          setNotOnSale((prev) => prev.filter((p) => p.productId !== productId));
          setOnSale((prev) => [...prev, item]);
        }
      } else {
        // Chuyển từ "Đang bán" -> "Chưa bán"
        const item = onSale.find((p) => p.productId === productId);
        if (item) {
          setOnSale((prev) => prev.filter((p) => p.productId !== productId));
          setNotOnSale((prev) => [...prev, item]);
        }
      }
    } catch {
      alert("Không thể kết nối server");
    } finally {
      setBusyId(null);
    }
  };

  const filterRows = (rows, q) => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        String(r.name || "").toLowerCase().includes(s) ||
        String(r.categoryName || "").toLowerCase().includes(s)
    );
  };

  const filteredOnSale = useMemo(() => filterRows(onSale, searchA), [onSale, searchA]);
  const filteredNotOnSale = useMemo(() => filterRows(notOnSale, searchB), [notOnSale, searchB]);

  // Paginated rows
  const paginatedA = useMemo(() => {
    const start = (pageA - 1) * itemsPerPage;
    return filteredOnSale.slice(start, start + itemsPerPage);
  }, [filteredOnSale, pageA]);

  const paginatedB = useMemo(() => {
    const start = (pageB - 1) * itemsPerPage;
    return filteredNotOnSale.slice(start, start + itemsPerPage);
  }, [filteredNotOnSale, pageB]);

  const totalPagesA = Math.ceil(filteredOnSale.length / itemsPerPage);
  const totalPagesB = Math.ceil(filteredNotOnSale.length / itemsPerPage);

  // Reset page when search changes
  useEffect(() => setPageA(1), [searchA]);
  useEffect(() => setPageB(1), [searchB]);

  const cinemaLabel =
    effectiveCinemaId != null
      ? selectedCinemaName || `Rạp #${effectiveCinemaId}`
      : null;

  const renderTable = (rows, mode, currentPage, totalPages, setPage) => (
    <div className="d-flex flex-column" style={{ minHeight: "400px" }}>
      <div className="table-responsive flex-grow-1">
        <Table hover className="align-middle mb-0" style={{ fontSize: "0.875rem" }}>
          <thead className="table-light">
            <tr>
              <th className="border-0">Sản phẩm</th>
              <th className="text-end border-0">Giá</th>
              <th className="text-end border-0">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-muted py-5">
                  <i className="bi bi-inbox fs-2 d-block mb-2 opacity-50"></i>
                  Không có mục nào
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const combo = isComboCategory(r.categoryName);
                const id = r.productId;
                return (
                  <tr key={`${mode}-${id}`}>
                    <td>
                      <div className="fw-bold text-dark text-truncate" style={{ maxWidth: "180px" }}>{r.name}</div>
                      <Badge pill bg={combo ? "warning" : "info"} text="dark" style={{ fontSize: "0.6rem" }}>
                        {combo ? "Combo" : r.categoryName || "Khác"}
                      </Badge>
                    </td>
                    <td className="text-end fw-semibold text-primary">{formatMoney(r.price)}</td>
                    <td className="text-end">
                      {mode === "on" ? (
                        <Button
                          variant="light"
                          size="sm"
                          className="text-danger border shadow-sm"
                          disabled={busyId === id}
                          onClick={() => toggleSelling(id, false)}
                          title="Gỡ khỏi rạp"
                        >
                          {busyId === id ? <Spinner animation="border" size="sm" /> : <i className="bi bi-trash3" />}
                        </Button>
                      ) : (
                        <Button
                          variant="light"
                          size="sm"
                          className="text-success border shadow-sm"
                          disabled={busyId === id}
                          onClick={() => toggleSelling(id, true)}
                          title="Bán tại rạp"
                        >
                          {busyId === id ? <Spinner animation="border" size="sm" /> : <i className="bi bi-plus-circle" />}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="p-3 border-top bg-white d-flex justify-content-center mt-auto">
          <Pagination size="sm" className="mb-0 custom-pagination">
            <Pagination.First disabled={currentPage === 1} onClick={() => setPage(1)} />
            <Pagination.Prev disabled={currentPage === 1} onClick={() => setPage(p => p - 1)} />
            
            {[...Array(totalPages)].map((_, i) => {
              const pageNum = i + 1;
              // Chỉ hiển thị trang hiện tại và 2 trang lân cận nếu quá nhiều trang
              if (totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                if (pageNum === 2 || pageNum === totalPages - 1) return <Pagination.Ellipsis key={pageNum} disabled />;
                return null;
              }
              return (
                <Pagination.Item 
                  key={pageNum} 
                  active={pageNum === currentPage}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Pagination.Item>
              );
            })}
            
            <Pagination.Next disabled={currentPage === totalPages} onClick={() => setPage(p => p + 1)} />
            <Pagination.Last disabled={currentPage === totalPages} onClick={() => setPage(totalPages)} />
          </Pagination>
        </div>
      )}
    </div>
  );

  return (
    <AdminPanelPage
      icon="box-seam"
      title="Sản phẩm & Combo"
      description={
        <div className="d-flex align-items-center gap-2 flex-wrap mt-2">
          {cinemaLabel ? (
            <Badge bg="primary" className="px-3 py-2 shadow-sm">
              <i className="bi bi-geo-alt-fill me-1" />
              {cinemaLabel}
            </Badge>
          ) : null}
          <span className="text-muted small">Cập nhật danh mục sản phẩm cho rạp phim của bạn</span>
        </div>
      }
    >
      <style>{`
        .pm-card {
          border: none;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
          border-radius: 12px;
          overflow: hidden;
          background: #fff;
          height: 100%;
        }
        .pm-header {
          padding: 1rem;
          background: #fff;
          border-bottom: 1px solid #f0f0f0;
        }
        .pm-search-input {
          border-radius: 20px;
          padding-left: 2.5rem;
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
        }
        .pm-search-wrapper {
          position: relative;
        }
        .pm-search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #adb5bd;
        }
      `}</style>

      {effectiveCinemaId == null ? (
        <div className="admin-card admin-slide-up">
          <div className="admin-card-body text-center py-5 text-muted">
            <h5 className="text-dark">Chưa chọn rạp</h5>
            <p className="mb-0 small">
              {isSuperAdmin
                ? "Vui lòng chọn rạp ở sidebar (Super Admin)."
                : "Tài khoản chưa được gán rạp (cinemaId). Liên hệ Super Admin."}
            </p>
          </div>
        </div>
      ) : loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Đang tải menu sản phẩm...</p>
        </div>
      ) : (
        <Row className="g-4">
          <Col lg={6}>
            <div className="pm-card admin-slide-up">
              <div className="pm-header">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fw-bold text-success d-flex align-items-center gap-2">
                    <ArrowUpRight size={20} />
                    Đang bán tại rạp
                    <Badge bg="success" pill className="ms-1">{onSale.length}</Badge>
                  </h5>
                </div>
                <div className="pm-search-wrapper">
                  <Search size={16} className="pm-search-icon" />
                  <Form.Control
                    className="pm-search-input"
                    placeholder="Tìm sản phẩm đang bán..."
                    value={searchA}
                    onChange={(e) => setSearchA(e.target.value)}
                  />
                </div>
              </div>
              {renderTable(paginatedA, "on", pageA, totalPagesA, setPageA)}
            </div>
          </Col>

          <Col lg={6}>
            <div className="pm-card admin-slide-up">
              <div className="pm-header">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fw-bold text-secondary d-flex align-items-center gap-2">
                    <ArrowDownLeft size={20} />
                    Chưa bán tại rạp
                    <Badge bg="secondary" pill className="ms-1">{notOnSale.length}</Badge>
                  </h5>
                </div>
                <div className="pm-search-wrapper">
                  <Search size={16} className="pm-search-icon" />
                  <Form.Control
                    className="pm-search-input"
                    placeholder="Tìm sản phẩm chưa bán..."
                    value={searchB}
                    onChange={(e) => setSearchB(e.target.value)}
                  />
                </div>
              </div>
              {renderTable(paginatedB, "off", pageB, totalPagesB, setPageB)}
            </div>
          </Col>
        </Row>
      )}
    </AdminPanelPage>
  );
}
