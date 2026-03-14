import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateMembershipLevel = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    rank_name: '',
    min_spending: '',
    description: '',
    discount_percent: '',
    bonus_point: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Dữ liệu mức độ hội viên mới:', formData);
    alert('Thêm mức độ hội viên thành công!');
    navigate('/super-admin/membership-levels');
  };

  return (
    <div className="create-membership p-4">
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

        .custom-input, .custom-textarea {
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

        .custom-textarea {
          min-height: 100px;
          padding-top: 12px;
        }

        .custom-input:focus, .custom-textarea:focus {
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
          margin-bottom: 25px;
          color: black;
          padding-bottom: 10px;
          border-bottom: 3px solid black;
          display: inline-block;
        }
      `}</style>

      <div className="mb-5">
        <h1 className="fw-black text-dark m-0" style={{ letterSpacing: '-1px' }}>Thêm Mức Độ Hội Viên</h1>
        <button className="btn btn-link text-muted p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/membership-levels')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <h5 className="section-title">THÔNG TIN HẠNG THÀNH VIÊN</h5>
          
          <div className="row">
            <div className="col-md-6 form-group-custom">
              <label className="form-label">Tên hạng (Rank Name)</label>
              <input 
                type="text" 
                name="rank_name"
                className="custom-input" 
                placeholder="Ví dụ: SILVER, GOLD, DIAMOND..." 
                required 
                value={formData.rank_name}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Chi tiêu tối thiểu (VNĐ)</label>
              <input 
                type="number" 
                name="min_spending"
                className="custom-input" 
                placeholder="Ví dụ: 5000000" 
                required 
                value={formData.min_spending}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 form-group-custom">
              <label className="form-label">Mô tả hạng hội viên</label>
              <textarea 
                name="description"
                className="custom-textarea" 
                placeholder="Nhập mô tả các đặc quyền của hạng này..." 
                value={formData.description}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Giảm giá vé (%)</label>
              <input 
                type="number" 
                name="discount_percent"
                className="custom-input" 
                placeholder="Ví dụ: 10" 
                required 
                value={formData.discount_percent}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Hệ số điểm thưởng (Bonus Point)</label>
              <input 
                type="number" 
                name="bonus_point"
                className="custom-input" 
                placeholder="Ví dụ: 2 (x2 điểm thưởng)" 
                required 
                value={formData.bonus_point}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mt-5 border-top pt-4 text-center">
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/membership-levels')}>
              HỦY BỎ
            </button>
            <button type="submit" className="btn btn-save">
              XÁC NHẬN LƯU MỨC ĐỘ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMembershipLevel;
