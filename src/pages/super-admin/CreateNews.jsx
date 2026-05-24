import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminPanelPage from "../../components/admin/AdminPanelPage";
import AdminFormListBack from "../../components/admin/AdminFormListBack";
import { apiFetch } from "../../utils/apiClient";
import { NEWS } from "../../constants/apiEndpoints";
import { useAdminToast } from "../../components/admin/AdminToast";
import sanitizeHtml from "../../utils/sanitizeHtml";
import { fileToDataUrl, IMAGE_FILE_ACCEPT } from "../../utils/mediaFiles";
import { adminStatusToCode, codeToAdminStatus } from "../../utils/statusFormat";
import { apiMessage, MESSAGES, resultToastType } from "../../utils/uiMessages";

function isRichTextEmpty(html) {
  if (html == null || !String(html).trim()) return true;
  const text = String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .trim();
  if (text.length > 0) return false;
  const t = String(html).trim();
  return (
    t === "" ||
    t === "<p><br></p>" ||
    t === "<p></p>" ||
    t === "<p>&nbsp;</p>" ||
    /^<p>\s*<\/p>$/.test(t)
  );
}

const CreateNews = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const { ToastComponent } = useAdminToast();
  const imageInputRef = useRef(null);
  const quillMountRef = useRef(null);
  const quillRef = useRef(null);
  const lastPushedHtmlRef = useRef("");
  const quillLiveRef = useRef({ quill: null, onTextChange: null });

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    status: "Active",
    image: null,
  });

  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [editorMode, setEditorMode] = useState("loading");

  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title || "",
        content: sanitizeHtml(editData.content || ""),
        status: codeToAdminStatus(editData.status, { allowUpcoming: false }),
        image: null,
      });
      if (editData.image) setPreviewImage(editData.image);
    }
  }, [editData]);

  useEffect(() => {
    const host = quillMountRef.current;
    if (!host) return undefined;

    let cancelled = false;
    lastPushedHtmlRef.current = "";
    quillLiveRef.current = { quill: null, onTextChange: null };

    (async () => {
      setEditorMode("loading");
      try {
        await import("quill/dist/quill.snow.css");
        const { default: Quill } = await import("quill");
        if (cancelled || !quillMountRef.current) return;

        host.innerHTML = "";
        const editorEl = document.createElement("div");
        host.appendChild(editorEl);

        const quillInstance = new Quill(editorEl, {
          theme: "snow",
          placeholder: "Viết nội dung bài viết...",
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline", "strike"],
              [{ color: [] }, { background: [] }],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link", "image", "blockquote"],
              ["clean"],
            ],
          },
        });

        if (cancelled) {
          host.innerHTML = "";
          return;
        }

        quillRef.current = quillInstance;

        const initialHtml = sanitizeHtml(editData?.content ?? "");
        if (initialHtml) {
          try {
            quillInstance.setContents(quillInstance.clipboard.convert({ html: initialHtml }), "silent");
          } catch {
            quillInstance.root.innerHTML = initialHtml;
          }
        }

        const onTextChange = () => {
          let html;
          try {
            html = quillInstance.getSemanticHTML();
          } catch {
            html = quillInstance.root.innerHTML;
          }
          const safeHtml = sanitizeHtml(html);
          if (safeHtml === lastPushedHtmlRef.current) return;
          lastPushedHtmlRef.current = safeHtml;
          setFormData((prev) => ({ ...prev, content: safeHtml }));
          setErrors((prev) => (prev.content ? { ...prev, content: "" } : prev));
        };

        quillInstance.on("text-change", onTextChange);
        quillLiveRef.current = { quill: quillInstance, onTextChange };
        onTextChange();

        if (!cancelled) setEditorMode("quill");
      } catch (e) {
        console.error("[CreateNews] Quill init failed:", e);
        if (!cancelled) {
          host.innerHTML = "";
          setEditorMode("textarea");
        }
      }
    })();

    return () => {
      cancelled = true;
      const { quill, onTextChange } = quillLiveRef.current;
      if (quill && onTextChange) {
        quill.off("text-change", onTextChange);
      }
      quillLiveRef.current = { quill: null, onTextChange: null };
      quillRef.current = null;
      lastPushedHtmlRef.current = "";
      host.innerHTML = "";
    };
  }, [editData?.id, editData?.content]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Tiêu đề không được để trống";
    if (isRichTextEmpty(sanitizeHtml(formData.content))) {
      newErrors.content = "Nội dung bài viết không được để trống";
    }
    if (!editData?.id && !formData.image) {
      newErrors.image = "Vui lòng chọn ảnh minh họa";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleContentTextarea = (e) => {
    const value = e.target.value;
    lastPushedHtmlRef.current = value;
    setFormData((prev) => ({ ...prev, content: value }));
    if (errors.content) setErrors((prev) => ({ ...prev, content: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setServerError("");

    try {
      let imageStr = previewImage;
      if (formData.image instanceof File) {
        imageStr = await fileToDataUrl(formData.image);
      }

      const safeContent = sanitizeHtml(formData.content).trim();
      const body = {
        title: formData.title.trim(),
        content: safeContent,
        image: imageStr,
        status: adminStatusToCode(formData.status, { allowUpcoming: false }),
      };

      const nid = editData?.id;
      const url = nid ? NEWS.BY_ID(nid) : NEWS.LIST;
      const res = await apiFetch(url, {
        method: nid ? "PUT" : "POST",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const json = await res.json().catch(() => null);
        const message = apiMessage(json, nid ? "Cập nhật bài viết thành công" : "Đăng tin mới thành công");
        const messageType = resultToastType(message);

        navigate("/super-admin/news", {
          state: {
            message: message,
            type: messageType,
          },
        });
      } else {
        const json = await res.json().catch(() => null);
        setServerError(apiMessage(json, "Lưu tin tức thất bại"));
      }
    } catch {
      setServerError(MESSAGES.networkError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelPage
      icon={editData ? "bi-newspaper" : "bi-file-earmark-plus"}
      title={editData ? "Cập nhật tin tức" : "Viết tin tức mới"}
      description="Soạn thảo HTML nhẹ (Quill) — phù hợp tin tức, khuyến mãi."
      headerRight={<AdminFormListBack to="/super-admin/news" />}
    >
      <ToastComponent />
      <div className="admin-form-page-wrap admin-form-compact">
      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-4">
          <div className="col-12">
            <div className="admin-card admin-slide-up">
              <div className="admin-card-header">
                <h4 className="mb-0">
                  <i className="bi bi-image-fill text-primary me-2"></i>Ảnh minh họa bài viết
                </h4>
              </div>
              <div className="admin-card-body p-4 text-center">
                <div
                  className={`mx-auto mb-3 border-2 d-flex align-items-center justify-content-center overflow-hidden ${
                    errors.image ? "border-danger" : "border-light"
                  }`}
                  style={{
                    width: "100%",
                    maxWidth: "min(960px, 100%)",
                    aspectRatio: "16/9",
                    cursor: "pointer",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                  onClick={() => imageInputRef.current.click()}
                >
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div className="text-muted text-center">
                      <i className="bi bi-cloud-arrow-up fs-1"></i>
                      <div className="small fw-bold mt-2">CHỌN ẢNH NGANG (16:9)</div>
                    </div>
                  )}
                </div>
                <input type="file" ref={imageInputRef} hidden accept={IMAGE_FILE_ACCEPT} onChange={handleFileChange} />
                {errors.image && <div className="text-danger small fw-bold">{errors.image}</div>}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="admin-card admin-slide-up">
              <div className="admin-card-header">
                <h4 className="mb-0">
                  <i className="bi bi-pencil-square text-primary me-2"></i>Nội dung tin tức
                </h4>
              </div>
              <div className="admin-card-body p-4">
                {serverError && (
                  <div className="alert alert-danger border-0 py-2 small mb-4">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    {serverError}
                  </div>
                )}

                <div className="row">
                  <div className="col-md-8 mb-4">
                    <label className="admin-form-label">
                      Tiêu đề bài viết <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      className={`admin-search-input w-100 ${errors.title ? "border-danger" : ""}`}
                      placeholder="Nhập tiêu đề hấp dẫn cho bài viết..."
                      value={formData.title}
                      onChange={handleChange}
                    />
                    {errors.title && <small className="text-danger fw-medium">{errors.title}</small>}
                  </div>

                  <div className="col-md-4 mb-4">
                    <label className="admin-form-label">Trạng thái hiển thị</label>
                    <select name="status" className="admin-search-input w-100" value={formData.status} onChange={handleChange}>
                      <option value="Active">Công khai (Public)</option>
                      <option value="Inactive">Bản nháp (Draft)</option>
                    </select>
                  </div>

                  <div className="col-12 mb-4">
                    <label className="admin-form-label mb-3">
                      Nội dung chi tiết <span className="text-danger">*</span>
                    </label>
                    <div className={`news-quill-wrapper ${errors.content ? "is-invalid" : ""}`}>
                      {editorMode === "loading" && (
                        <div className="text-muted small py-5 text-center border rounded-3 bg-light">Đang tải trình soạn thảo…</div>
                      )}
                      {editorMode === "textarea" && (
                        <textarea
                          name="content"
                          className={`admin-search-input w-100 font-monospace ${errors.content ? "border-danger" : ""}`}
                          rows={14}
                          placeholder="Nhập HTML nội dung bài viết…"
                          value={formData.content}
                          onChange={handleContentTextarea}
                        />
                      )}
                      <div ref={quillMountRef} className={editorMode === "quill" ? "news-quill-mount" : "d-none"} />
                    </div>
                    {errors.content && <small className="text-danger fw-medium d-block mt-1">{errors.content}</small>}
                  </div>
                </div>

                <div className="mt-3 d-flex justify-content-end">
                  <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: "200px" }} disabled={submitting}>
                    {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                    {editData ? "Cập nhật tin" : "Đăng tin tức"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
      </div>

      <style>{`
        .news-quill-wrapper .news-quill-mount .ql-toolbar {
          border-radius: 12px 12px 0 0;
          border-color: #e2e8f0 !important;
          background: #f8fafc;
        }
        .news-quill-wrapper .news-quill-mount .ql-container {
          min-height: 400px;
          font-size: 1.05rem;
          line-height: 1.7;
          color: #334155;
          border-radius: 0 0 12px 12px;
          border-color: #e2e8f0 !important;
        }
        .news-quill-wrapper .news-quill-mount .ql-editor {
          min-height: 380px;
          padding-left: 1.5rem;
          padding-right: 1.5rem;
        }
        .news-quill-wrapper .news-quill-mount .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
        }
        .news-quill-wrapper:not(.is-invalid) .news-quill-mount .ql-container.ql-focused {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }
        .news-quill-wrapper.is-invalid .news-quill-mount .ql-toolbar,
        .news-quill-wrapper.is-invalid .news-quill-mount .ql-container {
          border-color: #ef4444 !important;
        }
      `}</style>
    </AdminPanelPage>
  );
};

export default CreateNews;
