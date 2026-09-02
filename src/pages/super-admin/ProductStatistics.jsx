import React, { useState, useMemo } from "react";

import AdminPanelPage from "../../components/admin/AdminPanelPage";
import AdminPagination from "../../components/admin/AdminPagination";
import KpiCard from "../../components/admin/dashboard/KpiCard";
import ChartCard from "../../components/admin/dashboard/ChartCard";
import BarChartWidget from "../../components/admin/dashboard/BarChartWidget";
import PieChartWidget from "../../components/admin/dashboard/PieChartWidget";
import { useApiData } from "../../components/admin/dashboard/useApiData";
import { apiJson } from "../../utils/apiClient";
import { SUPER_ADMIN_DASHBOARD } from "../../constants/apiEndpoints";
import { formatNumber, formatVnd } from "../../utils/formatters";

const PAGE_SIZE = 10;
const COLS = "36px 1fr 130px 100px 100px 130px 110px";

const STATUS_LABELS = { 1: "Đang bán", 0: "Ngừng bán" };
const STATUS_BADGE  = { 1: "admin-badge-success", 0: "admin-badge-danger" };

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];
const MONTHS = [
  { value: 0,  label: "Cả năm" },
  { value: 1,  label: "Tháng 1" },
  { value: 2,  label: "Tháng 2" },
  { value: 3,  label: "Tháng 3" },
  { value: 4,  label: "Tháng 4" },
  { value: 5,  label: "Tháng 5" },
  { value: 6,  label: "Tháng 6" },
  { value: 7,  label: "Tháng 7" },
  { value: 8,  label: "Tháng 8" },
  { value: 9,  label: "Tháng 9" },
  { value: 10, label: "Tháng 10" },
  { value: 11, label: "Tháng 11" },
  { value: 12, label: "Tháng 12" },
];

const ProductStatistics = () => {
  const [page, setPage]     = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("quantity");
  const [pieYear, setPieYear]   = useState(CURRENT_YEAR);
  const [pieMonth, setPieMonth] = useState(new Date().getMonth() + 1);

  const productStats = useApiData(() => apiJson(SUPER_ADMIN_DASHBOARD.PRODUCT_STATS), []);
  const catRevenue   = useApiData(
    () => apiJson(SUPER_ADMIN_DASHBOARD.PRODUCT_CATEGORY_REVENUE(pieYear, pieMonth)),
    [pieYear, pieMonth]
  );

  const formatVN = (v) => formatVnd(v, { compact: true });

  const allData = productStats.data || [];

  const filtered = useMemo(() => {
    let data = allData;
    if (search) {
      const term = search.toLowerCase();
      data = data.filter(
        (p) =>
          p.productName?.toLowerCase().includes(term) ||
          p.categoryName?.toLowerCase().includes(term)
      );
    }
    if (sortBy === "revenue")
      data = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue);
    else
      data = [...data].sort((a, b) => b.quantitySold - a.quantitySold);
    return data;
  }, [allData, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered
    .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    .map((p, i) => ({ ...p, _rank: (page - 1) * PAGE_SIZE + i + 1 }));

  const totalQty     = allData.reduce((a, b) => a + (b.quantitySold || 0), 0);
  const totalRevenue = allData.reduce((a, b) => a + (b.totalRevenue || 0), 0);

  const top10 = useMemo(
    () => [...allData].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10),
    [allData]
  );

  const catRevenueEntries = useMemo(() => {
    const raw = catRevenue.data;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
    return Object.entries(raw)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);
  }, [catRevenue.data]);

  const pieFilter = (
    <div className="d-flex gap-2">
      <select
        className="admin-search-input admin-filter-control"
        style={{ width: 100, height: 30, fontSize: 12 }}
        value={pieMonth}
        onChange={(e) => setPieMonth(Number(e.target.value))}
      >
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <select
        className="admin-search-input admin-filter-control"
        style={{ width: 76, height: 30, fontSize: 12 }}
        value={pieYear}
        onChange={(e) => setPieYear(Number(e.target.value))}
      >
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );

  return (
    <AdminPanelPage icon="cup-straw" title="Thống kê sản phẩm">
      <div className="admin-stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <KpiCard title="Tổng sản phẩm"     value={formatNumber(allData.length)} color="#2a78d6" loading={productStats.loading} />
        <KpiCard title="Tổng số lượng bán" value={formatNumber(totalQty)}       color="#eb6834" loading={productStats.loading} />
        <KpiCard title="Tổng doanh thu sản phẩm" value={formatVN(totalRevenue)}      color="#1baf7a" loading={productStats.loading} />
      </div>

      <div className="row g-4 mt-1">
        <div className="col-lg-7">
          <ChartCard
            title="Top 10 sản phẩm bán chạy nhất"
            loading={productStats.loading}
            error={productStats.error}
            isEmpty={!productStats.loading && top10.length === 0}
            height={320}
          >
            <BarChartWidget
              horizontal
              labels={top10.map((p) => p.productName)}
              datasets={[{ label: "Số lượng bán", data: top10.map((p) => p.quantitySold) }]}
            />
          </ChartCard>
        </div>

        <div className="col-lg-5">
          <ChartCard
            title="Doanh thu theo loại sản phẩm"
            headerRight={pieFilter}
            loading={catRevenue.loading}
            error={catRevenue.error}
            isEmpty={!catRevenue.loading && catRevenueEntries.length === 0}
            height={320}
          >
            <PieChartWidget
              labels={catRevenueEntries.map(([cat]) => cat || "—")}
              values={catRevenueEntries.map(([, rev]) => rev)}
            />
          </ChartCard>
        </div>

        <div className="col-12">
          <div className="admin-card admin-slide-up">
            <div className="admin-card-header">
              <h4 className="mb-0">Chi tiết thống kê sản phẩm</h4>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="admin-search-input admin-filter-control"
                  style={{ width: 240, height: 34 }}
                  placeholder="Tìm tên hoặc loại..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                />
                <select
                  className="admin-search-input admin-filter-control"
                  style={{ width: 170, height: 34 }}
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                >
                  <option value="quantity">Sắp xếp: Số lượng</option>
                  <option value="revenue">Sắp xếp: Doanh thu</option>
                </select>
              </div>
            </div>

            <div className="mvstat-header" style={{ display: "grid", gridTemplateColumns: COLS }}>
              <span>#</span>
              <span>Sản phẩm</span>
              <span>Loại</span>
              <span style={{ textAlign: "right" }}>Đơn giá</span>
              <span style={{ textAlign: "right" }}>Số lượng</span>
              <span style={{ textAlign: "right" }}>Doanh thu</span>
              <span style={{ textAlign: "center" }}>Trạng thái</span>
            </div>

            {productStats.loading ? (
              <div className="mvstat-empty">Đang tải...</div>
            ) : productStats.error ? (
              <div className="mvstat-empty text-danger">{productStats.error}</div>
            ) : paged.length === 0 ? (
              <div className="mvstat-empty">Không có dữ liệu</div>
            ) : paged.map((p) => (
              <div key={p.productId} className="mvstat-row" style={{ display: "grid", gridTemplateColumns: COLS }}>
                <span className="text-muted">{p._rank}</span>
                <span style={{ fontWeight: 500 }}>{p.productName}</span>
                <span>{p.categoryName || "—"}</span>
                <span style={{ textAlign: "right" }}>{formatVN(p.unitPrice)}</span>
                <span style={{ textAlign: "right" }}>{formatNumber(p.quantitySold)}</span>
                <span style={{ textAlign: "right" }}>{formatVN(p.totalRevenue)}</span>
                <span style={{ textAlign: "center" }}>
                  <span className={`admin-badge ${STATUS_BADGE[p.status] ?? "admin-badge-neutral"}`}>
                    {STATUS_LABELS[p.status] ?? "Không xác định"}
                  </span>
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
            itemLabel="sản phẩm"
          />
        </div>
      </div>
    </AdminPanelPage>
  );
};

export default ProductStatistics;
