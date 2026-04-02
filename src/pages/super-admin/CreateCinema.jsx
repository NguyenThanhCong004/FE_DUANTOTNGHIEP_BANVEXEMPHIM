import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminPanelPage from '../../components/admin/AdminPanelPage';
import { apiFetch } from '../../utils/apiClient';
import { CINEMAS } from '../../constants/apiEndpoints';

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
          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-muted`}></i>
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

  const [formData, setFormData] = useState({
    name: '',
    status: 'Active',
    province: '',
    district: '',
    ward: '',
    street: ''
  });

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  // 1. Tải danh sách Tỉnh/Thành phố
  useEffect(() => {
    fetch('https://provinces.open-api.vn/api/p/')
      .then(res => res.json())
      .then(data => setProvinces(data))
      .catch(err => console.error('Lỗi fetch tỉnh:', err));
  }, []);

  // 2. Tải danh sách Quận/Huyện khi chọn Tỉnh
  useEffect(() => {
    if (formData.province) {
      const selectedProvince = provinces.find(p => p.name === formData.province);
      if (selectedProvince) {
        fetch(`https://provinces.open-api.vn/api/p/${selectedProvince.code}?depth=2`)
          .then(res => res.json())
          .then(data => setDistricts(data.districts))
          .catch(err => console.error('Lỗi fetch huyện:', err));
      }
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [formData.province, provinces]);

  // 3. Tải danh sách Phường/Xã khi chọn Huyện
  useEffect(() => {
    if (formData.district) {
      const selectedDistrict = districts.find(d => d.name === formData.district);
      if (selectedDistrict) {
        fetch(`https://provinces.open-api.vn/api/d/${selectedDistrict.code}?depth=2`)
          .then(res => res.json())
          .then(data => setWards(data.wards))
          .catch(err => console.error('Lỗi fetch xã:', err));
      }
    } else {
      setWards([]);
    }
  }, [formData.district, districts]);

  // --- Logic tách địa chỉ khi Sửa (Edit) ---
  useEffect(() => {
    if (editData && provinces.length > 0) {
      const fullAddr = editData.address || '';
      const parts = fullAddr.split(',').map(p => p.trim());
      
      // Giả sử cấu trúc BE lưu: "Số nhà, Phường, Quận, Tỉnh"
      if (parts.length >= 4) {
        const provinceName = parts[parts.length - 1];
        const districtName = parts[parts.length - 2];
        const wardName = parts[parts.length - 3];
        const streetName = parts.slice(0, parts.length - 3).join(', ');

        setFormData(prev => ({
          ...prev,
          name: editData.name || '',
          status: editData.status === 'Active' || editData.status === 1 ? 'Active' : 'Inactive',
          province: provinceName,
          district: districtName,
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
      ...(name === 'province' ? { district: '', ward: '' } : {}),
      ...(name === 'district' ? { ward: '' } : {})
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Vui lòng nhập tên rạp';
    if (!formData.province) newErrors.province = 'Chọn tỉnh thành';
    if (!formData.district) newErrors.district = 'Chọn quận huyện';
    if (!formData.ward) newErrors.ward = 'Chọn phường xã';
    if (!formData.street.trim()) newErrors.street = 'Nhập địa chỉ chi tiết';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setServerError('');
    const fullAddress = `${formData.street.trim()}, ${formData.ward}, ${formData.district}, ${formData.province}`;

    const body = {
      name: formData.name.trim(),
      address: fullAddress,
      status: formData.status === 'Active' ? 1 : 0,
    };
    
    try {
      const url = editData?.id ? CINEMAS.BY_ID(editData.id) : CINEMAS.LIST;
      const res = await apiFetch(url, {
        method: editData?.id ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      });
      if (res.ok) navigate('/super-admin/cinemas');
      else {
        const json = await res.json().catch(() => null);
        setServerError(json?.message || 'Lưu thất bại');
      }
    } catch {
      setServerError('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminPanelPage 
      icon={editData ? "bi-building-gear" : "bi-building-add"} 
      title={editData ? 'Cập nhật rạp' : 'Thêm rạp mới'} 
      description="Quản lý thông tin cụm rạp và địa chỉ hoạt động trên hệ thống."
    >
      <div className="admin-card admin-slide-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div className="admin-card-header">
          <h4 className="mb-0">
            <i className={`bi ${editData ? 'bi-pencil-square' : 'bi-plus-circle-fill'} text-primary me-2`}></i>
            Thông tin rạp
          </h4>
        </div>
        <div className="admin-card-body p-4">
          {serverError && <div className="alert alert-danger border-0 py-2 small mb-4"><i className="bi bi-exclamation-triangle-fill me-2"></i>{serverError}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-8 mb-4">
                <label className="admin-form-label">Tên cụm rạp <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  className={`admin-search-input w-100 ${errors.name ? 'border-danger' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Ví dụ: Cinema Duy Tân"
                />
                {errors.name && <small className="text-danger fw-medium">{errors.name}</small>}
              </div>
              <div className="col-md-4 mb-4">
                <label className="admin-form-label">Trạng thái</label>
                <select 
                  className="admin-search-input w-100"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="Active">Đang hoạt động</option>
                  <option value="Inactive">Tạm khóa</option>
                  <option value="Upcoming">Sắp khai trương</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <SearchableSelect 
                  label="Tỉnh / Thành phố"
                  options={provinces}
                  value={formData.province}
                  onChange={(val) => handleChange('province', val)}
                  placeholder="Tìm tỉnh thành..."
                  error={errors.province}
                />
              </div>
              <div className="col-md-4">
                <SearchableSelect 
                  label="Quận / Huyện"
                  options={districts}
                  value={formData.district}
                  onChange={(val) => handleChange('district', val)}
                  placeholder="Tìm quận huyện..."
                  disabled={!formData.province}
                  error={errors.district}
                />
              </div>
              <div className="col-md-4">
                <SearchableSelect 
                  label="Phường / Xã"
                  options={wards}
                  value={formData.ward}
                  onChange={(val) => handleChange('ward', val)}
                  placeholder="Tìm phường xã..."
                  disabled={!formData.district}
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
              />
              {errors.street && <small className="text-danger fw-medium">{errors.street}</small>}
            </div>

            <div className="mt-4 d-flex justify-content-center gap-3">
              <button type="button" className="admin-btn admin-btn-outline" onClick={() => navigate('/super-admin/cinemas')}>Hủy bỏ</button>
              <button type="submit" className="admin-btn admin-btn-primary" style={{ minWidth: '180px' }} disabled={submitting}>
                {submitting ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                {editData ? 'Cập nhật' : 'Lưu rạp'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminPanelPage>
  );
};

export default CreateCinema;
