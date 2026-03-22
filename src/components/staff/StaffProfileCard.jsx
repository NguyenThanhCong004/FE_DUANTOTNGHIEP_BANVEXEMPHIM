import React, { useEffect, useState, useCallback } from "react";
import { Card, Button, Spinner, Form } from "react-bootstrap";
import { Building2, Mail, Shield, User, Lock } from "lucide-react";
import {
  getAccessToken,
  getRefreshToken,
  getStoredStaff,
  getStoredUser,
  setAuthSession,
} from "../../utils/authStorage";
import { apiFetch } from "../../utils/apiClient";
import { STAFF } from "../../constants/apiEndpoints";

const GMAIL_RE = /^[a-z0-9._%+-]+@gmail\.com$/i;
const PHONE_RE = /^[0-9]{10}$/;
const DEFAULT_AVATAR_PLACEHOLDER =
  "https://placehold.co/120x120/1e293b/94a3b8?text=Avatar";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function toDateInputValue(birthday) {
  if (birthday == null || birthday === "") return "";
  if (typeof birthday === "string") return birthday.slice(0, 10);
  if (Array.isArray(birthday) && birthday.length >= 3) {
    const [y, m, d] = birthday;
    return `${String(y)}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return "";
}

function normalizeRole(role) {
  if (role == null) return "—";
  return String(role).replace(/^ROLE_/i, "");
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
      username: serverDto.username ?? prev.username,
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

/**
 * Hồ sơ nhân viên (ADMIN / SUPER_ADMIN) — tải từ API, chỉnh sửa & đổi mật khẩu.
 */
export default function StaffProfileCard({ title, roleLabel }) {
  const stored = getStoredStaff();
  const staffId = stored?.staffId ?? stored?.staff_id ?? null;

  const [model, setModel] = useState(null);
  const [draft, setDraft] = useState({});
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState(null);

  const [pw, setPw] = useState({ current: "", newPw: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const load = useCallback(async () => {
    if (!staffId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(STAFF.BY_ID(staffId));
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) {
        showToast(json?.message || "Không tải được hồ sơ", "error");
        setModel(null);
        return;
      }
      const d = json.data;
      setModel(d);
      mergeStaffSession(d);
    } catch {
      showToast("Không kết nối được máy chủ", "error");
      setModel(null);
    } finally {
      setLoading(false);
    }
  }, [staffId, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const startEdit = () => {
    if (!model) return;
    setAvatarFile(null);
    setAvatarPreview(
      (model.avatar && String(model.avatar).trim()) || DEFAULT_AVATAR_PLACEHOLDER
    );
    setDraft({
      fullname: model.fullname ?? "",
      email: model.email ?? "",
      username: model.username ?? "",
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
    if (!draft.username?.trim()) e.username = "Tên đăng nhập không được để trống";
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
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
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
        username: draft.username.trim(),
        phone: draft.phone.trim(),
        birthday: draft.birthday,
        avatar: avatarPayload,
        role: model.role,
        status: model.status,
        cinemaId: model.cinemaId ?? null,
      };
      const res = await apiFetch(STAFF.BY_ID(model.staffId), {
        method: "PUT",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.data) {
        showToast(json?.message || "Cập nhật thất bại", "error");
        return;
      }
      setModel(json.data);
      mergeStaffSession(json.data);
      setEditing(false);
      setAvatarFile(null);
      setAvatarPreview("");
      showToast("Đã lưu hồ sơ");
    } catch {
      showToast("Không kết nối được máy chủ", "error");
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
    if (!pw.newPw || pw.newPw.length < 8) e.newPw = "Mật khẩu mới tối thiểu 8 ký tự";
    if (pw.newPw !== pw.confirm) e.confirm = "Mật khẩu xác nhận không khớp";
    return e;
  };

  const savePassword = async () => {
    const e = validatePw();
    if (Object.keys(e).length) {
      setPwErrors(e);
      return;
    }
    if (!model?.staffId) return;

    setPwSaving(true);
    try {
      const res = await apiFetch(STAFF.PASSWORD(model.staffId), {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: pw.current,
          newPassword: pw.newPw,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        showToast(json?.message || "Đổi mật khẩu thất bại", "error");
        return;
      }
      setPw({ current: "", newPw: "", confirm: "" });
      showToast("Đã đổi mật khẩu");
    } catch {
      showToast("Không kết nối được máy chủ", "error");
    } finally {
      setPwSaving(false);
    }
  };

  const cardStyle = {
    background: "rgba(15, 23, 42, 0.75)",
    borderRadius: 16,
    border: "1px solid rgba(148, 163, 184, 0.2)",
  };

  const role = model ? normalizeRole(model.role) : normalizeRole(stored?.role);
  const name = model?.fullname || stored?.fullname || stored?.username || "—";
  const email = model?.email || stored?.email || "—";
  const cinemaId = model?.cinemaId ?? stored?.cinemaId;

  return (
    <div className="staff-profile-wrap">
      {toast && (
        <div
          className={`alert ${toast.type === "error" ? "alert-danger" : "alert-success"} py-2 px-3 mb-3`}
          role="status"
        >
          {toast.msg}
        </div>
      )}

      <div className="mb-4">
        <h2 className="h4 fw-bold text-white mb-1">{title}</h2>
        <p className="text-secondary small mb-0">{roleLabel}</p>
      </div>

      <Card className="border-0 text-light mb-4" style={cardStyle}>
        <Card.Body className="p-4">
          {!staffId ? (
            <p className="text-warning mb-0">
              Không tìm thấy mã nhân viên. Vui lòng đăng nhập lại.
            </p>
          ) : loading ? (
            <div className="d-flex align-items-center gap-2 text-secondary">
              <Spinner animation="border" size="sm" />
              Đang tải hồ sơ…
            </div>
          ) : !model ? (
            <p className="text-warning mb-2">Không tải được dữ liệu từ máy chủ.</p>
          ) : (
            <>
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid rgba(148,163,184,0.35)",
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={
                        (editing ? avatarPreview : model.avatar)?.trim() ||
                        DEFAULT_AVATAR_PLACEHOLDER
                      }
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(ev) => {
                        ev.target.src = DEFAULT_AVATAR_PLACEHOLDER;
                      }}
                    />
                  </div>
                  <div>
                    <div className="fw-bold fs-5">{name}</div>
                    <div className="small text-secondary">{email}</div>
                    {editing ? (
                      <div className="mt-2">
                        <Form.Label className="small text-secondary mb-1">Đổi ảnh đại diện</Form.Label>
                        <Form.Control
                          type="file"
                          accept="image/*"
                          size="sm"
                          className="bg-dark text-light border-secondary"
                          onChange={(ev) => {
                            const f = ev.target.files?.[0];
                            setErrors((er) => ({ ...er, avatar: "" }));
                            if (!f) {
                              setAvatarFile(null);
                              setAvatarPreview(
                                (model.avatar && String(model.avatar).trim()) ||
                                  DEFAULT_AVATAR_PLACEHOLDER
                              );
                              return;
                            }
                            setAvatarFile(f);
                            setAvatarPreview(URL.createObjectURL(f));
                          }}
                        />
                        {errors.avatar ? (
                          <div className="text-danger small mt-1">{errors.avatar}</div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="d-flex gap-2">
                  {!editing ? (
                    <>
                      <Button variant="outline-light" size="sm" onClick={startEdit}>
                        Chỉnh sửa
                      </Button>
                      <Button variant="outline-secondary" size="sm" onClick={load}>
                        Tải lại
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={saveProfile}
                        disabled={saving}
                      >
                        {saving ? "Đang lưu…" : "Lưu"}
                      </Button>
                      <Button variant="outline-light" size="sm" onClick={cancelEdit} disabled={saving}>
                        Hủy
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <ul className="list-unstyled mb-0">
                <li className="d-flex align-items-start gap-3 py-3 border-bottom border-secondary border-opacity-25">
                  <User size={20} className="text-info flex-shrink-0 mt-1" />
                  <div className="flex-grow-1">
                    <div className="small text-secondary text-uppercase fw-bold">Họ tên</div>
                    {editing ? (
                      <Form.Control
                        name="fullname"
                        value={draft.fullname}
                        onChange={handleDraft}
                        className="mt-1 bg-dark text-light border-secondary"
                        isInvalid={!!errors.fullname}
                      />
                    ) : (
                      <div className="fw-semibold">{model.fullname || "—"}</div>
                    )}
                    {errors.fullname && (
                      <div className="text-danger small mt-1">{errors.fullname}</div>
                    )}
                  </div>
                </li>
                <li className="d-flex align-items-start gap-3 py-3 border-bottom border-secondary border-opacity-25">
                  <Mail size={20} className="text-info flex-shrink-0 mt-1" />
                  <div className="flex-grow-1">
                    <div className="small text-secondary text-uppercase fw-bold">Email (Gmail)</div>
                    {editing ? (
                      <Form.Control
                        name="email"
                        type="email"
                        value={draft.email}
                        onChange={handleDraft}
                        className="mt-1 bg-dark text-light border-secondary"
                        isInvalid={!!errors.email}
                      />
                    ) : (
                      <div className="fw-semibold">{model.email || "—"}</div>
                    )}
                    {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
                  </div>
                </li>
                <li className="d-flex align-items-start gap-3 py-3 border-bottom border-secondary border-opacity-25">
                  <User size={20} className="text-info flex-shrink-0 mt-1" />
                  <div className="flex-grow-1">
                    <div className="small text-secondary text-uppercase fw-bold">Tên đăng nhập</div>
                    {editing ? (
                      <Form.Control
                        name="username"
                        value={draft.username}
                        onChange={handleDraft}
                        className="mt-1 bg-dark text-light border-secondary"
                        isInvalid={!!errors.username}
                      />
                    ) : (
                      <div className="fw-semibold">{model.username || "—"}</div>
                    )}
                    {errors.username && (
                      <div className="text-danger small mt-1">{errors.username}</div>
                    )}
                  </div>
                </li>
                <li className="d-flex align-items-start gap-3 py-3 border-bottom border-secondary border-opacity-25">
                  <Mail size={20} className="text-info flex-shrink-0 mt-1" />
                  <div className="flex-grow-1">
                    <div className="small text-secondary text-uppercase fw-bold">Điện thoại</div>
                    {editing ? (
                      <Form.Control
                        name="phone"
                        value={draft.phone}
                        onChange={handleDraft}
                        className="mt-1 bg-dark text-light border-secondary"
                        isInvalid={!!errors.phone}
                      />
                    ) : (
                      <div className="fw-semibold">{model.phone || "—"}</div>
                    )}
                    {errors.phone && <div className="text-danger small mt-1">{errors.phone}</div>}
                  </div>
                </li>
                <li className="d-flex align-items-start gap-3 py-3 border-bottom border-secondary border-opacity-25">
                  <User size={20} className="text-info flex-shrink-0 mt-1" />
                  <div className="flex-grow-1">
                    <div className="small text-secondary text-uppercase fw-bold">Ngày sinh</div>
                    {editing ? (
                      <Form.Control
                        name="birthday"
                        type="date"
                        value={draft.birthday}
                        onChange={handleDraft}
                        className="mt-1 bg-dark text-light border-secondary"
                        isInvalid={!!errors.birthday}
                      />
                    ) : (
                      <div className="fw-semibold">{toDateInputValue(model.birthday) || "—"}</div>
                    )}
                    {errors.birthday && (
                      <div className="text-danger small mt-1">{errors.birthday}</div>
                    )}
                  </div>
                </li>
                <li className="d-flex align-items-start gap-3 py-3 border-bottom border-secondary border-opacity-25">
                  <Shield size={20} className="text-info flex-shrink-0 mt-1" />
                  <div>
                    <div className="small text-secondary text-uppercase fw-bold">Vai trò</div>
                    <div className="fw-semibold">{role}</div>
                  </div>
                </li>
                <li className="d-flex align-items-start gap-3 py-3">
                  <Building2 size={20} className="text-info flex-shrink-0 mt-1" />
                  <div>
                    <div className="small text-secondary text-uppercase fw-bold">Rạp gán (cinemaId)</div>
                    <div className="fw-semibold">
                      {cinemaId != null ? `#${cinemaId}` : "— (Super Admin có thể chưa gán)"}
                    </div>
                  </div>
                </li>
              </ul>
            </>
          )}
        </Card.Body>
      </Card>

      {staffId && model && (
        <Card className="border-0 text-light" style={cardStyle}>
          <Card.Body className="p-4">
            <div className="d-flex align-items-center gap-2 mb-3">
              <Lock size={20} className="text-warning" />
              <span className="fw-bold">Đổi mật khẩu</span>
            </div>
            <Form.Group className="mb-3">
              <Form.Label className="small text-secondary">Mật khẩu hiện tại</Form.Label>
              <Form.Control
                type="password"
                name="current"
                value={pw.current}
                onChange={handlePw}
                className="bg-dark text-light border-secondary"
                autoComplete="current-password"
                isInvalid={!!pwErrors.current}
              />
              {pwErrors.current && (
                <Form.Control.Feedback type="invalid">{pwErrors.current}</Form.Control.Feedback>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small text-secondary">Mật khẩu mới (≥ 8 ký tự)</Form.Label>
              <Form.Control
                type="password"
                name="newPw"
                value={pw.newPw}
                onChange={handlePw}
                className="bg-dark text-light border-secondary"
                autoComplete="new-password"
                isInvalid={!!pwErrors.newPw}
              />
              {pwErrors.newPw && (
                <Form.Control.Feedback type="invalid">{pwErrors.newPw}</Form.Control.Feedback>
              )}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="small text-secondary">Xác nhận mật khẩu mới</Form.Label>
              <Form.Control
                type="password"
                name="confirm"
                value={pw.confirm}
                onChange={handlePw}
                className="bg-dark text-light border-secondary"
                autoComplete="new-password"
                isInvalid={!!pwErrors.confirm}
              />
              {pwErrors.confirm && (
                <Form.Control.Feedback type="invalid">{pwErrors.confirm}</Form.Control.Feedback>
              )}
            </Form.Group>
            <Button variant="warning" className="text-dark fw-semibold" onClick={savePassword} disabled={pwSaving}>
              {pwSaving ? "Đang xử lý…" : "Cập nhật mật khẩu"}
            </Button>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
