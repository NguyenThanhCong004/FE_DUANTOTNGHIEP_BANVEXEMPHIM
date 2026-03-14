import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateSeatType = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    price: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Dữ liệu loại ghế mới:', formData);
    alert('Thêm loại ghế thành công!');
    navigate('/super-admin/seat-types');
  };

  return (
    <div className="create-seat-type p-4">
      <style>{`
        .form-container {
          background: white;
          border-radius: 15px;
          padding: 40px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
          max-width: 800px;
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

        .custom-input {
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

        .custom-input:focus {
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
        <h1 className="fw-black text-dark m-0" style={{ letterSpacing: '-1px' }}>Thêm Loại Ghế Mới</h1>
        <button className="btn btn-link text-muted p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/seat-types')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <h5 className="section-title">THÔNG TIN LOẠI GHẾ</h5>
          
          <div className="form-group-custom">
            <label className="form-label">Tên loại ghế</label>
            <input 
              type="text" 
              name="name"
              className="custom-input" 
              placeholder="Ví dụ: Ghế VIP, Ghế Sweetbox..." 
              required 
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group-custom">
            <label className="form-label">Giá phụ thu (VNĐ)</label>
            <input 
              type="number" 
              name="price"
              className="custom-input" 
              placeholder="Ví dụ: 90000" 
              required 
              value={formData.price}
              onChange={handleChange}
            />
            <p className="text-muted small mt-2">Mức giá này sẽ được áp dụng khi khách hàng chọn loại ghế này.</p>
          </div>

          <div className="mt-5 border-top pt-4 text-center">
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/seat-types')}>
              HỦY BỎ
            </button>
            <button type="submit" className="btn btn-save">
              XÁC NHẬN LƯU LOẠI GHẾ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSeatType;
