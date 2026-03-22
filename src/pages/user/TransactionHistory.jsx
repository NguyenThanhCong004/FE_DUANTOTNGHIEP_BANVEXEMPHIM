import { useState, useEffect } from "react";
import { 
  Info, Filter, Search, Loader2, AlertCircle, 
  Calendar, Clock, ChevronDown, ArrowRight, X 
} from "lucide-react"; 

// --- MOCK COMPONENTS VÀ UTILS ĐỂ CHẠY TRONG CANVAS ---
// Giả lập thư viện react-router-dom
const useNavigate = () => (path) => console.log("Navigating to", path);
const Link = ({ to, children, className }) => <a href={to} className={className} onClick={e => e.preventDefault()}>{children}</a>;

// Giả lập các file local
const Layout = ({ children }) => <div className="w-full h-full font-sans">{children}</div>;
const ME = { TRANSACTIONS: "/mock-api" };
const getAccessToken = () => "mock-token-123";
const mapMeTransactionToFe = (data) => data;

// Giả lập API trả về dữ liệu mẫu
const apiFetch = async () => ({
  ok: true,
  status: 200,
  json: async () => ({
    data: [
      {
        id: "TX-12345",
        type: "ticket_online",
        status: "completed",
        order_code: "CINE-8899A",
        created_at: new Date().toISOString(),
        original_amount: 150000,
        discount_amount: 20000,
        final_amount: 130000,
        points_earned: 13,
        voucher_code: "GIAM20K",
        items: [
          { label: "Vé xem phim: Dune 2", sub: "Ghế H1, H2", price: 150000, qty: 1, icon: "🎫" }
        ]
      },
      {
        id: "TX-99887",
        type: "food",
        status: "completed",
        order_code: "FOOD-1122B",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        original_amount: 85000,
        discount_amount: 0,
        final_amount: 85000,
        points_earned: 8,
        items: [
          { label: "Combo 2 Ngăn", sub: "1 Bắp phô mai & caramel, 2 Coca", price: 85000, qty: 1, icon: "🍿" }
        ]
      },
      {
        id: "TX-55443",
        type: "points",
        status: "completed",
        order_code: "PTS-DED-11",
        created_at: new Date(Date.now() - 172800000).toISOString(),
        original_amount: 0,
        discount_amount: 0,
        final_amount: -50,
        points_earned: 0,
        items: [
          { label: "Đổi quà thành viên", sub: "Voucher giảm 50K", price: -50, qty: 1, icon: "⭐" }
        ]
      }
    ]
  })
});
// -----------------------------------------------------

const TYPE_CONFIG = {
  ticket_online: { label: "Vé Online", color: "#7b1fa2", bg: "rgba(123,31,162,0.12)", icon: "🎫" },
  food:          { label: "Bắp & Nước", color: "#e91e8c", bg: "rgba(233,30,140,0.12)", icon: "🍿" },
  points:        { label: "Điểm", color: "#d4e219", bg: "rgba(212,226,25,0.12)", icon: "⭐" }, 
};

const STATUS_CONFIG = {
  completed: { label: "Hoàn thành", color: "#81c784", bg: "rgba(76,175,80,0.12)" },
  cancelled: { label: "Đã hủy", color: "#e57373", bg: "rgba(244,67,54,0.12)" },
  pending:   { label: "Chờ xử lý", color: "#d4e219", bg: "rgba(212,226,25,0.12)" },
};

const fmt = (n) => Math.abs(n).toLocaleString("vi-VN") + "đ";
const fmtDate = (d) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

/* ══ Detail Modal ══ */
function DetailModal({ tx, onClose }) {
  if (!tx) return null;
  const tc = TYPE_CONFIG[tx.type] || TYPE_CONFIG.ticket_online;
  const sc = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
        <button 
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors z-10" 
          onClick={onClose}
        >
          <X size={16} />
        </button>

        <div className="p-6 flex items-center gap-4 bg-zinc-900/40 border-b border-zinc-800">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ background: tc.bg, color: tc.color }}>
            {tc.icon}
          </div>
          <div>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">CHI TIẾT GIAO DỊCH</div>
            <div className="text-xl font-black text-white tracking-tight">{tx.order_code}</div>
          </div>
          <span className="ml-auto px-3 py-1.5 rounded-xl text-xs font-bold border" style={{ background: sc.bg, color: sc.color, borderColor: `${sc.color}40` }}>
            {sc.label}
          </span>
        </div>

        {/* Items */}
        <div className="p-6 space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar">
          {tx.items.map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm truncate">{item.label}</div>
                <div className="text-[10px] text-zinc-500 font-medium">{item.sub}</div>
              </div>
              <div className="text-right text-sm font-black tabular-nums text-zinc-400">
                {tx.type === "points" 
                  ? <span className={item.price > 0 ? "text-emerald-500" : "text-red-500"}>
                      {item.price > 0 ? "+" : ""}{item.price.toLocaleString()} pts
                    </span>
                  : fmt(item.price * item.qty)
                }
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="p-6 border-t border-zinc-800 bg-zinc-900/20">
          {tx.type !== "points" ? (
            <div className="space-y-3">
              <div className="flex justify-between text-sm font-medium text-zinc-500">
                <span>Tạm tính</span>
                <span className="text-zinc-300">{fmt(tx.original_amount)}</span>
              </div>
              {tx.discount_amount > 0 && (
                <div className="flex justify-between text-sm font-bold text-emerald-400">
                  <div className="flex items-center gap-2">
                    Giảm giá
                    {tx.voucher_code && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black tracking-widest">
                        {tx.voucher_code}
                      </span>
                    )}
                  </div>
                  <span>-{fmt(tx.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-zinc-800 mt-3">
                <span className="text-base font-bold text-white">Tổng thanh toán</span>
                <span className="text-2xl font-black text-rose-500 tracking-tight tabular-nums">{fmt(tx.final_amount)}</span>
              </div>
              {tx.points_earned > 0 && (
                <div className="flex justify-between text-xs font-bold text-amber-500 pt-2">
                  <span>Điểm tích lũy nhận được</span>
                  <span>+{tx.points_earned} pts</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-white">Tổng điểm thay đổi</span>
              <span className={`text-2xl font-black tracking-tight tabular-nums ${tx.final_amount >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {tx.final_amount > 0 ? "+" : ""}{tx.final_amount.toLocaleString()} pts
              </span>
            </div>
          )}

          <div className="mt-6 text-center">
            <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Mã giao dịch hệ thống</div>
            <div className="text-xs font-mono text-zinc-600 mt-1">{tx.id}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══ Main Page ══ */
export default function TransactionHistory() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      setTransactions([]);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await apiFetch(ME.TRANSACTIONS);
        const body = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.status === 401) {
          navigate("/login", { state: { from: "/transactionHistory" } });
          return;
        }
        if (!res.ok) {
          setLoadError(body?.message || "Không tải được lịch sử giao dịch");
          setTransactions([]);
          return;
        }
        const raw = Array.isArray(body?.data) ? body.data : [];
        setTransactions(raw.map(mapMeTransactionToFe));
      } catch {
        if (!cancelled) setLoadError("Không kết nối được máy chủ");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const filtered = transactions.filter(tx => {
    const matchType = filterType === "all" || tx.type === filterType;
    const matchStatus = filterStatus === "all" || tx.status === filterStatus;
    const code = String(tx.order_code || "").toLowerCase();
    const q = search.toLowerCase();
    const matchSearch = code.includes(q) ||
                        tx.items.some(i => String(i.label || "").toLowerCase().includes(q));
    return matchType && matchStatus && matchSearch;
  });

  /* Stats */
  const totalSpent = transactions.filter(t => t.status === "completed" && t.type !== "points").reduce((a, t) => a + t.final_amount, 0);
  const totalPts = transactions.filter(t => t.status === "completed").reduce((a, t) => a + (t.points_earned || 0), 0);
  const totalOrders = transactions.filter(t => t.status === "completed").length;

  return (
    <Layout>
      <div className="min-h-screen bg-zinc-950 text-zinc-300 pb-24">
        {selected && <DetailModal tx={selected} onClose={() => setSelected(null)} />}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

          {/* ── HEADER ── */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <div className="flex items-center gap-2 text-rose-500 font-black uppercase tracking-[0.2em] text-xs mb-3">
                <Info size={14} />
                Lịch sử tài khoản
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                LỊCH SỬ <span className="text-rose-600">GIAO DỊCH</span>
              </h1>
            </div>

            {!loading && getAccessToken() && transactions.length > 0 && (
              <div className="flex gap-3">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-w-[100px] text-center shadow-xl">
                  <div className="text-2xl font-black text-white tabular-nums">{totalOrders}</div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Đơn hàng</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-w-[100px] text-center shadow-xl">
                  <div className="text-2xl font-black text-rose-500 tabular-nums">{(totalSpent / 1000).toFixed(0)}K</div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Đã chi</div>
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 min-w-[100px] text-center shadow-xl">
                  <div className="text-2xl font-black text-amber-500 tabular-nums">{totalPts}</div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Điểm ⭐</div>
                </div>
              </div>
            )}
          </div>

          {/* ── FILTERS ── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-8 shadow-xl">
            <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-800 rounded-xl text-zinc-400 mr-2">
                  <Filter size={16} />
                  <span className="text-xs font-bold uppercase">Lọc:</span>
                </div>

                <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                  {[
                    { key: "all",           label: "Tất cả" },
                    { key: "ticket_online", label: "Vé" },
                    { key: "food",          label: "Bắp Nước" },
                    { key: "points",        label: "Điểm" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilterType(key)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        filterType === key ? "bg-rose-600 text-white shadow-lg" : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                  {[
                    { key: "all",       label: "Mọi trạng thái" },
                    { key: "completed", label: "Hoàn thành" },
                    { key: "cancelled", label: "Đã hủy" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilterStatus(key)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        filterStatus === key ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative w-full lg:max-w-xs">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
                <input
                  className="w-full pl-12 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500 transition-all font-medium"
                  placeholder="Tìm mã đơn, tên sản phẩm..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ── CONTENT ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-12 h-12 text-rose-500 animate-spin mb-4" />
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : !getAccessToken() ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center shadow-2xl max-w-2xl mx-auto">
              <Info className="w-16 h-16 text-rose-500 mx-auto mb-6 opacity-20" />
              <h2 className="text-2xl font-bold text-white mb-4">Vui lòng đăng nhập</h2>
              <p className="text-zinc-500 mb-8">Bạn cần đăng nhập để xem lịch sử giao dịch và tích lũy điểm thưởng.</p>
              <Link to="/login" className="inline-block px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-600/20">
                Đăng nhập ngay
              </Link>
            </div>
          ) : loadError ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center text-red-400 font-bold max-w-2xl mx-auto">
              <AlertCircle className="mx-auto mb-3" size={32} />
              {loadError}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800">
              <Search className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-zinc-500 mb-2">Không tìm thấy giao dịch nào</h3>
              <p className="text-zinc-600">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-4 mb-2">
                <span className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em]">Danh sách {filtered.length} giao dịch</span>
              </div>

              {filtered.map(tx => {
                const tc = TYPE_CONFIG[tx.type] || TYPE_CONFIG.ticket_online;
                const sc = STATUS_CONFIG[tx.status] || STATUS_CONFIG.pending;
                const isExpanded = expanded === tx.id;
                const isPoints = tx.type === "points";

                return (
                  <div 
                    key={tx.id} 
                    className={`group bg-zinc-900 border transition-all duration-300 rounded-3xl overflow-hidden shadow-xl ${
                      isExpanded ? "border-rose-500/30 ring-1 ring-rose-500/20" : "border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div 
                      className="flex flex-col md:flex-row md:items-center gap-4 p-6 cursor-pointer"
                      onClick={() => setExpanded(isExpanded ? null : tx.id)}
                    >
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`} style={{ background: tc.bg, color: tc.color }}>
                        {tc.icon}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-lg font-black text-white tracking-tight">{tx.order_code}</span>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest`} style={{ background: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                        </div>
                        <div className="text-sm text-zinc-500 font-medium truncate">
                          {tx.items[0]?.label || "Giao dịch"}
                          {tx.items.length > 1 && ` và ${tx.items.length - 1} sản phẩm khác`}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="flex flex-col md:items-end shrink-0">
                        <div className="flex items-center gap-2 text-zinc-400 font-bold text-sm mb-1">
                          <Calendar size={14} className="text-zinc-600" />
                          {fmtDate(tx.created_at)}
                        </div>
                        <div className="flex items-center gap-2 text-zinc-600 font-medium text-xs">
                          <Clock size={12} />
                          {fmtTime(tx.created_at)}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex flex-col md:items-end min-w-[120px] shrink-0">
                        <div className={`text-xl font-black tabular-nums tracking-tight ${
                          tx.status === "cancelled" ? "text-zinc-600 line-through" 
                          : isPoints ? (tx.final_amount > 0 ? "text-emerald-500" : "text-red-500")
                          : "text-rose-500"
                        }`}>
                          {isPoints
                            ? `${tx.final_amount > 0 ? "+" : ""}${tx.final_amount.toLocaleString()} pts`
                            : fmt(tx.final_amount)
                          }
                        </div>
                        <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                          {isPoints ? "Điểm tích lũy" : "Thanh toán"}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className={`p-2 rounded-xl bg-zinc-950 text-zinc-600 group-hover:text-rose-500 transition-all ${isExpanded ? "rotate-180 bg-rose-500/10 text-rose-500" : ""}`}>
                        <ChevronDown size={20} />
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="bg-zinc-950 border-t border-zinc-800 p-6 animate-in slide-in-from-top-4 duration-300">
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-4">Danh sách sản phẩm</span>
                            {tx.items.map((item, i) => (
                              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                                <span className="text-2xl">{item.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-white font-bold text-sm truncate">{item.label}</div>
                                  <div className="text-[10px] text-zinc-500 font-medium">{item.sub}</div>
                                </div>
                                <div className="text-right text-sm font-black tabular-nums text-zinc-400">
                                  {isPoints ? `${item.price > 0 ? "+" : ""}${item.price.toLocaleString()} pts` : fmt(item.price)}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-col justify-between">
                            <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800">
                              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block mb-4">Tóm tắt đơn hàng</span>
                              {!isPoints ? (
                                <div className="space-y-3">
                                  <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                    <span>Tạm tính</span>
                                    <span>{fmt(tx.original_amount)}</span>
                                  </div>
                                  {tx.discount_amount > 0 && (
                                    <div className="flex justify-between text-xs font-bold text-emerald-500 uppercase tracking-widest">
                                      <span>Giảm giá</span>
                                      <span>-{fmt(tx.discount_amount)}</span>
                                    </div>
                                  )}
                                  <div className="h-px bg-zinc-800 my-2" />
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-black text-white uppercase tracking-widest">Tổng cộng</span>
                                    <span className="text-2xl font-black text-rose-500 tracking-tight">{fmt(tx.final_amount)}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center py-4">
                                  <span className="text-sm font-black text-white uppercase tracking-widest">Thay đổi điểm</span>
                                  <span className={`text-2xl font-black tracking-tight ${tx.final_amount >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                    {tx.final_amount > 0 ? "+" : ""}{tx.final_amount.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="mt-6 flex gap-3">
                              <button 
                                onClick={() => setSelected(tx)}
                                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm uppercase tracking-widest transition-all"
                              >
                                Chi tiết hóa đơn
                                <ArrowRight size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}