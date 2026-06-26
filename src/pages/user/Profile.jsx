import { useState, useEffect, useMemo } from "react";
import { STRONG_PASSWORD_REGEX, PASSWORD_RULE_MESSAGE } from "../../utils/passwordValidation";
import Layout from "../../components/layout/Layout";
import CustomerPageShell from "../../components/common/CustomerPageShell";
import MovieCard from "../../components/common/MovieCard";
import { Container, Row, Col } from "react-bootstrap";
import {
  User, Calendar, Mail, Phone, Shield, Star, History,
  Award, Edit3, X, Check, AlertCircle, Camera, Key,
  TrendingUp, TrendingDown, Activity, Ticket, Crown,
  ChevronRight, Clock, CheckCircle, XCircle,
} from "lucide-react";
import { getAccessToken, getRefreshToken, getStoredUser, setAuthSession, getStoredStaff, getAuthSession } from "../../utils/authStorage";
import { getUserIdFromToken } from "../../utils/jwt";
import { apiFetch, apiUrl, withQuery } from "../../utils/apiClient";
import { USERS, ME, MEMBERSHIP_RANKS, TICKET_ORDERS } from "../../constants/apiEndpoints";
import { mapFavoriteRowToFavCard, mapMeTransactionToFe, mapUserVoucherRow } from "../../utils/customerMeApi";
import { fileToDataUrl, IMAGE_FILE_ACCEPT, isDisplayableImageSrc } from "../../utils/mediaFiles";
import { apiMessage, MESSAGES } from "../../utils/uiMessages";
import { formatDate, formatDateTime, formatNumber, formatVnd as fmtVnd, toDateInputValue } from "../../utils/formatters";
import { Link, useSearchParams } from "react-router-dom";

/* ─────────────────────────────────────────
   Utils
───────────────────────────────────────── */
function normalizeUser(raw) {
  if (!raw) return null;
  if (raw.user_id != null) {
    return {
      ...raw,
      user_id: raw.user_id,
      username: raw.username ?? "",
      fullname: raw.fullname ?? "",
      email: raw.email ?? "",
      phone: raw.phone ?? "",
      birthday: toDateInputValue(raw.birthday),
      avatar: raw.avatar ?? "",
      points: Number(raw.points ?? 0),
      total_spending: Number(raw.total_spending ?? raw.totalSpending ?? 0),
      rank_name: raw.rank_name ?? raw.rankName ?? null,
    };
  }
  const resolvedId = raw.userId ?? raw.id;
  if (resolvedId != null) {
    return {
      user_id: resolvedId,
      username: raw.username ?? "",
      fullname: raw.fullname ?? "",
      email: raw.email ?? "",
      phone: raw.phone ?? "",
      birthday: toDateInputValue(raw.birthday),
      avatar: raw.avatar ?? "",
      status: raw.status,
      points: Number(raw.points ?? 0),
      total_spending: Number(raw.totalSpending ?? 0),
      rank_name: raw.rankName ?? null,
    };
  }
  return null;
}

function resolveUserId(user) {
  return user?.user_id ?? user?.userId ?? user?.id ?? getUserIdFromToken(getAccessToken());
}

const fmtBirthday = (d) => {
  return formatDate(d, { day: "2-digit", month: "2-digit", year: "numeric" });
};
const fmtDate = formatDate;
const fmtDatetime = (d) => formatDateTime(d, { hour: "2-digit", minute: "2-digit" });

function formatVoucherDiscount(v) {
  if (!v) return "";
  const dt = String(v.discountType || "").toLowerCase();
  if (dt === "fixed" || dt === "amount") return fmtVnd(v.value);
  if (dt === "percent" || dt === "percentage" || dt === "%") return `${Number(v.value ?? 0)}%`;
  return `${Number(v.value ?? 0)}%`;
}

function voucherIsExpired(v) {
  if (!v) return true;
  const status = Number(v.status);
  if (status === 0 || status === 3) return true;
  const end = v.endDate ? new Date(`${String(v.endDate).slice(0, 10)}T23:59:59`) : null;
  return Boolean(end && end < new Date());
}

function voucherIsScheduled(v) {
  if (!v) return false;
  const status = Number(v.status);
  if (status === 2) return true;
  const start = v.startDate ? new Date(`${String(v.startDate).slice(0, 10)}T00:00:00`) : null;
  return Boolean(start && start > new Date());
}

const TX_TYPE = {
  ticket_online: { label: "Vé Online",  color: "#b39ddb", bg: "rgba(123,31,162,0.18)", icon: "🎫" },
  food:          { label: "Bắp & Nước", color: "#e91e8c", bg: "rgba(233,30,140,0.14)", icon: "🍿" },
  points:        { label: "Điểm",       color: "#d4e219", bg: "rgba(212,226,25,0.14)",  icon: "⭐" },
};
const TX_STATUS = {
  completed: { label: "Hoàn thành", color: "#81c784", bg: "rgba(76,175,80,0.13)" },
  cancelled: { label: "Đã hủy",     color: "#e57373", bg: "rgba(244,67,54,0.13)" },
  pending:   { label: "Chờ xử lý",  color: "#d4e219", bg: "rgba(212,226,25,0.13)" },
};

function ticketQrSrc(item) {
  const token = item?.qr_token || item?.qrToken;
  return token ? apiUrl(TICKET_ORDERS.QR(token)) : "";
}

/* ─────────────────────────────────────────
   Avatar
───────────────────────────────────────── */
function Avatar({ name, size = 96, avatarUrl }) {
  const initials = String(name || "?").trim().split(/\s+/).filter(Boolean).slice(-2).map(w => w[0]).join("").toUpperCase() || "?";
  const url = typeof avatarUrl === "string" ? avatarUrl.trim() : "";
  const showImg = isDisplayableImageSrc(url);
  return showImg
    ? <img src={url} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.12)", boxShadow: "0 0 28px rgba(123,31,162,0.35)", flexShrink: 0 }} />
    : (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "linear-gradient(135deg, #7b1fa2, #e91e8c)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Bebas Neue', sans-serif", fontSize: size * 0.35,
        color: "#fff", letterSpacing: 2, flexShrink: 0,
        boxShadow: "0 0 28px rgba(233,30,140,0.35)",
      }}>
        {initials}
      </div>
    );
}

/* ─────────────────────────────────────────
   Toast
───────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className={`pf-toast ${toast.type}`}>
      {toast.type === "success" ? "✓" : "⚠"} {toast.msg}
    </div>
  );
}

/* ─────────────────────────────────────────
   Field
───────────────────────────────────────── */
function Field({ label, value, name, type = "text", onChange, disabled, error, placeholder }) {
  return (
    <div className="pf-field">
      <label className="pf-label">{label}</label>
      <input
        className={`pf-input${error ? " err" : ""}${disabled ? " disabled" : ""}`}
        type={type} name={name} value={value ?? ""} onChange={onChange}
        disabled={disabled} placeholder={placeholder}
      />
      {error && <p className="pf-field-err">{error}</p>}
    </div>
  );
}

function LoadingSpinner({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div className="pf-spinner" />
      {text && <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700, marginTop: 14 }}>{text}</p>}
    </div>
  );
}

function EmptyState({ icon, text, children }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 0" }}>
      <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>{icon}</div>
      <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>{text}</p>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────
   Password Modal
───────────────────────────────────────── */
function PasswordModal({ user, onClose, showToast }) {
  const [pwData, setPwData] = useState({ current: "", newPw: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => { setPwData(d => ({ ...d, [e.target.name]: e.target.value })); setPwErrors({}); };
  const validate = () => {
    const e = {};
    if (!pwData.current) e.current = "Nhập mật khẩu hiện tại";
    if (!pwData.newPw) e.newPw = "Nhập mật khẩu mới";
    else if (!STRONG_PASSWORD_REGEX.test(pwData.newPw)) e.newPw = PASSWORD_RULE_MESSAGE;
    if (pwData.newPw !== pwData.confirm) e.confirm = "Mật khẩu xác nhận không khớp";
    return e;
  };
  const save = async () => {
    const e = validate();
    if (Object.keys(e).length) { setPwErrors(e); return; }
    const token = getAccessToken();
    const userId = resolveUserId(user);
    if (!token || !userId) { showToast("Bạn cần đăng nhập", "error"); return; }
    setLoading(true);
    try {
      const res = await apiFetch(USERS.PASSWORD(userId), {
        method: "PUT",
        body: JSON.stringify({ currentPassword: pwData.current, newPassword: pwData.newPw }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) { showToast(apiMessage(json, "Đổi mật khẩu thất bại"), "error"); return; }
      showToast("Đổi mật khẩu thành công");
      onClose();
    } catch { showToast(MESSAGES.networkError, "error"); }
    finally { setLoading(false); }
  };

  const EyeBtn = ({ field }) => (
    <button className="pf-eye" type="button" onClick={() => setShowPw(s => ({ ...s, [field]: !s[field] }))}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {showPw[field]
          ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
          : <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
        }
      </svg>
    </button>
  );

  return (
    <div className="pf-modal-overlay" onClick={onClose}>
      <div className="pf-modal" onClick={e => e.stopPropagation()}>
        <button className="pf-modal-close" onClick={onClose}>×</button>
        <div className="pf-modal-title">ĐỔI <span>MẬT KHẨU</span></div>
        {[
          { name: "current", label: "Mật khẩu hiện tại" },
          { name: "newPw",   label: "Mật khẩu mới" },
          { name: "confirm", label: "Xác nhận mật khẩu mới" },
        ].map(({ name, label }) => (
          <div key={name} className="pf-field">
            <label className="pf-label">{label}</label>
            <div className="pf-pw-wrap">
              <input
                className={`pf-input${pwErrors[name] ? " err" : ""}`}
                type={showPw[name] ? "text" : "password"}
                name={name} value={pwData[name]} onChange={handleChange}
                style={{ width: "100%" }} placeholder="••••••••"
              />
              <EyeBtn field={name} />
            </div>
            {pwErrors[name] && <p className="pf-field-err">{pwErrors[name]}</p>}
          </div>
        ))}
        <div className="d-flex gap-2 mt-3">
          <button className="pf-btn-ghost" onClick={onClose}>Hủy</button>
          <button className="pf-btn-primary" style={{ flex: 1 }} onClick={save} disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu mật khẩu"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Tab: Thông tin
───────────────────────────────────────── */
function TabInfo({ user, setUser, showToast }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState({});
  const [errors,  setErrors]  = useState({});
  const [saving,  setSaving]  = useState(false);
  const [pwModal, setPwModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const startEdit  = () => { setDraft({ ...user }); setAvatarFile(null); setAvatarPreview(user.avatar || ""); setEditing(true); setErrors({}); };
  const cancelEdit = () => { setEditing(false); setAvatarFile(null); setAvatarPreview(""); setErrors({}); };
  const handleChange = (e) => {
    setDraft(d => ({ ...d, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: "" }));
  };
  const validate = () => {
    const e = {};
    if (!draft.fullname?.trim()) e.fullname = "Họ tên không được để trống";
    const em = draft.email?.trim() || "";
    if (!em) e.email = "Email không được để trống";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) e.email = "Email không hợp lệ";
    if (!draft.phone?.trim()) e.phone = "Số điện thoại không được để trống";
    else if (draft.phone.replace(/\D/g, "").length < 9) e.phone = "Số điện thoại không hợp lệ";
    return e;
  };
  const save = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    const token = getAccessToken();
    const userId = resolveUserId(user);
    if (!token || !userId) { showToast("Bạn cần đăng nhập", "error"); return; }
    setSaving(true);
    try {
      const avatar = avatarFile ? await fileToDataUrl(avatarFile) : (draft.avatar || user.avatar || "");
      const body = {
        fullname: draft.fullname.trim(), email: draft.email.trim(),
        phone: draft.phone.trim().replace(/\s/g, ""), status: user.status ?? 1,
        birthday: draft.birthday || null,
        avatar,
      };
      const originalBody = {
        fullname: String(user.fullname ?? "").trim(),
        email: String(user.email ?? "").trim(),
        phone: String(user.phone ?? "").trim().replace(/\s/g, ""),
        status: user.status ?? 1,
        birthday: toDateInputValue(user.birthday) || null,
        avatar: user.avatar || "",
      };
      if (JSON.stringify(body) === JSON.stringify(originalBody)) {
        showToast(MESSAGES.noChanges, "error");
        setSaving(false);
        return;
      }
      const res = await apiFetch(USERS.BY_ID(userId), { method: "PUT", body: JSON.stringify(body) });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) { showToast(apiMessage(json, "Cập nhật thất bại"), "error"); return; }
      const n = normalizeUser(json.data);
      if (n) setUser(n);
      setAuthSession({ accessToken: getAccessToken(), refreshToken: getRefreshToken(), user: json.data, staff: getStoredStaff() });
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview("");
      showToast("Cập nhật thông tin thành công");
    } catch { showToast(MESSAGES.networkError, "error"); }
    finally { setSaving(false); }
  };

  return (
    <>
      {pwModal && <PasswordModal user={user} onClose={() => setPwModal(false)} showToast={showToast} />}
      <Row className="g-3">
        <Col xs={12} lg={7}>
          <div className="pf-card">
            <div className="pf-card-title">
              <span>👤</span> THÔNG TIN <span>CÁ NHÂN</span>
              {!editing && (
                <button className="pf-btn-yellow ms-auto" style={{ fontSize: 11, padding: "6px 16px" }} onClick={startEdit}>
                  ✏️ Chỉnh sửa
                </button>
              )}
            </div>
            {editing ? (
              <>
                <Row className="g-2">
                  <Col xs={12}>
                    <label className="pf-label">Ảnh đại diện</label>
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <Avatar name={draft.fullname} avatarUrl={avatarPreview || draft.avatar} size={64} />
                      <div style={{ flex: 1 }}>
                        <input
                          className="pf-input"
                          type="file"
                          accept={IMAGE_FILE_ACCEPT}
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            if (!file) return;
                            if (!file.type.startsWith("image/")) { setErrors((er) => ({ ...er, avatar: "Vui lòng chọn tệp ảnh" })); return; }
                            setAvatarFile(file);
                            setAvatarPreview(URL.createObjectURL(file));
                            setErrors((er) => ({ ...er, avatar: "" }));
                          }}
                        />
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 5 }}>Chọn ảnh JPG, PNG hoặc WebP. Ảnh sẽ được lưu khi bấm cập nhật.</div>
                        {errors.avatar && <p className="pf-field-err">{errors.avatar}</p>}
                      </div>
                    </div>
                  </Col>
                  <Col xs={12} md={6}><Field label="Họ và tên" name="fullname" value={draft.fullname} onChange={handleChange} error={errors.fullname} placeholder="Nhập họ và tên" /></Col>
                  <Col xs={12} md={6}><Field label="Email" name="email" type="email" value={draft.email} onChange={handleChange} error={errors.email} placeholder="email@example.com" /></Col>
                  <Col xs={12} md={6}><Field label="Số điện thoại" name="phone" value={draft.phone} onChange={handleChange} error={errors.phone} placeholder="0123456789" /></Col>
                  <Col xs={12} md={6}><Field label="Ngày sinh" name="birthday" type="date" value={draft.birthday} onChange={handleChange} /></Col>
                </Row>
                <div className="d-flex gap-2 mt-2">
                  <button className="pf-btn-ghost" onClick={cancelEdit}>Hủy bỏ</button>
                  <button className="pf-btn-primary" onClick={save} disabled={saving}>{saving ? "Đang lưu..." : "Cập nhật ngay"}</button>
                </div>
              </>
            ) : (
              <>
                {[
                  { icon: "👤", label: "Họ và tên",       value: user.fullname },
                  { icon: "✉️", label: "Email",             value: user.email },
                  { icon: "📱", label: "Số điện thoại",    value: user.phone },
                  { icon: "🎂", label: "Ngày sinh",         value: fmtBirthday(user.birthday) },
                  { icon: "🏆", label: "Hạng thành viên",   value: user.rank_name || "Mới" },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="pf-info-row">
                    <span className="pf-info-icon">{icon}</span>
                    <div>
                      <div className="pf-info-label">{label}</div>
                      <div className="pf-info-value">{value || "—"}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </Col>

        <Col xs={12} lg={5}>
          <div className="pf-card">
            <div className="pf-card-title"><span>🔐</span> BẢO <span>MẬT</span></div>
            <div className="pf-security-block" style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Mật khẩu</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 600, marginBottom: 12 }}>
                Nên đổi mật khẩu định kỳ để bảo vệ tài khoản
              </div>
              <button className="pf-btn-primary" style={{ fontSize: 12, padding: "9px 18px" }} onClick={() => setPwModal(true)}>
                🔑 Đổi mật khẩu mới
              </button>
            </div>
          </div>
        </Col>
      </Row>
    </>
  );
}

/* ─────────────────────────────────────────
   Tab: Điểm thưởng
───────────────────────────────────────── */
function TabPoints({ user, pointRows, loading }) {
  if (loading) return <LoadingSpinner text="Đang tải lịch sử điểm..." />;

  const totalEarned = pointRows.filter(e => e.delta > 0).reduce((s, e) => s + e.delta, 0);
  const totalSpent  = pointRows.filter(e => e.delta < 0).reduce((s, e) => s + e.delta, 0);

  return (
    <Row className="g-3">
      <Col xs={12} lg={7}>
        <div className="pf-card">
          <div className="pf-card-title"><span>⚡</span> LỊCH SỬ <span>ĐIỂM</span></div>
          {pointRows.length === 0 ? (
            <EmptyState icon="⭐" text="Chưa có lịch sử điểm" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pointRows.map(ev => (
                <div key={ev.id} className="pf-activity-item" style={{ borderBottom: "none", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: ev.delta > 0 ? "rgba(76,175,80,0.13)" : "rgba(244,67,54,0.13)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0, border: `1px solid ${ev.delta > 0 ? "rgba(129,199,132,0.3)" : "rgba(229,115,115,0.3)"}` }}>
                    {ev.delta > 0 ? "↑" : "↓"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{ev.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{ev.date}</div>
                  </div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1, color: ev.delta > 0 ? "#81c784" : "#e57373" }}>
                    {ev.delta > 0 ? "+" : ""}{formatNumber(ev.delta)}
                    <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)", letterSpacing: 1, textTransform: "uppercase", textAlign: "right" }}>điểm</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Col>

      <Col xs={12} lg={5}>
        <div className="pf-card">
          <div className="pf-card-title"><span>⭐</span> ĐIỂM <span>TÍCH LŨY</span></div>
          <div style={{ textAlign: "center", padding: "20px 0 24px" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 64, letterSpacing: 3, color: "var(--yellow)", lineHeight: 1 }}>
              {formatNumber(user?.points ?? 0)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>
              điểm hiện có
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            {[
              { label: "Đã nhận", value: `+${formatNumber(totalEarned)}`, color: "#81c784" },
              { label: "Đã dùng", value: formatNumber(totalSpent),        color: "#e57373" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 12, textAlign: "center" }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, letterSpacing: 1, color }}>{value}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: "12px 14px", background: "rgba(212,226,25,0.05)", border: "1px solid rgba(212,226,25,0.12)", borderRadius: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(212,226,25,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Mẹo tích điểm</div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 600, margin: 0, lineHeight: 1.6 }}>Mua vé và bắp nước trực tuyến để được tích điểm lên đến 5% giá trị giao dịch.</p>
          </div>

          <Link to="/voucher" style={{ display: "block", textAlign: "center", padding: 12, background: "linear-gradient(135deg, var(--purple), var(--pink))", borderRadius: 12, color: "#fff", fontFamily: "'Syne'", fontWeight: 800, fontSize: 13, textDecoration: "none", letterSpacing: 0.5, boxShadow: "0 0 20px rgba(233,30,140,0.2)", marginBottom: 10 }}>
            🎟 Đổi điểm lấy voucher
          </Link>
          <Link to="/myVouchers" style={{ display: "block", textAlign: "center", padding: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, color: "rgba(255,255,255,0.6)", fontFamily: "'Syne'", fontWeight: 800, fontSize: 13, textDecoration: "none", letterSpacing: 0.5 }}>
            🎫 Kho Voucher của tôi
          </Link>
        </div>
      </Col>
    </Row>
  );
}

/* ─────────────────────────────────────────
   Tab: Lịch sử giao dịch
───────────────────────────────────────── */
function TabTransactions({ transactions, loading, searchTerm, onSearchChange }) {
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(null);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchFilter = filter === "all" || tx.type === filter || tx.status === filter;
      return matchFilter;
    });
  }, [transactions, filter]);

  if (loading) return <LoadingSpinner text="Đang tải lịch sử giao dịch..." />;

  if (!transactions.length) {
    return (
      <EmptyState icon="🧾" text="Chưa có giao dịch nào">
        <Link to="/movies" className="pf-btn-primary" style={{ textDecoration: "none" }}>Đặt vé ngay</Link>
      </EmptyState>
    );
  }

  return (
    <>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        {[
          { key: "all", label: "Tất cả" },
          { key: "ticket_online", label: "Vé" },
          { key: "food", label: "Bắp nước" },
          { key: "completed", label: "Hoàn thành" },
          { key: "pending", label: "Chờ xử lý" },
        ].map(({ key, label }) => (
          <button key={key} type="button" className={`pf-filter-btn${filter === key ? " active" : ""}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
        <input
          className="pf-search-input"
          placeholder="Tìm mã đơn hoặc món..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🔍" text="Không tìm thấy giao dịch phù hợp" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((tx) => {
            const type = TX_TYPE[tx.type] || { label: "Giao dịch", color: "#b39ddb", bg: "rgba(123,31,162,0.14)", icon: "🧾" };
            const status = TX_STATUS[tx.status] || { label: tx.status || "—", color: "rgba(255,255,255,0.55)", bg: "rgba(255,255,255,0.08)" };
            const isOpen = openId === tx.id;
            const qrItems = (tx.items || []).filter((item) => ticketQrSrc(item));
            const qrLeadItem = qrItems[0] || null;
            const qrSeatLabels = [...new Set(qrItems.map((item) => item.seat_label || item.sub).filter(Boolean))];
            return (
              <div key={tx.id} className={`pf-tx-row${isOpen ? " open" : ""}`}>
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : tx.id)}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "transparent",
                    padding: "15px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: type.bg, border: `1px solid ${type.color}44`, color: type.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                    {type.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 4 }}>
                      <span style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{type.label}</span>
                      <span style={{ color: status.color, background: status.bg, border: `1px solid ${status.color}33`, borderRadius: 999, padding: "2px 8px", fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>
                        {status.label}
                      </span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {tx.order_code || "Không có mã"} • {fmtDatetime(tx.created_at)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", color: "var(--yellow)", fontSize: 20, letterSpacing: 1 }}>{fmtVnd(tx.final_amount)}</div>
                    {tx.points_earned > 0 && <div style={{ color: "#81c784", fontSize: 11, fontWeight: 700 }}>+{tx.points_earned} điểm</div>}
                  </div>
                </button>

                {isOpen && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "14px 16px 16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                      {(tx.items || []).map((item, idx) => (
                        <div key={`${tx.id}-${idx}`} style={{ display: "flex", gap: 10, alignItems: "center", color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: 700 }}>
                          <span style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon || "•"}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                            {item.sub && <div style={{ color: "rgba(255,255,255,0.32)", fontSize: 11, fontWeight: 600 }}>{item.sub}</div>}
                            {item.ticket_code && <div style={{ color: "rgba(212,226,25,0.65)", fontSize: 10, fontWeight: 800, marginTop: 2 }}>Mã vé: {item.ticket_code}</div>}
                          </div>
                          <div style={{ color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>x{item.qty}</div>
                          <div style={{ color: "var(--yellow)", whiteSpace: "nowrap" }}>{fmtVnd(item.price)}</div>
                        </div>
                      ))}
                    </div>
                    {tx.type === "ticket_online" && qrLeadItem && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ color: "#fff", fontSize: 12, fontWeight: 900, marginBottom: 10, letterSpacing: 0.4 }}>
                          Mã QR vé
                        </div>
                        <div
                          style={{
                            background: "rgba(255,255,255,0.04)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: 14,
                            padding: 12,
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            flexWrap: "wrap",
                          }}
                        >
                          <img
                            src={ticketQrSrc(qrLeadItem)}
                            alt={`QR vé ${qrLeadItem.ticket_code || tx.order_code || ""}`}
                            style={{
                              width: 128,
                              height: 128,
                              objectFit: "contain",
                              background: "#fff",
                              borderRadius: 12,
                              padding: 8,
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ minWidth: 180, flex: 1 }}>
                            <div style={{ color: "var(--yellow)", fontSize: 12, fontWeight: 900, wordBreak: "break-all" }}>
                              {tx.order_code || qrLeadItem.ticket_code || "Vé"}
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: 800, marginTop: 6 }}>
                              Ghế: {qrSeatLabels.length ? qrSeatLabels.join(", ") : "—"}
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 11, fontWeight: 700, marginTop: 6 }}>
                              1 QR dùng cho toàn bộ ghế trong đơn này.
                            </div>
                          </div>
                        </div>
                        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 700, marginTop: 10 }}>
                          QR này là token đã mã hóa từ BE; nhân viên quét sẽ thấy toàn bộ ghế của đơn.
                        </div>
                      </div>
                    )}
                    <div style={{ display: "grid", gap: 6, color: "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: 700 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tạm tính</span><span>{fmtVnd(tx.original_amount)}</span></div>
                      {tx.discount_amount > 0 && <div style={{ display: "flex", justifyContent: "space-between" }}><span>Giảm giá {tx.voucher_code ? `(${tx.voucher_code})` : ""}</span><span>-{fmtVnd(tx.discount_amount)}</span></div>}
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#fff", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 8 }}><span>Thanh toán</span><span style={{ color: "var(--yellow)" }}>{fmtVnd(tx.final_amount)}</span></div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ─────────────────────────────────────────
   Tab: Voucher
───────────────────────────────────────── */
function TabVouchers({ vouchers, loading }) {
  const [filter,   setFilter]   = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = useMemo(() => vouchers.filter(uv => {
    const isExpired = voucherIsExpired(uv.voucher);
    const isUsed    = uv.status === 0;
    const isActive  = !isExpired && !isUsed && !voucherIsScheduled(uv.voucher);
    if (filter === "active") return isActive;
    if (filter === "used")   return isUsed || isExpired;
    return true;
  }), [filter, vouchers]);

  if (loading) return <LoadingSpinner text="Đang tải voucher..." />;

  return (
    <>
      {selected && (
        <div className="pf-modal-overlay" onClick={() => setSelected(null)}>
          <div className="pf-modal" onClick={e => e.stopPropagation()}>
            <button className="pf-modal-close" onClick={() => setSelected(null)}>×</button>
            <div className="pf-modal-title">CHI TIẾT <span>VOUCHER</span></div>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, letterSpacing: 3, color: "var(--yellow)" }}>{formatVoucherDiscount(selected.voucher)}</div>
              <div style={{ fontFamily: "monospace", fontSize: 16, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", padding: "8px 16px", borderRadius: 8, color: "#fff", display: "inline-block" }}>{selected.voucher?.code}</div>
            </div>
            {selected.voucher?.description && (
              <div style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, marginBottom: 16 }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0 }}>{selected.voucher.description}</p>
              </div>
            )}
            <Row className="g-2" style={{ marginBottom: 20 }}>
              {[
                ["Đơn tối thiểu", fmtVnd(selected.voucher?.minOrderValue ?? 0)],
                ["Giảm tối đa", fmtVnd(selected.voucher?.maxDiscountAmount ?? 0)],
                ["Điểm đổi", Number(selected.voucher?.pointVoucher ?? 0) > 0 ? `${formatNumber(selected.voucher.pointVoucher)} điểm` : "Miễn phí"],
                ["Trạng thái", selected.status === 0 ? "Đã dùng" : voucherIsExpired(selected.voucher) ? "Hết hạn" : voucherIsScheduled(selected.voucher) ? "Chờ hiệu lực" : "Đang hoạt động"],
                ["Bắt đầu", fmtDate(selected.voucher?.startDate)],
                ["Kết thúc", fmtDate(selected.voucher?.endDate)],
              ].map(([k, v]) => (
                <Col key={k} xs={6}>
                  <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{k}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{v}</div>
                  </div>
                </Col>
              ))}
            </Row>
            <button className="pf-btn-ghost" style={{ width: "100%" }} onClick={() => setSelected(null)}>Đóng</button>
          </div>
        </div>
      )}

      <Row className="g-2" style={{ marginBottom: 20 }}>
        {[
          { label: "Tổng",            val: vouchers.length,                                                     color: "#fff" },
          { label: "Đang hoạt động",  val: vouchers.filter(uv => !voucherIsExpired(uv.voucher) && !voucherIsScheduled(uv.voucher) && uv.status !== 0).length, color: "#81c784" },
          { label: "Đã sử dụng",     val: vouchers.filter(uv => voucherIsExpired(uv.voucher) || uv.status === 0).length, color: "var(--yellow)" },
        ].map(({ label, val, color }) => (
          <Col key={label} xs={4}>
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 1, color }}>{val}</div>
            </div>
          </Col>
        ))}
      </Row>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[{ key: "all", label: "Tất cả" }, { key: "active", label: "Đang hoạt động" }, { key: "used", label: "Đã sử dụng" }].map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)} className={`pf-filter-btn${filter === key ? " active" : ""}`}>{label}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="🎫" text={filter === "active" ? "Bạn chưa có voucher đang hoạt động" : filter === "used" ? "Bạn chưa sử dụng voucher nào" : "Chưa có voucher nào"}>
          <Link to="/voucher" className="pf-btn-primary" style={{ textDecoration: "none", display: "inline-block" }}>Đổi điểm lấy voucher</Link>
        </EmptyState>
      ) : (
        <Row className="g-3">
          {filtered.map(uv => {
            const voucher   = uv.voucher;
            const isExpired = voucherIsExpired(voucher);
            const isScheduled = voucherIsScheduled(voucher);
            const isUsed    = uv.status === 0;
            const isActive  = !isExpired && !isUsed && !isScheduled;
            const statusColor = isActive ? "#81c784" : isScheduled ? "#d4e219" : isUsed ? "rgba(255,255,255,0.25)" : "#e57373";
            const statusLabel = isActive ? "Còn hạn" : isScheduled ? "Chờ hiệu lực" : isUsed ? "Đã dùng" : "Hết hạn";
            const pointCost = Number(voucher?.pointVoucher ?? 0);
            return (
              <Col key={uv.id} xs={12} md={6} lg={4}>
                <div className={`pf-voucher-card${!isActive ? " muted" : ""}`} onClick={() => setSelected(uv)}>
                  <div className="pf-voucher-stripe" style={{ background: isActive ? "linear-gradient(180deg, var(--purple), var(--pink))" : statusColor }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div className="pf-voucher-code">{voucher?.code}</div>
                    <span className="pf-voucher-status" style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}>{statusLabel}</span>
                  </div>
                  <div className="pf-voucher-main">
                    <div className="pf-voucher-discount">{formatVoucherDiscount(voucher)}</div>
                    <div className="pf-voucher-unit">GIẢM GIÁ</div>
                  </div>
                  {voucher?.description && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, marginBottom: 10, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{voucher.description}</p>}
                  <div className="pf-voucher-divider" />
                  <div className="pf-voucher-meta">
                    <div>🛒 Đơn tối thiểu: <strong>{fmtVnd(voucher?.minOrderValue ?? 0)}</strong></div>
                    <div>💸 Giảm tối đa: <strong>{fmtVnd(voucher?.maxDiscountAmount ?? 0)}</strong></div>
                    <div>⭐ Điểm đổi: <strong>{pointCost > 0 ? `${formatNumber(pointCost)} điểm` : "Miễn phí"}</strong></div>
                    <div>📅 <strong>{fmtDate(voucher?.startDate)}</strong> – <strong>{fmtDate(voucher?.endDate)}</strong></div>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      )}
    </>
  );
}

/* ─────────────────────────────────────────
   Tab: Hạng thành viên
───────────────────────────────────────── */
function TabRank({ user, ranks, loading }) {
  const { pct, next, label } = useMemo(() => {
    if (!ranks.length) return { pct: 0, next: null, label: user?.rank_name || "—" };
    const spend = Number(user?.total_spending || 0);
    let idx = -1;
    for (let i = 0; i < ranks.length; i++) { if (spend >= Number(ranks[i].minSpending ?? 0)) idx = i; }
    const current = idx >= 0 ? ranks[idx] : null;
    const next = idx < ranks.length - 1 ? ranks[idx + 1] : null;
    const rankLabel = user?.rank_name || current?.rankName || "—";
    if (!next) return { pct: 100, next: null, label: rankLabel };
    const curMin = Number(current?.minSpending ?? 0);
    const nextMin = Number(next.minSpending ?? 0);
    const pct = nextMin > curMin ? Math.min(100, Math.max(0, ((spend - curMin) / (nextMin - curMin)) * 100)) : 0;
    return { pct, next, label: rankLabel };
  }, [ranks, user]);

  if (loading) return <LoadingSpinner text="Đang tải hạng thành viên..." />;

  const currentRank = ranks.find(r => r.rankName === label);

  return (
    <Row className="g-3">
      <Col xs={12} lg={7}>
        <div className="pf-card">
          <div className="pf-card-title"><span>🏆</span> CÁC HẠNG <span>THÀNH VIÊN</span></div>
          {ranks.length === 0 ? (
            <EmptyState icon="🏆" text="Chưa có danh sách hạng" />
          ) : (
            ranks.map(r => {
              const isCurrent = r.rankName === label;
              return (
                <div key={r.id} className={`pf-rank-card${isCurrent ? " current" : ""}`}>
                  <span className="pf-rank-icon">{isCurrent ? "👑" : "🏅"}</span>
                  <div className="pf-rank-info">
                    <div className="pf-rank-name" style={{ color: isCurrent ? "var(--yellow)" : "#b39ddb" }}>{r.rankName}</div>
                    <div className="pf-rank-req">
                      {Number(r.minSpending ?? 0) === 0 ? "Mặc định" : `Chi từ ${fmtVnd(r.minSpending)}`}
                    </div>
                    {r.description && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 3 }}>{r.description}</div>}
                  </div>
                  <div className="pf-rank-perks">
                    {r.discountPercent > 0 && <span style={{ color: isCurrent ? "var(--yellow)" : "#b39ddb" }}>-{r.discountPercent}% vé</span>}
                    {r.bonusPoint != null && <span>×{r.bonusPoint} điểm</span>}
                    {isCurrent && <span className="pf-current-tag">Của bạn</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Col>

      <Col xs={12} lg={5}>
        <div className="pf-card">
          <div className="pf-card-title"><span>📈</span> TIẾN ĐỘ <span>HẠNG</span></div>

          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>👑</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 3, color: "var(--yellow)" }}>{label}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 600, marginTop: 4 }}>
              Tổng chi tiêu: <span style={{ color: "#fff" }}>{fmtVnd(user?.total_spending)}</span>
            </div>
          </div>

          {next && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", marginBottom: 8 }}>
                <span>{label}</span>
                <span>{next.rankName}</span>
              </div>
              <div className="pf-progress-bar" style={{ marginBottom: 8 }}>
                <div className="pf-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)", textAlign: "center", marginBottom: 20 }}>
                Còn <span style={{ color: "var(--yellow)" }}>{fmtVnd(Math.max(0, next.minSpending - (user?.total_spending || 0)))}</span> để lên hạng
              </div>
            </>
          )}

          {currentRank && (
            <div style={{ padding: "14px 16px", background: "rgba(212,226,25,0.06)", border: "1px solid rgba(212,226,25,0.15)", borderRadius: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(212,226,25,0.7)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Quyền lợi hiện tại</div>
              {[
                currentRank.discountPercent > 0 && `Giảm ${currentRank.discountPercent}% giá vé`,
                currentRank.bonusPoint != null && `Nhân ×${currentRank.bonusPoint} điểm tích lũy`,
                "Ưu tiên đặt vé sự kiện đặc biệt",
              ].filter(Boolean).map((perk, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
                  <span style={{ color: "var(--yellow)" }}>✓</span> {perk}
                </div>
              ))}
            </div>
          )}
        </div>
      </Col>
    </Row>
  );
}

function TabFavorites({ favorites, loading }) {
  if (loading) return <LoadingSpinner text="Đang tải phim yêu thích..." />;

  return (
    <div className="pf-card">
      <div className="pf-card-title">
        <span>❤️</span> PHIM <span>YÊU THÍCH</span>
        <Link to="/favorites" className="pf-mini-link ms-auto">Xem đầy đủ</Link>
      </div>

      {favorites.length === 0 ? (
        <EmptyState icon="🎬" text="Bạn chưa lưu phim yêu thích nào">
          <Link to="/movies" className="pf-btn-primary" style={{ textDecoration: "none" }}>
            Khám phá phim
          </Link>
        </EmptyState>
      ) : (
        <Row className="g-3">
          {favorites.slice(0, 8).map((fav) => (
            <Col key={fav.favorite_id} xs={6} md={4} xl={3}>
              <div className="pf-fav-card">
                {fav.review && <div className="pf-review-badge">★ {fav.review.rating}.0</div>}
                <MovieCard
                  movie={fav.movie}
                  isComingSoon={fav.movie?.type === "soon"}
                  showBuyButton={false}
                />
              </div>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN
───────────────────────────────────────── */
const TABS = [
  { key: "info",         label: "Hồ sơ cá nhân" },
  { key: "points",       label: "Điểm thưởng" },
  { key: "favorites",    label: "Phim yêu thích" },
  { key: "vouchers",     label: "Voucher của tôi" },
  { key: "rank",         label: "Hạng thành viên" },
  { key: "transactions", label: "Lịch sử giao dịch" },
];

export default function UserProfile() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [user,        setUser]        = useState(null);
  const [toast,       setToast]       = useState(null);
  const [initialLoad, setInitialLoad] = useState(true);

  const activeTab = TABS.some(t => t.key === searchParams.get("tab")) ? searchParams.get("tab") : "info";
  const setActiveTab = (key) => setSearchParams({ tab: key }, { replace: true });

  const [transactions, setTransactions] = useState([]);
  const [txSearch,     setTxSearch]     = useState("");
  const [pointRows,    setPointRows]    = useState([]);
  const [favorites,    setFavorites]    = useState([]);
  const [vouchers,     setVouchers]     = useState([]);
  const [ranks,        setRanks]        = useState([]);

  const [loadingTx,  setLoadingTx]  = useState(false);
  const [loadingPts, setLoadingPts] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);
  const [loadingVou, setLoadingVou] = useState(false);
  const [loadingRnk, setLoadingRnk] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    const authSession = getAuthSession();
    const token = authSession.accessToken;
    const stored = getStoredUser();
    if (!authSession.isAuthenticated || !authSession.user) {
      setUser(null);
      setInitialLoad(false);
      return;
    }
    if (stored) { const n = normalizeUser(stored); if (n) setUser(n); }
    if (!token) { setInitialLoad(false); return; }
    const userId = getUserIdFromToken(token);
    if (!userId) { setInitialLoad(false); return; }
    let c = false;
    (async () => {
      try {
        const res = await apiFetch(USERS.BY_ID(userId));
        const json = await res.json().catch(() => null);
        if (c) return;
        if (res.ok && json?.data) {
          const n = normalizeUser(json.data);
          if (n) {
            setUser(n);
            setAuthSession({ accessToken: getAccessToken(), refreshToken: getRefreshToken(), user: json.data, staff: getStoredStaff() });
          }
        }
      } catch {
        // Keep any locally stored user data when profile refresh fails.
      }
      finally { if (!c) setInitialLoad(false); }
    })();
    return () => { c = true; };
  }, []);

  useEffect(() => {
    const token = getAccessToken();
    if (!token || !user) return;
    let c = false;

    if (activeTab === "transactions") {
      setLoadingTx(true);
      apiFetch(withQuery(ME.TRANSACTIONS, { search: txSearch })).then(r => r.json().catch(() => null)).then(body => {
        if (c) return;
        if (body?.data && Array.isArray(body.data)) setTransactions(body.data.map(mapMeTransactionToFe));
        else setTransactions([]);
      }).catch(() => {}).finally(() => { if (!c) setLoadingTx(false); });
    }

    if (activeTab === "points" && pointRows.length === 0) {
      setLoadingPts(true);
      apiFetch(ME.POINTS_HISTORY).then(r => r.json().catch(() => null)).then(body => {
        if (c) return;
        if (body?.data && Array.isArray(body.data)) {
          setPointRows(body.data.map(r => ({
            id: r.pointHistoryId,
            date: formatDate(r.date),
            label: r.description || "—",
            delta: Number(r.points ?? 0),
          })));
        }
      }).catch(() => {}).finally(() => { if (!c) setLoadingPts(false); });
    }

    if (activeTab === "favorites" && favorites.length === 0) {
      setLoadingFav(true);
      apiFetch(ME.FAVORITES).then(r => r.json().catch(() => null)).then(body => {
        if (c) return;
        if (body?.data && Array.isArray(body.data)) setFavorites(body.data.map(mapFavoriteRowToFavCard));
      }).catch(() => {}).finally(() => { if (!c) setLoadingFav(false); });
    }

    if (activeTab === "vouchers" && vouchers.length === 0) {
      setLoadingVou(true);
      apiFetch(ME.VOUCHERS).then(r => r.json().catch(() => null)).then(body => {
        if (c) return;
        if (body?.data && Array.isArray(body.data)) setVouchers(body.data.map(mapUserVoucherRow));
      }).catch(() => {}).finally(() => { if (!c) setLoadingVou(false); });
    }

    if (activeTab === "rank" && ranks.length === 0) {
      setLoadingRnk(true);
      apiFetch(MEMBERSHIP_RANKS.LIST).then(r => r.json().catch(() => null)).then(body => {
        if (c) return;
        if (body?.data && Array.isArray(body.data)) {
          setRanks([...body.data].sort((a, b) => Number(a.minSpending ?? 0) - Number(b.minSpending ?? 0)));
        }
      }).catch(() => {}).finally(() => { if (!c) setLoadingRnk(false); });
    }

    return () => { c = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user, txSearch]);

  const token = getAuthSession().accessToken;

  if (!user) {
    if (token && initialLoad) return (
      <Layout>
        <div className="pf-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <LoadingSpinner text="Đang tải hồ sơ..." />
        </div>
      </Layout>
    );
    return (
      <Layout>
        <div className="pf-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ textAlign: "center", maxWidth: 400 }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }}>🔒</div>
            <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, letterSpacing: 3, color: "#fff", marginBottom: 8 }}>
              {token ? "Không tải được hồ sơ" : "Vui lòng đăng nhập"}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontWeight: 600, marginBottom: 24, lineHeight: 1.6 }}>
              {token ? "Kiểm tra kết nối BE và token còn hạn." : "Trang hồ sơ chỉ hiển thị khi bạn đăng nhập."}
            </p>
            {!token && <Link to="/login" className="pf-btn-primary" style={{ textDecoration: "none" }}>Đăng nhập ngay</Link>}
          </div>
        </div>
      </Layout>
    );
  }

  const completedTx = transactions.filter(t => t.status === "completed").length;

  return (
    <Layout>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Syne:wght@400;600;700;800&display=swap');
        :root {
          --navy:   #2d3151;
          --purple: #7b1fa2;
          --pink:   #e91e8c;
          --yellow: #d4e219;
          --dark:   #0f102a;
          --card:   rgba(20,22,50,0.92);
        }

        /* PAGE */
        .pf-page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 65% 50% at 15% 20%, rgba(123,31,162,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 85% 80%, rgba(233,30,140,0.13) 0%, transparent 60%),
            #0f102a;
          font-family: 'Syne', sans-serif;
          padding: 32px 0 80px;
        }

        .pf-header {
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 22px;
        }
        .pf-title {
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(36px, 6vw, 58px);
          letter-spacing: 4px;
          line-height: 1;
          color: #fff;
          margin: 0;
        }
        .pf-title span { color: var(--yellow); }
        .pf-title-bar {
          width: 80px;
          height: 3px;
          border-radius: 2px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--yellow));
          margin-top: 12px;
        }
        .pf-count {
          color: rgba(255,255,255,0.42);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .6px;
          text-transform: uppercase;
          margin-top: 8px;
        }
        .pf-filters {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-width: 0;
          max-width: 100%;
        }

        /* HERO */
        .pf-hero {
          background: var(--card);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 28px 32px;
          display: flex;
          align-items: center;
          gap: 24px;
          position: relative;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .pf-hero::before {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--purple), var(--pink), var(--yellow));
          background-size: 300%;
          animation: gradMove 5s linear infinite;
        }
        @keyframes gradMove { 0%{background-position:0%} 100%{background-position:300%} }
        .pf-hero-right { flex: 1; min-width: 0; }
        .pf-username   { font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.35); letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 2px; }
        .pf-fullname   { font-family: 'Bebas Neue', sans-serif; font-size: clamp(26px,4vw,40px); letter-spacing: 3px; color: #fff; line-height: 1; margin-bottom: 10px; }
        .pf-rank-badge { display: inline-flex; align-items: center; gap: 7px; border-radius: 100px; padding: 5px 14px; border: 1px solid; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 16px; }

        .pf-progress-wrap { max-width: 380px; }
        .pf-progress-label { display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.3); margin-bottom: 6px; }
        .pf-progress-bar   { height: 6px; background: rgba(255,255,255,0.08); border-radius: 3px; overflow: hidden; }
        .pf-progress-fill  { height: 100%; border-radius: 3px; background: linear-gradient(90deg, var(--purple), var(--pink)); transition: width 0.6s ease; }

        .pf-hero-stats { display: flex; flex-direction: column; gap: 10px; text-align: center; flex-shrink: 0; }
        .pf-hs { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 12px 20px; min-width: 110px; }
        .pf-hs-num { font-family: 'Bebas Neue', sans-serif; font-size: 24px; letter-spacing: 1px; color: var(--yellow); line-height: 1; }
        .pf-hs-lbl { font-size: 10px; font-weight: 700; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }

        /* TABS */
        .pf-tabs { display: flex; gap: 4px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 4px; overflow-x: auto; width: fit-content; max-width: 100%; }
        .pf-tab { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 12px; letter-spacing: 0.8px; text-transform: uppercase; padding: 9px 18px; border-radius: 9px; border: none; background: transparent; color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .pf-tab.active { background: linear-gradient(135deg, var(--purple), var(--pink)); color: #fff; box-shadow: 0 0 14px rgba(233,30,140,0.3); }
        .pf-tab:hover:not(.active) { color: rgba(255,255,255,0.7); }

        /* CARD */
        .pf-card { background: var(--card); border: 1px solid rgba(255,255,255,0.07); border-radius: 16px; padding: 24px; height: 100%; }
        .pf-card-title { font-family: 'Bebas Neue', sans-serif; font-size: 18px; letter-spacing: 3px; color: #fff; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .pf-card-title span { color: var(--yellow); }

        /* FORM */
        .pf-field { margin-bottom: 16px; }
        .pf-label { display: block; font-size: 12px; font-weight: 600; letter-spacing: 0.3px; color: rgba(255,255,255,0.5); margin-bottom: 7px; }
        .pf-input { width: 100%; background: rgba(255,255,255,0.05); border: 1.5px solid rgba(255,255,255,0.09); border-radius: 10px; padding: 11px 16px; color: #fff; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 400; outline: none; transition: border-color 0.2s, background 0.2s; }
        .pf-input:focus { border-color: var(--yellow); background: rgba(212,226,25,0.03); }
        .pf-input.disabled { color: rgba(255,255,255,0.35); cursor: default; background: rgba(255,255,255,0.02); }
        .pf-input.err { border-color: var(--pink); }
        .pf-field-err { font-size: 12px; font-weight: 400; color: #f48fb1; margin-top: 5px; }

        /* SECURITY BLOCK */
        .pf-security-block { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px; }

        /* BUTTONS */
        .pf-btn-primary { background: linear-gradient(135deg, var(--purple), var(--pink)); border: none; color: #fff; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; border-radius: 10px; padding: 11px 24px; cursor: pointer; transition: box-shadow 0.2s, transform 0.2s; box-shadow: 0 0 16px rgba(233,30,140,0.25); }
        .pf-btn-primary:hover { box-shadow: 0 0 28px rgba(233,30,140,0.5); transform: translateY(-1px); }
        .pf-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .pf-btn-ghost { background: transparent; border: 1.5px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.5); font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.3px; border-radius: 10px; padding: 11px 20px; cursor: pointer; transition: all 0.2s; }
        .pf-btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: #fff; }
        .pf-btn-yellow { background: var(--yellow); border: none; color: #0f102a; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 13px; letter-spacing: 0.5px; border-radius: 10px; padding: 11px 24px; cursor: pointer; transition: box-shadow 0.2s, transform 0.2s; box-shadow: 0 0 16px rgba(212,226,25,0.2); }
        .pf-btn-yellow:hover { box-shadow: 0 0 28px rgba(212,226,25,0.45); transform: translateY(-1px); }
        .pf-mini-link { color: rgba(255,255,255,0.55); font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-decoration: none; text-transform: uppercase; }
        .pf-mini-link:hover { color: var(--yellow); }

        /* FILTER BUTTONS */
        .pf-filter-btn { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); color: rgba(255,255,255,0.4); font-family: 'Syne', sans-serif; font-weight: 700; font-size: 11px; letter-spacing: 0.3px; border-radius: 8px; padding: 7px 14px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .pf-filter-btn:hover { color: rgba(255,255,255,0.7); border-color: rgba(255,255,255,0.2); }
        .pf-filter-btn.active { background: linear-gradient(135deg, var(--purple), var(--pink)); border-color: transparent; color: #fff; }

        /* SEARCH INPUT */
        .pf-search-input { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-radius: 8px; padding: 7px 14px; color: #fff; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 400; outline: none; transition: border-color 0.2s; min-width: 200px; margin-left: auto; }
        .pf-search-input::placeholder { color: rgba(255,255,255,0.25); }
        .pf-search-input:focus { border-color: var(--yellow); }

        /* RANK CARDS */
        .pf-rank-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px; display: flex; align-items: center; gap: 12px; transition: border-color 0.2s; margin-bottom: 10px; }
        .pf-rank-card.current { border-color: rgba(212,226,25,0.35); background: rgba(212,226,25,0.04); }
        .pf-rank-icon { font-size: 28px; flex-shrink: 0; }
        .pf-rank-info { flex: 1; }
        .pf-rank-name { font-family: 'Bebas Neue', sans-serif; font-size: 16px; letter-spacing: 2px; }
        .pf-rank-req  { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.3); margin-top: 2px; }
        .pf-rank-perks { display: flex; flex-direction: column; gap: 3px; text-align: right; font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.4); flex-shrink: 0; }
        .pf-current-tag { font-size: 9px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; background: var(--yellow); color: #0f102a; padding: 2px 8px; border-radius: 4px; }

        /* VOUCHER CARD */
        .pf-voucher-card {
          background: rgba(20,22,50,0.92);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 20px 20px 20px 24px;
          cursor: pointer;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        .pf-voucher-card:hover {
          border-color: rgba(212,226,25,0.25);
          box-shadow: 0 16px 48px rgba(0,0,0,0.35);
          transform: translateY(-4px);
        }
        .pf-voucher-card.muted {
          opacity: 0.68;
          filter: grayscale(0.25);
        }
        .pf-voucher-stripe {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
        }
        .pf-voucher-code {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          letter-spacing: 3px;
          background: rgba(255,255,255,0.06);
          border: 1px dashed rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.72);
          padding: 4px 12px;
          border-radius: 6px;
          display: inline-block;
        }
        .pf-voucher-status {
          font-size: 10px;
          padding: 3px 10px;
          border-radius: 999px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .pf-voucher-main { margin-bottom: 8px; }
        .pf-voucher-discount {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 42px;
          line-height: 1;
          letter-spacing: 1px;
          background: linear-gradient(135deg, #e91e8c, #7b1fa2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .pf-voucher-unit {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 14px;
          color: rgba(255,255,255,0.5);
          letter-spacing: 1.5px;
        }
        .pf-voucher-divider {
          height: 1px;
          background: rgba(255,255,255,0.05);
          margin: 12px 0;
        }
        .pf-voucher-meta {
          display: grid;
          gap: 6px;
          font-size: 11.5px;
          color: rgba(255,255,255,0.42);
          font-weight: 700;
          letter-spacing: 0.2px;
        }
        .pf-voucher-meta strong {
          color: rgba(255,255,255,0.72);
        }
        .pf-fav-card { position: relative; height: 100%; }
        .pf-review-badge { position: absolute; top: 8px; right: 8px; z-index: 3; background: rgba(212,226,25,0.92); color: #0f102a; border-radius: 8px; padding: 3px 8px; font-size: 11px; font-weight: 900; box-shadow: 0 0 14px rgba(212,226,25,0.35); }

        /* TRANSACTION ROW */
        .pf-tx-row { background: var(--card); border: 1px solid rgba(255,255,255,0.07); border-radius: 14px; overflow: hidden; transition: border-color 0.2s; }
        .pf-tx-row:hover { border-color: rgba(255,255,255,0.14); }
        .pf-tx-row.open { border-color: rgba(212,226,25,0.25); }

        /* ACTIVITY */
        .pf-activity-item { display: flex; align-items: center; gap: 12px; padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .pf-activity-item:last-child { border-bottom: none; }

        /* INFO ROW */
        .pf-info-row { display: flex; align-items: flex-start; gap: 14px; padding: 13px 0; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .pf-info-row:last-child { border-bottom: none; }
        .pf-info-icon  { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
        .pf-info-label { font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.35); letter-spacing: 0.3px; margin-bottom: 3px; }
        .pf-info-value { font-size: 14px; font-weight: 400; color: #fff; }

        /* MODAL */
        .pf-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(5px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 16px; }
        .pf-modal { background: #0d0e28; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; width: 100%; max-width: 420px; padding: 28px; position: relative; animation: pfPop 0.3s ease; }
        @keyframes pfPop { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        .pf-modal-close { position: absolute; top: 14px; right: 16px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 7px; color: rgba(255,255,255,0.4); width: 30px; height: 30px; font-size: 17px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
        .pf-modal-close:hover { color: #fff; }
        .pf-modal-title { font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 3px; color: #fff; margin-bottom: 20px; }
        .pf-modal-title span { color: var(--yellow); }
        .pf-pw-wrap { position: relative; display: flex; align-items: center; }
        .pf-pw-wrap .pf-input { padding-right: 44px; }
        .pf-eye { position: absolute; right: 12px; background: none; border: none; color: rgba(255,255,255,0.25); cursor: pointer; padding: 0; display: flex; align-items: center; transition: color 0.2s; }
        .pf-eye:hover { color: var(--yellow); }

        /* TOAST */
        .pf-toast { position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%); border-radius: 12px; padding: 13px 24px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; letter-spacing: 0.4px; z-index: 9999; white-space: nowrap; animation: pfToast 0.3s ease; display: flex; align-items: center; gap: 8px; }
        .pf-toast.success { background: #0d0e28; border: 1.5px solid #81c784; color: #81c784; }
        .pf-toast.error   { background: #0d0e28; border: 1.5px solid var(--pink); color: var(--pink); }
        @keyframes pfToast { from{opacity:0;transform:translateX(-50%) translateY(14px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }

        /* SPINNER */
        .pf-spinner { width: 32px; height: 32px; border: 2px solid rgba(123,31,162,0.3); border-top-color: var(--pink); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 767px) {
          .pf-header { display: block; }
          .pf-filters { justify-content: flex-start; margin-top: 18px; }
          .pf-hero { flex-direction: column; align-items: flex-start; }
          .pf-hero-stats { flex-direction: row; }
          .pf-tabs { width: 100%; }
        }
      `}</style>

      <Toast toast={toast} />

      <div className="pf-page mt-4">
        <Container fluid="xl">

          <div className="pf-header">
            <div>
              <h1 className="pf-title">TÀI KHOẢN <span>CỦA TÔI</span></h1>
              <div className="pf-title-bar" />
              <div className="pf-count">Hồ sơ, điểm thưởng, voucher và giao dịch</div>
            </div>

            <div className="pf-filters">
              <div className="pf-tabs">
                {TABS.map(({ key, label }) => (
                  <button key={key} className={`pf-tab${activeTab === key ? " active" : ""}`} onClick={() => setActiveTab(key)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* HERO */}
          <div className="pf-hero">
            <Avatar name={user.fullname} avatarUrl={user.avatar} size={90} />

            <div className="pf-hero-right">
              <div className="pf-username">@{user.username}</div>
              <div className="pf-fullname">{user.fullname}</div>

              {user.rank_name && (
                <div className="pf-rank-badge" style={{ color: "var(--yellow)", borderColor: "var(--yellow)", background: "rgba(212,226,25,0.06)" }}>
                  🏆 {user.rank_name}
                </div>
              )}

              <div className="pf-progress-wrap">
                <div className="pf-progress-label">
                  <span>{fmtVnd(user.total_spending)} đã chi</span>
                </div>
                <div className="pf-progress-bar">
                  <div className="pf-progress-fill" style={{ width: `60%` }} />
                </div>
              </div>
            </div>

            <div className="pf-hero-stats">
              <div className="pf-hs">
                <div className="pf-hs-num">{formatNumber(user.points)}</div>
                <div className="pf-hs-lbl">Điểm ⭐</div>
              </div>
              <div className="pf-hs">
                <div className="pf-hs-num" style={{ fontSize: 18 }}>{fmtVnd(user.total_spending)}</div>
                <div className="pf-hs-lbl">Tổng chi</div>
              </div>
              <div className="pf-hs">
                <div className="pf-hs-num" style={{ fontSize: 18 }}>{completedTx || "—"}</div>
                <div className="pf-hs-lbl">Giao dịch</div>
              </div>
            </div>
          </div>

          {/* TAB PANELS */}
          {activeTab === "info"         && <TabInfo user={user} setUser={setUser} showToast={showToast} />}
          {activeTab === "transactions" && (
            <div className="pf-card">
              <div className="pf-card-title"><span>📋</span> LỊCH SỬ <span>GIAO DỊCH</span></div>
              <TabTransactions transactions={transactions} loading={loadingTx} searchTerm={txSearch} onSearchChange={setTxSearch} />
            </div>
          )}
          {activeTab === "points"   && <TabPoints user={user} pointRows={pointRows} loading={loadingPts} />}
          {activeTab === "favorites" && <TabFavorites favorites={favorites} loading={loadingFav} />}
          {activeTab === "vouchers" && (
            <div className="pf-card">
              <div className="pf-card-title"><span>🎫</span> KHO <span>VOUCHER</span></div>
              <TabVouchers vouchers={vouchers} loading={loadingVou} />
            </div>
          )}
          {activeTab === "rank"     && <TabRank user={user} ranks={ranks} loading={loadingRnk} />}

        </Container>
      </div>
    </Layout>
  );
}
