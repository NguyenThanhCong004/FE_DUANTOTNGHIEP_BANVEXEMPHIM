import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "react-bootstrap";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import { useAdminToast } from "../../components/admin/AdminToast";
import { apiFetch, withQuery } from "../../utils/apiClient";
import { SEAT_TYPES } from "../../constants/apiEndpoints";
import { hexColorForSeatTypeName, normalizeHex } from "../../utils/seatTypeColors";
import { formatVnd } from "../../utils/formatters";
import AdminPagination from "../../components/admin/AdminPagination";

const SeatTypeManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const itemsPerPage = 5;

  const { showToast, ToastComponent } = useAdminToast();
  const [seatTypes, setSeatTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (location.state?.message) {
      showToast(location.state.message, location.state.type || "success");
      window.history.replaceState({}, document.title);
    }
  }, [location.state, showToast]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(withQuery(SEAT_TYPES.LIST, { search: searchTerm }));
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        if (!mounted) return;
        setSeatTypes(
          arr.map((t) => ({
            id: t.seatTypeId ?? t.id,
            name: t.name ?? "",
            surcharge: t.surcharge != null ? Number(t.surcharge) : 0,
            coupleSeat: Boolean(t.coupleSeat),
            color: t.color || "",
          }))
        );
      } catch {
        if (mounted) setSeatTypes([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [searchTerm]);

  const filteredTypes = seatTypes
    .sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTypes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTypes.length / itemsPerPage);

  return (
    <AdminPanelPage icon="ui-checks-grid" title="Loại ghế">
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header flex-wrap gap-2">
          <h4 className="mb-0 d-flex align-items-center gap-2">
            Danh sách loại ghế
          </h4>
          <span className="text-muted small">Tổng: {filteredTypes.length}</span>
        </div>
        <div className="admin-card-body">
          <div className="admin-search-wrapper mb-3" style={{ maxWidth: 420 }}>
            <input
              type="search"
              className="admin-search-input"
              placeholder="Tìm loại ghế..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Tìm loại ghế"
            />
          </div>

          <div className="table-responsive">
            <table className="admin-table mb-0">
              <thead>
                <tr>
                  <th style={{ width: 56 }}>STT</th>
                  <th style={{ width: 48 }} className="text-center">
                    Màu
                  </th>
                  <th>Tên loại ghế</th>
                  <th style={{ width: 130 }} className="text-center">
                    Dạng
                  </th>
                  <th className="text-end" style={{ minWidth: 140 }}>
                    Phụ thu (VNĐ)
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
                      Đang tải…
                    </td>
                  </tr>
                ) : filteredTypes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-5 text-muted">
                      {searchTerm ? "Không tìm thấy loại ghế phù hợp." : "Chưa có loại ghế."}
                    </td>
                  </tr>
                ) : (
                  currentItems.map((type, index) => (
                    <tr key={type.id}>
                      <td className="fw-semibold text-muted">{indexOfFirstItem + index + 1}</td>
                      <td className="text-center align-middle">
                        <span
                          title="Màu trên sơ đồ"
                          style={{
                            display: "inline-block",
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            backgroundColor:
                              normalizeHex(type.color) || hexColorForSeatTypeName(type.name),
                            border: "1px solid rgba(0,0,0,0.12)",
                            verticalAlign: "middle",
                          }}
                        />
                      </td>
                      <td className="fw-semibold align-middle">{type.name}</td>
                      <td className="text-center align-middle">
                        {type.coupleSeat ? (
                          <Badge bg="danger">Ghế đôi</Badge>
                        ) : (
                          <Badge bg="secondary">Ghế đơn</Badge>
                        )}
                      </td>
                      <td className="text-end fw-semibold align-middle">
                        {formatVnd(type.surcharge)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTypes.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            itemLabel="loại ghế"
          />
        </div>
      </div>
      <ToastComponent />
    </AdminPanelPage>
  );
};

export default SeatTypeManagement;
