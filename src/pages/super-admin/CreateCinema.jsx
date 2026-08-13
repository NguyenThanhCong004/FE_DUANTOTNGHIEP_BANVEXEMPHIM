import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import AdminFormListBack from '../../components/admin/AdminFormListBack';
import { useAdminToast } from '../../components/admin/AdminToast';
import { useSuperAdminCinema } from '../../components/layout/useSuperAdminCinema';
import { apiFetch } from '../../utils/apiClient';
import { CINEMAS } from '../../constants/apiEndpoints';
import { adminStatusToCode, codeToAdminStatus } from '../../utils/statusFormat';
import { apiMessage, MESSAGES, resultToastType } from '../../utils/uiMessages';

// --- Custom Searchable Select Component ---
const SearchableSelect = ({ label, options, value, onChange, placeholder, disabled, error }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => 
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="mb-4" ref={wrapperRef}>
      <label className="admin-form-label">{label}</label>
      <div className="position-relative">
        <div 
          className={`admin-search-input w-100 d-flex align-items-center justify-content-between cursor-pointer ${disabled ? 'bg-light opacity-50' : 'bg-white'} ${error ? 'border-danger' : ''}`}
          style={{ paddingLeft: '1rem' }} // Ghi đè padding-left mặc định của admin-search-input nếu không có icon
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={!value ? 'text-muted' : 'text-dark fw-bold'}>
            {value || placeholder}
          </span>
        </div>

        {isOpen && (
          <div className="position-absolute w-100 mt-1 shadow-lg bg-white border rounded-3 z-3" style={{ maxHeight: '250px', overflowY: 'auto', left: 0 }}>
            <div className="p-2 sticky-top bg-white border-bottom">
              <input
                type="text"
                className="form-control form-control-sm border-0 bg-light"
                placeholder="Tìm nhanh..."
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.code || opt.name}
                  className={`px-3 py-2 cursor-pointer hover-bg-light ${value === opt.name ? 'bg-primary text-white' : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  {opt.name}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-muted small italic">Không tìm thấy kết quả</div>
            )}
          </div>
        )}
      </div>
      {error && <small className="text-danger fw-medium">{error}</small>}
      <style>{`
        .hover-bg-light:hover { background-color: var(--admin-bg); }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
  );
};

const CreateCinema = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const editData = location.state?.editData;
  const { showToast, ToastComponent } = useAdminToast();
  const { refreshCinemas, setSelectedCinemaId } = useSuperAdminCinema();

  const [formData, setFormData] = useState({
    name: '',
    status: 'Active',
    province: '',
    ward: '',
    street: ''
  });

  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // 1. Tải danh sách Tỉnh/Thành phố (API v2: sau sáp nhập, chỉ còn 2 cấp Tỉnh -> Phường/Xã, không còn Quận/Huyện)
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/v2/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error('Lỗi fetch tỉnh:', err));
  }, []);

  // 2. Tải danh sách Phường/Xã khi chọn Tỉnh
  useEffect(() => {
    if (formData.province) {
      const selectedProvince = provinces.find(p => p.name === formData.province);
      if (selectedProvince) {
        fetch(`https://provinces.open-api.vn/api/v2/p/${selectedProvince.code}?depth=2`)
          .then(res => res.json())
          .then(data => setWards(data.wards || []))
          .catch(err => console.error('Lỗi fetch phường xã:', err));
      }
    } else {
      setWards([]);
    }
  }, [formData.province, provinces]);

  // --- Logic tách địa chỉ khi Sửa (Edit) ---
  useEffect(() => {
    if (editData && provinces.length > 0) {
      const fullAddr = editData.address || '';
      const parts = fullAddr.split(',').map(p => p.trim());

      // Cấu trúc mới BE lưu: "Số nhà, Phường/Xã, Tỉnh/Thành"
      if (parts.length >= 3) {
        const provinceName = parts[parts.length - 1];
        const wardName = parts[parts.length - 2];
        const streetName = parts.slice(0, parts.length - 2).join(', ');

        setFormData(prev => ({
          ...prev,
          name: editData.name || '',
          status: codeToAdminStatus(editData.status, { allowUpcoming: true }),
          province: provinceName,
          ward: wardName,
          street: streetName
        }));
      } else {
        // Fallback nếu chuỗi không đúng định dạng
        setFormData(prev => ({
          ...prev,
          name: editData.name || '',
          street: fullAddr
        }));
      }
    }
  }, [editData, provinces]);

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'province' ? { ward: '' } : {})
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập tên rạp';
    if (!formData.province) newErrors.province = 'Chọn tỉnh thành';
    if (!formData.ward) newErrors.ward = 'Chọn phường xã';
    if (!formData.street.trim()) newErrors.street = 'Nhập địa chỉ chi tiết';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setServerError('');
    const fullAddress = `${formData.street.trim()}, ${formData.ward}, ${formData.province}`;

    const body = {
      name: formData.name.trim(),
      address: fullAddress,
      status: adminStatusToCode(formData.status, { allowUpcoming: true }),
    };
    let payload = body;

    if (editData?.id) {
      const originalBody = {
        name: String(editData.name || '').trim(),
        address: String(editData.address || '').trim(),
        status: adminStatusToCode(editData.status, { allowUpcoming: true }),
      };

      const isUnchanged =
        body.name === originalBody.name &&
        body.address === originalBody.address &&
        body.status === originalBody.status;

      if (isUnchanged) {
        showToast(MESSAGES.noChanges, 'warning');
        setSubmitting(false);
        return;
      }

      // Chỉ gửi các trường thay đổi để giảm xử lý backend không cần thiết.
      payload = {};
      if (body.name !== originalBody.name) payload.name = body.name;
      if (body.address !== originalBody.address) payload.address = body.address;
      if (body.status !== originalBody.status) payload.status = body.status;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const url = editData?.id ? CINEMAS.BY_ID(editData.id) : CINEMAS.LIST;
      const res = await apiFetch(url, {
        method: editData?.id ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (res.ok) {
        const json = await res.json().catch(() => null);
        const message = apiMessage(json, editData?.id ? 'Cập nhật rạp thành công' : 'Lưu rạp thành công');
        const messageType = resultToastType(message);
        const savedCinemaId = json?.data?.cinemaId ?? json?.data?.id ?? editData?.id ?? null;

        await refreshCinemas();
        if (!editData?.id && savedCinemaId != null) {
          setSelectedCinemaId(savedCinemaId);
        }
        
        navigate('/super-admin/cinemas', {
          state: {
            message: message,
            type: messageType,
          },
        });
      } else {
        const json = await res.json().catch(() => null);
        setServerError(apiMessage(json, 'Lưu rạp thất bại'));
      }
    } catch (err) {
      if (err?.name === 'AbortError') {
        setServerError('Máy chủ phản hồi chậm (quá 4 giây). Vui lòng thử lại.');
      } else {
        setServerError(MESSAGES.networkError);
      }
    } finally {
      clearTimeout(timeoutId);
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelPage 
      icon={editData ? "bi-building-gear" : "bi-building-add"} 
      title={editData ? 'Cập nhật rạp' : 'Thêm rạp mới'}
      headerRight={<AdminFormListBack to="/super-admin/cinemas" />}
    >
      <ToastComponent />
      <div className="admin-form-page-wrap admin-form-compact">
      <div className="admin-card admin-slide-up">
        <div className="admin-card-header">
          <h4 className="mb-0">
            Thông tin rạp
          </h4>
        </div>
        <div className="admin-card-body p-4">
          {serverError && <div className="alert alert-danger border-0 py-2 small mb-4">{serverError}</div>}
          
          <form onSubmit={handleSubmit} noValidate>
            <div className="row">
              <div className="col-md-8 mb-4">
                <label className="admin-form-label">Tên cụm rạp <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  className={`admin-search-input w-100 ${errors.name ? 'border-danger' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ví dụ: Cinema Duy Tân"
                  disabled={submitting}
                />
                {errors.name && <small className="text-danger fw-medium">{errors.name}</small>}
              </div>
              <div className="col-md-4 mb-4">
                <label className="admin-form-label">Trạng thái</label>
                <select 
                  className="admin-search-input w-100"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={submitting}
                >
                  <option value="Active">Đang hoạt động</option>
                  <option value="Inactive">Tạm khóa</option>
                  <option value="Upcoming">Sắp khai trương</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <SearchableSelect
                  label="Tỉnh / Thành phố"
                  options={provinces}
                  value={formData.province}
                  onChange={(val) => handleChange('province', val)}
                  placeholder="Tìm tỉnh thành..."
                  disabled={submitting}
                  error={errors.province}
                />
              </div>
              <div className="col-md-6">
                <SearchableSelect
                  label="Phường / Xã"
                  options={wards}
                  value={formData.ward}
                  onChange={(val) => handleChange('ward', val)}
                  placeholder="Tìm phường xã..."
                  disabled={!formData.province || submitting}
                  error={errors.ward}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="admin-form-label">Địa chỉ chi tiết (Số nhà, tên đường...) <span className="text-danger">*</span></label>
              <input 
                type="text"
                className={`admin-search-input w-100 ${errors.street ? 'border-danger' : ''}`}
                value={formData.street}
                onChange={(e) => handleChange('street', e.target.value)}
                placeholder="Ví dụ: Số 123, đường Nguyễn Huệ"
                disabled={submitting}
              />
              {errors.street && <small className="text-danger fw-medium">{errors.street}</small>}
            </div>

            <div className="mt-3 d-flex justify-content-end">
              <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: '180px' }} disabled={submitting}>
                {submitting && <span className="spinner-border spinner-border-sm me-2"></span>}
                {editData ? 'Cập nhật' : 'Lưu rạp'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
      {submitting && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column justify-content-center align-items-center"
          style={{ backgroundColor: 'rgba(17, 24, 39, 0.45)', zIndex: 1200 }}
        >
          <div className="bg-white rounded-4 shadow-lg px-4 py-3 d-flex align-items-center gap-3">
            <span className="spinner-border text-primary" role="status" aria-hidden="true"></span>
            <div className="fw-semibold text-dark">
              Đang cập nhật dữ liệu, vui lòng chờ...
            </div>
          </div>
        </div>
      )}
    </AdminPanelPage>
  );
};

export default CreateCinema;
