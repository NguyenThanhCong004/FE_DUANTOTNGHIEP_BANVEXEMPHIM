import React, { useEffect, useRef, useState } from "react";
import { STRONG_PASSWORD_REGEX, PASSWORD_RULE_MESSAGE } from "../../../utils/passwordValidation";

import { useLocation, useNavigate, useParams } from "react-router-dom";

import { Form, Button, Row, Col, Card, Alert } from "react-bootstrap";



import { apiFetch } from "../../../utils/apiClient";

import { STAFF } from "../../../constants/apiEndpoints";

import { getStoredStaff } from "../../../utils/authStorage";

import { useSuperAdminCinema } from "../../../components/layout/useSuperAdminCinema";

import AdminPanelPage from "../../../components/admin/AdminPanelPage";
import AdminFormListBack from "../../../components/admin/AdminFormListBack";
import { useAdminToast } from "../../../components/admin/AdminToast";

import { staffStatusToCode } from "../../../utils/statusFormat";
import { apiMessage, MESSAGES } from "../../../utils/uiMessages";

function buildDefaultAvatarUrl(staff) {
  const label = staff.name?.trim() || staff.email?.trim() || "Staff";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=1f2937&color=fff&size=256`;
}



export default function AdminStaffForm({ mode = "add", cinemaId }) {

  const navigate = useNavigate();

  const { id } = useParams();

  const location = useLocation();

  const { selectedCinemaId } = useSuperAdminCinema();

  const { showToast, ToastComponent } = useAdminToast();



  const isEdit = mode === "edit";

  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  /** Khi thêm mới nhân viên (cả Admin và Super Admin): không nhập mật khẩu — BE sinh và gửi email */
  const autoPasswordByEmail = !isEdit;
  const backPath = isSuperAdmin ? "/super-admin/staff" : "/admin/staff";

  const effectiveCinemaId = isSuperAdmin ? selectedCinemaId : (getStoredStaff()?.cinemaId ?? cinemaId ?? null);



  const initialStaffState = {

    name: "",

    password: "",

    email: "",

    phone: "",

    birthDate: "",

    status: "1",
    role: "STAFF",

    cinemaId: null,

  };



  const [staff, setStaff] = useState(initialStaffState);

  const [initialStaff, setInitialStaff] = useState(null);
  const originalDataRef = useRef(null);

  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(isEdit);



  const validate = () => {

    const tempErrors = {};



    if (!staff.name.trim()) tempErrors.name = "Họ tên không được để trống";



    if (!autoPasswordByEmail && !isEdit && !staff.password?.trim()) {
      tempErrors.password = "Mật khẩu không được để trống khi tạo mới";
    } else if (staff.password?.trim() && !STRONG_PASSWORD_REGEX.test(staff.password.trim())) {
      tempErrors.password = PASSWORD_RULE_MESSAGE;
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

      

      // Nếu chưa đến tháng sinh hoặc cùng tháng nhưng chưa đến ngày sinh thì giảm 1 tuổi

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {

        age--;

      }

      

      if (age < 18) {

        tempErrors.birthDate = "Nhân viên phải từ đủ 18 tuổi trở lên";

      }

    }



    if (isEdit && originalDataRef.current) {

      const current = {
        fullname: String(staff.name || "").trim(),
        email: String(staff.email || "").trim(),
        phone: String(staff.phone || "").trim(),
        birthday: staff.birthDate || "",
        status: Number(staff.status),
        cinemaId: staff.cinemaId ? Number(staff.cinemaId) : null,
      };
      const isUnchanged = Object.entries(current).every(
        ([key, value]) => value === originalDataRef.current[key]
      ) && !staff.password?.trim();

      if (isUnchanged) tempErrors.form = MESSAGES.noChanges;

    }



    setErrors(tempErrors);

    return Object.keys(tempErrors).length === 0;

  };



  const handleInputChange = (e) => {

    const { name, value } = e.target;

    setStaff((prev) => ({ ...prev, [name]: value }));



    // Clear error cho field khi user thay đổi giá trị

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

          ? "Vui lòng chọn rạp trên header trước khi thêm nhân viên."

          : "Không xác định được rạp (cinemaId).",

      });

      return;

    }

    try {

      const submitCinemaId = isEdit ? (staff.cinemaId ?? null) : effectiveCinemaId;

      const data = {
        fullname: staff.name.trim(),
        email: staff.email.trim(),
        phone: staff.phone.trim(),
        birthday: staff.birthDate,
        status: Number(staff.status),
        cinemaId: submitCinemaId ?? null,
        /**
         * Lấy role hiện tại nếu đang sửa, mặc định STAFF nếu thêm mới.
         * Super Admin tạo quản trị viên rạp nên dùng trang Quản trị hệ thống (nếu có)
         * hoặc trang này sẽ giữ nguyên role ADMIN của họ.
         */
        role: isEdit ? (initialStaff?.role ?? staff.role ?? "STAFF") : "STAFF",
      };
      if (!isEdit) {
        data.avatar = buildDefaultAvatarUrl(staff);
      }



      if (staff.password?.trim()) {

        data.password = staff.password.trim();

      }



      if (!autoPasswordByEmail && !isEdit && !staff.password?.trim()) {

        setErrors({ password: "Mật khẩu không được để trống khi tạo mới" });

        return;

      }

      let payload = data;

      if (isEdit && originalDataRef.current) {
        const original = originalDataRef.current;
        const changedData = {};

        if (data.fullname !== original.fullname) changedData.fullname = data.fullname;
        if (data.email !== original.email) changedData.email = data.email;
        if (data.phone !== original.phone) changedData.phone = data.phone;
        if (data.birthday !== original.birthday) changedData.birthday = data.birthday;
        if (data.status !== original.status) changedData.status = data.status;
        if (data.cinemaId !== original.cinemaId) changedData.cinemaId = data.cinemaId;
        if (staff.password?.trim()) changedData.password = staff.password.trim();

        if (Object.keys(changedData).length === 0) {
          setErrors({ form: MESSAGES.noChanges });
          return;
        }

        payload = changedData;
      }

      const url = isEdit ? STAFF.BY_ID(id) : STAFF.LIST;

      const res = await apiFetch(url, {

        method: isEdit ? "PUT" : "POST",

        body: JSON.stringify(payload),

      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {

        // Xử lý lỗi trùng từ BE thành validation error

        const message = apiMessage(json, "Lưu nhân viên thất bại");

        if (message.includes("Email đã tồn tại")) {

          setErrors({ email: message });

        } else if (message.includes("Số điện thoại đã tồn tại")) {

          setErrors({ phone: message });

        } else {

          setErrors({ form: message });

          showToast(message, 'danger');

        }

        return;

      }

      

      const successMessage = autoPasswordByEmail && !isEdit 

        ? "Đã tạo nhân viên. Mật khẩu tạm đã được gửi tới email đã nhập"

        : (isEdit ? "Cập nhật nhân viên thành công" : "Tạo nhân viên thành công");

      

      showToast(successMessage, 'success');

      

      // Chuyển trang sau khi hiển thị thông báo

      setTimeout(() => {

        navigate(backPath);

      }, autoPasswordByEmail && !isEdit ? 2000 : 1500);

    } catch {

      setErrors({ form: MESSAGES.networkError });

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

          setErrors({ form: apiMessage(json, "Không tải được dữ liệu nhân viên") });

          setLoading(false);

          return;

        }

        const birth = found.birthday

          ? (typeof found.birthday === "string" ? found.birthday.slice(0, 10) : "")

          : "";

        const next = {

          name: found.fullname ?? found.name ?? "",

          password: "",

          email: found.email ?? "",

          phone: found.phone ?? "",

          birthDate: birth,

          status: String(staffStatusToCode(found.status)),
          role: String(found.role || "STAFF").replace(/^ROLE_/i, "").toUpperCase(),

          cinemaId: found.cinemaId ?? null,

        };

        setStaff(next);

        setInitialStaff(next);
        originalDataRef.current = {
          fullname: String(next.name || "").trim(),
          email: String(next.email || "").trim(),
          phone: String(next.phone || "").trim(),
          birthday: next.birthDate || "",
          status: Number(next.status),
          cinemaId: next.cinemaId ? Number(next.cinemaId) : null,
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

  }, [id, isEdit]);



  if (loading) {

    return (

      <AdminPanelPage
        title={isEdit ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
        headerRight={<AdminFormListBack to={backPath} />}
      >

        <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>

          Đang tải dữ liệu...

        </div>

      </AdminPanelPage>

    );

  }



  return (

    <AdminPanelPage
      title={isEdit ? `Chỉnh Sửa Nhân Viên #${id}` : "Thêm Nhân Viên Mới"}
      headerRight={<AdminFormListBack to={backPath} />}
    >

      <ToastComponent />

      <style>{`

        .black-input {

          border: 1px solid rgba(0,0,0,0.1) !important;

          color: var(--admin-text) !important;

          font-weight: 500 !important;

          background-color: var(--admin-bg-card) !important;

          border-radius: 8px !important;

        }

        .black-input:focus {

          box-shadow: 0 0 0 0.2rem rgba(0, 0, 0, 0.05) !important;

          border-color: #000 !important;

        }

        .black-input.is-invalid {

          border-color: #dc3545 !important;

        }

        .pw-wrap {

          position: relative;

        }

        .pw-eye {

          position: absolute;

          right: 10px;

          top: 50%;

          transform: translateY(-50%);

          border: none;

          background: transparent;

          color: #6b7280;

        }

      `}</style>



      {errors.form ? (

        <Alert variant="warning" className="border-0 shadow-sm mb-4 fw-bold" style={{ borderRadius: "12px" }}>

          {errors.form}

        </Alert>

      ) : null}



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

                      />

                      {errors.name ? <div className="text-danger small fw-bold mt-1">{errors.name}</div> : null}

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

                        <option value="1">Đang làm việc</option>

                        <option value="0">Tạm nghỉ / Khóa</option>

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

    </AdminPanelPage>

  );

}



