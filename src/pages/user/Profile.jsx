import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import {
  User,
  Calendar,
  Mail,
  Phone,
  Shield,
  Star,
  History,
  Award,
  Settings,
  LogOut,
  Edit3,
  X,
  Check,
  AlertCircle,
  Camera,
  Key,
  TrendingUp,
  Activity
} from "lucide-react";
import { getAccessToken, getRefreshToken, getStoredStaff, getStoredUser, setAuthSession } from "../../utils/authStorage";
import { getUserIdFromToken } from "../../utils/jwt";
import { apiFetch } from "../../utils/apiClient";
import { USERS, ME } from "../../constants/apiEndpoints";
import { mapMeTransactionToFe } from "../../utils/customerMeApi";

// BE chỉ có endpoint user; không hiển thị dữ liệu mẫu.
// Nếu chưa tải được dữ liệu từ BE thì UI sẽ ở trạng thái loading/empty.

// BE chưa có endpoint rank/membership plans riêng để FE hiển thị chính xác.
// Vì vậy FE không tính/không render rank tiers nữa.

/** Chuẩn hóa ngày sinh từ BE (string yyyy-MM-dd hoặc mảng Jackson). */
function toDateInputValue(birthday) {
  if (birthday == null || birthday === "") return "";
  if (typeof birthday === "string") return birthday.slice(0, 10);
  if (Array.isArray(birthday) && birthday.length >= 3) {
    const [y, m, d] = birthday;
    return `${String(y)}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return "";
}

function normalizeUser(maybeUser) {
  if (!maybeUser) return null;

  // FE shape (đã chuẩn hóa trước đó)
  if (maybeUser.user_id != null) {
    const total = Number(maybeUser.total_spending ?? 0);
    return {
      ...maybeUser,
      points: Number(maybeUser.points ?? 0),
      total_spending: total,
    };
  }

  // BE shape (UserDTO camelCase)
  if (maybeUser.userId != null) {
    const total = Number(maybeUser.totalSpending ?? 0);
    return {
      user_id: maybeUser.userId,
      username: maybeUser.username ?? "",
      fullname: maybeUser.fullname ?? "",
      email: maybeUser.email ?? "",
      phone: maybeUser.phone ?? "",
      birthday: toDateInputValue(maybeUser.birthday),
      avatar: maybeUser.avatar ?? "",
      status: maybeUser.status,
      points: Number(maybeUser.points ?? 0),
      total_spending: total,
      rank_name: maybeUser.rankName ?? null,
    };
  }

  return null;
}

function transactionToActivity(tx) {
  const d = new Date(tx.created_at);
  const dateStr = Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN");
  const icon = tx.type === "points" ? "⭐" : tx.type === "food" ? "🍿" : "🎫";
  const label = tx.items?.[0]?.label || tx.order_code || "Giao dịch";
  let pts = "—";
  let pts_color = "rgba(255,255,255,0.35)";
  if (tx.type === "points") {
    pts = `${tx.final_amount > 0 ? "+" : ""}${tx.final_amount} pts`;
    pts_color = tx.final_amount >= 0 ? "#81c784" : "#e57373";
  } else if (tx.points_earned > 0) {
    pts = `+${tx.points_earned} pts`;
    pts_color = "#81c784";
  }
  return { icon, label, date: dateStr, pts, pts_color };
}

const fmt = (n) => n.toLocaleString("vi-VN") + "đ";
const fmtBirthday = (d) => {
  if (d == null || d === "") return "—";
  const s = typeof d === "string" ? d.slice(0, 10) : d;
  const dt = new Date(s);
  if (Number.isNaN(dt.getTime())) return "—";
  return `${dt.getDate().toString().padStart(2, "0")}/${(dt.getMonth() + 1).toString().padStart(2, "0")}/${dt.getFullYear()}`;
};

/* ── Avatar Component ── */
function Avatar({ name, size = 96, avatarUrl, showEditButton = false, onEditClick }) {
  const safeName = String(name || "?").trim() || "?";
  const initials = safeName.split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join("").toUpperCase() || "?";
  const url = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  const showImg = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:image");

  return (
    <div className="relative">
      {showImg ? (
        <img
          src={url}
          alt=""
          className={`${size === 96 ? 'w-24 h-24' : 'w-20 h-20'} rounded-full object-cover border-2 border-white/20 shadow-2xl`}
        />
      ) : (
        <div className={`${size === 96 ? 'w-24 h-24' : 'w-20 h-20'} rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white font-bold text-2xl shadow-2xl border-2 border-white/20`}>
          {initials}
        </div>
      )}
      {showEditButton && (
        <button
          onClick={onEditClick}
          className="absolute bottom-0 right-0 bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-full shadow-lg transition-colors border-2 border-zinc-900"
        >
          <Camera size={14} />
        </button>
      )}
    </div>
  );
}

/* ── Input Field ── */
function Field({ label, icon, value, name, type = "text", onChange, disabled, error, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
        {icon}
        {label}
      </label>
      <input
        className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-800/50'} text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
      />
      {error && (
        <p className="text-red-400 text-sm flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}

function TextAreaField({ label, icon, value, name, onChange, error, rows = 3, hint, placeholder }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-300 flex items-center gap-2">
        {icon}
        {label}
      </label>
      <textarea
        className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-800/50'} text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all resize-none`}
        name={name}
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ minHeight: rows * 22 }}
      />
      {hint && (
        <p className="text-zinc-500 text-xs">{hint}</p>
      )}
      {error && (
        <p className="text-red-400 text-sm flex items-center gap-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN
══════════════════════════════════════ */
export default function UserProfile() {
  const [user, setUser]         = useState(null);
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState({});
  const [errors, setErrors]     = useState({});
  const [toast, setToast]       = useState(null);
  const [pwModal, setPwModal]   = useState(false);
  const [pwData, setPwData]     = useState({ current: "", newPw: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [activeTab, setActiveTab] = useState("info");
  const [profileLoading, setProfileLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(ME.TRANSACTIONS);
        const body = await res.json().catch(() => null);
        if (cancelled || !res.ok) return;
        const raw = Array.isArray(body?.data) ? body.data : [];
        const acts = raw.map(mapMeTransactionToFe).slice(0, 8).map(transactionToActivity);
        setRecentActivity(acts);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    const uidFromJwt = token ? getUserIdFromToken(token) : null;
    const uidFromStore = stored?.userId ?? stored?.user_id ?? null;
    const userId = uidFromJwt ?? uidFromStore;

    if (stored) {
      const normalized = normalizeUser(stored);
      if (normalized) setUser(normalized);
    }

    if (!token || !userId) {
      setInitialLoad(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setProfileLoading(true);
      try {
        const res = await apiFetch(USERS.BY_ID(userId));
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (res.ok && json?.data) {
          const normalized = normalizeUser(json.data);
          if (normalized) {
            setUser(normalized);
            setAuthSession({
              accessToken: token,
              refreshToken: getRefreshToken(),
              user: json.data,
              staff: getStoredStaff(),
            });
          }
        }
      } catch {
        /* giữ dữ liệu từ localStorage nếu có */
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
          setInitialLoad(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  /* edit handlers */
  const startEdit = () => { setDraft({ ...user }); setEditing(true); setErrors({}); };
  const cancelEdit = () => { setEditing(false); setErrors({}); };
  const handleChange = (e) => {
    setDraft(d => ({ ...d, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: "" }));
  };
  const validateEdit = () => {
    const e = {};
    if (!draft.fullname?.trim()) e.fullname = "Họ tên không được để trống";
    const em = draft.email?.trim() || "";
    if (!em) e.email = "Email không được để trống";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) e.email = "Email không hợp lệ";
    if (!draft.phone?.trim()) e.phone = "Số điện thoại không được để trống";
    else {
      const digits = draft.phone.replace(/\D/g, "");
      if (digits.length < 9 || digits.length > 12) e.phone = "Số điện thoại không hợp lệ";
    }
    return e;
  };
  const saveEdit = async () => {
    const e = validateEdit();
    if (Object.keys(e).length) { setErrors(e); return; }

    const token = getAccessToken();
    if (!token || !user.user_id) {
      showToast("Bạn cần đăng nhập để lưu thông tin", "error");
      return;
    }

    try {
      const body = {
        fullname: draft.fullname.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim().replace(/\s/g, ""),
        status: user.status ?? 1,
        birthday: draft.birthday ? draft.birthday : null,
        avatar: draft.avatar?.trim() ? draft.avatar.trim() : null,
      };
      const res = await apiFetch(USERS.BY_ID(user.user_id), {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) {
        showToast(json?.message || "Cập nhật thất bại", "error");
        return;
      }
      const normalized = normalizeUser(json.data);
      if (normalized) setUser(normalized);
      setAuthSession({
        accessToken: token,
        refreshToken: getRefreshToken(),
        user: json.data,
        staff: getStoredStaff(),
      });
      setEditing(false);
      showToast("Cập nhật thông tin thành công!");
    } catch {
      showToast("Không thể kết nối máy chủ", "error");
    }
  };

  /* password */
  const handlePwChange = (e) => { setPwData(d => ({ ...d, [e.target.name]: e.target.value })); setPwErrors({}); };
  const validatePw = () => {
    const e = {};
    if (!pwData.current) e.current = "Nhập mật khẩu hiện tại";
    if (!pwData.newPw || pwData.newPw.length < 8) e.newPw = "Mật khẩu mới tối thiểu 8 ký tự";
    if (pwData.newPw !== pwData.confirm) e.confirm = "Mật khẩu xác nhận không khớp";
    return e;
  };
  const savePw = async () => {
    const e = validatePw();
    if (Object.keys(e).length) { setPwErrors(e); return; }

    const token = getAccessToken();
    if (!token || !user?.user_id) {
      showToast("Bạn cần đăng nhập", "error");
      return;
    }

    try {
      const res = await apiFetch(USERS.PASSWORD(user.user_id), {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: pwData.current,
          newPassword: pwData.newPw,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(json?.message || "Đổi mật khẩu thất bại", "error");
        return;
      }
      setPwModal(false);
      setPwData({ current: "", newPw: "", confirm: "" });
      showToast("Đổi mật khẩu thành công!");
    } catch {
      showToast("Không thể kết nối máy chủ", "error");
    }
  };

  if (!user) {
    const token = getAccessToken();
    if (token && initialLoad) {
      return (
        <Layout>
          <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>      
           <div style={{ color: "#fff", fontWeight: 700 }}>Đang tải hồ sơ...</div>
          </div>
        </Layout>
      );
    }
    return (
      <Layout>
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>            
        <div                                                                                                                       
           style={{                                                                                                                 
             width: "100%",                                                                                                         
            maxWidth: 720,                                                                                                         
             background: "rgba(20,22,50,0.92)",                                                                                     
            border: "1px solid rgba(255,255,255,0.08)",                                                                            
             borderRadius: 18,                                                                                                      
             padding: 22,                                                                                                           
            color: "#fff",                                                                                                         
             textAlign: "center",                                                                                                   
           }}                                                                                                                       
         >                                                                                                                          
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, letterSpacing: 3, marginBottom: 8 }}>
              {token ? "Không tải được hồ sơ" : "Vui lòng đăng nhập"}
            </div>                                                                                                                   
           <div style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 13, lineHeight: 1.6 }}>
              {token
                ? "Kiểm tra BE đang chạy và token còn hạn. Đăng nhập lại nếu cần."
                : "Trang hồ sơ chỉ hiển thị khi bạn đăng nhập tài khoản khách."}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* PASSWORD MODAL */}
      {pwModal && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center z-[100] p-4" onClick={() => setPwModal(false)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <Key className="text-rose-500" size={24} />
                </div>
                Đổi mật khẩu
              </h3>
              <button
                onClick={() => setPwModal(false)}
                className="text-zinc-400 hover:text-white transition-colors p-2 rounded-xl hover:bg-zinc-800"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5">
              {[
                { name: "current", label: "Mật khẩu hiện tại", icon: <Key size={18} /> },
                { name: "newPw", label: "Mật khẩu mới", icon: <Shield size={18} /> },
                { name: "confirm", label: "Xác nhận mật khẩu mới", icon: <Check size={18} /> },
              ].map(({ name, label, icon }) => (
                <div key={name} className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-400 flex items-center gap-2 ml-1">
                    {icon}
                    {label}
                  </label>
                  <input
                    type="password"
                    name={name}
                    value={pwData[name]}
                    onChange={handlePwChange}
                    className="w-full px-5 py-4 rounded-xl border border-zinc-800 bg-zinc-950 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                  {pwErrors[name] && (
                    <p className="text-red-400 text-xs flex items-center gap-1 mt-1 ml-1 font-medium">
                      <AlertCircle size={14} />
                      {pwErrors[name]}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-10">
              <button
                onClick={() => setPwModal(false)}
                className="flex-1 px-6 py-4 rounded-xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-bold"
              >
                Hủy
              </button>
              <button
                onClick={savePw}
                className="flex-1 px-6 py-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-all font-bold shadow-lg shadow-rose-600/20"
              >
                Lưu mật khẩu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div className={`fixed top-24 right-6 z-[110] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right duration-300 ${
          toast.type === "success" 
            ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border border-red-500/20 text-red-400"
        } backdrop-blur-xl`}>
          <div className={`p-1.5 rounded-full ${toast.type === "success" ? "bg-emerald-500/20" : "bg-red-500/20"}`}>
            {toast.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
          </div>
          <span className="text-sm font-bold tracking-tight">{toast.msg}</span>
        </div>
      )}

      <div className="min-h-screen bg-zinc-950 text-zinc-300 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

          {/* ── HERO SECTION ── */}
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 md:p-12 mb-10 overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 via-pink-500 to-amber-400" />
            
            <div className="flex flex-col lg:flex-row items-center lg:items-center gap-8 md:gap-12 relative z-10">
              <div className="relative group">
                <Avatar name={user.fullname} size={128} avatarUrl={user.avatar} showEditButton={editing} onEditClick={() => {}} />
                {editing && (
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" size={24} />
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 justify-center lg:justify-start">
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">@{user.username}</h1>
                  {user.rank_name && (
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-black uppercase tracking-widest">
                      <Star size={16} fill="currentColor" />
                      {user.rank_name}
                    </span>
                  )}
                </div>
                <h2 className="text-xl md:text-2xl text-zinc-400 font-medium mb-8 tracking-tight">{user.fullname}</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto lg:mx-0">
                  <div className="bg-zinc-950/50 rounded-2xl p-5 border border-zinc-800/50 backdrop-blur-sm transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-3 text-rose-500 mb-2 justify-center lg:justify-start">
                      <Star size={18} />
                      <span className="text-xs font-black uppercase tracking-widest opacity-60">Điểm</span>
                    </div>
                    <div className="text-3xl font-black text-white tabular-nums">{user.points.toLocaleString()}</div>
                  </div>
                  <div className="bg-zinc-950/50 rounded-2xl p-5 border border-zinc-800/50 backdrop-blur-sm transition-transform hover:scale-[1.02]">
                    <div className="flex items-center gap-3 text-emerald-500 mb-2 justify-center lg:justify-start">
                      <TrendingUp size={18} />
                      <span className="text-xs font-black uppercase tracking-widest opacity-60">Tổng chi</span>
                    </div>
                    <div className="text-3xl font-black text-white tabular-nums">{(user.total_spending / 1000).toFixed(0)}K</div>
                  </div>
                </div>
              </div>

              {!editing && (
                <button
                  onClick={startEdit}
                  className="px-8 py-4 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all shadow-xl hover:scale-105 active:scale-95 flex items-center gap-3"
                >
                  <Edit3 size={20} />
                  Chỉnh sửa hồ sơ
                </button>
              )}
            </div>
          </div>

          {/* ── TABS ── */}
          <div className="flex gap-2 p-1.5 bg-zinc-900 border border-zinc-800 rounded-2xl mb-10 sticky top-24 z-40 backdrop-blur-md bg-zinc-900/90 shadow-2xl">
            {[
              { key: "info", label: "Thông tin cá nhân", icon: <User size={20} /> },
              { key: "activity", label: "Hoạt động gần đây", icon: <Activity size={20} /> },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold transition-all duration-300 ${
                  activeTab === key
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                    : "text-zinc-500 hover:text-white hover:bg-zinc-800"
                }`}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* ══ TAB: INFO ══ */}
          {activeTab === "info" && (
            <div className="grid lg:grid-cols-3 gap-10">
              {/* Left: info / edit form */}
              <div className="lg:col-span-2">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-600/20">
                      <User className="text-white" size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">Chi tiết tài khoản</h3>
                  </div>

                  {editing ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Field label="Họ và tên" icon={<User size={18} />} name="fullname" value={draft.fullname ?? ""} onChange={handleChange} error={errors.fullname} placeholder="Nhập họ và tên" />
                        <Field label="Email" icon={<Mail size={18} />} name="email" type="email" value={draft.email ?? ""} onChange={handleChange} error={errors.email} placeholder="email@example.com" />
                        <Field label="Số điện thoại" icon={<Phone size={18} />} name="phone" value={draft.phone ?? ""} onChange={handleChange} error={errors.phone} placeholder="0123456789" />
                        <Field label="Ngày sinh" icon={<Calendar size={18} />} name="birthday" type="date" value={draft.birthday ?? ""} onChange={handleChange} />
                      </div>
                      <TextAreaField
                        label="Liên kết ảnh đại diện"
                        icon={<Camera size={18} />}
                        name="avatar"
                        rows={2}
                        value={draft.avatar ?? ""}
                        onChange={handleChange}
                        hint="Hệ thống hỗ trợ link URL trực tiếp (https://...) hoặc chuỗi Base64."
                        placeholder="https://images.unsplash.com/photo-..."
                      />
                      <div className="flex gap-4 pt-8">
                        <button
                          onClick={cancelEdit}
                          className="flex-1 px-8 py-5 rounded-2xl border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-bold uppercase tracking-widest text-sm"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          onClick={saveEdit}
                          disabled={profileLoading}
                          className="flex-1 px-8 py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white transition-all font-bold uppercase tracking-widest text-sm shadow-xl shadow-rose-600/20 disabled:opacity-50"
                        >
                          {profileLoading ? "Đang lưu..." : "Cập nhật ngay"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { icon: <User size={20} />, label: "Họ và tên", value: user.fullname, color: "text-rose-500" },
                        { icon: <Mail size={20} />, label: "Địa chỉ Email", value: user.email, color: "text-blue-500" },
                        { icon: <Phone size={20} />, label: "Số điện thoại", value: user.phone, color: "text-emerald-500" },
                        { icon: <Calendar size={20} />, label: "Ngày sinh nhật", value: fmtBirthday(user.birthday), color: "text-amber-500" },
                        { icon: <Shield size={20} />, label: "Tên đăng nhập", value: "@" + user.username, color: "text-purple-500" },
                        { icon: <Award size={20} />, label: "Hạng thành viên", value: user.rank_name || "Mới", color: "text-yellow-500" },
                      ].map(({ icon, label, value, color }) => (
                        <div key={label} className="group flex items-start gap-5 p-6 rounded-2xl bg-zinc-950 border border-zinc-800/50 hover:border-zinc-700 transition-all">
                          <div className={`${color} mt-1 p-2 bg-zinc-900 rounded-xl group-hover:scale-110 transition-transform`}>
                            {icon}
                          </div>
                          <div className="flex-1">
                            <div className="text-xs font-black text-zinc-600 uppercase tracking-widest mb-1.5">{label}</div>
                            <div className="text-white font-bold text-lg">{value || "—"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right: security */}
              <div className="lg:col-span-1 space-y-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-zinc-800 rounded-2xl">
                      <Shield className="text-rose-500" size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">Bảo mật</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Key className="text-zinc-500" size={20} />
                          <span className="font-bold text-white text-lg">Mật khẩu</span>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-500 mb-6 leading-relaxed">Nên đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn tốt hơn.</p>
                      <button
                        onClick={() => setPwModal(true)}
                        className="w-full px-6 py-4 rounded-xl bg-rose-600/10 border border-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-all font-bold text-sm uppercase tracking-widest"
                      >
                        Đổi mật khẩu mới
                      </button>
                    </div>

                    <div className="p-6 rounded-2xl bg-zinc-950 border border-zinc-800/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <Activity className="text-zinc-500" size={20} />
                          <span className="font-bold text-white text-lg">Trạng thái</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          user.status === 1 ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                        }`}>
                          {user.status === 1 ? "Đang hoạt động" : "Bị khóa"}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 bg-zinc-900 rounded-xl border border-zinc-800/50">
                        <div className={`w-3 h-3 rounded-full ${user.status === 1 ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                        <p className="text-sm font-bold text-zinc-300">
                          {user.status === 1 ? "Tài khoản đang ở trạng thái an toàn" : "Tài khoản của bạn đang bị giới hạn"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: ACTIVITY ══ */}
          {activeTab === "activity" && (
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl">
                  <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-zinc-800 rounded-2xl">
                        <History className="text-rose-500" size={24} />
                      </div>
                      <h3 className="text-2xl font-black text-white tracking-tight uppercase">Giao dịch gần đây</h3>
                    </div>
                  </div>
                  
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-20 bg-zinc-950 rounded-3xl border border-dashed border-zinc-800">
                      <History className="w-16 h-16 text-zinc-800 mx-auto mb-6" />
                      <div className="text-xl font-bold text-zinc-500 mb-2">Chưa có giao dịch nào</div>
                      <p className="text-zinc-600 max-w-sm mx-auto mb-10">Bạn có thể bắt đầu trải nghiệm bằng cách đặt vé xem những bộ phim hoạt hình hấp dẫn nhất.</p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/movies" className="px-8 py-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20">Khám phá phim</Link>
                        <Link to="/foodorder" className="px-8 py-4 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-all">Đặt bắp nước</Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentActivity.map((act, i) => (
                        <div key={i} className="group flex items-center gap-6 p-5 rounded-2xl bg-zinc-950 border border-zinc-800/50 hover:border-zinc-700 transition-all">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                            {act.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-bold text-lg truncate mb-1">{act.label}</div>
                            <div className="flex items-center gap-3 text-sm text-zinc-500">
                              <Calendar size={14} />
                              {act.date}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-black tracking-tight" style={{ color: act.pts_color }}>
                              {act.pts}
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest opacity-40">Tích lũy</div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="mt-10 pt-8 border-top border-zinc-800 text-center">
                        <Link 
                          to="/transactionHistory" 
                          className="inline-flex items-center gap-3 text-rose-500 hover:text-rose-400 font-bold uppercase tracking-widest text-sm transition-all hover:gap-5"
                        >
                          Toàn bộ lịch sử giao dịch
                          <TrendingUp size={18} />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl sticky top-24">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-amber-500/10 rounded-2xl">
                      <Award className="text-amber-500" size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">Điểm thưởng</h3>
                  </div>

                  <div className="text-center py-10 bg-zinc-950 rounded-2xl border border-zinc-800/50 mb-8 shadow-inner">
                    <div className="text-6xl font-black text-amber-500 mb-2 drop-shadow-2xl tracking-tighter">
                      {user.points.toLocaleString()}
                    </div>
                    <div className="text-xs font-black text-zinc-600 uppercase tracking-widest">
                      điểm thưởng hiện có
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Link 
                      to="/voucher" 
                      className="flex items-center justify-center gap-3 w-full px-6 py-5 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-rose-600/20"
                    >
                      🎟 Đổi ưu đãi ngay
                    </Link>
                    <Link 
                      to="/myVouchers" 
                      className="flex items-center justify-center gap-3 w-full px-6 py-5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-black uppercase tracking-widest text-sm transition-all"
                    >
                      🎫 Kho Voucher của tôi
                    </Link>
                  </div>
                  
                  <div className="mt-10 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                        <AlertCircle size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-amber-500 mb-1">Mẹo tích điểm</div>
                        <p className="text-xs text-zinc-500 leading-relaxed">Mua vé và bắp nước trực tuyến để được tích điểm lên đến 5% giá trị giao dịch.</p>
                      </div>
                    </div>
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