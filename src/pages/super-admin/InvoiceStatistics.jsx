import React, { useState, useMemo } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";

import AdminPanelPage from "../../components/admin/AdminPanelPage";
import AdminPagination from "../../components/admin/AdminPagination";
import KpiCard from "../../components/admin/dashboard/KpiCard";
import ChartCard from "../../components/admin/dashboard/ChartCard";
import BarChartWidget from "../../components/admin/dashboard/BarChartWidget";
import PieChartWidget from "../../components/admin/dashboard/PieChartWidget";
import InvoiceSummaryCard from "../../components/common/InvoiceSummaryCard";
import { useApiData } from "../../components/admin/dashboard/useApiData";
import { apiFetch, apiJson } from "../../utils/apiClient";
import { SUPER_ADMIN_DASHBOARD, ORDERS_ONLINE, CINEMAS } from "../../constants/apiEndpoints";
import { formatNumber, formatVnd } from "../../utils/formatters";

const PAGE_SIZE = 10;
const COLS = "36px 120px 1fr 120px 100px 90px 110px 100px 110px 56px";

const STATUS_MAP = {
  0: { label: "Chờ thanh toán",   badge: "admin-badge-warning" },
  1: { label: "Hoàn tất", badge: "admin-badge-success" },
  2: { label: "Đã huỷ",   badge: "admin-badge-danger"  },
};

const getPayCategory = (o) => o?.isCounter ? "Mua tại quầy" : "Mua online";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}`);

function fmtDate(dt) {
  if (!dt) return "—";
  let d;
  if (Array.isArray(dt)) {
    d = new Date(dt[0], (dt[1] || 1) - 1, dt[2] || 1, dt[3] || 0, dt[4] || 0);
  } else {
    d = new Date(dt);
  }
  if (isNaN(d.getTime())) return "—";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const InvoiceStatistics = () => {
  const [page, setPage]                   = useState(1);
  const [search, setSearch]               = useState("");
  const [filterStatus, setFilterStatus]   = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterYear, setFilterYear]       = useState(0);
  const [filterMonth, setFilterMonth]     = useState(0);
  const [filterCinema, setFilterCinema]   = useState("");
  const [chartYear, setChartYear]         = useState(CURRENT_YEAR);

  // Modal chi tiết
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailOrder, setDetailOrder]         = useState(null);
  const [detailLoading, setDetailLoading]     = useState(false);
  const [detailErr, setDetailErr]             = useState("");

  const invoiceStats = useApiData(() => apiJson(SUPER_ADMIN_DASHBOARD.INVOICE_STATS), []);
  const cinemaList   = useApiData(() => apiJson(CINEMAS.LIST), []);

  const formatVN   = (v) => formatVnd(v, { compact: true });
  const formatFull = (v) => formatVnd(v);
  const allData    = invoiceStats.data || [];

  const completed     = useMemo(() => allData.filter((o) => o.status === 1), [allData]);
  const totalRevenue  = useMemo(() => completed.reduce((s, o) => s + (o.finalAmount   || 0), 0), [completed]);
  const totalDiscount = useMemo(() => completed.reduce((s, o) => s + (o.discountAmount || 0), 0), [completed]);

  const monthlyRevenue = useMemo(() => {
    const arr = Array(12).fill(0);
    allData
      .filter((o) => o.status === 1 && o.createdAt && new Date(o.createdAt).getFullYear() === chartYear)
      .forEach((o) => { arr[new Date(o.createdAt).getMonth()] += o.finalAmount || 0; });
    return arr;
  }, [allData, chartYear]);

  const paymentDist = useMemo(() => {
    let counter = 0, online = 0;
    completed.forEach((o) => { o.isCounter ? counter++ : online++; });
    return [["Mua tại quầy", counter], ["Mua online", online]].filter(([, v]) => v > 0);
  }, [completed]);

  const cinemaOptions = useMemo(() => {
    const fromList = (cinemaList.data || [])
      .filter((c) => c.cinemaId && c.name)
      .map((c) => ({ id: c.cinemaId, name: c.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    if (fromList.length > 0) return fromList;
    // fallback từ orders khi chưa load
    const seen = new Map();
    allData.forEach((o) => { if (o.cinemaId && o.cinemaName && o.cinemaName !== "—") seen.set(o.cinemaId, o.cinemaName); });
    return [...seen.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [cinemaList.data, allData]);

  const filtered = useMemo(() => {
    return allData.filter((o) => {
      if (filterStatus  !== "" && String(o.status) !== filterStatus)                        return false;
      if (filterPayment === "counter" && !o.isCounter)                                      return false;
      if (filterPayment === "online"  &&  o.isCounter)                                      return false;
      if (filterCinema  && String(o.cinemaId) !== filterCinema)                             return false;
      if (filterYear  > 0 && o.createdAt && new Date(o.createdAt).getFullYear()       !== filterYear)  return false;
      if (filterMonth > 0 && o.createdAt && (new Date(o.createdAt).getMonth() + 1)    !== filterMonth) return false;
      if (search) {
        const t = search.toLowerCase();
        if (!o.orderCode?.toLowerCase().includes(t) && !o.customerName?.toLowerCase().includes(t)) return false;
      }
      return true;
    });
  }, [allData, filterStatus, filterPayment, filterCinema, filterYear, filterMonth, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((o, i) => ({ ...o, _rank: (page - 1) * PAGE_SIZE + i + 1 }));

  const resetPage = () => setPage(1);

  const openOrderDetail = async (orderId) => {
    setShowDetailModal(true);
    setDetailOrder(null);
    setDetailErr("");
    setDetailLoading(true);
    try {
      const res  = await apiFetch(ORDERS_ONLINE.BY_ID(orderId));
      const json = await res.json().catch(() => null);
      if (!res.ok) { setDetailErr(json?.message || "Không tải được đơn"); return; }
      setDetailOrder(json?.data ?? json);
    } catch {
      setDetailErr("Lỗi kết nối máy chủ");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeOrderDetail = () => { setShowDetailModal(false); setDetailOrder(null); setDetailErr(""); };

  const chartYearRight = (
    <select
      className="admin-search-input admin-filter-control"
      style={{ width: 80, height: 30, fontSize: 12 }}
      value={chartYear}
      onChange={(e) => setChartYear(Number(e.target.value))}
    >
      {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
    </select>
  );

  return (
    <AdminPanelPage icon="receipt-cutoff" title="Thống kê hóa đơn">
      <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <KpiCard title="Tổng đơn"       value={formatNumber(allData.length)}   color="#8b5cf6" loading={invoiceStats.loading} />
        <KpiCard title="Đơn hoàn tất"   value={formatNumber(completed.length)} color="#1baf7a" loading={invoiceStats.loading} />
        <KpiCard title="Tổng doanh thu" value={formatVN(totalRevenue)}         color="#2a78d6" loading={invoiceStats.loading} />
        <KpiCard title="Tổng giảm giá"  value={formatVN(totalDiscount)}        color="#eb6834" loading={invoiceStats.loading} />
      </div>

      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <ChartCard
            title="Doanh thu theo tháng"
            headerRight={chartYearRight}
            loading={invoiceStats.loading}
            error={invoiceStats.error}
            isEmpty={!invoiceStats.loading && monthlyRevenue.every((v) => v === 0)}
            height={300}
          >
            <BarChartWidget
              labels={MONTH_LABELS}
              datasets={[{ label: "Doanh thu", data: monthlyRevenue }]}
            />
          </ChartCard>
        </div>

        <div className="col-lg-5">
          <ChartCard
            title="Phân bổ phương thức thanh toán"
            loading={invoiceStats.loading}
            error={invoiceStats.error}
            isEmpty={!invoiceStats.loading && paymentDist.length === 0}
            height={300}
          >
            <PieChartWidget
              labels={paymentDist.map(([pm]) => pm)}
              values={paymentDist.map(([, cnt]) => cnt)}
            />
          </ChartCard>
        </div>

        <div className="col-12">
          <div className="admin-card admin-slide-up">
            <div className="admin-card-header">
              <h4 className="mb-0">Chi tiết hóa đơn</h4>
              <div className="d-flex flex-wrap gap-2">
                <input
                  type="text"
                  className="admin-search-input admin-filter-control"
                  style={{ width: 200, height: 34 }}
                  placeholder="Mã đơn / Tên khách..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); resetPage(); }}
                />
                <select className="admin-search-input admin-filter-control" style={{ width: 130, height: 34 }}
                  value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); resetPage(); }}>
                  <option value="">Tất cả Trạng thái</option>
                  <option value="1">Hoàn tất</option>
                  <option value="0">Chờ thanh toán</option>
                  <option value="2">Đã huỷ</option>
                </select>
                <select className="admin-search-input admin-filter-control" style={{ width: 140, height: 34 }}
                  value={filterPayment} onChange={(e) => { setFilterPayment(e.target.value); resetPage(); }}>
                  <option value="">Tất cả loại mua</option>
                  <option value="counter">Mua tại quầy</option>
                  <option value="online">Mua online</option>
                </select>
                <select className="admin-search-input admin-filter-control" style={{ width: 150, height: 34 }}
                  value={filterCinema} onChange={(e) => { setFilterCinema(e.target.value); resetPage(); }}>
                  <option value="">Tất cả rạp</option>
                  {cinemaOptions.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
                <select className="admin-search-input admin-filter-control" style={{ width: 80, height: 34 }}
                  value={filterYear} onChange={(e) => { setFilterYear(Number(e.target.value)); resetPage(); }}>
                  <option value={0}>Năm</option>
                  {YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select className="admin-search-input admin-filter-control" style={{ width: 120, height: 34 }}
                  value={filterMonth} onChange={(e) => { setFilterMonth(Number(e.target.value)); resetPage(); }}>
                  <option value={0}>Tất cả tháng</option>
                  {MONTH_LABELS.map((label, i) => (
                    <option key={i + 1} value={i + 1}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mvstat-header" style={{ display: "grid", gridTemplateColumns: COLS }}>
              <span>#</span>
              <span>Mã đơn</span>
              <span>Khách hàng</span>
              <span>Rạp</span>
              <span>Phương thức</span>
              <span style={{ textAlign: "right" }}>Giảm giá</span>
              <span style={{ textAlign: "right" }}>Thực thu</span>
              <span style={{ textAlign: "center" }}>Trạng thái</span>
              <span style={{ textAlign: "right" }}>Ngày tạo</span>
              <span></span>
            </div>

            {invoiceStats.loading ? (
              <div className="mvstat-empty">Đang tải...</div>
            ) : invoiceStats.error ? (
              <div className="mvstat-empty text-danger">{invoiceStats.error}</div>
            ) : paged.length === 0 ? (
              <div className="mvstat-empty">Không có dữ liệu</div>
            ) : paged.map((o) => (
              <div key={o.orderId} className="mvstat-row" style={{ display: "grid", gridTemplateColumns: COLS }}>
                <span className="text-muted">{o._rank}</span>
                <span style={{ fontSize: "0.82rem", fontFamily: "monospace" }}>{o.orderCode || "—"}</span>
                <span style={{ fontWeight: 500 }}>{o.customerName}</span>
                <span style={{ fontSize: "0.83rem" }}>{o.cinemaName}</span>
                <span style={{ fontSize: "0.83rem" }}>{getPayCategory(o)}</span>
                <span style={{ textAlign: "right" }}>
                  {o.discountAmount > 0 ? formatVN(o.discountAmount) : "—"}
                </span>
                <span style={{ textAlign: "right" }}>{formatVN(o.finalAmount)}</span>
                <span style={{ textAlign: "center" }}>
                  <span className={`admin-badge ${STATUS_MAP[o.status]?.badge ?? "admin-badge-neutral"}`}>
                    {STATUS_MAP[o.status]?.label ?? "?"}
                  </span>
                </span>
                <span style={{ textAlign: "right", fontSize: "0.8rem" }}>{fmtDate(o.createdAt)}</span>
                <span style={{ textAlign: "center" }}>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    style={{ fontSize: "0.75rem", padding: "2px 8px" }}
                    onClick={() => openOrderDetail(o.orderId)}
                  >
                    Xem
                  </button>
                </span>
              </div>
            ))}
          </div>

          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="đơn"
          />
        </div>
      </div>

      {/* Modal chi tiết đơn — đồng bộ với admin InvoiceManagement */}
      <Modal show={showDetailModal} onHide={closeOrderDetail} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="d-flex align-items-center gap-2 fw-bold text-primary mb-0">
            Chi tiết hóa đơn
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-dark">
          {detailLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : detailErr ? (
            <p className="text-danger mb-0">{detailErr}</p>
          ) : !detailOrder ? (
            <p className="text-muted mb-0">Không có dữ liệu</p>
          ) : (
            <InvoiceSummaryCard order={detailOrder} />
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={closeOrderDetail}>Đóng</Button>
        </Modal.Footer>
      </Modal>
    </AdminPanelPage>
  );
};

export default InvoiceStatistics;
