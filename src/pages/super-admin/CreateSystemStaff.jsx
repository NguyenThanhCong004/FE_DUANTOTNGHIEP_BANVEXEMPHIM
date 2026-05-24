import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Form, Button, Row, Col, Card, Alert } from "react-bootstrap";
import { apiFetch } from "../../utils/apiClient";
import { STAFF, CINEMAS } from "../../constants/apiEndpoints";
import { useAdminToast } from "../../components/admin/AdminToast";
import { fileToDataUrl, IMAGE_FILE_ACCEPT } from "../../utils/mediaFiles";
import { codeToStaffStatus, staffStatusToCode } from "../../utils/statusFormat";
import { apiMessage, MESSAGES } from "../../utils/uiMessages";

const initialForm = {
  name: "",
  username: "",
  email: "",
  phone: "",
  birthDate: "",
  status: "Hoạt động",
  role: "STAFF",
  avatar: null,
  image: null,
  imagePreview: "https://via.placeholder.com/150",
  cinemaId: "",
};

const CreateSystemStaff = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editId = location.state?.editId;
  const { showToast, ToastComponent } = useAdminToast();

  const [staff, setStaff] = useState(initialForm);
  const [cinemas, setCinemas] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!editId);
  const originalDataRef = useRef(null);

  const backPath = "/super-admin/system-staff";

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch(CINEMAS.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        setCinemas(Array.isArray(list) ? list : []);
      } catch {
        setCinemas([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!editId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      setLoading(true);
      setErrors({});
      try {
        const res = await apiFetch(STAFF.BY_ID(editId));
        const json = await res.json().catch(() => null);
        const found = json?.data ?? json;
        if (!mounted) return;
        if (!res.ok || !found) {
          setErrors({ form: apiMessage(json, "Không tải được dữ liệu nhân sự") });
          setLoading(false);
          return;
        }
        const birth = found.birthday
          ? (typeof found.birthday === "string" ? found.birthday.slice(0, 10) : "")
          : "";
        const statusLabel = codeToStaffStatus(found.status);
        const next = {
          name: found.fullname ?? "",
          username: found.username ?? "",
          email: found.email ?? "",
          phone: found.phone ?? "",
          birthDate: birth,
          status: statusLabel,
          role: String(found.role || "STAFF").toUpperCase() === "ADMIN" ? "ADMIN" : "STAFF",
          avatar: found.avatar ?? null,
          image: null,
          imagePreview: found.avatar ?? "https://via.placeholder.com/150",
          cinemaId: found.cinemaId ?? "",
        };
        setStaff(next);
        originalDataRef.current = {
          fullname: String(next.name || "").trim(),
          username: String(next.username || "").trim(),
          email: String(next.email || "").trim(),
          phone: String(next.phone || "").trim(),
          birthday: next.birthDate || "",
          status: staffStatusToCode(next.status),
          avatar: next.imagePreview || "",
          cinemaId: next.cinemaId || null,
          role: next.role === "ADMIN" ? "ADMIN" : "STAFF",
        };
      } catch {
        if (mounted) setErrors({ form: MESSAGES.loadFailed });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [editId]);

  const validate = () => {
    const tempErrors = {};
    if (!staff.name.trim()) tempErrors.name = "Họ tên không được để trống";

    if (!staff.username?.trim()) {
      tempErrors.username = "Username không được để trống";
    } else if (staff.username.trim().length < 6 || staff.username.trim().length > 50) {
      tempErrors.username = "Tên đăng nhập phải từ 6 đến 50 ký tự";
    }

    const emailRegex = /^[a-z0-9._%+-]+@gmail\.com$/i;
    if (!staff.email) {
      tempErrors.email = "Email không được để trống";
    } else if (!emailRegex.test(staff.email)) {
      tempErrors.email = "Email phải đúng định dạng Gmail (vd: abc@gmail.com)";
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!staff.phone) {
      tempErrors.phone = "Số điện thoại không được để trống";
    } else if (!phoneRegex.test(staff.phone)) {
      tempErrors.phone = "Số điện thoại phải có 10 chữ số";
    }

    if (!staff.birthDate) {
      tempErrors.birthDate = "Vui lòng chọn ngày sinh";
    } else {
      const birthDate = new Date(staff.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        tempErrors.birthDate = "Nhân viên phải từ đủ 18 tuổi trở lên";
      }
    }

    if (!staff.cinemaId) {
      tempErrors.cinemaId = "Vui lòng chọn rạp chiếu";
    }

    const hasRealAvatar =
      staff.image instanceof File ||
      (staff.imagePreview && !String(staff.imagePreview).includes("via.placeholder.com"));
    if (!hasRealAvatar) {
      tempErrors.avatar = "Hình ảnh không được để trống";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setStaff((prev) => ({
      ...prev,
      avatar: previewUrl,
      image: file,
      imagePreview: previewUrl,
    }));
    if (errors.avatar) setErrors((prev) => ({ ...prev, avatar: "" }));
    if (errors.form) setErrors((prev) => ({ ...prev, form: "" }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStaff((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (editId && errors.form) setErrors((prev) => ({ ...prev, form: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});
    try {
      let avatarUrl = staff.imagePreview;
      if (staff.image instanceof File) {
        avatarUrl = await fileToDataUrl(staff.image);
      }
      if (!avatarUrl || !String(avatarUrl).trim()) {
        setErrors({ avatar: "Ảnh đại diện không được để trống" });
        setSubmitting(false);
        return;
      }

      const data = {
        fullname: staff.name.trim(),
        username: staff.username.trim(),
        email: staff.email.trim(),
        phone: staff.phone.trim(),
        birthday: staff.birthDate,
        status: staffStatusToCode(staff.status),
        avatar: avatarUrl,
        cinemaId: staff.cinemaId ? parseInt(staff.cinemaId) : null,
        role: staff.role === "ADMIN" ? "ADMIN" : "STAFF",
      };

      if (editId && originalDataRef.current) {
        const original = originalDataRef.current;
        const isUnchanged =
          data.fullname === original.fullname &&
          data.username === original.username &&
          data.email === original.email &&
          data.phone === original.phone &&
          data.birthday === original.birthday &&
          data.status === original.status &&
          data.avatar === original.avatar &&
          data.cinemaId === original.cinemaId &&
          data.role === original.role;
        if (isUnchanged) {
          setSubmitting(false);
          showToast(MESSAGES.noChanges, "warning");
          return;
        }
      }

      const url = editId ? STAFF.BY_ID(editId) : STAFF.LIST;
      const res = await apiFetch(url, {
        method: editId ? "PUT" : "POST",
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = apiMessage(json, "Lưu nhân sự thất bại");
        if (message.includes("Email đã tồn tại")) {
          setErrors({ email: message });
        } else if (message.includes("Username đã tồn tại") || message.includes("Tên đăng nhập đã tồn tại")) {
          setErrors({ username: message });
        } else if (message.includes("Số điện thoại đã tồn tại")) {
          setErrors({ phone: message });
        } else {
          setErrors({ form: message });
        }
        return;
      }
      navigate(backPath, {
        state: {
          message: editId
            ? "Cập nhật nhân sự thành công"
            : "Đã tạo nhân sự. Mật khẩu tạm đã được gửi tới email đã nhập",
          type: "success",
        },
      });
    } catch {
      setErrors({ form: MESSAGES.networkError });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="add-staff-page text-dark p-3">
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
          }}
        >
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={editId ? "edit-staff-page" : "add-staff-page"}>
      <style>{`
        .black-input {
          border: 1px solid rgba(0,0,0,0.1) !important;
          color: #000 !important;
          font-weight: 500 !important;
          background-color: #fff !important;
          border-radius: 8px !important;
          min-height: 42px !important; /* Đảm bảo đủ chiều cao cho ô date */
        }
        input[type="date"].black-input {
          line-height: 1.5 !important;
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }
        .black-input:focus {
          box-shadow: 0 0 0 0.2rem rgba(0, 0, 0, 0.05) !important;
          border-color: #000 !important;
        }
        .black-input.is-invalid {
          border-color: #dc3545 !important;
        }
        .image-upload-wrapper {
          width: 200px;
          height: 200px;
          border: 2px dashed #ddd;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          position: relative;
          transition: all 0.3s ease;
          background: #f8f9fa;
        }
        .image-upload-wrapper:hover {
          border-color: #0d6efd;
          background: rgba(13, 110, 253, 0.05);
        }
        .image-upload-wrapper img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>

      <div className="d-flex align-items-center justify-content-between gap-3 mb-4 flex-wrap">
        <h2 className="mb-0 fw-bold text-dark">
          {editId ? `Cập nhật nhân sự #${editId}` : "Thêm nhân sự mới"}
        </h2>
        <Button variant="outline-primary" className="text-nowrap" onClick={() => navigate(backPath)}>
          Danh sách
        </Button>
      </div>

      {errors.form ? (
        <Alert variant="warning" className="border-0 shadow-sm mb-4 fw-bold" style={{ borderRadius: "12px" }}>
          <i className="fas fa-exclamation-triangle me-2" />
          {errors.form}
        </Alert>
      ) : null}

      <div className="admin-form-page-wrap admin-form-compact w-100">
      <Card className="border-0 shadow-sm p-4" style={{ borderRadius: "20px" }}>
        <Card.Body>
          <Form onSubmit={handleSubmit} noValidate>
            <Row>
              <Col lg={4} className="d-flex flex-column align-items-center mb-4 mb-lg-0">
                <Form.Label className="fw-bold mb-3 text-dark">Ảnh đại diện</Form.Label>
                <label htmlFor="sysStaffImageUpload" className="image-upload-wrapper shadow-sm mb-3">
                  {staff.imagePreview ? (
                    <img src={staff.imagePreview} alt="Preview" />
                  ) : (
                    <div className="text-muted text-center">
                      <i className="fas fa-camera fs-1 mb-2" />
                      <small className="d-block">Tải ảnh lên</small>
                    </div>
                  )}
                </label>
                <input
                  type="file"
                  id="sysStaffImageUpload"
                  className="d-none"
                  accept={IMAGE_FILE_ACCEPT}
                  onChange={handleImageChange}
                  disabled={submitting}
                />
                <p className="text-muted small text-center px-4" style={{ marginBottom: 0 }}>
                  Nên chọn ảnh vuông để hiển thị đẹp hơn.
                </p>
                {errors.avatar ? (
                  <div className="text-danger small fw-bold mt-2 text-center">{errors.avatar}</div>
                ) : null}
              </Col>

              <Col lg={8}>
                <Row className="g-4">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Họ và tên nhân viên</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        className={`black-input py-2 ${errors.name ? "is-invalid" : ""}`}
                        placeholder="Nhập đầy đủ họ và tên"
                        value={staff.name}
                        onChange={handleInputChange}
                        disabled={submitting}
                      />
                      {errors.name ? <div className="text-danger small fw-bold mt-1">{errors.name}</div> : null}
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Thuộc rạp chiếu</Form.Label>
                      <Form.Select
                        name="cinemaId"
                        className={`black-input py-2 text-dark ${errors.cinemaId ? "is-invalid" : ""}`}
                        value={staff.cinemaId}
                        onChange={handleInputChange}
                        disabled={submitting}
                      >
                        <option value="">-- Chọn rạp chiếu --</option>
                        {cinemas.map((c) => (
                          <option key={c.cinemaId || c.id} value={c.cinemaId || c.id}>
                            {c.name}
                          </option>
                        ))}
                      </Form.Select>
                      {errors.cinemaId ? <div className="text-danger small fw-bold mt-1">{errors.cinemaId}</div> : null}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Username</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        className={`black-input py-2 ${errors.username ? "is-invalid" : ""}`}
                        placeholder="Nhập username"
                        value={staff.username}
                        onChange={handleInputChange}
                        disabled={!!editId}
                      />
                      {errors.username ? (
                        <div className="text-danger small fw-bold mt-1">{errors.username}</div>
                      ) : null}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Địa chỉ Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        className={`black-input py-2 ${errors.email ? "is-invalid" : ""}`}
                        placeholder="example@gmail.com"
                        value={staff.email}
                        onChange={handleInputChange}
                        disabled={submitting}
                      />
                      {errors.email ? <div className="text-danger small fw-bold mt-1">{errors.email}</div> : null}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Số điện thoại</Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        className={`black-input py-2 ${errors.phone ? "is-invalid" : ""}`}
                        placeholder="09xx xxx xxx"
                        value={staff.phone}
                        onChange={handleInputChange}
                        disabled={submitting}
                      />
                      {errors.phone ? <div className="text-danger small fw-bold mt-1">{errors.phone}</div> : null}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Ngày sinh</Form.Label>
                      <Form.Control
                        type="date"
                        name="birthDate"
                        className={`black-input py-2 ${errors.birthDate ? "is-invalid" : ""}`}
                        value={staff.birthDate}
                        onChange={handleInputChange}
                        disabled={submitting}
                      />
                      {errors.birthDate ? (
                        <div className="text-danger small fw-bold mt-1">{errors.birthDate}</div>
                      ) : null}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Vai trò</Form.Label>
                      <Form.Select
                        name="role"
                        className="black-input py-2 text-dark"
                        value={staff.role}
                        onChange={handleInputChange}
                        disabled={submitting}
                      >
                        <option value="STAFF">Nhân viên (STAFF)</option>
                        <option value="ADMIN">Quản lý rạp (ADMIN)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Trạng thái</Form.Label>
                      <Form.Select
                        name="status"
                        className="black-input py-2 text-dark"
                        value={staff.status}
                        onChange={handleInputChange}
                        disabled={submitting}
                      >
                        <option value="Hoạt động">Đang làm việc</option>
                        <option value="Khóa">Tạm nghỉ / Khóa</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end mt-4">
                  <Button variant="primary" type="submit" className="px-5 fw-bold shadow-sm border-0" disabled={submitting}>
                    {submitting ? "Đang lưu..." : editId ? "Cập nhật" : "Thêm nhân sự"}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
      </div>
      
      {submitting && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
          style={{ backgroundColor: "rgba(17, 24, 39, 0.45)", zIndex: 1200 }}
        >
          <div className="bg-white rounded-4 shadow-lg px-4 py-3 d-flex align-items-center gap-3">
            <span className="spinner-border text-primary" role="status" aria-hidden="true"></span>
            <div className="fw-semibold text-dark">Đang cập nhật dữ liệu, vui lòng chờ...</div>
          </div>
        </div>
      )}
    </div>
      <ToastComponent />
    </>
  );
};

export default CreateSystemStaff;
