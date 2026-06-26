import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import AdminFormListBack from "../../components/admin/AdminFormListBack";
import { useAdminToast } from "../../components/admin/AdminToast";
import { apiFetch, apiJson } from "../../utils/apiClient";
import { AUTHORS, NATIONS } from "../../constants/apiEndpoints";
import { apiMessage, MESSAGES, resultToastType } from "../../utils/uiMessages";

const CONFIG = {
  author: {
    title: "Tác giả",
    singular: "tác giả",
    plural: "tác giả",
    fieldLabel: "Tên tác giả",
    placeholder: "Ví dụ: Christopher Nolan, Trấn Thành...",
    icon: "bi-person-vcard",
    createIcon: "bi-person-plus",
    api: AUTHORS,
    listPath: "/super-admin/authors",
  },
  nation: {
    title: "Quốc gia",
    singular: "quốc gia",
    plural: "quốc gia",
    fieldLabel: "Tên quốc gia",
    placeholder: "Ví dụ: Việt Nam, Hàn Quốc, Mỹ...",
    icon: "bi-globe2",
    createIcon: "bi-globe-asia-australia",
    api: NATIONS,
    listPath: "/super-admin/nations",
  },
};

export default function MovieReferenceForm({ type }) {
  const config = CONFIG[type] || CONFIG.author;
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const editData = location.state?.editData;
  const editingId = id || editData?.id;
  const isEdit = Boolean(editingId);
  const { showToast, ToastComponent } = useAdminToast();

  const [name, setName] = useState(editData?.name || "");
  const [status, setStatus] = useState(editData?.status ?? 1);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(isEdit && !editData);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const title = useMemo(
    () => (isEdit ? `Cập nhật ${config.singular}` : `Thêm ${config.singular} mới`),
    [config.singular, isEdit]
  );

  const loadFormData = useCallback(async () => {
    setLoading(true);
    try {
      const [listResult, detailResult] = await Promise.all([
        apiJson(config.api.LIST),
        isEdit && !editData ? apiJson(config.api.BY_ID(editingId)) : Promise.resolve(null),
      ]);

      if (listResult.ok && Array.isArray(listResult.data)) {
        setItems(listResult.data);
      }

      if (detailResult) {
        if (!detailResult.ok) {
          throw new Error(detailResult.message || `Không tải được ${config.singular}`);
        }
        setName(detailResult.data?.name || "");
        setStatus(detailResult.data?.status ?? 1);
      }
    } catch (error) {
      setServerError(error.message || MESSAGES.networkError);
    } finally {
      setLoading(false);
    }
  }, [config.api, config.singular, editData, editingId, isEdit]);

  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  const validateForm = () => {
    const trimmed = name.trim();
    const nextErrors = {};

    if (!trimmed) {
      nextErrors.name = `${config.fieldLabel} không được để trống`;
    } else {
      const duplicate = items.some((item) => {
        if (String(item.id) === String(editingId)) return false;
        return item.name?.trim().toLowerCase() === trimmed.toLowerCase();
      });
      if (duplicate) nextErrors.name = `${config.fieldLabel} này đã tồn tại`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const trimmed = name.trim();
    const originalName = String(editData?.name || "").trim();
    const originalStatus = editData?.status ?? 1;

    if (isEdit && trimmed === originalName && Number(status) === Number(originalStatus)) {
      showToast(MESSAGES.noChanges, "warning");
      return;
    }

    setSubmitting(true);
    setServerError("");
    try {
      const res = await apiFetch(isEdit ? config.api.BY_ID(editingId) : config.api.LIST, {
        method: isEdit ? "PUT" : "POST",
        body: JSON.stringify({ name: trimmed, status: Number(status) }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(apiMessage(json, `Không thể lưu ${config.singular}`));

      const message = apiMessage(json, isEdit ? `Cập nhật ${config.singular} thành công` : `Thêm ${config.singular} thành công`);
      navigate(config.listPath, {
        state: {
          message,
          type: resultToastType(message),
        },
      });
    } catch (error) {
      setServerError(error.message || MESSAGES.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelPage
      icon={isEdit ? config.icon : config.createIcon}
      title={title}
      description={`Quản lý danh mục ${config.plural} dùng khi tạo và cập nhật phim.`}
      headerRight={<AdminFormListBack to={config.listPath} />}
    >
      <ToastComponent />
      <div className="admin-form-page-wrap admin-form-compact">
        <div className="admin-card admin-slide-up">
          <div className="admin-card-header">
            <h4 className="mb-0">
              <i className={`bi ${isEdit ? "bi-pencil-square" : "bi-plus-circle-fill"} text-primary me-2`} />
              Thông tin {config.singular}
            </h4>
          </div>
          <div className="admin-card-body p-4">
            {serverError && (
              <div className="alert alert-danger border-0 py-2 small mb-4">
                <i className="bi bi-exclamation-triangle-fill me-2" />
                {serverError}
              </div>
            )}

            {loading ? (
              <div className="text-center py-4 text-muted">Đang tải dữ liệu...</div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-4">
                  <label className="admin-form-label">
                    {config.fieldLabel} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`admin-search-input w-100 ${errors.name ? "border-danger" : ""}`}
                    placeholder={config.placeholder}
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    autoFocus
                  />
                  {errors.name && <small className="text-danger fw-medium">{errors.name}</small>}
                </div>

                <div className="mb-4">
                  <label className="admin-form-label">Trạng thái</label>
                  <select
                    className="admin-search-input w-100"
                    value={status}
                    onChange={(event) => setStatus(Number(event.target.value))}
                  >
                    <option value={1}>Đang dùng</option>
                    <option value={0}>Ngừng dùng</option>
                  </select>
                </div>

                <div className="mt-4 d-flex justify-content-end gap-2">
                  <button type="button" className="admin-btn admin-btn-outline-secondary" onClick={() => navigate(config.listPath)}>
                    Hủy
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: 180 }} disabled={submitting}>
                    {submitting ? <span className="spinner-border spinner-border-sm me-2" /> : <i className="bi bi-check-circle me-2" />}
                    {isEdit ? "Cập nhật" : `Lưu ${config.singular}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </AdminPanelPage>
  );
}
