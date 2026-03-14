import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateEmployee = () => {
  const navigate = useNavigate();
  
  // State quản lý form
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullname: '',
    status: 'Active',
    phone: '',
    birthday: '',
    role: 'STAFF',
    cinema: '',
    avatar: null
  });

  const [previewAvatar, setPreviewAvatar] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, avatar: file });
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Ở đây sẽ gọi API để lưu nhân viên. ID sẽ do Backend tự tăng.
    console.log('Dữ liệu gửi đi:', formData);
    alert('Thêm nhân viên thành công! (Dữ liệu ảo)');
    navigate('/super-admin/employees');
  };

  return (
    <div className="create-employee p-4">
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
        }

        /* Style ô nhập liệu giống hệt ô tìm kiếm */
        .custom-input {
          width: 100%;
          height: 50px;
          padding: 10px 20px;
          background-color: whitesmoke !important; /* Nền Whitesmoke */
          border: 2px solid black !important; /* Viền đen 2px */
          border-radius: 10px;
          color: black !important; /* Chữ đen */
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
        }

        .custom-input:focus {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .custom-input::placeholder {
          color: #666;
        }

        /* Phần ảnh đại diện */
        .avatar-section {
          text-center mb-5;
          padding: 20px;
          border: 2px solid black;
          border-radius: 15px;
          background: whitesmoke;
          margin-bottom: 30px;
        }

        .avatar-preview {
          width: 130px;
          height: 130px;
          border-radius: 10px;
          border: 2px solid black;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: white;
          margin: 0 auto 15px;
          cursor: pointer;
        }

        .avatar-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Nút bấm */
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

        .section-header-box {
          background: black;
          color: white;
          padding: 12px 20px;
          border-radius: 10px;
          font-weight: 800;
          font-size: 1rem;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }
      `}</style>

      <div className="mb-5">
        <h1 className="fw-black text-dark m-0" style={{ letterSpacing: '-1px' }}>Thêm Nhân Viên Mới</h1>
        <button className="btn btn-link text-muted p-3 mb-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/employees')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          {/* Avatar Section */}
          <div className="avatar-section text-center d-flex flex-column align-items-center">
            <h5 className="section-title w-100">ẢNH ĐẠI DIỆN NHÂN VIÊN</h5>
            <div className="avatar-preview" onClick={() => document.getElementById('avatar-input').click()}>
              {previewAvatar ? (
                <img src={previewAvatar} alt="Preview" />
              ) : (
                <div className="text-center">
                  <i className="bi bi-cloud-arrow-up fs-1 text-primary mb-1"></i>
                  <div className="small fw-bold text-muted">TẢI ẢNH LÊN</div>
                </div>
              )}
            </div>
            <input 
              type="file" 
              id="avatar-input" 
              hidden 
              accept="image/*" 
              onChange={handleAvatarChange}
            />
            <p className="text-muted small mt-2 mb-0">Hỗ trợ JPG, PNG. Tối đa 2MB.</p>
          </div>

          <h5 className="section-title">THÔNG TIN TÀI KHOẢN & CÁ NHÂN</h5>
          <div className="row">
            <div className="col-md-6 form-group-custom">
              <label className="form-label">Họ và Tên</label>
              <input 
                type="text" 
                name="fullname"
                className="custom-input" 
                placeholder="Ví dụ: Nguyễn Văn A" 
                required
                value={formData.fullname}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Địa chỉ Email</label>
              <input 
                type="email" 
                name="email"
                className="custom-input" 
                placeholder="email@example.com" 
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Mật khẩu</label>
              <input 
                type="password" 
                name="password"
                className="custom-input" 
                placeholder="Nhập mật khẩu bảo mật" 
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Số điện thoại</label>
              <input 
                type="tel" 
                name="phone"
                className="custom-input" 
                placeholder="09xx xxx xxx" 
                required
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Ngày sinh</label>
              <input 
                type="date" 
                name="birthday"
                className="custom-input" 
                required
                value={formData.birthday}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Vai trò hệ thống</label>
              <select 
                name="role"
                className="custom-input"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="STAFF">Nhân viên (Staff)</option>
                <option value="ADMIN">Quản trị viên (Admin)</option>
              </select>
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Trực thuộc rạp</label>
              <select 
                name="cinema"
                className="custom-input"
                required
                value={formData.cinema}
                onChange={handleChange}
              >
                <option value="">-- Chọn rạp chiếu phim --</option>
                <option value="all">Tất cả rạp (Quản trị tổng)</option>
                <option value="cgv_vincom">CGV Vincom Center</option>
                <option value="lotte_cinema">Lotte Cinema Gò Vấp</option>
                <option value="bhd_star">BHD Star Thảo Điền</option>
                <option value="galaxy_cinema">Galaxy Nguyễn Du</option>
              </select>
            </div>

            <div className="col-md-6 form-group-custom">
              <label className="form-label">Trạng thái tài khoản</label>
              <select 
                name="status"
                className="custom-input"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="Active">Đang hoạt động</option>
                <option value="Inactive">Tạm khóa tài khoản</option>
              </select>
            </div>


            <div className="col-12 mt-4 border-top pt-4 text-center">
              <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/employees')}>
                HỦY BỎ
              </button>
              <button type="submit" className="btn btn-save">
                XÁC NHẬN LƯU NHÂN VIÊN
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEmployee;
