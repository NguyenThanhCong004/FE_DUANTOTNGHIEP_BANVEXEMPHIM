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
    password: "",
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
          password: "",
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
    
    if (!form.username?.trim()) e.username = "Tên đăng nhập không được để trống";
    
    if (!editId && !form.password?.trim()) e.password = "Mật khẩu không được để trống khi tạo mới";
    else if (form.password && form.password.length < 6) e.password = "Mật khẩu phải có ít nhất 6 ký tự";
    
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
      const username = form.username.trim();
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
      
      // Chỉ thêm password nếu có giá trị (tạo mới hoặc đổi mật khẩu khi sửa)
      if (form.password?.trim()) {
        body.password = form.password.trim();
      }
      
      const res = await apiFetch(editId ? STAFF.BY_ID(editId) : STAFF.LIST, {
        method: editId ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok) {
        // Xử lý lỗi trùng từ BE thành validation error
        const message = j?.message || "Lưu thất bại";
        if (message.includes("Email đã tồn tại")) {
          setErrors({ email: message });
        } else if (message.includes("Username đã tồn tại") || message.includes("Tên đăng nhập đã tồn tại")) {
          setErrors({ username: message });
        } else if (message.includes("Số điện thoại đã tồn tại")) {
          setErrors({ phone: message });
        } else {
          alert(message);
        }
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
    <div className="create-employee min-vh-100">
      <div className="container-fluid py-4">
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8 col-xl-6">
            <div className="form-container bg-white text-dark">
              <div className="text-center mb-4">
                <h2 className="fw-bold mb-2">{editId ? "Sửa quản trị viên rạp" : "Thêm quản trị viên rạp"}</h2>
                <p className="text-muted small mb-0">
                  Vai trò cố định: <strong>ADMIN</strong>. Khi tạo mới, mật khẩu mặc định do hệ thống gán.
                </p>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-12 col-md-4 text-center mb-4">
                    <label className="form-label d-block">Ảnh đại diện</label>
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
                    {errors.avatar && <div className="error-message text-center mt-2">{errors.avatar}</div>}
                  </div>

                  <div className="col-12 col-md-8">
                    <div className="form-group-custom mb-3">
                      <label className="form-label">Tên đăng nhập</label>
                      <input
                        className="custom-input"
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        disabled={!!editId}
                      />
                      {errors.username && <div className="error-message">{errors.username}</div>}
                    </div>

                    <div className="form-group-custom mb-3">
                      <label className="form-label">Mật khẩu</label>
                      <input
                        className="custom-input"
                        type="password"
                        value={form.password || ""}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder={editId ? "Để trống nếu không đổi" : "Mật khẩu mặc định sẽ được gán"}
                      />
                      {errors.password && <div className="error-message">{errors.password}</div>}
                    </div>

                    <div className="form-group-custom mb-3">
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

                    <div className="form-group-custom mb-3">
                      <label className="form-label">Họ và tên</label>
                      <input
                        className="custom-input"
                        value={form.fullname}
                        onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                      />
                      {errors.fullname && <div className="error-message">{errors.fullname}</div>}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12 col-md-6">
                    <div className="form-group-custom mb-3">
                      <label className="form-label">Số điện thoại</label>
                      <input
                        className="custom-input"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                      {errors.phone && <div className="error-message">{errors.phone}</div>}
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="form-group-custom mb-3">
                      <label className="form-label">Ngày sinh</label>
                      <input
                        className="custom-input"
                        type="date"
                        value={form.birthday}
                        onChange={(e) => setForm({ ...form, birthday: e.target.value })}
                      />
                      {errors.birthday && <div className="error-message">{errors.birthday}</div>}
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12 col-md-6">
                    <div className="form-group-custom mb-3">
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
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="form-group-custom mb-3">
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
                  </div>
                </div>

                <div className="d-flex gap-2 justify-content-end mt-4">
                  <button type="button" className="btn btn-outline-secondary px-4" onClick={() => navigate(-1)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn-save px-4" disabled={saving}>
                    {saving ? "Đang lưu…" : "Lưu"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .form-container { 
          border-radius: 16px; 
          padding: 24px; 
          box-shadow: 0 4px 24px rgba(0,0,0,0.08); 
        }
        .form-group-custom { }
        .form-label { 
          display: block; 
          font-weight: 600; 
          font-size: 0.8rem; 
          margin-bottom: 6px; 
          text-transform: uppercase; 
        }
        .custom-input { 
          width: 100%; 
          height: 44px; 
          padding: 8px 12px; 
          border: 2px solid #111; 
          border-radius: 8px; 
          font-size: 14px;
        }
        .custom-input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .error-message { 
          color: #dc3545; 
          font-size: 0.8rem; 
          margin-top: 4px; 
        }
        .avatar-preview { 
          width: 100px; 
          height: 100px; 
          border: 2px solid #111; 
          border-radius: 12px; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          overflow: hidden; 
          background: #f8f9fa; 
          font-size: 2rem;
        }
        .btn-save { 
          background: #111; 
          color: #fff; 
          border: none; 
          padding: 10px 24px; 
          border-radius: 8px; 
          font-weight: 700; 
        }
        .btn-save:hover {
          background: #333;
        }
        
        @media (max-width: 768px) {
          .form-container {
            padding: 16px;
            margin: 0 8px;
          }
          .avatar-preview {
            width: 80px;
            height: 80px;
          }
          .custom-input {
            height: 40px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}
