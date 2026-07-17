import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Badge, Button, Form, Spinner, Table, Row, Col, Pagination } from "react-bootstrap";

import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { useAdminToast } from "../../components/admin/AdminToast";
import { apiFetch, withQuery } from "../../utils/apiClient";
import { CINEMAS } from "../../constants/apiEndpoints";
import { getStoredStaff } from "../../utils/authStorage";
import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";
import { isDisplayableImageSrc } from "../../utils/mediaFiles";
import { apiMessage, MESSAGES } from "../../utils/uiMessages";
import { formatVnd } from "../../utils/formatters";

function formatMoney(v) {
  return formatVnd(v);
}

function isComboCategory(name) {
  return String(name || "")
    .toLowerCase()
    .includes("combo");
}

function ProductThumb({ product }) {
  const imageSrc = isDisplayableImageSrc(product?.image) ? String(product.image).trim() : "";
  return (
    <div
      className="flex-shrink-0 overflow-hidden rounded-3"
      style={{
        width: 46,
        height: 46,
        background: "#f1f5f9",
        border: "1px solid #e2e8f0",
        position: "relative",
      }}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={product?.name || "Sản phẩm"}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) fallback.style.display = "flex";
          }}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : null}
      <div
        style={{
          display: imageSrc ? "none" : "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          color: "#94a3b8",
          fontSize: 18,
        }}
      >
      </div>
    </div>
  );
}

/** Sản phẩm mới (id lớn hơn) lên trên — đồng bộ với API đã sort theo productId DESC */
function sortProductsNewestFirst(items) {
  return [...items].sort(
    (a, b) => (Number(b.productId) || 0) - (Number(a.productId) || 0)
  );
}

export default function ProductManagement() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const staffSession = getStoredStaff();
  const { selectedCinemaId, selectedCinemaName } = useSuperAdminCinema();
  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : staffSession?.cinemaId ?? null;

  const { showToast, ToastComponent } = useAdminToast();
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
      const res = await apiFetch(withQuery(CINEMAS.PRODUCT_MENU(effectiveCinemaId), {
        onSaleSearch: searchA,
        notOnSaleSearch: searchB,
      }));
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setOnSale([]);
        setNotOnSale([]);
        return;
      }
      const data = json?.data ?? json;
      setOnSale(
        Array.isArray(data?.onSale) ? sortProductsNewestFirst(data.onSale) : []
      );
      setNotOnSale(
        Array.isArray(data?.notOnSale) ? sortProductsNewestFirst(data.notOnSale) : []
      );
    } catch {
      setOnSale([]);
      setNotOnSale([]);
    } finally {
      setLoading(false);
    }
  }, [effectiveCinemaId, searchA, searchB]);

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
        showToast(apiMessage(json, "Cập nhật thất bại"), "danger");
        return;
      }

      // Cập nhật local state
      setOnSale(prev => prev.map(p => p.productId === productId ? { ...p, isActive: selling } : p));
      
      // Nếu sản phẩm đang ở danh sách "Chưa bán" và được bật bán
      const inNotOnSale = notOnSale.find(p => p.productId === productId);
      if (inNotOnSale && selling) {
        setNotOnSale(prev => prev.filter(p => p.productId !== productId));
        setOnSale(prev => [{ ...inNotOnSale, isActive: true }, ...prev]);
        showToast(`Đã thêm "${inNotOnSale.name}" vào menu rạp.`, "success");
      } else {
        showToast(selling ? "Đã cập nhật: Còn hàng" : "Đã cập nhật: Hết hàng — hệ thống sẽ tự bật lại lúc 7h sáng mai.", "success");
      }
    } catch {
      showToast(MESSAGES.networkError, "danger");
    } finally {
      setBusyId(null);
    }
  };

  const removeFromMenu = async (productId) => {
    if (effectiveCinemaId == null) return;
    setBusyId(productId);
    try {
      const res = await apiFetch(`${CINEMAS.PRODUCT_MENU(effectiveCinemaId)}/products/${productId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        showToast(apiMessage(json, "Gỡ thất bại"), "danger");
        return;
      }

      const item = onSale.find(p => p.productId === productId) || notOnSale.find(p => p.productId === productId);
      setOnSale(prev => prev.filter(p => p.productId !== productId));
      setNotOnSale(prev => [{ ...item, cinemaProductId: null, isActive: null }, ...prev]);
      showToast(`Đã gỡ "${item?.name}" khỏi menu rạp.`, "warning");
    } catch {
      showToast(MESSAGES.networkError, "danger");
    } finally {
      setBusyId(null);
    }
  };

  const filteredOnSale = onSale;
  const filteredNotOnSale = notOnSale;

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
              <th className="border-0" style={{ width: 56 }}>STT</th>
              <th className="border-0">Sản phẩm</th>
              <th className="text-end border-0">Giá</th>
              <th className="text-center border-0" style={{ width: "100px" }}>Trạng thái</th>
              <th className="text-end border-0">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-5">
                  Không có mục nào
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const combo = isComboCategory(r.categoryName);
                const id = r.productId;
                const inStock = r.isActive !== false;

                return (
                  <tr key={`${mode}-${id}`}>
                    <td className="fw-semibold text-muted">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <ProductThumb product={r} />
                        <div className="min-width-0">
                          <div className="fw-bold text-dark text-truncate" style={{ maxWidth: "150px" }}>{r.name}</div>
                          <Badge pill bg={combo ? "warning" : "info"} text="dark" style={{ fontSize: "0.6rem" }}>
                            {combo ? "Combo" : r.categoryName || "Khác"}
                          </Badge>
                        </div>
                      </div>
                    </td>
                    <td className="text-end fw-semibold text-primary">{formatMoney(r.price)}</td>
                    <td className="text-center">
                      {mode === "on" ? (
                        <div className="d-flex flex-column align-items-center gap-1">
                          <Form.Check
                            type="switch"
                            id={`stock-switch-${id}`}
                            checked={inStock}
                            disabled={busyId === id}
                            onChange={(e) => toggleSelling(id, e.target.checked)}
                            title={inStock ? "Đang còn hàng" : "Đã hết hàng"}
                          />
                          {!inStock && (
                            <Badge bg="warning" text="dark" style={{ fontSize: '0.6rem' }}>Hết hàng</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        {mode === "on" ? (
                          <>
                            <Button
                              variant="light"
                              size="sm"
                              className="text-danger border shadow-sm"
                              disabled={busyId === id}
                              onClick={() => removeFromMenu(id)}
                              title="Gỡ khỏi rạp"
                            >
                              {busyId === id ? <Spinner animation="border" size="sm" /> : "Gỡ"}
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="light"
                            size="sm"
                            className="text-success border shadow-sm"
                            disabled={busyId === id}
                            onClick={() => toggleSelling(id, true)}
                            title="Thêm vào rạp"
                          >
                            {busyId === id ? <Spinner animation="border" size="sm" /> : "Thêm"}
                          </Button>
                        )}
                      </div>
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
                ? "Vui lòng chọn rạp trên header (Super Admin)."
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
                  <h5 className="mb-0 fw-bold text-secondary d-flex align-items-center gap-2">
                    Chưa bán tại rạp
                    <Badge bg="secondary" pill className="ms-1">{notOnSale.length}</Badge>
                  </h5>
                </div>
                <div className="pm-search-wrapper">
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

          <Col lg={6}>
            <div className="pm-card admin-slide-up">
              <div className="pm-header">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0 fw-bold text-success d-flex align-items-center gap-2">
                    Đang bán tại rạp
                    <Badge bg="success" pill className="ms-1">{onSale.length}</Badge>
                  </h5>
                </div>
                <div className="pm-search-wrapper">
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
        </Row>
      )}

      <ToastComponent />
    </AdminPanelPage>
  );
}
