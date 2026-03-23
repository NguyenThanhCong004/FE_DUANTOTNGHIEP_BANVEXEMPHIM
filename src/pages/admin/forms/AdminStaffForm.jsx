import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Form, Button, Row, Col, Card, Alert } from "react-bootstrap";

import { apiFetch } from "../../../utils/apiClient";
import { STAFF } from "../../../constants/apiEndpoints";
import { getStoredStaff } from "../../../utils/authStorage";
import { useSuperAdminCinema } from "../../../components/layout/useSuperAdminCinema";

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function AdminStaffForm({ mode = "add", cinemaId }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const { selectedCinemaId } = useSuperAdminCinema();

  const isEdit = mode === "edit";
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const backPath = isSuperAdmin ? "/super-admin/staff" : "/admin/staff";
  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : (getStoredStaff()?.cinemaId ?? cinemaId ?? null);

  const initialStaffState = {
    name: "",
    username: "",
    email: "",
    phone: "",
    birthDate: "",
    status: "Hoạt động",
    avatar: null,
    cinemaId: null,
    image: null,
    imagePreview: "https://via.placeholder.com/150",
  };

  const [staff, setStaff] = useState(initialStaffState);
  const [initialStaff, setInitialStaff] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);

  const validate = () => {
    const tempErrors = {};

    if (!staff.name.trim()) tempErrors.name = "Họ tên không được để trống";

    if (!staff.username) {
      tempErrors.username = "Username không được để trống";
    } else if (!staff.username.trim()) {
      tempErrors.username = "Username không được để trống";
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

    if (!staff.birthDate) tempErrors.birthDate = "Vui lòng chọn ngày sinh";

    if (!staff.avatar) tempErrors.avatar = "Hình ảnh không được để trống";

    if (isEdit && initialStaff) {
      const isUnchanged = JSON.stringify(staff) === JSON.stringify(initialStaff);
      if (isUnchanged) tempErrors.form = "Bạn chưa thay đổi thông tin nào!";
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

    if (errors.avatar) {
      setErrors((prev) => ({ ...prev, avatar: "" }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStaff((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (isEdit && errors.form) {
      setErrors((prev) => ({ ...prev, form: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (!isEdit && effectiveCinemaId == null) {
      setErrors({
        form: isSuperAdmin
          ? "Vui lòng chọn rạp (sidebar) trước khi thêm nhân viên."
          : "Không xác định được rạp (cinemaId).",
      });
      return;
    }
    try {
      let avatarUrl = staff.imagePreview;
      if (staff.image instanceof File) {
        avatarUrl = await fileToDataUrl(staff.image);
      }
      if (!avatarUrl || !String(avatarUrl).trim()) {
        setErrors({ avatar: "Ảnh đại diện không được để trống" });
        return;
      }
      const data = {
        fullname: staff.name.trim(),
        username: staff.username.trim(),
        password: staff.password,
        email: staff.email.trim(),
        phone: staff.phone.trim(),
        birthday: staff.birthDate,
        status: staff.status === "Hoạt động" ? 1 : 0,
        avatar: avatarUrl,
        cinemaId: effectiveCinemaId ?? staff.cinemaId ?? null,
        /** Mặc định nhân viên sàn — Super Admin tạo quản trị viên rạp dùng trang Quản trị viên rạp. */
        role: "STAFF",
      };
      const body = isEdit ? data : { ...data, password: staff.password };
      const url = isEdit ? STAFF.BY_ID(id) : STAFF.LIST;
      const res = await apiFetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setErrors({ form: json?.message || "Lưu nhân viên thất bại" });
        return;
      }
      navigate(backPath);
    } catch {
      setErrors({ form: "Không thể kết nối tới server" });
    }
  };

  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      setInitialStaff(null);
      return;
    }
    let mounted = true;
    (async () => {
      setLoading(true);
      setErrors({});
      try {
        const res = await apiFetch(STAFF.BY_ID(id));
        const json = await res.json().catch(() => null);
        const found = json?.data ?? json;
        if (!mounted) return;
        if (!res.ok || !found) {
          setErrors({ form: json?.message || "Không tải được dữ liệu nhân viên" });
          setLoading(false);
          return;
        }
        const birth = found.birthday
          ? (typeof found.birthday === "string" ? found.birthday.slice(0, 10) : "")
          : "";
        const statusLabel = found.status === 0 ? "Khóa" : "Hoạt động";
        const next = {
          name: found.fullname ?? found.name ?? "",
          username: found.username ?? "",
          email: found.email ?? "",
          phone: found.phone ?? "",
          birthDate: birth,
          status: statusLabel,
          avatar: found.avatar ?? null,
          cinemaId: found.cinemaId ?? null,
          image: null,
          imagePreview: found.avatar ?? "https://via.placeholder.com/150",
        };
        setStaff(next);
        setInitialStaff(next);
      } catch {
        if (mounted) setErrors({ form: "Lỗi tải dữ liệu nhân viên" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

  if (loading) {
    return (
      <div className="add-staff-page text-dark">
        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
    <div className={`${isEdit ? "edit-staff-page" : "add-staff-page"}`}>
      <style>{`
        .black-input {
          border: 1px solid rgba(0,0,0,0.1) !important;
          color: #000 !important;
          font-weight: 500 !important;
          background-color: #fff !important;
          border-radius: 8px !important;
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

      <div className="d-flex align-items-center gap-3 mb-4">
        <Button
          variant="link"
          className="p-0 text-dark"
          onClick={() => navigate(backPath)}
        >
          <i className="fas fa-arrow-left fs-4"></i>
        </Button>
        <h2 className="mb-0 fw-bold text-dark">
          {isEdit ? `Chỉnh Sửa Nhân Viên #${id}` : "Thêm Nhân Viên Mới"}
        </h2>
      </div>

      {errors.form ? (
        <Alert variant="warning" className="border-0 shadow-sm mb-4 fw-bold" style={{ borderRadius: "12px" }}>
          <i className="fas fa-exclamation-triangle me-2" />
          {errors.form}
        </Alert>
      ) : null}

      <Card className="border-0 shadow-sm p-4" style={{ borderRadius: "20px" }}>
        <Card.Body>
          <Form onSubmit={handleSubmit} noValidate>
            <Row>
              <Col lg={4} className="d-flex flex-column align-items-center mb-4 mb-lg-0">
                <Form.Label className="fw-bold mb-3 text-dark">Ảnh đại diện</Form.Label>
                <label htmlFor="imageUpload" className="image-upload-wrapper shadow-sm mb-3">
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
                  id="imageUpload"
                  className="d-none"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                <p className="text-muted small text-center px-4" style={{ marginBottom: 0 }}>
                  Nên chọn ảnh vuông, dung lượng dưới 2MB.
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
                      />
                      {errors.name ? <div className="text-danger small fw-bold mt-1">{errors.name}</div> : null}
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
                      />
                      {errors.username ? <div className="text-danger small fw-bold mt-1">{errors.username}</div> : null}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Địa chỉ Email</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        className={`black-input py-2 ${errors.email ? "is-invalid" : ""}`}
                        placeholder="example@cinema.com"
                        value={staff.email}
                        onChange={handleInputChange}
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
                      />
                      {errors.birthDate ? <div className="text-danger small fw-bold mt-1">{errors.birthDate}</div> : null}
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
                      >
                        <option value="Hoạt động">Đang làm việc</option>
                        <option value="Khóa">Tạm nghỉ / Khóa</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-3 mt-5">
                  <Button
                    variant="light"
                    className="px-4 fw-bold text-secondary"
                    onClick={() => navigate(backPath)}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    className="px-5 fw-bold shadow-sm border-0"
                  >
                    {isEdit ? "Cập nhật" : "Thêm nhân viên"}
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}

