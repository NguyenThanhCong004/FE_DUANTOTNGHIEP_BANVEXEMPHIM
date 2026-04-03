import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { apiFetch } from "../../utils/apiClient";
import { ME } from "../../constants/apiEndpoints";
import { getAccessToken } from "../../utils/authStorage";
import { mapUserVoucherRow } from "../../utils/customerMeApi";
import {
  Ticket,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  Tag,
  Percent,
  DollarSign,
  Gift,
  Star,
  ChevronRight,
  Eye,
  Zap
} from "lucide-react";

const fmtVnd = (n) => Number(n ?? 0).toLocaleString("vi-VN") + "đ";
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("vi-VN") : "";

function formatDiscount(v) {
  if (!v) return "";
  const dt = String(v.discountType || "").toLowerCase();
  if (dt === "fixed" || dt === "amount") return fmtVnd(v.value);
  if (dt === "percent" || dt === "percentage") return `${Number(v.value ?? 0).toLocaleString("vi-VN")}%`;
  return fmtVnd(v.value);
}

export default function MyVouchers() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [filter, setFilter] = useState("all"); // all | active | used
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setRows([]);
      return;
    }
    let c = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await apiFetch(ME.VOUCHERS);
        const body = await res.json().catch(() => null);
        if (c) return;
        if (res.status === 401) {
          navigate("/login", { state: { from: "/myVouchers" } });
          return;
        }
        if (!res.ok) {
          setLoadError(body?.message || "Không tải được voucher");
          setRows([]);
          return;
        }
        const raw = Array.isArray(body?.data) ? body.data : [];
        setRows(raw.map(mapUserVoucherRow));
      } catch {
        if (!c) setLoadError("Lỗi kết nối");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => { c = true; };
  }, [navigate]);

  const filtered = useMemo(() => {
    return rows.filter((uv) => {
      const voucher = uv.voucher;
      const isExpired = voucher?.status === 0;
      const isUsed = uv.status === 0;
      const isActive = !isExpired && !isUsed;

      if (filter === "active") return isActive;
      if (filter === "used") return isUsed || isExpired;
      return true;
    });
  }, [filter, rows]);

  return (
    <Layout>
      <div className="min-h-screen bg-zinc-950 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <p className="text-rose-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Ticket size={16} />
              Voucher của tôi
            </p>
            <h1 className="text-4xl font-bold text-white">
              DANH SÁCH <span className="text-rose-500">VOUCHER</span>
            </h1>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-zinc-400 text-sm">Đang tải voucher…</p>
            </div>
          )}

          {/* Auth Error */}
          {!loading && !getAccessToken() && (
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-2xl p-6 text-center">
              <AlertCircle className="text-amber-400 mx-auto mb-2" size={24} />
              <p className="text-amber-400 font-medium">Đăng nhập để xem voucher của bạn.</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Tổng voucher</p>
                  <p className="text-2xl font-bold text-white">{rows.length}</p>
                </div>
                <div className="w-12 h-12 bg-rose-500/20 border border-rose-500/30 rounded-xl flex items-center justify-center text-rose-400">
                  <Ticket size={20} />
                </div>
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Đang hoạt động</p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {rows.filter(uv => {
                      const voucher = uv.voucher;
                      const isExpired = voucher?.status === 0;
                      const isUsed = uv.status === 0;
                      return !isExpired && !isUsed;
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-emerald-400">
                  <CheckCircle size={20} />
                </div>
              </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm mb-1">Đã sử dụng</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {rows.filter(uv => {
                      const voucher = uv.voucher;
                      const isExpired = voucher?.status === 0;
                      const isUsed = uv.status === 0;
                      return isUsed || isExpired;
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400">
                  <XCircle size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Load Error */}
          {loadError && getAccessToken() && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-2xl p-6 text-center">
              <XCircle className="text-red-400 mx-auto mb-2" size={24} />
              <p className="text-red-400 font-medium">{loadError}</p>
            </div>
          )}

          {/* Filter Bar */}
          {!loading && getAccessToken() && !loadError && (
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { key: "all", label: "Tất cả", icon: <Filter size={14} /> },
                { key: "active", label: "Đang hoạt động", icon: <CheckCircle size={14} /> },
                { key: "used", label: "Đã sử dụng", icon: <XCircle size={14} /> },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-all ${
                    filter === key
                      ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20"
                      : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-white"
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Voucher Grid */}
          {!loading && getAccessToken() && !loadError && (
            <>
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Ticket className="text-zinc-600 mx-auto mb-4" size={48} />
                  <p className="text-zinc-500 font-medium mb-2">Không có voucher nào</p>
                  <p className="text-zinc-600 text-sm">
                    {filter === "active" && "Bạn chưa có voucher đang hoạt động"}
                    {filter === "used" && "Bạn chưa sử dụng voucher nào"}
                    {filter === "all" && "Chưa có voucher nào trong tài khoản"}
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filtered.map((uv) => {
                    const voucher = uv.voucher;
                    const isExpired = voucher?.status === 0;
                    const isUsed = uv.status === 0;
                    const isActive = !isExpired && !isUsed;
                    
                    return (
                      <div
                        key={uv.id}
                        onClick={() => setSelected(uv)}
                        className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm cursor-pointer transition-all hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-900/50 group"
                      >
                        {/* Status Stripe */}
                        <div className={`h-1 w-full rounded-t-xl mb-4 ${
                          isActive ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 
                          isUsed ? 'bg-gradient-to-r from-zinc-600 to-zinc-500' : 
                          'bg-gradient-to-r from-red-500 to-red-400'
                        }`} />
                        
                        <div className="space-y-4">
                          {/* Code */}
                          <div className="flex items-center justify-between">
                            <div className="font-mono text-sm bg-zinc-800/50 border border-zinc-700 px-3 py-1 rounded-lg text-zinc-300">
                              {voucher.code}
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                              isActive 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : isUsed
                                ? 'bg-zinc-600/20 text-zinc-400 border border-zinc-600/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                              {isActive ? 'Hoạt động' : isUsed ? 'Đã dùng' : 'Hết hạn'}
                            </span>
                          </div>
                          
                          {/* Discount */}
                          <div className="text-center">
                            <div className="text-3xl font-bold text-amber-400">
                              {formatDiscount(voucher)}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">Giảm giá</div>
                          </div>
                          
                          {/* Description */}
                          {voucher.description && (
                            <p className="text-sm text-zinc-400 line-clamp-2">
                              {voucher.description}
                            </p>
                          )}
                          
                          {/* Validity */}
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <div className="flex items-center gap-1">
                              <Calendar size={12} />
                              {fmtDate(voucher.startDate)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock size={12} />
                              {fmtDate(voucher.endDate)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Hover Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-rose-600/5 to-amber-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Detail Modal */}
          {selected && (
            <div 
              className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelected(null)}
            >
              <div 
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Ticket className="text-rose-500" />
                    Chi tiết voucher
                  </h3>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-zinc-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-amber-400 mb-2">
                      {formatDiscount(selected.voucher)}
                    </div>
                    <div className="font-mono text-lg bg-zinc-800/50 border border-zinc-700 px-4 py-2 rounded-lg text-white inline-block">
                      {selected.voucher.code}
                    </div>
                  </div>
                  
                  {selected.voucher.description && (
                    <div className="p-4 bg-zinc-800/30 rounded-xl">
                      <p className="text-zinc-300">{selected.voucher.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-zinc-800/30 rounded-xl">
                      <div className="text-zinc-500 mb-1">Bắt đầu</div>
                      <div className="text-white font-medium">{fmtDate(selected.voucher.startDate)}</div>
                    </div>
                    <div className="p-3 bg-zinc-800/30 rounded-xl">
                      <div className="text-zinc-500 mb-1">Kết thúc</div>
                      <div className="text-white font-medium">{fmtDate(selected.voucher.endDate)}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => setSelected(null)}
                      className="flex-1 px-4 py-3 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors font-medium"
                    >
                      Đóng
                    </button>
                    <button
                      className="flex-1 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors font-medium shadow-lg shadow-rose-600/20"
                    >
                      Sử dụng ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </Layout>
  );
}
                  
