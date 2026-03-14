import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';

const AddStaff = () => {
  const navigate = useNavigate();
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    phone: '',
    birthDate: '',
    role: 'Bán vé',
    status: 'Hoạt động',
    image: null,
    imagePreview: 'https://via.placeholder.com/150'
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    let tempErrors = {};
    if (!newStaff.name.trim()) tempErrors.name = "Họ tên không được để trống";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newStaff.email) {
      tempErrors.email = "Email không được để trống";
    } else if (!emailRegex.test(newStaff.email)) {
      tempErrors.email = "Email không đúng định dạng";
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!newStaff.phone) {
      tempErrors.phone = "Số điện thoại không được để trống";
    } else if (!phoneRegex.test(newStaff.phone)) {
      tempErrors.phone = "Số điện thoại phải có 10 chữ số";
    }

    if (!newStaff.birthDate) tempErrors.birthDate = "Vui lòng chọn ngày sinh";
    
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewStaff({
        ...newStaff,
        image: file,
        imagePreview: URL.createObjectURL(file)
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStaff({ ...newStaff, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log('Adding staff:', newStaff);
      navigate('/admin/staff');
    }
  };

  return (
    <div className="add-staff-page">
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
            transition: all 0.3s ease;
            background: #f8f9fa;
          }
          .image-upload-wrapper:hover {
            border-color: #0d6efd;
            background: rgba(13, 110, 253, 0.05);
          }
          .image-upload-wrapper img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        `}
      </style>

      <div className="d-flex align-items-center gap-3 mb-4">
        <Button 
          variant="link" 
          className="p-0 text-dark" 
          onClick={() => navigate('/admin/staff')}
        >
          <i className="fas fa-arrow-left fs-4"></i>
        </Button>
        <h2 className="mb-0 fw-bold text-dark">Thêm Nhân Viên Mới</h2>
      </div>

      <Card className="border-0 shadow-sm p-4" style={{ borderRadius: '20px' }}>
        <Card.Body>
          <Form onSubmit={handleSubmit} noValidate>
            <Row>
              <Col lg={4} className="d-flex flex-column align-items-center mb-4 mb-lg-0">
                <Form.Label className="fw-bold mb-3 text-dark">Ảnh đại diện</Form.Label>
                <label htmlFor="imageUpload" className="image-upload-wrapper shadow-sm mb-3">
                  {newStaff.imagePreview ? (
                    <img src={newStaff.imagePreview} alt="Preview" />
                  ) : (
                    <div className="text-muted text-center">
                      <i className="fas fa-camera fs-1 mb-2"></i>
                      <small className="d-block">Tải ảnh lên</small>
                    </div>
                  )}
                </label>
                <input 
                  type="file" 
                  id="imageUpload" 
                  className="d-none" 
                  accept="image/*" 
                  onChange={handleImageChange}
                />
                <p className="text-muted small text-center px-4">
                  Nên chọn ảnh vuông, dung lượng dưới 2MB.
                </p>
              </Col>

              <Col lg={8}>
                <Row className="g-4">
                  <Col md={12}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Họ và tên nhân viên</Form.Label>
                      <Form.Control 
                        type="text"
                        name="name"
                        className={`black-input py-2 ${errors.name ? 'is-invalid' : ''}`}
                        placeholder="Nhập đầy đủ họ và tên"
                        value={newStaff.name}
                        onChange={handleInputChange}
                      />
                      {errors.name && <div className="text-danger small fw-bold mt-1">{errors.name}</div>}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Địa chỉ Email</Form.Label>
                      <Form.Control 
                        type="email"
                        name="email"
                        className={`black-input py-2 ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="example@cinema.com"
                        value={newStaff.email}
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
                        placeholder="09xx xxx xxx"
                        value={newStaff.phone}
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
                        value={newStaff.birthDate}
                        onChange={handleInputChange}
                      />
                      {errors.birthDate && <div className="text-danger small fw-bold mt-1">{errors.birthDate}</div>}
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold small text-dark">Vai trò / Chức vụ</Form.Label>
                      <Form.Select 
                        name="role"
                        className="black-input py-2 text-dark"
                        value={newStaff.role}
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
                      <Form.Label className="fw-bold small text-dark">Trạng thái làm việc</Form.Label>
                      <Form.Select 
                        name="status"
                        className="black-input py-2 text-dark"
                        value={newStaff.status}
                        onChange={handleInputChange}
                      >
                        <option value="Hoạt động">Đang làm việc</option>
                        <option value="Khóa">Tạm nghỉ / Khóa</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex justify-content-end gap-3 mt-5">
                  <Button 
                    variant="light" 
                    className="px-4 fw-bold text-secondary"
                    onClick={() => navigate('/admin/staff')}
                    style={{ borderRadius: '10px' }}
                  >
                    Hủy bỏ
                  </Button>
                  <Button 
                    variant="primary" 
                    type="submit"
                    className="px-5 fw-bold shadow-sm border-0"
                    style={{ borderRadius: '10px' }}
                  >
                    Lưu Nhân Viên
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AddStaff;