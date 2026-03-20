import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';

const EditStaff = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Dữ liệu mẫu (trong thực tế sẽ fetch từ API)
  const initialData = {
    name: 'Nguyễn Văn A',
    email: 'vana@cinema.com',
    phone: '0901234567',
    birthDate: '1995-05-20',
    role: 'Quản lý',
    status: 'Hoạt động',
    imagePreview: 'https://via.placeholder.com/150'
  };

  const [staff, setStaff] = useState(initialData);
  const [initialStaff] = useState(initialData); // Lưu lại dữ liệu gốc để so sánh
  const [errors, setErrors] = useState({});

  const validate = () => {
    let tempErrors = {};
    if (!staff.name.trim()) tempErrors.name = "Họ tên không được để trống";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!staff.email) {
      tempErrors.email = "Email không được để trống";
    } else if (!emailRegex.test(staff.email)) {
      tempErrors.email = "Email không đúng định dạng";
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!staff.phone) {
      tempErrors.phone = "Số điện thoại không được để trống";
    } else if (!phoneRegex.test(staff.phone)) {
      tempErrors.phone = "Số điện thoại phải có 10 chữ số";
    }

    if (!staff.birthDate) tempErrors.birthDate = "Vui lòng chọn ngày sinh";

    // Kiểm tra xem có thay đổi gì không
    const isUnchanged = JSON.stringify(staff) === JSON.stringify(initialStaff);
    if (isUnchanged) {
      tempErrors.form = "Bạn chưa thay đổi thông tin nào!";
    }
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStaff({
        ...staff,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStaff({ ...staff, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    if (errors.form) setErrors({ ...errors, form: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Updating staff:', staff);
      navigate('/admin/staff');
    }
  };

  return (
    <div className="edit-staff-page">
      <style>
        {`
          .black-input {
            border: 1px solid rgba(0,0,0,0.1) !important;
            color: #000 !important;
            font-weight: 500 !important;
            background-color: #fff !important;
            border-radius: 8px !important;
          }
          .black-input:focus {
            box-shadow: 0 0 0 0.2rem rgba(0, 0, 0, 0.05) !important;
            border-color: #000 !important;
          }
          .black-input.is-invalid {
            border-color: #dc3545 !important;
          }
          .image-upload-wrapper {
            width: 200px;
            height: 200px;
            border: 2px dashed #ddd;
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            overflow: hidden;
            position: relative;
            background: #f8f9fa;
          }
          .image-upload-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        `}
      </style>

      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="link" className="p-0 text-dark" onClick={() => navigate('/admin/staff')}>
          <i className="fas fa-arrow-left fs-4"></i>
        </Button>
        <h2 className="mb-0 fw-bold text-dark">Chỉnh Sửa Nhân Viên #{id}</h2>
      </div>

      {errors.form && (
        <div className="alert alert-warning border-0 shadow-sm mb-4 fw-bold" style={{ borderRadius: '12px' }}>
          <i className="fas fa-exclamation-triangle me-2"></i>{errors.form}
        </div>
      )}

      <Card className="border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
        <Card.Body>
          <Form onSubmit={handleSubmit} noValidate>
            <Row>
              <Col lg={4} className="d-flex flex-column align-items-center mb-4">
                <Form.Label className="fw-bold mb-3 text-dark">Ảnh đại diện</Form.Label>
                <label htmlFor="imageUpload" className="image-upload-wrapper shadow-sm mb-3">
                  <img src={staff.imagePreview} alt="Preview" />
                </label>
                <input type="file" id="imageUpload" className="d-none" accept="image/*" onChange={handleImageChange} />
                <small className="text-muted text-center">Nhấn vào ảnh để thay đổi</small>
              </Col>

              <Col lg={8}>
                <Row className="g-4">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Họ và tên</Form.Label>
                      <Form.Control 
                        type="text" 
                        name="name" 
                        className={`black-input py-2 ${errors.name ? 'is-invalid' : ''}`} 
                        value={staff.name} 
                        onChange={handleInputChange} 
                      />
                      {errors.name && <div className="text-danger small fw-bold mt-1">{errors.name}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Email</Form.Label>
                      <Form.Control 
                        type="email" 
                        name="email" 
                        className={`black-input py-2 ${errors.email ? 'is-invalid' : ''}`} 
                        value={staff.email} 
                        onChange={handleInputChange} 
                      />
                      {errors.email && <div className="text-danger small fw-bold mt-1">{errors.email}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Số điện thoại</Form.Label>
                      <Form.Control 
                        type="tel" 
                        name="phone" 
                        className={`black-input py-2 ${errors.phone ? 'is-invalid' : ''}`} 
                        value={staff.phone} 
                        onChange={handleInputChange} 
                      />
                      {errors.phone && <div className="text-danger small fw-bold mt-1">{errors.phone}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Ngày sinh</Form.Label>
                      <Form.Control 
                        type="date" 
                        name="birthDate" 
                        className={`black-input py-2 ${errors.birthDate ? 'is-invalid' : ''}`} 
                        value={staff.birthDate} 
                        onChange={handleInputChange} 
                      />
                      {errors.birthDate && <div className="text-danger small fw-bold mt-1">{errors.birthDate}</div>}
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Vai trò</Form.Label>
                      <Form.Select 
                        name="role" 
                        className="black-input py-2 text-dark" 
                        value={staff.role} 
                        onChange={handleInputChange}
                      >
                        <option value="Bán vé">Bán vé</option>
                        <option value="Soát vé">Soát vé</option>
                        <option value="Phục vụ">Phục vụ</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Trạng thái</Form.Label>
                      <Form.Select 
                        name="status" 
                        className="black-input py-2 text-dark" 
                        value={staff.status} 
                        onChange={handleInputChange}
                      >
                        <option value="Hoạt động">Đang làm việc</option>
                        <option value="Khóa">Tạm nghỉ / Khóa</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end gap-3 mt-5">
                  <Button variant="light" className="px-4 fw-bold text-secondary" onClick={() => navigate('/admin/staff')}>Hủy</Button>
                  <Button variant="primary" type="submit" className="px-5 fw-bold shadow-sm border-0">Cập Nhật</Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default EditStaff;