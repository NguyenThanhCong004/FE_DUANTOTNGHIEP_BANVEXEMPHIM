import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateVoucher = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'PERCENTAGE',
    value: '',
    min_order_value: '',
    start_date: '',
    end_date: '',
    point_voucher: '',
    status: 'Active'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Dữ liệu Voucher mới:', formData);
    alert('Tạo voucher thành công!');
    navigate('/super-admin/vouchers');
  };

  return (
    <div className="create-voucher p-4">
      <style>{`
        .form-container {
          background: white;
          border-radius: 15px;
          padding: 40px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
          max-width: 900px;
          margin: 0 auto;
        }

        .form-group-custom {
          margin-bottom: 25px;
        }

        .form-label {
          font-weight: bold;
          color: black;
          margin-bottom: 8px;
          display: block;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
        }

        .custom-input, .custom-select {
          width: 100%;
          height: 50px;
          padding: 10px 20px;
          background-color: whitesmoke !important;
          border: 2px solid black !important;
          border-radius: 10px;
          color: black !important;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
        }

        .custom-input:focus, .custom-select:focus {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .btn-save {
          background: black;
          color: white;
          border: 2px solid black;
          padding: 12px 40px;
          border-radius: 10px;
          font-weight: bold;
          transition: all 0.2s;
        }

        .btn-save:hover {
          background: whitesmoke;
          color: black;
        }

        .btn-cancel {
          background: white;
          color: black;
          border: 2px solid black;
          padding: 12px 40px;
          border-radius: 10px;
          font-weight: bold;
          margin-right: 15px;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: black;
          margin-bottom: 25px;
          padding-bottom: 10px;
          border-bottom: 3px solid black;
          display: inline-block;
        }
      `}</style>

      <div className="mb-5">
        <h1 className="fw-black text-dark m-0" style={{ letterSpacing: '-1px' }}>Tạo Voucher Mới</h1>
        <button className="btn btn-link text-muted p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/vouchers')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <h5 className="section-title">CẤU HÌNH VOUCHER</h5>
          
          <div className="row">
            <div className="col-md-6 form-group-custom">
              <label className="form-label">Mã Voucher (Code)</label>
              <input 
                type="text" 
                name="code"
                className="custom-input" 
                placeholder="Ví dụ: KM50K, CHAOHE2024..." 
                required 
                value={formData.code}
                onChange={handleChange}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Loại giảm giá</label>
              <select 
                name="discount_type"
                className="custom-select"
                value={formData.discount_type}
                onChange={handleChange}
              >
                <option value="PERCENTAGE">Giảm theo phần trăm (%)</option>
                <option value="FIXED_AMOUNT">Giảm số tiền cố định (VNĐ)</option>
              </select>
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Giá trị giảm giá</label>
              <input 
                type="number" 
                name="value"
                className="custom-input" 
                placeholder={formData.discount_type === 'PERCENTAGE' ? 'Ví dụ: 10 (%)' : 'Ví dụ: 50000 (VNĐ)'}
                required 
                value={formData.value}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Giá trị đơn hàng tối thiểu (VNĐ)</label>
              <input 
                type="number" 
                name="min_order_value"
                className="custom-input" 
                placeholder="Ví dụ: 150000" 
                required 
                value={formData.min_order_value}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Ngày bắt đầu</label>
              <input 
                type="date" 
                name="start_date"
                className="custom-input" 
                required 
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Ngày kết thúc</label>
              <input 
                type="date" 
                name="end_date"
                className="custom-input" 
                required 
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Điểm đổi voucher</label>
              <input 
                type="number" 
                name="point_voucher"
                className="custom-input" 
                placeholder="Số điểm cần để đổi mã này..." 
                required 
                value={formData.point_voucher}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Trạng thái mã</label>
              <select 
                name="status"
                className="custom-select"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Đang hoạt động</option>
                <option value="Inactive">Ngưng áp dụng</option>
              </select>
            </div>
          </div>

          <div className="mt-5 border-top pt-4 text-center">
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/vouchers')}>
              HỦY BỎ
            </button>
            <button type="submit" className="btn btn-save">
              XÁC NHẬN TẠO VOUCHER
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVoucher;
