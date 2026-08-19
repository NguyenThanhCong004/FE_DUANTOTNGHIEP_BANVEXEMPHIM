import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Form, Button, Row, Col, Card, Alert } from "react-bootstrap";
import { apiFetch } from "../../utils/apiClient";
import { STAFF, CINEMAS } from "../../constants/apiEndpoints";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import AdminFormListBack from "../../components/admin/AdminFormListBack";
import { useAdminToast } from "../../components/admin/AdminToast";
import { staffStatusToCode } from "../../utils/statusFormat";
import { apiMessage, MESSAGES } from "../../utils/uiMessages";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  birthDate: "",
  status: "1",
  role: "STAFF",
  cinemaId: "",
};

function buildDefaultAvatarUrl(staff) {
  const label = staff.name?.trim() || staff.email?.trim() || "Staff";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=1f2937&color=fff&size=256`;
}

const CreateSystemStaff = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: routeEditId } = useParams();
  const editId = routeEditId ?? location.state?.editId;
  const isEdit = Boolean(editId);
  const { showToast, ToastComponent } = useAdminToast();

  const [staff, setStaff] = useState(initialForm);
  const [cinemas, setCinemas] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);
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
        const next = {
          name: found.fullname ?? "",
          email: found.email ?? "",
          phone: found.phone ?? "",
          birthDate: birth,
          status: String(staffStatusToCode(found.status)),
          role: String(found.role || "STAFF").toUpperCase() === "ADMIN" ? "ADMIN" : "STAFF",
          cinemaId: found.cinemaId ?? "",
        };
        setStaff(next);
        originalDataRef.current = {
          fullname: String(next.name || "").trim(),
          email: String(next.email || "").trim(),
          phone: String(next.phone || "").trim(),
          birthday: next.birthDate || "",
          status: Number(next.status),
          cinemaId: next.cinemaId ? Number(next.cinemaId) : null,
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!staff.email) {
      tempErrors.email = "Email không được để trống";
    } else if (!emailRegex.test(staff.email)) {
      tempErrors.email = "Email không đúng định dạng (vd: abc@gmail.com, abc@moviezone.com)";
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

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
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
      const data = {
        fullname: staff.name.trim(),
        email: staff.email.trim(),
        phone: staff.phone.trim(),
        birthday: staff.birthDate,
        status: Number(staff.status),
        cinemaId: staff.cinemaId ? parseInt(staff.cinemaId) : null,
        role: staff.role === "ADMIN" ? "ADMIN" : "STAFF",
      };
      if (!editId) {
        data.avatar = buildDefaultAvatarUrl(staff);
      }

      let payload = data;

      if (editId && originalDataRef.current) {
        const original = originalDataRef.current;
        const changedData = {};

        if (data.fullname !== original.fullname) changedData.fullname = data.fullname;
        if (data.email !== original.email) changedData.email = data.email;
        if (data.phone !== original.phone) changedData.phone = data.phone;
        if (data.birthday !== original.birthday) changedData.birthday = data.birthday;
        if (data.status !== original.status) changedData.status = data.status;
        if (data.cinemaId !== original.cinemaId) changedData.cinemaId = data.cinemaId;
        if (data.role !== original.role) changedData.role = data.role;

        if ((changedData.status != null || changedData.role != null) && changedData.cinemaId == null) {
          changedData.cinemaId = data.cinemaId;
        }

        if (Object.keys(changedData).length === 0) {
          setSubmitting(false);
          showToast(MESSAGES.noChanges, "warning");
          return;
        }

        payload = changedData;
      }

      const url = editId ? STAFF.BY_ID(editId) : STAFF.LIST;
      const res = await apiFetch(url, {
        method: editId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const message = apiMessage(json, "Lưu nhân sự thất bại");
        if (message.includes("Email đã tồn tại")) {
          setErrors({ email: message });
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
      <AdminPanelPage
        title={editId ? "Cập nhật nhân sự" : "Thêm nhân sự mới"}
        headerRight={<AdminFormListBack to={backPath} />}
      >
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
      </AdminPanelPage>
    );
  }

  return (
    <AdminPanelPage
      title={editId ? `Cập nhật nhân sự #${editId}` : "Thêm nhân sự mới"}
      headerRight={<AdminFormListBack to={backPath} />}
    >
      <ToastComponent />
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
      `}</style>

      {errors.form ? (
        <Alert variant="warning" className="border-0 shadow-sm mb-4 fw-bold" style={{ borderRadius: "12px" }}>
          {errors.form}
        </Alert>
      ) : null}

      <div className="admin-form-page-wrap admin-form-compact w-100">
      <Card className="border-0 shadow-sm p-4" style={{ borderRadius: "20px" }}>
        <Card.Body>
          <Form onSubmit={handleSubmit} noValidate>
            <Row>
              <Col lg={12}>
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
                        <option value="1">Đang làm việc</option>
                        <option value="0">Tạm nghỉ / Khóa</option>
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
    </AdminPanelPage>
  );
};

export default CreateSystemStaff;
