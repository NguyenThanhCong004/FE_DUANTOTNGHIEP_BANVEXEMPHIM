import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, Form, Button, Row, Col } from "react-bootstrap";

import { getStoredStaff } from "../../../utils/authStorage";
import { apiFetch } from "../../../utils/apiClient";
import { ROOMS, ROOM_TYPES } from "../../../constants/apiEndpoints";
import { useSuperAdminCinema } from "../../../components/layout/useSuperAdminCinema";
import AdminPanelPage from "../../../components/admin/AdminPanelPage";
import AdminFormListBack from "../../../components/admin/AdminFormListBack";
import { isActiveStatus } from "../../../utils/statusFormat";
import { apiMessage, MESSAGES } from "../../../utils/uiMessages";

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
  const [submitting, setSubmitting] = useState(false);
  const [roomTypes, setRoomTypes] = useState([]);
  const originalRoomRef = useRef(null);
  const [room, setRoom] = useState(() => {
    if (isEdit) {
      return { name: "", status: "", roomTypeId: "" };
    }
    return { name: "", status: "1", roomTypeId: "" };
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await apiFetch(ROOM_TYPES.LIST);
        const json = await res.json().catch(() => null);
        if (mounted) setRoomTypes(Array.isArray(json?.data) ? json.data : []);
      } catch {
        if (mounted) setRoomTypes([]);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
          setErrors({ name: apiMessage(json, "Không tải được phòng") });
          return;
        }
        const nextRoom = {
          name: data.name ?? "",
          status: isActiveStatus(data.status) ? "1" : "0",
          cinemaId: data.cinemaId ?? null,
          roomTypeId: data.roomTypeId != null ? String(data.roomTypeId) : "",
        };
        setRoom(nextRoom);
        originalRoomRef.current = {
          name: String(nextRoom.name ?? "").trim(),
          status: Number(nextRoom.status),
          cinemaId: nextRoom.cinemaId != null ? Number(nextRoom.cinemaId) : null,
          roomTypeId: data.roomTypeId != null ? Number(data.roomTypeId) : null,
        };
      } catch {
        if (mounted) setErrors({ name: MESSAGES.loadFailed });
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
    if (!room.status) newErrors.status = "Vui lòng chọn trạng thái phòng";
    if (!isEdit && !room.roomTypeId) newErrors.roomTypeId = "Vui lòng chọn loại phòng chiếu";
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    if (!isEdit && cinemaId == null) {
      setErrors({ name: isSuperAdmin ? "Vui lòng chọn rạp trước khi tạo phòng." : "Tài khoản chưa có cinemaId." });
      return;
    }

    const roomCinemaId = isEdit ? (room.cinemaId ?? cinemaId ?? null) : cinemaId;
    const statusInt = Number(room.status) === 1 ? 1 : 0;
    const roomTypeIdInt = room.roomTypeId ? Number(room.roomTypeId) : null;
    const body = {
      name: room.name.trim(),
      status: statusInt,
      cinemaId: roomCinemaId,
      roomTypeId: roomTypeIdInt,
    };
    let payload = body;
    if (isEdit && originalRoomRef.current) {
      const original = originalRoomRef.current;
      const changedData = {};
      const nextCinemaId = roomCinemaId != null ? Number(roomCinemaId) : null;

      if (body.name !== original.name) changedData.name = body.name;
      if (body.status !== original.status) changedData.status = body.status;
      if (nextCinemaId !== original.cinemaId) changedData.cinemaId = nextCinemaId;
      if (roomTypeIdInt !== original.roomTypeId) changedData.roomTypeId = roomTypeIdInt;

      if (Object.keys(changedData).length === 0) {
        setErrors({ form: MESSAGES.noChanges });
        return;
      }

      payload = changedData;
    }
    try {
      setSubmitting(true);
      const url = isEdit ? ROOMS.BY_ID(id) : ROOMS.LIST;
      const res = await apiFetch(url, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setErrors({ name: apiMessage(json, "Lưu phòng thất bại") });
        return;
      }
      const saved = json?.data ?? json;
      const nextId = saved?.id ?? (isEdit ? Number(id) : null);
      navigate(`${prefix}/seats`, {
        state: {
          roomInfo: {
            id: nextId,
            name: room.name,
            status: statusInt,
            cinemaId: roomCinemaId,
            roomTypeId: saved?.roomTypeId ?? null,
            roomTypeName: saved?.roomTypeName ?? null,
            standardSeatCount: saved?.standardSeatCount ?? null,
            vipSeatCount: saved?.vipSeatCount ?? null,
            coupleSeatCount: saved?.coupleSeatCount ?? null,
          },
        },
      });
    } catch {
      setErrors({ name: MESSAGES.networkError });
    } finally {
      setSubmitting(false);
    }
  };

  const activeRadioId = isEdit ? "edit-active-radio" : "active-radio";
  const maintenanceRadioId = isEdit ? "edit-maintenance-radio" : "maintenance-radio";
  const roomStatusName = isEdit ? "roomStatusEdit" : "roomStatus";

  if (loading) {
    return (
      <AdminPanelPage title={isEdit ? "Chỉnh sửa phòng chiếu" : "Thêm phòng chiếu mới"}>
        <div className="py-5 d-flex justify-content-center fw-bold">
          Đang tải phòng...
        </div>
      </AdminPanelPage>
    );
  }

  return (
    <AdminPanelPage
      title={isEdit ? `Chỉnh sửa: ${room.name}` : "Thêm phòng chiếu mới"}
      headerRight={<AdminFormListBack to={`${prefix}/rooms`} />}
    >
      <style>{`
        .custom-input {
          border-radius: 12px;
          padding: 12px 15px;
          border: 1px solid var(--admin-border);
          background: var(--admin-bg-subtle);
          color: var(--admin-text) !important;
        }
        .custom-input:focus {
          color: var(--admin-text) !important;
          background: var(--admin-bg-card);
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
          background: var(--admin-bg-subtle);
          border-radius: 12px;
          border: 1px solid var(--admin-border);
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

      <Row className="justify-content-center">
        <Col lg={8}>
          <Card className="card-form overflow-hidden">
            <div className={`p-1 ${isEdit ? "bg-warning" : "bg-primary"}`} />
            <Card.Body className="p-4 p-md-5">
              <Form onSubmit={handleSubmit} noValidate>
                {errors.form ? (
                  <div className="alert alert-warning border-0 py-2 small mb-4">
                    {errors.form}
                  </div>
                ) : null}
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
                          if (errors.name || errors.form) setErrors((prev) => ({ ...prev, name: null, form: null }));
                        }}
                      />
                      {errors.name ? (
                        <div className="text-danger small mt-1 d-flex align-items-center gap-1"> {errors.name}
                        </div>
                      ) : null}
                    </Form.Group>
                  </Col>

                  <Col md={12}>
                    <Form.Group>
                      <Form.Label>Loại phòng chiếu {!isEdit && <span className="text-danger">*</span>}</Form.Label>
                      <Form.Select
                        className={`custom-input ${errors.roomTypeId ? "is-invalid" : ""}`}
                        value={room.roomTypeId}
                        onChange={(e) => {
                          setRoom((prev) => ({ ...prev, roomTypeId: e.target.value }));
                          if (errors.roomTypeId || errors.form) setErrors((prev) => ({ ...prev, roomTypeId: null, form: null }));
                        }}
                      >
                        <option value="">-- Chọn loại phòng --</option>
                        {roomTypes.map((rt) => (
                          <option key={rt.roomTypeId} value={rt.roomTypeId}>
                            {rt.name} ({rt.standardSeatCount} thường · {rt.vipSeatCount} VIP · {rt.coupleSeatCount} đôi)
                          </option>
                        ))}
                      </Form.Select>
                      {errors.roomTypeId && (
                        <div className="text-danger small mt-1">{errors.roomTypeId}</div>
                      )}
                      {room.roomTypeId && (() => {
                        const rt = roomTypes.find((x) => String(x.roomTypeId) === String(room.roomTypeId));
                        return rt ? (
                          <div className="mt-2 p-2 rounded-2 bg-light border small text-muted">
                            Yêu cầu khi setup ghế: <strong>{rt.standardSeatCount}</strong> ghế thường ·{" "}
                            <strong>{rt.vipSeatCount}</strong> ghế VIP ·{" "}
                            <strong>{rt.coupleSeatCount}</strong> ghế đôi
                            (tổng <strong>{rt.standardSeatCount + rt.vipSeatCount + rt.coupleSeatCount}</strong> ghế)
                          </div>
                        ) : null;
                      })()}
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
                            value="1"
                            checked={String(room.status) === "1"}
                            onChange={(e) => {
                              setRoom((prev) => ({ ...prev, status: e.target.value }));
                              if (errors.form) setErrors((prev) => ({ ...prev, form: null }));
                            }}
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
                            value="0"
                            checked={String(room.status) === "0"}
                            onChange={(e) => {
                              setRoom((prev) => ({ ...prev, status: e.target.value }));
                              if (errors.form) setErrors((prev) => ({ ...prev, form: null }));
                            }}
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
                        disabled={submitting}
                        onClick={() => navigate(`${prefix}/rooms`)}
                      > Hủy bỏ
                      </Button>
                      <Button
                        type="submit"
                        variant={isEdit ? "warning" : "primary"}
                        disabled={submitting}
                        className={`px-4 py-2 rounded-3 fw-bold shadow-sm d-flex align-items-center ${
                          isEdit ? "text-dark" : ""
                        }`}
                      > {submitting ? "Đang lưu..." : isEdit ? "Cập nhật thay đổi" : "Lưu phòng chiếu"}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </AdminPanelPage>
  );
}

