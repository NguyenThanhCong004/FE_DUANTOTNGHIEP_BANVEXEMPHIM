import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiFetch } from '../../utils/apiClient';
import { NEWS } from '../../constants/apiEndpoints';

// CKEditor 5 Imports
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const CreateNews = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const imageInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'Active',
    image: null
  });

  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (editData) {
      setFormData({
        title: editData.title || '',
        content: editData.content || '',
        status: editData.status === 1 || editData.status === 'Active' ? 'Active' : 'Inactive',
        image: null 
      });
      if (editData.image) setPreviewImage(editData.image);
    }
  }, [editData]);

  const validateForm = () => {
    let newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Tiêu đề không được để trống';
    if (!formData.content.trim() || formData.content === '<p>&nbsp;</p>') {
      newErrors.content = 'Nội dung bài viết không được để trống';
    }
    
    if (!editData?.id && !formData.image) {
      newErrors.image = 'Vui lòng chọn ảnh minh họa';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // Hàm xử lý thay đổi từ CKEditor
  const handleEditorChange = (event, editor) => {
    const data = editor.getData();
    setFormData(prev => ({ ...prev, content: data }));
    if (errors.content) setErrors(prev => ({ ...prev, content: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setServerError('');

    try {
      let imageStr = previewImage;
      if (formData.image instanceof File) {
        imageStr = await fileToDataUrl(formData.image);
      }

      const body = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        image: imageStr,
        status: formData.status === 'Active' ? 1 : 0,
      };

      const nid = editData?.id;
      const url = nid ? NEWS.BY_ID(nid) : NEWS.LIST;
      const res = await apiFetch(url, {
        method: nid ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });

      if (res.ok) {
        navigate('/super-admin/news', {
          state: {
            message: nid ? 'Cập nhật bài viết thành công!' : 'Đăng tin mới thành công!',
            type: 'success'
          }
        });
      } else {
        const json = await res.json().catch(() => null);
        setServerError(json?.message || 'Lưu tin tức thất bại');
      }
    } catch {
      setServerError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  // Cấu hình Toolbar CKEditor
  const editorConfiguration = {
    toolbar: {
      items: [
        'heading',
        '|',
        'bold',
        'italic',
        'link',
        'bulletedList',
        'numberedList',
        '|',
        'outdent',
        'indent',
        '|',
        'imageUpload',
        'blockQuote',
        'insertTable',
        'mediaEmbed',
        'undo',
        'redo'
      ]
    },
    language: 'vi',
    image: {
      toolbar: [
        'imageTextAlternative',
        'toggleImageCaption',
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side'
      ]
    },
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells'
      ]
    }
  };

  return (
    <AdminPanelPage 
      icon={editData ? "bi-newspaper" : "bi-file-earmark-plus"} 
      title={editData ? 'Cập nhật tin tức' : 'Viết tin tức mới'} 
      description="Sử dụng bộ soạn thảo chuyên nghiệp để đăng tải tin tức, khuyến mãi."
    >
      <form onSubmit={handleSubmit} noValidate>
        <div className="row g-4">
          <div className="col-12">
            <div className="admin-card admin-slide-up">
              <div className="admin-card-header">
                <h4 className="mb-0"><i className="bi bi-image-fill text-primary me-2"></i>Ảnh minh họa bài viết</h4>
              </div>
              <div className="admin-card-body p-4 text-center">
                <div 
                  className={`mx-auto mb-3 border-2 d-flex align-items-center justify-content-center overflow-hidden ${errors.image ? 'border-danger' : 'border-light'}`}
                  style={{ width: '100%', maxWidth: '800px', aspectRatio: '16/9', cursor: 'pointer', background: '#f8fafc', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  onClick={() => imageInputRef.current.click()}
                >
                  {previewImage ? (
                    <img src={previewImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div className="text-muted text-center">
                      <i className="bi bi-cloud-arrow-up fs-1"></i>
                      <div className="small fw-bold mt-2">CHỌN ẢNH NGANG (16:9)</div>
                    </div>
                  )}
                </div>
                <input type="file" ref={imageInputRef} hidden accept="image/*" onChange={handleFileChange} />
                {errors.image && <div className="text-danger small fw-bold">{errors.image}</div>}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="admin-card admin-slide-up">
              <div className="admin-card-header">
                <h4 className="mb-0"><i className="bi bi-pencil-square text-primary me-2"></i>Nội dung tin tức</h4>
              </div>
              <div className="admin-card-body p-4">
                {serverError && <div className="alert alert-danger border-0 py-2 small mb-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{serverError}</div>}
                
                <div className="row">
                  <div className="col-md-8 mb-4">
                    <label className="admin-form-label">Tiêu đề bài viết <span className="text-danger">*</span></label>
                    <input 
                      type="text" name="title" className={`admin-search-input w-100 ${errors.title ? 'border-danger' : ''}`}
                      placeholder="Nhập tiêu đề hấp dẫn cho bài viết..." value={formData.title} onChange={handleChange} 
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
                    <label className="admin-form-label mb-3">Nội dung chi tiết <span className="text-danger">*</span></label>
                    <div className={`ckeditor-wrapper ${errors.content ? 'is-invalid' : ''}`}>
                      <CKEditor
                        editor={ClassicEditor}
                        config={editorConfiguration}
                        data={formData.content}
                        onReady={editor => {
                          // Bạn có thể tùy chỉnh thêm cho editor tại đây
                          editor.editing.view.change(writer => {
                            writer.setStyle('min-height', '400px', editor.editing.view.document.getRoot());
                          });
                        }}
                        onChange={handleEditorChange}
                      />
                    </div>
                    {errors.content && <small className="text-danger fw-medium d-block mt-1">{errors.content}</small>}
                  </div>
                </div>

                <div className="mt-4 d-flex justify-content-center gap-3">
                  <button type="button" className="admin-btn admin-btn-outline" onClick={() => navigate('/super-admin/news')}>Hủy bỏ</button>
                  <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: '200px' }} disabled={submitting}>
                    {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                    {editData ? 'Cập nhật tin' : 'Đăng tin tức'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Tùy chỉnh CSS cho CKEditor để khớp với thiết kế Admin */}
      <style>{`
        .ck-editor__editable_inline {
          padding-left: 1.5rem !important;
          padding-right: 1.5rem !important;
          font-size: 1.05rem;
          line-height: 1.7;
          color: #334155;
        }
        .ck-editor__main {
          border-radius: 0 0 12px 12px !important;
          overflow: hidden;
        }
        .ck-toolbar {
          border-radius: 12px 12px 0 0 !important;
          border-color: #e2e8f0 !important;
          background-color: #f8fafc !important;
        }
        .ck.ck-editor__main>.ck-editor__editable:not(.ck-focused) {
          border-color: #e2e8f0 !important;
        }
        .ck.ck-editor__editable.ck-focused {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1) !important;
        }
        .ckeditor-wrapper.is-invalid .ck-editor__main>.ck-editor__editable {
          border-color: #ef4444 !important;
        }
      `}</style>
    </AdminPanelPage>
  );
};

export default CreateNews;
