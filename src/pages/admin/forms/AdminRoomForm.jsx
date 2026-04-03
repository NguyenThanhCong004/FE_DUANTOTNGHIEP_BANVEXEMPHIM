import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, Form, Button, Row, Col, Breadcrumb } from "react-bootstrap";
import { ArrowLeft, Save, X, AlertCircle } from "lucide-react";
import { getStoredStaff } from "../../../utils/authStorage";
import { apiFetch } from "../../../utils/apiClient";
import { ROOMS } from "../../../constants/apiEndpoints";
import { useSuperAdminCinema } from "../../../components/layout/useSuperAdminCinema";

export default function AdminRoomForm({ mode = "add" }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";

  const staff = getStoredStaff();
  const { selectedCinemaId } = useSuperAdminCinema();
  const cinemaId = isSuperAdmin ? selectedCinemaId : staff?.cinemaId ?? null;

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [room, setRoom] = useState(() => {
    if (isEdit) {
      return { name: "", status: "" };
    }
    return { name: "", status: "Hoạt động" };
  });

  useEffect(() => {
    if (!isEdit) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await apiFetch(ROOMS.BY_ID(id));
        const json = await res.json().catch(() => null);
        const data = json?.data ?? json;
        if (!mounted) return;
        if (!res.ok || !data) {
          setErrors({ name: json?.message || "Không tải được phòng" });
          return;
        }
        const statusLabel = data.status === 1 || data.status === "active" ? "Hoạt động" : "Bảo trì";
        setRoom({
          name: data.name ?? "",
          status: statusLabel,
        });
      } catch {
        if (mounted) setErrors({ name: "Lỗi tải phòng" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

  const validate = () => {
    const newErrors = {};
    if (!room.name.trim()) newErrors.name = "Tên phòng chiếu không được để trống";

    if (!room.status) {
      newErrors.status = "Vui lòng chọn trạng thái phòng";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (cinemaId == null) {
      setErrors({ name: isSuperAdmin ? "Vui lòng chọn rạp trước khi tạo phòng." : "Tài khoản chưa có cinemaId." });
      return;
    }

    const statusInt = room.status === "Hoạt động" ? 1 : 0;
    const body = {
      name: room.name.trim(),
      status: statusInt,
      cinemaId,
    };
    try {
      const url = isEdit ? ROOMS.BY_ID(id) : ROOMS.LIST;
      const res = await apiFetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setErrors({ name: json?.message || "Lưu phòng thất bại" });
        return;
      }
      const saved = json?.data ?? json;
      const nextId = saved?.id ?? (isEdit ? Number(id) : null);
      navigate(`${prefix}/seats`, {
        state: {
          roomInfo: {
            id: nextId,
            name: room.name,
            status: room.status,
            cinemaId,
          },
        },
      });
    } catch {
      setErrors({ name: "Không thể kết nối server" });
    }
  };

  const activeRadioId = isEdit ? "edit-active-radio" : "active-radio";
  const maintenanceRadioId = isEdit ? "edit-maintenance-radio" : "maintenance-radio";
  const roomStatusName = isEdit ? "roomStatusEdit" : "roomStatus";

  if (loading) {
    return (
      <div className="text-dark py-5 d-flex justify-content-center fw-bold">
        Đang tải phòng...
      </div>
    );
  }

  return (
    <div className={`${isEdit ? "edit-room-page" : "add-room-page"} text-dark`}>
      <style>{`
        .custom-input {
          border-radius: 12px;
          padding: 12px 15px;
          border: 1px solid #eee;
          background: #fcfcfc;
          color: #000 !important;
        }
        .custom-input:focus {
          color: #000 !important;
          background: #fff;
          border-color: #0d6efd;
          box-shadow: 0 0 0 4px rgba(13, 110, 253, 0.05);
        }
        .custom-input.is-invalid {
          border-color: #dc3545;
          background-color: #fff8f8;
        }
        .form-label {
          font-weight: 700;
          font-size: 0.85rem;
          color: #495057;
          text-transform: uppercase;
        }
        .card-form {
          border-radius: 20px;
          border: none;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .status-selection {
          display: flex;
          gap: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #eee;
        }
        .radio-item {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .radio-item input[type="radio"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        .radio-item label {
          cursor: pointer;
          margin-bottom: 0;
          font-weight: 600;
        }
      `}</style>

      <div className="mb-4">
        <Breadcrumb className="small mb-2">
          <Breadcrumb.Item onClick={() => navigate(`${prefix}/rooms`)} style={{ cursor: "pointer" }}>
            Quản lý phòng chiếu
          </Breadcrumb.Item>
          <Breadcrumb.Item active>
            {isEdit ? "Chỉnh sửa phòng chiếu" : "Thêm phòng chiếu mới"}
          </Breadcrumb.Item>
        </Breadcrumb>

        <div className="d-flex align-items-center gap-3">
          <Button
            variant="light"
            className="rounded-circle p-2 shadow-sm border"
            onClick={() => navigate(`${prefix}/rooms`)}
          >
            <ArrowLeft size={20} />
          </Button>
          <h2 className="fw-bold mb-0">
            {isEdit ? `Chỉnh sửa: ${room.name}` : "Thêm phòng chiếu mới"}
          </h2>
        </div>
      </div>

      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="card-form overflow-hidden">
            <div className={`p-1 ${isEdit ? "bg-warning" : "bg-primary"}`} />
            <Card.Body className="p-4 p-md-5">
              <Form onSubmit={handleSubmit} noValidate>
                <Row className="g-4">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Tên phòng chiếu</Form.Label>
                      <Form.Control
                        type="text"
                        className={`custom-input ${errors.name ? "is-invalid" : ""}`}
                        value={room.name}
                        onChange={(e) => {
                          setRoom((prev) => ({ ...prev, name: e.target.value }));
                          if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
                        }}
                      />
                      {errors.name ? (
                        <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                          <AlertCircle size={14} /> {errors.name}
                        </div>
                      ) : null}
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Trạng thái hoạt động</Form.Label>
                      <div className="status-selection">
                        <div className="radio-item">
                          <input
                            type="radio"
                            id={activeRadioId}
                            name={roomStatusName}
                            value="Hoạt động"
                            checked={room.status === "Hoạt động"}
                            onChange={(e) => setRoom((prev) => ({ ...prev, status: e.target.value }))}
                          />
                          <label htmlFor={activeRadioId} className="text-success">
                            Đang hoạt động
                          </label>
                        </div>

                        <div className="radio-item">
                          <input
                            type="radio"
                            id={maintenanceRadioId}
                            name={roomStatusName}
                            value="Bảo trì"
                            checked={room.status === "Bảo trì"}
                            onChange={(e) => setRoom((prev) => ({ ...prev, status: e.target.value }))}
                          />
                          <label htmlFor={maintenanceRadioId} className="text-danger">
                            Đang bảo trì
                          </label>
                        </div>
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={12} className="pt-3">
                    <hr className="my-4 opacity-50" />
                    <div className="d-flex justify-content-end gap-3">
                      <Button
                        variant="light"
                        className="px-4 py-2 rounded-3 fw-bold border"
                      onClick={() => navigate(`${prefix}/rooms`)}
                      >
                        <X size={18} className="me-2" /> Hủy bỏ
                      </Button>
                      <Button
                        type="submit"
                        variant={isEdit ? "warning" : "primary"}
                        className={`px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center ${
                          isEdit ? "text-dark" : ""
                        }`}
                      >
                        <Save size={18} className="me-2" /> {isEdit ? "Cập nhật thay đổi" : "Lưu phòng chiếu"}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

