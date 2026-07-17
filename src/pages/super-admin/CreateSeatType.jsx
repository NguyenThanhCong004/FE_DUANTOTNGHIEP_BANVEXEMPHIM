import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Alert, Form } from "react-bootstrap";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import AdminFormListBack from "../../components/admin/AdminFormListBack";
import { useAdminToast } from "../../components/admin/AdminToast";
import { apiFetch } from "../../utils/apiClient";
import { SEAT_TYPES } from "../../constants/apiEndpoints";
import {
  SEAT_COLOR_PALETTE,
  hexColorForSeatTypeName,
  isCoupleTypeName,
  normalizeHex,
} from "../../utils/seatTypeColors";
import { apiMessage, MESSAGES, resultToastType } from "../../utils/uiMessages";

const initialForm = () => ({
  name: "",
  surcharge: "",
  coupleSeat: false,
  color: "",
});

const CreateSeatType = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const { showToast, ToastComponent } = useAdminToast();
  const editId = editData?.id ?? null;

  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [allSeatTypes, setAllSeatTypes] = useState([]);

  useEffect(() => {
    let m = true;
    (async () => {
      try {
        const res = await apiFetch(SEAT_TYPES.LIST);
        const json = await res.json().catch(() => null);
        const list = json?.data ?? json ?? [];
        const arr = Array.isArray(list) ? list : [];
        if (m) {
          setAllSeatTypes(
            arr.map((t) => ({
              id: t.seatTypeId ?? t.id,
              name: t.name ?? "",
              color: t.color ?? "",
            }))
          );
        }
      } catch {
        if (m) setAllSeatTypes([]);
      }
    })();
    return () => {
      m = false;
    };
  }, []);

  useEffect(() => {
    if (editData) {
      const sur = editData.surcharge ?? editData.price;
      setFormData({
        name: editData.name || "",
        surcharge: sur != null && sur !== "" ? String(sur) : "0",
        coupleSeat: Boolean(editData.coupleSeat),
        color: normalizeHex(editData.color) || "",
      });
    } else {
      setFormData(initialForm());
    }
  }, [editData]);

  const nameSuggestsCouple = isCoupleTypeName(formData.name);

  const isColorTakenByOther = useMemo(
    () => (hex) => {
      const n = normalizeHex(hex);
      if (!n) return false;
      return allSeatTypes.some((t) => t.id !== editId && normalizeHex(t.color) === n);
    },
    [allSeatTypes, editId]
  );

  const visiblePalette = useMemo(() => {
    const selected = normalizeHex(formData.color);
    const inPalette = (h) => SEAT_COLOR_PALETTE.some((p) => normalizeHex(p.hex) === normalizeHex(h));
    const base = SEAT_COLOR_PALETTE.filter(({ hex }) => {
      const n = normalizeHex(hex);
      if (!n) return false;
      if (selected && n === selected) return true;
      return !isColorTakenByOther(hex);
    });
    if (selected && !inPalette(selected) && !isColorTakenByOther(selected)) {
      return [...base, { n: "—", hex: selected, custom: true }];
    }
    return base;
  }, [formData.color, isColorTakenByOther]);

  const previewColor = normalizeHex(formData.color) || (formData.name.trim() ? hexColorForSeatTypeName(formData.name.trim()) : "#dee2e6");

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Tên loại ghế không được để trống";

    const raw = String(formData.surcharge ?? "").replace(/\s/g, "");
    if (raw === "") {
      newErrors.surcharge = "Nhập phụ thu (có thể là 0)";
    } else {
      const sur = Number(raw);
      if (!Number.isFinite(sur) || sur < 0) {
        newErrors.surcharge = "Phụ thu phải là số ≥ 0";
      }
    }

    const col = normalizeHex(formData.color);
    if (!col) {
      newErrors.color = "Chọn một màu trong bảng màu (số 1–16)";
    } else if (isColorTakenByOther(col)) {
      newErrors.color = "Màu này đã được loại ghế khác dùng — chọn màu khác";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const selectColor = (hex) => {
    const n = normalizeHex(hex);
    setFormData((prev) => ({ ...prev, color: n }));
    if (errors.color) setErrors((prev) => ({ ...prev, color: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setServerError("");
    const sur = Number(String(formData.surcharge).replace(/\s/g, ""));
    const body = {
      name: formData.name.trim(),
      surcharge: sur,
      coupleSeat: formData.coupleSeat,
      color: normalizeHex(formData.color),
    };
    const tid = editData?.id;
    if (tid) {
      const originalBody = {
        name: String(editData.name ?? "").trim(),
        surcharge: Number(editData.surcharge ?? editData.price ?? 0),
        coupleSeat: Boolean(editData.coupleSeat),
        color: normalizeHex(editData.color),
      };
      if (JSON.stringify(body) === JSON.stringify(originalBody)) {
        showToast(MESSAGES.noChanges, "warning");
        setSubmitting(false);
        return;
      }
    }
    const url = tid ? SEAT_TYPES.BY_ID(tid) : SEAT_TYPES.LIST;
    try {
      const res = await apiFetch(url, {
        method: tid ? "PUT" : "POST",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const message = apiMessage(json, tid ? "Cập nhật loại ghế thành công" : "Thêm loại ghế thành công");
        navigate("/super-admin/seat-types", {
          state: {
            message,
            type: resultToastType(message),
          },
        });
      } else {
        const json = await res.json().catch(() => null);
        setServerError(apiMessage(json, "Lưu loại ghế thất bại"));
      }
    } catch {
      setServerError(MESSAGES.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  const hiddenByOthersCount = useMemo(
    () =>
      SEAT_COLOR_PALETTE.filter(({ hex }) => {
        const n = normalizeHex(hex);
        const sel = normalizeHex(formData.color);
        return n && isColorTakenByOther(hex) && n !== sel;
      }).length,
    [formData.color, isColorTakenByOther]
  );

  return (
    <AdminPanelPage
      icon={editData ? "bi-chair-fill" : "bi-chair"}
      title={editData ? "Cập nhật loại ghế" : "Thêm loại ghế mới"}
      description="Chọn màu từ bảng có số (mỗi màu chỉ một loại ghế). Màu lưu trên máy chủ và hiển thị đồng bộ trên sơ đồ phòng / đặt vé."
      headerRight={<AdminFormListBack to="/super-admin/seat-types" />}
    >
      <ToastComponent />
      <div className="admin-form-page-wrap admin-form-compact">
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h4 className="mb-0">
            Thông tin loại ghế
          </h4>
          <div className="d-flex align-items-center gap-2 small text-muted">
            <span>Xem trước</span>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: previewColor,
                border: "1px solid rgba(0,0,0,0.12)",
              }}
              title="Màu đã chọn"
            />
          </div>
        </div>
        <div className="admin-card-body p-4">
          {serverError ? (
            <Alert variant="danger" className="py-2 small mb-4">
              {serverError}
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} noValidate>
            <Form.Group className="mb-4">
              <Form.Label className="admin-form-label fw-semibold">Bảng màu (chọn 1)</Form.Label>
              <div
                className="d-flex flex-wrap gap-2 p-3 rounded-3"
                style={{ background: "#f8f9fa", border: "1px solid #e9ecef" }}
              >
                {visiblePalette.map(({ n, hex, custom }) => {
                  const nHex = normalizeHex(hex);
                  const active = normalizeHex(formData.color) === nHex;
                  return (
                    <button
                      key={custom ? `custom-${nHex}` : n}
                      type="button"
                      title={custom ? "Màu đang lưu (không trong bảng 1–16)" : `Màu ${n}`}
                      onClick={() => selectColor(hex)}
                      className="position-relative border-0 p-0 rounded-2 overflow-hidden"
                      style={{
                        width: 48,
                        height: 48,
                        boxShadow: active ? "0 0 0 3px #6366f1" : "0 1px 3px rgba(0,0,0,0.12)",
                        outline: active ? "2px solid #fff" : "none",
                        outlineOffset: -2,
                      }}
                    >
                      <span
                        className="d-block w-100 h-100"
                        style={{ backgroundColor: nHex }}
                      />
                      <span
                        className="position-absolute bottom-0 end-0 m-1 rounded px-1 fw-bold"
                        style={{
                          fontSize: "0.65rem",
                          background: "rgba(0,0,0,0.55)",
                          color: "#fff",
                          lineHeight: 1.2,
                        }}
                      >
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.color ? <Form.Text className="text-danger d-block mt-2">{errors.color}</Form.Text> : null}
              <Form.Text className="text-muted d-block mt-2">
                {hiddenByOthersCount > 0
                  ? `${hiddenByOthersCount} màu đang được loại khác dùng — đã ẩn khỏi bảng.`
                  : "Mỗi mã màu chỉ gán cho một loại ghế."}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="admin-form-label">
                Tên loại ghế <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="name"
                className={`admin-search-input ${errors.name ? "border-danger" : ""}`}
                placeholder="Ví dụ: Thường, VIP, Đôi, Ghế Sweetbox…"
                value={formData.name}
                onChange={handleChange}
                autoComplete="off"
              />
              {errors.name ? <Form.Text className="text-danger d-block">{errors.name}</Form.Text> : null}
              {nameSuggestsCouple && !formData.coupleSeat ? (
                <Form.Text className="text-warning d-block mt-1">
                  Tên có vẻ là ghế đôi — nên bật «Ghế đôi» bên dưới nếu đúng ý định.
                </Form.Text>
              ) : null}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="admin-form-label">
                Phụ thu (VNĐ) <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="number"
                name="surcharge"
                step="1000"
                min="0"
                inputMode="numeric"
                className={`admin-search-input ${errors.surcharge ? "border-danger" : ""}`}
                placeholder="Ví dụ: 0, 1000, 20000..."
                value={formData.surcharge}
                onChange={handleChange}
              />
              {errors.surcharge ? <Form.Text className="text-danger d-block">{errors.surcharge}</Form.Text> : null}
              <Form.Text className="text-muted d-block mt-2">
                Số tiền cộng thêm (chỉ chấp nhận số tròn nghìn, VD: 1000, 5000, 100000).
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4 p-3 rounded-3" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <Form.Check
                type="switch"
                id="coupleSeat"
                name="coupleSeat"
                label={<span className="fw-semibold">Ghế đôi (chiếm 2 cột liền kề)</span>}
                checked={formData.coupleSeat}
                onChange={handleChange}
              />
              <Form.Text className="text-muted d-block mt-2 ms-1">
                Bật nếu một ghế logic trải trên hai ô liền kề trên lưới thiết kế.
              </Form.Text>
            </Form.Group>

            <div className="mt-3 d-flex flex-wrap justify-content-end">
              <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: 180 }} disabled={submitting}>
                {submitting && <span className="spinner-border spinner-border-sm me-2" role="status" />}
                {editData ? "Cập nhật" : "Lưu loại ghế"}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </AdminPanelPage>
  );
};

export default CreateSeatType;
