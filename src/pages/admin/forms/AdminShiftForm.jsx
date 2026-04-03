import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Form, Button, Row, Col, Card } from "react-bootstrap";
import { ArrowLeft, UserCheck, Calendar as CalendarIcon } from "lucide-react";
import { getAccessToken, getStoredStaff } from "../../../utils/authStorage";
import { SuperAdminCinemaContext } from "../../../components/layout/SuperAdminCinemaContext";
import { apiUrl } from "../../../utils/apiClient";
import { SHIFTS, STAFF } from "../../../constants/apiEndpoints";

export default function AdminShiftForm({ mode = "add" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = mode === "edit";

  const isSuperAdmin = location.pathname.startsWith("/super-admin");
  const prefix = isSuperAdmin ? "/super-admin" : "/admin";

  const staffSession = getStoredStaff();
  const superCtx = useContext(SuperAdminCinemaContext);
  const selectedCinemaId = isSuperAdmin ? superCtx?.selectedCinemaId ?? null : staffSession?.cinemaId ?? null;

  const [staffDtos, setStaffDtos] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const staffByRole = useMemo(
    () => ({
      "Bán vé": staffDtos.filter((s) => s.role === "Bán vé").map((s) => ({ id: s.id, name: s.name })),
      "Soát vé": staffDtos.filter((s) => s.role === "Soát vé").map((s) => ({ id: s.id, name: s.name })),
      "Phục vụ": staffDtos.filter((s) => s.role === "Phục vụ").map((s) => ({ id: s.id, name: s.name })),
    }),
    [staffDtos]
  );

  const shiftTimes = useMemo(
    () => ({
      "Ca 1": "08:00 - 13:00",
      "Ca 2": "13:00 - 18:00",
      "Ca 3": "18:00 - 23:00",
    }),
    []
  );

  const [formData, setFormData] = useState(() => {
    return {
      date: "",
      shiftType: "Ca 1",
      staff_banve: "",
      staff_soatve: "",
      staff_phucvu: "",
    };
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isSuperAdmin && !selectedCinemaId) {
      setError("Vui lòng chọn rạp trước khi phân ca.");
      return;
    }

    const requiredFields = [
      { key: "date", label: "Ngày trực" },
      { key: "shiftType", label: "Loại ca" },
      { key: "staff_banve", label: "Nhân viên Bán vé" },
      { key: "staff_soatve", label: "Nhân viên Soát vé" },
      { key: "staff_phucvu", label: "Nhân viên Phục vụ" },
    ];

    const missing = requiredFields.find((f) => !formData[f.key]);
    if (missing) {
      setError(`Vui lòng nhập ${missing.label}.`);
      return;
    }

    try {
      setSubmitting(true);
      const token = getAccessToken();
      const payload = {
        date: formData.date,
        shiftType: formData.shiftType,
        staffBanveId: Number(formData.staff_banve),
        staffSoatVeId: Number(formData.staff_soatve),
        staffPhucVuId: Number(formData.staff_phucvu),
      };

      const url = isEdit ? apiUrl(SHIFTS.BY_ID(id)) : apiUrl(SHIFTS.LIST);

      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        setError(json?.message || "Lưu ca làm thất bại");
        return;
      }

      navigate(`${prefix}/shifts`);
    } catch {
      setError("Không thể kết nối tới server");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingStaff(true);
      try {
        const token = getAccessToken();
        const cid = isSuperAdmin ? selectedCinemaId : staffSession?.cinemaId ?? null;
        const staffUrl = cid != null ? apiUrl(`${STAFF.LIST}?cinemaId=${cid}`) : apiUrl(STAFF.LIST);
        const res = await fetch(staffUrl, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json().catch(() => null);
        const data = json?.data ?? json;

        if (!mounted) return;
        if (!res.ok || !Array.isArray(data)) {
          setStaffDtos([]);
          return;
        }

        // BE đã lọc theo cinemaId; nếu gọi không query thì lọc tay như cũ.
        const filtered =
          cid == null
            ? data.filter(
                (s) =>
                  selectedCinemaId == null ||
                  s.cinemaId == null ||
                  String(s.cinemaId) === String(selectedCinemaId)
              )
            : data;

        setStaffDtos(
          filtered.map((s) => ({
            id: s.staffId,
            name: s.fullname ?? "",
            role: s.role ?? "",
            phone: s.phone ?? "",
            cinemaId: s.cinemaId ?? null,
          }))
        );
      } catch {
        if (!mounted) return;
        setStaffDtos([]);
      } finally {
        if (mounted) setLoadingStaff(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [selectedCinemaId, isSuperAdmin, staffSession?.cinemaId]);

  useEffect(() => {
    if (!isEdit || !id) return;

    let mounted = true;
    (async () => {
      setError("");
      try {
        const token = getAccessToken();
        const res = await fetch(apiUrl(SHIFTS.BY_ID(id)), {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const json = await res.json().catch(() => null);
        const data = json?.data ?? json;
        if (!mounted) return;

        if (!res.ok || !data) {
          setError(json?.message || "Không tải được ca làm");
          return;
        }

        setFormData((prev) => ({
          ...prev,
          date: data.date ? data.date.toString() : "",
          shiftType: data.shiftType ?? "Ca 1",
          staff_banve: data.staffBanveId != null ? String(data.staffBanveId) : "",
          staff_soatve: data.staffSoatVeId != null ? String(data.staffSoatVeId) : "",
          staff_phucvu: data.staffPhucVuId != null ? String(data.staffPhucVuId) : "",
        }));
      } catch {
        if (!mounted) return;
        setError("Không thể kết nối tới server");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id, isEdit]);

  return (
    <div className={`${isEdit ? "edit-shift-page" : "add-shift-page"} text-dark pb-5`}>
      <style>{`
        .shift-input {
          border-radius: 12px !important;
          border: 1.5px solid #eee !important;
          padding: 12px 15px !important;
          color: #000 !important;
        }
        .role-card {
          border-left: 4px solid #0d6efd;
          background: #f8faff;
          transition: all 0.3s ease;
        }
        .role-card:hover {
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
      `}</style>

      <div className="d-flex align-items-center gap-3 mb-4">
        <Button
          variant="light"
          className="rounded-circle p-2 shadow-sm"
          onClick={() => navigate(`${prefix}/shifts`)}
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h2 className="mb-0 fw-bold">
            {isEdit ? `Chỉnh sửa phân ca #${id}` : "Phân ca làm việc mới"}
          </h2>
          <p className="text-muted small mb-0">
            {isEdit ? "Cập nhật nhân sự cho các vị trí trong ca làm việc" : "Mỗi ca yêu cầu đủ 3 nhân viên cho 3 vị trí khác nhau"}
          </p>
        </div>
      </div>

      {error ? <div className="text-center text-danger fw-bold mb-3">{error}</div> : null}
      {isSuperAdmin && selectedCinemaId == null ? (
        <div className="text-center text-warning fw-bold mb-3">
          Vui lòng chọn rạp để phân ca.
        </div>
      ) : null}

      <Form onSubmit={handleSubmit}>
        <Row className="justify-content-center">
          <Col lg={10}>
            <Card className="border-0 shadow-sm p-4 rounded-4 mb-4">
              <div className="d-flex align-items-center gap-2 mb-4 text-primary">
                <CalendarIcon size={20} />
                <h5 className="fw-bold mb-0">Thông tin chung</h5>
              </div>

              <Row className="g-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">Ngày trực</Form.Label>
                    <Form.Control
                      type="date"
                      name="date"
                      className="shift-input"
                      value={formData.date}
                      onChange={handleInputChange}
                      required
                      disabled={loadingStaff || submitting || (isSuperAdmin && selectedCinemaId == null)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold text-muted text-uppercase">Chọn loại ca</Form.Label>
                    <Form.Select
                      name="shiftType"
                      className="shift-input"
                      value={formData.shiftType}
                      onChange={handleInputChange}
                      disabled={loadingStaff || submitting || (isSuperAdmin && selectedCinemaId == null)}
                    >
                      <option value="Ca 1">Ca 1 ({shiftTimes["Ca 1"]})</option>
                      <option value="Ca 2">Ca 2 ({shiftTimes["Ca 2"]})</option>
                      <option value="Ca 3">Ca 3 ({shiftTimes["Ca 3"]})</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card>

            <Card className="border-0 shadow-sm p-4 rounded-4">
              <div className="d-flex align-items-center gap-2 mb-4 text-primary">
                <UserCheck size={20} />
                <h5 className="fw-bold mb-0">
                  {isEdit ? "Điều chỉnh nhân sự" : `Bố trí nhân sự cho ${formData.shiftType}`}
                </h5>
              </div>

              <Row className="g-4">
                <Col md={4}>
                  <div className="p-3 rounded-3 role-card h-100">
                    <Form.Label className="fw-bold text-primary mb-2">{isEdit ? "1. Nhân viên Bán vé" : "1. Nhân viên Bán vé"}</Form.Label>
                    <Form.Select
                      name="staff_banve"
                      className="shift-input bg-white"
                      value={formData.staff_banve}
                      onChange={handleInputChange}
                      required
                      disabled={loadingStaff || submitting || (isSuperAdmin && selectedCinemaId == null)}
                    >
                      {isEdit ? null : <option value="">-- Chọn nhân viên --</option>}
                      {staffByRole["Bán vé"].map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 rounded-3 role-card h-100" style={{ borderLeftColor: "#6610f2" }}>
                    <Form.Label className="fw-bold mb-2" style={{ color: "#6610f2" }}>
                      {isEdit ? "2. Nhân viên Soát vé" : "2. Nhân viên Soát vé"}
                    </Form.Label>
                    <Form.Select
                      name="staff_soatve"
                      className="shift-input bg-white"
                      value={formData.staff_soatve}
                      onChange={handleInputChange}
                      required
                      disabled={loadingStaff || submitting || (isSuperAdmin && selectedCinemaId == null)}
                    >
                      {isEdit ? null : <option value="">-- Chọn nhân viên --</option>}
                      {staffByRole["Soát vé"].map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="p-3 rounded-3 role-card h-100" style={{ borderLeftColor: "#fd7e14" }}>
                    <Form.Label className="fw-bold mb-2" style={{ color: "#fd7e14" }}>
                      {isEdit ? "3. Nhân viên Phục vụ" : "3. Nhân viên Phục vụ"}
                    </Form.Label>
                    <Form.Select
                      name="staff_phucvu"
                      className="shift-input bg-white"
                      value={formData.staff_phucvu}
                      onChange={handleInputChange}
                      required
                      disabled={loadingStaff || submitting || (isSuperAdmin && selectedCinemaId == null)}
                    >
                      {isEdit ? null : <option value="">-- Chọn nhân viên --</option>}
                      {staffByRole["Phục vụ"].map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                </Col>
              </Row>

              <div className="mt-5 d-flex justify-content-end gap-3">
                <Button
                  variant="light"
                  className="px-4 fw-bold text-muted border-0"
                  onClick={() => navigate(`${prefix}/shifts`)}
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="px-5 py-2 fw-bold shadow-sm rounded-3"
                  disabled={submitting || loadingStaff || (isSuperAdmin && selectedCinemaId == null)}
                >
                  {submitting ? "Đang lưu..." : isEdit ? "Cập nhật ca trực" : "Lưu phân ca"}
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}

