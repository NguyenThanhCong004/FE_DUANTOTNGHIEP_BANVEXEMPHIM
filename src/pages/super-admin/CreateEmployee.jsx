import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiFetch } from "../../utils/apiClient";
import { STAFF, CINEMAS } from "../../constants/apiEndpoints";
import { useSuperAdminCinema } from "../../components/layout/useSuperAdminCinema";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function toDateInput(birthday) {
  if (!birthday) return "";
  if (typeof birthday === "string") return birthday.slice(0, 10);
  if (Array.isArray(birthday) && birthday.length >= 3) {
    const [y, m, d] = birthday;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return "";
}

const GMAIL = /^[a-z0-9._%+-]+@gmail\.com$/i;

/**
 * Tạo / sửa quản trị viên rạp (role ADMIN). Mật khẩu mới: BE gán mặc định khi tạo (vd: 12345678).
 */
export default function CreateEmployee() {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = location.state?.editId ?? null;
  const { selectedCinemaId } = useSuperAdminCinema();

  const [cinemas, setCinemas] = useState([]);
  const [form, setForm] = useState({
    username: "",
    email: "",
    fullname: "",
    phone: "",
    birthday: "",
    cinemaId: "",
    status: "Active",
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!editId);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await apiFetch(CINEMAS.LIST);
        const j = await res.json().catch(() => null);
        if (!m) return;
        setCinemas(Array.isArray(j?.data) ? j.data : []);
      } catch {
        if (m) setCinemas([]);
      }
    })();
    return () => {
      m = false;
    };
  }, []);

  /* Tạo mới: đồng bộ rạp từ header */
  useEffect(() => {
    if (editId) return;
    if (selectedCinemaId != null) {
      setForm((f) => ({ ...f, cinemaId: String(selectedCinemaId) }));
    }
  }, [selectedCinemaId, editId]);

  useEffect(() => {
    if (!editId) return;
    let m = true;
    (async () => {
      setPageLoading(true);
      try {
        const res = await apiFetch(STAFF.BY_ID(editId));
        const j = await res.json().catch(() => null);
        const s = j?.data;
        if (!m || !res.ok || !s) return;
        setForm({
          username: s.username || "",
          email: s.email || "",
          fullname: s.fullname || "",
          phone: s.phone || "",
          birthday: toDateInput(s.birthday),
          cinemaId: s.cinemaId != null ? String(s.cinemaId) : "",
          status: s.status === 0 ? "Inactive" : "Active",
        });
        if (s.avatar) setPreview(s.avatar);
      } finally {
        if (m) setPageLoading(false);
      }
    })();
    return () => {
      m = false;
    };
  }, [editId]);

  const validate = () => {
    const e = {};
    if (!form.fullname?.trim()) e.fullname = "Họ tên không được để trống";
    const em = form.email?.trim() || "";
    if (!em) e.email = "Email không được để trống";
    else if (!GMAIL.test(em)) e.email = "Email phải là Gmail";
    if (editId) {
      if (!form.username?.trim()) e.username = "Username không được để trống";
    }
    const ph = form.phone?.replace(/\s/g, "") || "";
    if (!ph) e.phone = "Số điện thoại không được để trống";
    else if (!/^\d{10}$/.test(ph)) e.phone = "10 chữ số";
    if (!form.birthday) e.birthday = "Chọn ngày sinh";
    if (!form.cinemaId) e.cinemaId = "Chọn rạp";
    const av = image || preview;
    if (!av) e.avatar = "Tải ảnh đại diện";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      let avatarUrl = preview;
      if (image) avatarUrl = await fileToDataUrl(image);
      const username = editId ? form.username.trim() : form.email.trim();
      const body = {
        fullname: form.fullname.trim(),
        username,
        email: form.email.trim(),
        phone: form.phone.replace(/\s/g, ""),
        birthday: form.birthday,
        status: form.status === "Active" ? 1 : 0,
        avatar: String(avatarUrl).trim(),
        role: "ADMIN",
        cinemaId: Number(form.cinemaId),
      };
      const res = await apiFetch(editId ? STAFF.BY_ID(editId) : STAFF.LIST, {
        method: editId ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        alert(j?.message || "Lưu thất bại");
        return;
      }
      navigate("/super-admin/employees");
    } catch {
      alert("Không kết nối được máy chủ");
    } finally {
      setSaving(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="p-5 text-center text-secondary">
        <div className="spinner-border" role="status" />
        <p className="mt-2 mb-0">Đang tải…</p>
      </div>
    );
  }

  if (!editId && selectedCinemaId == null) {
    return (
      <div className="p-5">
        <div className="alert alert-warning border-0 shadow-sm">
          <strong>Chưa chọn rạp trên header.</strong> Thêm quản trị viên rạp gắn với{" "}
          <code>cinemaId</code> — vui lòng chọn rạp ở dropdown trên thanh header (góc phải), sau đó quay lại
          trang này.
        </div>
        <button type="button" className="btn btn-outline-secondary" onClick={() => navigate("/super-admin/employees")}>
          Về danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="create-employee p-4">
      <div className="form-container bg-white text-dark">
        <h2 className="fw-bold mb-4">{editId ? "Sửa quản trị viên rạp" : "Thêm quản trị viên rạp"}</h2>
        <p className="text-muted small mb-4">
          Vai trò cố định: <strong>ADMIN</strong>. Khi tạo mới, mật khẩu mặc định do hệ thống gán (đổi qua hồ sơ sau khi đăng nhập).
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group-custom text-center mb-4">
            <label className="form-label">Ảnh đại diện</label>
            <div
              className="avatar-preview mx-auto"
              style={{ cursor: "pointer" }}
              onClick={() => document.getElementById("avt")?.click()}
            >
              {preview ? (
                <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span className="text-muted">+</span>
              )}
            </div>
            <input
              id="avt"
              type="file"
              accept="image/*"
              className="d-none"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setImage(f);
                  setPreview(URL.createObjectURL(f));
                  setErrors((x) => ({ ...x, avatar: "" }));
                }
              }}
            />
            {errors.avatar && <div className="error-message">{errors.avatar}</div>}
          </div>

          {editId ? (
            <div className="form-group-custom">
              <label className="form-label">Tên đăng nhập</label>
              <input
                className="custom-input"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
              {errors.username && <div className="error-message">{errors.username}</div>}
            </div>
          ) : null}

          <div className="form-group-custom">
            <label className="form-label">Email (Gmail)</label>
            <input
              className="custom-input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={!!editId}
            />
            {errors.email && <div className="error-message">{errors.email}</div>}
          </div>

          <div className="form-group-custom">
            <label className="form-label">Họ và tên</label>
            <input
              className="custom-input"
              value={form.fullname}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
            />
            {errors.fullname && <div className="error-message">{errors.fullname}</div>}
          </div>

          <div className="form-group-custom">
            <label className="form-label">Số điện thoại</label>
            <input
              className="custom-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            {errors.phone && <div className="error-message">{errors.phone}</div>}
          </div>

          <div className="form-group-custom">
            <label className="form-label">Ngày sinh</label>
            <input
              className="custom-input"
              type="date"
              value={form.birthday}
              onChange={(e) => setForm({ ...form, birthday: e.target.value })}
            />
            {errors.birthday && <div className="error-message">{errors.birthday}</div>}
          </div>

          <div className="form-group-custom">
            <label className="form-label">Rạp phụ trách</label>
            <select
              className="custom-input"
              value={form.cinemaId}
              onChange={(e) => setForm({ ...form, cinemaId: e.target.value })}
            >
              <option value="">— Chọn rạp —</option>
              {cinemas.map((c) => (
                <option key={c.cinemaId} value={String(c.cinemaId)}>
                  {c.name ?? `Rạp #${c.cinemaId}`}
                </option>
              ))}
            </select>
            {errors.cinemaId && <div className="error-message">{errors.cinemaId}</div>}
          </div>

          <div className="form-group-custom">
            <label className="form-label">Trạng thái</label>
            <select
              className="custom-input"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="Active">Hoạt động</option>
              <option value="Inactive">Khóa</option>
            </select>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button type="button" className="btn btn-outline-secondary px-4" onClick={() => navigate(-1)}>
              Hủy
            </button>
            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu"}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .form-container { max-width: 640px; margin: 0 auto; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .form-group-custom { margin-bottom: 1.25rem; }
        .form-label { display: block; font-weight: 600; font-size: 0.8rem; margin-bottom: 6px; text-transform: uppercase; }
        .custom-input { width: 100%; height: 48px; padding: 10px 16px; border: 2px solid #111; border-radius: 10px; }
        .error-message { color: #c00; font-size: 0.8rem; margin-top: 4px; }
        .avatar-preview { width: 120px; height: 120px; border: 2px solid #111; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #f8f9fa; }
        .btn-save { background: #111; color: #fff; border: none; padding: 12px 32px; border-radius: 10px; font-weight: 700; }
      `}</style>
    </div>
  );
}
