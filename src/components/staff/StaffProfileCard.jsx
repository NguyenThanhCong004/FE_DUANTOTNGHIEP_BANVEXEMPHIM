import React, { useEffect, useState, useCallback } from "react";
import { Card, Button, Spinner, Form } from "react-bootstrap";
import {
  User, Mail, Phone, Calendar, Shield, Building2,
  KeyRound, Pencil, RefreshCw, Save, X,
} from "lucide-react";

import { useAdminToast } from "../admin/AdminToast";
import {
  getAccessToken,
  getRefreshToken,
  getStoredStaff,
  getStoredUser,
  setAuthSession,
} from "../../utils/authStorage";
import { apiFetch } from "../../utils/apiClient";
import { STAFF, CINEMAS } from "../../constants/apiEndpoints";
import { fileToDataUrl, IMAGE_FILE_ACCEPT } from "../../utils/mediaFiles";
import { apiMessage, MESSAGES } from "../../utils/uiMessages";
import { toDateInputValue } from "../../utils/formatters";
import { PASSWORD_RULE_MESSAGE, STRONG_PASSWORD_REGEX } from "../../utils/passwordValidation";

const GMAIL_RE = /^[a-z0-9._%+-]+@gmail\.com$/i;
const PHONE_RE = /^[0-9]{10}$/;
const DEFAULT_AVATAR_PLACEHOLDER =
  "https://placehold.co/120x120/1e293b/94a3b8?text=Avatar";

function normalizeRole(role) {
  if (role == null) return "—";
  return String(role).replace(/^ROLE_/i, "");
}

function formatBirthdayDisplay(value) {
  const dateValue = toDateInputValue(value);
  if (!dateValue) return "—";
  const [year, month, day] = dateValue.split("-");
  return `${day}/${month}/${year}`;
}

function mergeStaffSession(serverDto) {
  const prev = getStoredStaff() || {};
  setAuthSession({
    accessToken: getAccessToken(),
    refreshToken: getRefreshToken(),
    user: getStoredUser(),
    staff: {
      ...prev,
      staffId: serverDto.staffId ?? prev.staffId,
      email: serverDto.email ?? prev.email,
      fullname: serverDto.fullname ?? prev.fullname,
      phone: serverDto.phone ?? prev.phone,
      birthday: serverDto.birthday ?? prev.birthday,
      role: serverDto.role ?? prev.role,
      avatar: serverDto.avatar ?? prev.avatar,
      status: serverDto.status ?? prev.status,
      cinemaId: serverDto.cinemaId ?? prev.cinemaId,
    },
  });
}

const ROLE_COLORS = {
  ADMIN: { bg: "rgba(59,130,246,0.15)", text: "#60a5fa", border: "rgba(59,130,246,0.35)" },
  STAFF: { bg: "rgba(16,185,129,0.15)", text: "#34d399", border: "rgba(16,185,129,0.35)" },
  SUPER_ADMIN: { bg: "rgba(139,92,246,0.15)", text: "#a78bfa", border: "rgba(139,92,246,0.35)" },
};

function RoleBadge({ role }) {
  const key = String(role || "").toUpperCase().replace(/^ROLE_/i, "");
  const c = ROLE_COLORS[key] || { bg: "rgba(100,116,139,0.15)", text: "#94a3b8", border: "rgba(100,116,139,0.3)" };
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 12px",
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.06em",
      background: c.bg,
      color: c.text,
      border: `1px solid ${c.border}`,
      textTransform: "uppercase",
    }}>
      {key || "—"}
    </span>
  );
}

function IconBox({ icon: Icon, color = "#60a5fa", bg = "rgba(59,130,246,0.12)" }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 9,
      background: bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <Icon size={16} color={color} />
    </div>
  );
}

function InfoRow({ icon, iconColor, iconBg, label, noBorder = false, children }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: 14,
      padding: "15px 0",
      borderBottom: noBorder ? "none" : "1px solid rgba(148,163,184,0.1)",
    }}>
      <IconBox icon={icon} color={iconColor} bg={iconBg} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10.5, color: "#64748b", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5,
        }}>
          {label}
        </div>
        {children}
      </div>
    </div>
  );
}

function PwField({ label, name, value, show, onToggle, onChange, error, inputDark }) {
  return (
    <Form.Group className="mb-3">
      <Form.Label style={{ fontSize: 12, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>
        {label}
      </Form.Label>
      <div style={{ position: "relative" }}>
        <Form.Control
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          className={`${inputDark || ""} ${error ? "is-invalid border-danger" : ""}`.trim()}
          autoComplete={name === "current" ? "current-password" : "new-password"}
          style={{ paddingRight: 42, backgroundImage: "none", borderRadius: 9 }}
        />
        <button
          type="button"
          onClick={onToggle}
          style={{
            position: "absolute", right: 10, top: "50%",
            transform: "translateY(-50%)", border: "none",
            background: "transparent", color: "#94a3b8", zIndex: 5,
          }}
        >
          <i className={`fas ${show ? "fa-eye-slash" : "fa-eye"}`} />
        </button>
      </div>
      {error && (
        <div style={{ color: "#f87171", fontSize: 11, marginTop: 5, fontWeight: 600 }}>{error}</div>
      )}
    </Form.Group>
  );
}

/**
 * Hồ sơ nhân viên (ADMIN / SUPER_ADMIN) — tải từ API, chỉnh sửa & đổi mật khẩu.
 * @param {boolean} [hideHeader] — ẩn tiêu đề phụ (khi đã có AdminPanelPage).
 * @param {'dark'|'light'} [variant] — dark: nền slate; light: khớp admin panel.
 */
export default function StaffProfileCard({ title, roleLabel, hideHeader = false, variant = "dark" }) {
  const stored = getStoredStaff();
  const staffId = stored?.staffId ?? stored?.staff_id ?? null;

  const [model, setModel] = useState(null);
  const [draft, setDraft] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const { showToast, ToastComponent } = useAdminToast();

  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "", otpCode: "" });
  const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [cinemaName, setCinemaName] = useState(null);

  const load = useCallback(async () => {
    if (!staffId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await apiFetch(STAFF.ME);
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) {
        showToast(apiMessage(json, "Không tải được hồ sơ"), "danger");
        setModel(null);
        return;
      }
      const d = json.data;
      setModel(d);
      mergeStaffSession(d);
    } catch {
      showToast(MESSAGES.networkError, "danger");
      setModel(null);
    } finally {
      setLoading(false);
    }
  }, [staffId, showToast]);

  useEffect(() => { load(); }, [load]);

  const cinemaId = model?.cinemaId ?? stored?.cinemaId;
  useEffect(() => {
    if (cinemaId == null) { setCinemaName(null); return; }
    apiFetch(CINEMAS.BY_ID(cinemaId))
      .then(r => r.json().catch(() => null))
      .then(json => { if (json?.data?.name) setCinemaName(json.data.name); })
      .catch(() => {});
  }, [cinemaId]);

  const startEdit = () => {
    if (!model) return;
    setAvatarFile(null);
    setAvatarPreview((model.avatar && String(model.avatar).trim()) || DEFAULT_AVATAR_PLACEHOLDER);
    setDraft({
      fullname: model.fullname ?? "",
      email: model.email ?? "",
      phone: model.phone ?? "",
      birthday: toDateInputValue(model.birthday),
    });
    setEditing(true);
    setErrors({});
  };

  const cancelEdit = () => {
    setEditing(false);
    setErrors({});
    setAvatarFile(null);
    setAvatarPreview("");
  };

  const handleDraft = (e) => {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };

  const validateDraft = () => {
    const e = {};
    if (!draft.fullname?.trim()) e.fullname = "Họ tên không được để trống";
    const em = draft.email?.trim() || "";
    if (!em) e.email = "Email không được để trống";
    else if (!GMAIL_RE.test(em)) e.email = "Email phải là Gmail (vd: abc@gmail.com)";
    const ph = draft.phone?.trim() || "";
    if (!ph) e.phone = "Số điện thoại không được để trống";
    else if (!PHONE_RE.test(ph)) e.phone = "Số điện thoại phải đúng 10 chữ số";
    if (!draft.birthday) e.birthday = "Chọn ngày sinh";
    const avSrc = avatarFile ? "file" : avatarPreview?.trim() || model?.avatar?.trim() || "";
    if (!avSrc) e.avatar = "Cần có ảnh đại diện";
    return e;
  };

  const saveProfile = async () => {
    const e = validateDraft();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (!model?.staffId) return;

    setSaving(true);
    try {
      let avatarPayload = (model.avatar && String(model.avatar).trim()) || "";
      if (avatarFile) {
        avatarPayload = await fileToDataUrl(avatarFile);
      } else if (avatarPreview && avatarPreview.trim()) {
        avatarPayload = avatarPreview.trim();
      }
      if (!avatarPayload) {
        setErrors({ avatar: "Ảnh đại diện không được để trống" });
        setSaving(false);
        return;
      }
      const body = {
        fullname: draft.fullname.trim(),
        email: draft.email.trim(),
        phone: draft.phone.trim(),
        birthday: draft.birthday,
        avatar: avatarPayload,
        role: model.role,
        status: model.status,
        cinemaId: model.cinemaId ?? null,
      };
      const originalBody = {
        fullname: String(model.fullname ?? "").trim(),
        email: String(model.email ?? "").trim(),
        phone: String(model.phone ?? "").trim(),
        birthday: toDateInputValue(model.birthday),
        avatar: String(model.avatar ?? "").trim(),
        role: model.role,
        status: model.status,
        cinemaId: model.cinemaId ?? null,
      };
      if (!avatarFile && JSON.stringify(body) === JSON.stringify(originalBody)) {
        showToast(MESSAGES.noChanges, "warning");
        setSaving(false);
        return;
      }
      const res = await apiFetch(STAFF.ME, { method: "PUT", body: JSON.stringify(body) });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) {
        showToast(apiMessage(json, "Cập nhật thất bại"), "danger");
        return;
      }
      setModel(json.data);
      mergeStaffSession(json.data);
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview("");
      showToast("Đã lưu hồ sơ");
    } catch {
      showToast(MESSAGES.networkError, "danger");
    } finally {
      setSaving(false);
    }
  };

  const handlePw = (e) => {
    const { name, value } = e.target;
    setPw((p) => ({ ...p, [name]: value }));
    setPwErrors({});
  };

  const validatePw = () => {
    const e = {};
    if (!pw.current) e.current = "Nhập mật khẩu hiện tại";
    if (!STRONG_PASSWORD_REGEX.test(pw.newPw || "")) e.newPw = PASSWORD_RULE_MESSAGE;
    if (pw.newPw !== pw.confirm) e.confirm = "Mật khẩu xác nhận không khớp";
    if (!pw.otpCode || pw.otpCode.trim().length !== 6) e.otpCode = "Nhập mã 6 số được gửi về email";
    return e;
  };

  const sendOtp = async () => {
    if (otpSending || otpCooldown > 0) return;
    setOtpSending(true);
    try {
      const res = await apiFetch(STAFF.ME_PASSWORD_SEND_OTP, { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok) { showToast(apiMessage(json, "Không gửi được mã"), "danger"); return; }
      setOtpSent(true);
      showToast("Mã xác nhận đã gửi về email của bạn", "success");
      let s = 60;
      setOtpCooldown(s);
      const t = setInterval(() => { s--; setOtpCooldown(s); if (s <= 0) clearInterval(t); }, 1000);
    } catch {
      showToast(MESSAGES.networkError, "danger");
    } finally {
      setOtpSending(false);
    }
  };

  const savePassword = async () => {
    const e = validatePw();
    if (Object.keys(e).length) { setPwErrors(e); return; }
    if (!model?.staffId) return;

    setPwSaving(true);
    try {
      const res = await apiFetch(STAFF.ME_PASSWORD, {
        method: "PUT",
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.newPw, otpCode: pw.otpCode.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) { showToast(apiMessage(json, "Đổi mật khẩu thất bại"), "danger"); return; }
      setPw({ current: "", newPw: "", confirm: "", otpCode: "" });
      setOtpSent(false);
      setOtpCooldown(0);
      showToast("Đã đổi mật khẩu thành công");
    } catch {
      showToast(MESSAGES.networkError, "danger");
    } finally {
      setPwSaving(false);
    }
  };

  const light = variant === "light";
  const inputDark = light ? "" : "bg-dark text-light border-secondary";

  const role = model ? normalizeRole(model.role) : normalizeRole(stored?.role);
  const name = model?.fullname || stored?.fullname || stored?.email || "—";
  const email = model?.email || stored?.email || "—";

  const cardStyle = {
    background: light ? "var(--admin-bg-card)" : "rgba(15, 23, 42, 0.9)",
    borderRadius: 16,
    border: "1px solid rgba(148, 163, 184, 0.12)",
    overflow: "hidden",
    boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
  };

  const textPrimary = light ? "#1e293b" : "#f1f5f9";
  const textValue = light ? "#1e293b" : "#e2e8f0";

  return (
    <div className={`staff-profile-wrap${light ? " staff-profile-wrap--light" : ""}`}>
      <ToastComponent />

      {!hideHeader && (
        <div className="mb-4">
          <h2 style={{ fontSize: 22, fontWeight: 700, color: textPrimary, marginBottom: 4 }}>{title}</h2>
          <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>{roleLabel}</p>
        </div>
      )}

      {/* Profile Card */}
      <Card className="border-0 mb-4" style={cardStyle}>
        {/* Gradient banner */}
        <div style={{
          background: light
            ? "linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)"
            : "linear-gradient(135deg, #1e3a5f 0%, #1e293b 60%, #0f172a 100%)",
          height: 88,
        }} />

        <Card.Body className="p-4" style={{ marginTop: -20 }}>
          {!staffId ? (
            <p style={{ color: "#f59e0b" }}>Không tìm thấy mã nhân viên. Vui lòng đăng nhập lại.</p>
          ) : loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", padding: "20px 0" }}>
              <Spinner animation="border" size="sm" />
              Đang tải hồ sơ…
            </div>
          ) : !model ? (
            <p style={{ color: "#f59e0b" }}>Không tải được dữ liệu từ máy chủ.</p>
          ) : (
            <>
              {/* Avatar + name + actions */}
              <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: "50%",
                    border: "3px solid #3b82f6",
                    boxShadow: "0 0 0 5px rgba(59,130,246,0.18), 0 4px 16px rgba(0,0,0,0.3)",
                    overflow: "hidden", background: "#1e293b", flexShrink: 0,
                  }}>
                    <img
                      src={(editing ? avatarPreview : model.avatar)?.trim() || DEFAULT_AVATAR_PLACEHOLDER}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(ev) => {
                        if (ev.target.src !== DEFAULT_AVATAR_PLACEHOLDER) {
                          showToast("Ảnh đại diện không hiển thị được (định dạng không hỗ trợ) — vui lòng thử ảnh JPG/PNG khác", "warning");
                        }
                        ev.target.src = DEFAULT_AVATAR_PLACEHOLDER;
                      }}
                    />
                  </div>
                  <div style={{ paddingBottom: 4 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 3 }}>{name}</div>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{email}</div>
                    <RoleBadge role={model.role} />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
                  {!editing ? (
                    <>
                      <button
                        onClick={startEdit}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "7px 16px", borderRadius: 9, border: "none",
                          background: "#3b82f6", color: "#fff",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        <Pencil size={14} /> Chỉnh sửa
                      </button>
                      <button
                        onClick={load}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "7px 14px", borderRadius: 9,
                          border: "1px solid rgba(148,163,184,0.3)",
                          background: "transparent", color: "#94a3b8",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        <RefreshCw size={14} /> Tải lại
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "7px 16px", borderRadius: 9, border: "none",
                          background: "#10b981", color: "#fff",
                          fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer",
                          opacity: saving ? 0.7 : 1,
                        }}
                      >
                        <Save size={14} /> {saving ? "Đang lưu…" : "Lưu"}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        style={{
                          display: "flex", alignItems: "center", gap: 6,
                          padding: "7px 14px", borderRadius: 9,
                          border: "1px solid rgba(148,163,184,0.3)",
                          background: "transparent", color: "#94a3b8",
                          fontSize: 13, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        <X size={14} /> Hủy
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Avatar file picker (edit mode) */}
              {editing && (
                <div style={{
                  marginBottom: 20, padding: "12px 16px",
                  background: "rgba(59,130,246,0.07)",
                  borderRadius: 10, border: "1px solid rgba(59,130,246,0.18)",
                }}>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Đổi ảnh đại diện
                  </div>
                  <Form.Control
                    type="file"
                    accept={IMAGE_FILE_ACCEPT}
                    size="sm"
                    className={inputDark || undefined}
                    style={{ borderRadius: 8 }}
                    onChange={(ev) => {
                      const f = ev.target.files?.[0];
                      setErrors((er) => ({ ...er, avatar: "" }));
                      if (!f) {
                        setAvatarFile(null);
                        setAvatarPreview((model.avatar && String(model.avatar).trim()) || DEFAULT_AVATAR_PLACEHOLDER);
                        return;
                      }
                      setAvatarFile(f);
                      setAvatarPreview(URL.createObjectURL(f));
                    }}
                  />
                  {errors.avatar && <div style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>{errors.avatar}</div>}
                </div>
              )}

              {/* Info rows */}
              <InfoRow icon={User} iconColor="#60a5fa" iconBg="rgba(59,130,246,0.1)" label="Họ tên">
                {editing ? (
                  <>
                    <Form.Control name="fullname" value={draft.fullname} onChange={handleDraft}
                      className={`mt-1 ${inputDark}`.trim()} isInvalid={!!errors.fullname}
                      style={{ borderRadius: 9 }} />
                    {errors.fullname && <div style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>{errors.fullname}</div>}
                  </>
                ) : (
                  <div style={{ fontWeight: 600, color: textValue }}>{model.fullname || "—"}</div>
                )}
              </InfoRow>

              <InfoRow icon={Mail} iconColor="#34d399" iconBg="rgba(16,185,129,0.1)" label="Email (Gmail)">
                {editing ? (
                  <>
                    <Form.Control name="email" type="email" value={draft.email} onChange={handleDraft}
                      className={`mt-1 ${inputDark}`.trim()} isInvalid={!!errors.email}
                      style={{ borderRadius: 9 }} />
                    {errors.email && <div style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>{errors.email}</div>}
                  </>
                ) : (
                  <div style={{ fontWeight: 600, color: textValue }}>{model.email || "—"}</div>
                )}
              </InfoRow>

              <InfoRow icon={Phone} iconColor="#f472b6" iconBg="rgba(244,114,182,0.1)" label="Điện thoại">
                {editing ? (
                  <>
                    <Form.Control name="phone" value={draft.phone} onChange={handleDraft}
                      className={`mt-1 ${inputDark}`.trim()} isInvalid={!!errors.phone}
                      style={{ borderRadius: 9 }} />
                    {errors.phone && <div style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>{errors.phone}</div>}
                  </>
                ) : (
                  <div style={{ fontWeight: 600, color: textValue }}>{model.phone || "—"}</div>
                )}
              </InfoRow>

              <InfoRow icon={Calendar} iconColor="#fb923c" iconBg="rgba(251,146,60,0.1)" label="Ngày sinh">
                {editing ? (
                  <>
                    <Form.Control name="birthday" type="date" value={draft.birthday} onChange={handleDraft}
                      className={`mt-1 ${inputDark}`.trim()} isInvalid={!!errors.birthday}
                      style={{ borderRadius: 9 }} />
                    {errors.birthday && <div style={{ color: "#f87171", fontSize: 12, marginTop: 5 }}>{errors.birthday}</div>}
                  </>
                ) : (
                  <div style={{ fontWeight: 600, color: textValue }}>{formatBirthdayDisplay(model.birthday)}</div>
                )}
              </InfoRow>

              <InfoRow icon={Shield} iconColor="#a78bfa" iconBg="rgba(139,92,246,0.1)" label="Vai trò">
                <RoleBadge role={model.role} />
              </InfoRow>

              <InfoRow icon={Building2} iconColor="#38bdf8" iconBg="rgba(56,189,248,0.1)" label="Rạp phụ trách" noBorder>
                <div style={{ fontWeight: 600, color: textValue }}>
                  {cinemaName ?? (cinemaId != null ? `Rạp #${cinemaId}` : "Chưa gán rạp")}
                </div>
              </InfoRow>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Password Card */}
      {staffId && model && (
        <Card className="border-0" style={cardStyle}>
          <Card.Body className="p-4">
            {/* Section header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              marginBottom: 24, paddingBottom: 20,
              borderBottom: "1px solid rgba(148,163,184,0.1)",
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: "rgba(245,158,11,0.12)",
                border: "1px solid rgba(245,158,11,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <KeyRound size={19} color="#f59e0b" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: textPrimary }}>Đổi mật khẩu</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Mật khẩu mạnh giúp bảo vệ tài khoản của bạn
                </div>
              </div>
            </div>

            <PwField
              label="Mật khẩu hiện tại"
              name="current"
              value={pw.current}
              show={showPw.current}
              onToggle={() => setShowPw((s) => ({ ...s, current: !s.current }))}
              onChange={handlePw}
              error={pwErrors.current}
              inputDark={inputDark}
            />
            <PwField
              label="Mật khẩu mới (≥ 8 ký tự)"
              name="newPw"
              value={pw.newPw}
              show={showPw.newPw}
              onToggle={() => setShowPw((s) => ({ ...s, newPw: !s.newPw }))}
              onChange={handlePw}
              error={pwErrors.newPw}
              inputDark={inputDark}
            />
            <PwField
              label="Xác nhận mật khẩu mới"
              name="confirm"
              value={pw.confirm}
              show={showPw.confirm}
              onToggle={() => setShowPw((s) => ({ ...s, confirm: !s.confirm }))}
              onChange={handlePw}
              error={pwErrors.confirm}
              inputDark={inputDark}
            />

            {/* OTP Section */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Nhập mã 6 số từ email"
                  value={pw.otpCode}
                  onChange={(e) => { setPw((p) => ({ ...p, otpCode: e.target.value.replace(/\D/g, "") })); setPwErrors((err) => ({ ...err, otpCode: undefined })); }}
                  className={`form-control ${inputDark}`}
                  style={{ flex: 1, letterSpacing: 6, fontWeight: 700, fontSize: 16 }}
                />
                <button
                  type="button"
                  onClick={sendOtp}
                  disabled={otpSending || otpCooldown > 0}
                  style={{
                    padding: "8px 14px", borderRadius: 9, border: "1px solid rgba(245,158,11,0.4)",
                    background: "rgba(245,158,11,0.1)", color: "#f59e0b",
                    fontSize: 12, fontWeight: 700, cursor: (otpSending || otpCooldown > 0) ? "not-allowed" : "pointer",
                    whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6,
                    opacity: (otpSending || otpCooldown > 0) ? 0.6 : 1,
                  }}
                >
                  <Mail size={13} />
                  {otpCooldown > 0 ? `Gửi lại (${otpCooldown}s)` : otpSending ? "Đang gửi…" : otpSent ? "Gửi lại mã" : "Gửi mã"}
                </button>
              </div>
              {pwErrors.otpCode && <div style={{ fontSize: 12, color: "#f87171" }}>{pwErrors.otpCode}</div>}
              {otpSent && !pwErrors.otpCode && (
                <div style={{ fontSize: 12, color: "#4ade80" }}>Mã đã gửi — kiểm tra hộp thư email của bạn.</div>
              )}
            </div>

            <button
              onClick={savePassword}
              disabled={pwSaving}
              style={{
                marginTop: 4, padding: "9px 22px", borderRadius: 9, border: "none",
                background: "#f59e0b", color: "#1e293b",
                fontSize: 13, fontWeight: 700, cursor: pwSaving ? "not-allowed" : "pointer",
                opacity: pwSaving ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: 7,
              }}
            >
              <KeyRound size={14} />
              {pwSaving ? "Đang xử lý…" : "Cập nhật mật khẩu"}
            </button>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
