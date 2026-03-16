import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Row, Col, Card, Badge, InputGroup } from 'react-bootstrap';
import { ArrowLeft, Film, Calendar, Percent, Info, CheckCircle2, X } from 'lucide-react';

const AddPromotion = () => {
  const navigate = useNavigate();
  
  // Danh sách phim giả lập
  const mockMovies = [
    { id: 1, title: 'Lật Mặt 7: Một Điều Ước' },
    { id: 2, title: 'Doraemon: Bản Tình Ca Của Nobita' },
    { id: 3, title: 'Hành Tinh Khỉ: Vương Quốc Mới' },
    { id: 4, title: 'Mai' },
    { id: 5, title: 'Kung Fu Panda 4' },
    { id: 6, title: 'Godzilla x Kong' },
  ];

  const [formData, setFormData] = useState({
    title: '',
    discount_percent: '',
    start_date: '',
    end_date: '',
    selectedMovieIds: [], // Lưu danh sách ID phim được chọn
    description: ''
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const toggleMovieSelection = (movieId) => {
    const isSelected = formData.selectedMovieIds.includes(movieId);
    if (isSelected) {
      setFormData({
        ...formData,
        selectedMovieIds: formData.selectedMovieIds.filter(id => id !== movieId)
      });
    } else {
      setFormData({
        ...formData,
        selectedMovieIds: [...formData.selectedMovieIds, movieId]
      });
    }
    if (errors.movies) setErrors({ ...errors, movies: '' });
  };

  const selectAllMovies = () => {
    if (formData.selectedMovieIds.length === mockMovies.length) {
      setFormData({ ...formData, selectedMovieIds: [] });
    } else {
      setFormData({ ...formData, selectedMovieIds: mockMovies.map(m => m.id) });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let newErrors = {};
    if (!formData.title) newErrors.title = 'Tên khuyến mãi không được để trống';
    if (!formData.discount_percent || formData.discount_percent <= 0 || formData.discount_percent > 100) 
      newErrors.discount_percent = 'Phần trăm giảm giá từ 1-100%';
    if (!formData.start_date) newErrors.start_date = 'Chọn ngày bắt đầu';
    if (!formData.end_date) newErrors.end_date = 'Chọn ngày kết thúc';
    if (formData.selectedMovieIds.length === 0) newErrors.movies = 'Vui lòng chọn ít nhất 1 phim';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    console.log('Promotion created:', formData);
    navigate('/admin/promotions');
  };

  return (
    <div className="add-promotion-page text-dark pb-5">
      <style>{`
        .promo-input {
          border-radius: 10px !important;
          border: 1.5px solid #eee !important;
          padding: 10px 15px !important;
          color: #000 !important; /* Chữ nhập vào màu đen */
        }
        .promo-input::placeholder {
          color: #000 !important; /* Chữ gợi ý màu đen */
          opacity: 0.6; /* Làm mờ nhẹ để vẫn phân biệt được với chữ đã nhập */
        }
        .movie-badge-item {
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid #eee;
          user-select: none;
        }
        .movie-badge-item.selected {
          background-color: #0d6efd !important;
          color: white !important;
          border-color: #0d6efd;
          transform: scale(1.05);
        }
        .movie-list-container {
          max-height: 250px;
          overflow-y: auto;
          border: 1.5px solid #eee;
          border-radius: 12px;
          padding: 15px;
        }
      `}</style>

      <div className="d-flex align-items-center gap-3 mb-4">
        <Button variant="light" className="rounded-circle p-2 shadow-sm" onClick={() => navigate('/admin/promotions')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h3 className="mb-0 fw-bold">Tạo khuyến mãi đa phim</h3>
          <p className="text-muted small mb-0">Thiết lập mức giảm giá cho một hoặc nhiều bộ phim cùng lúc</p>
        </div>
      </div>

      <Form onSubmit={handleSubmit}>
        <Row className="justify-content-center">
          <Col lg={11}>
            <Card className="border-0 shadow-sm p-4 rounded-4">
              <Row>
                {/* Cột 1: Thông tin & Giá trị */}
                <Col md={5} className="border-end pe-md-4">
                  <div className="d-flex align-items-center gap-2 mb-3 text-primary">
                    <Info size={20} />
                    <h5 className="fw-bold mb-0">Thông tin ưu đãi</h5>
                  </div>

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Tên chương trình</Form.Label>
                    <Form.Control
                      name="title"
                      placeholder="VD: Ưu đãi phim tháng 3"
                      className={`promo-input ${errors.title ? 'is-invalid' : ''}`}
                      value={formData.title}
                      onChange={handleInputChange}
                    />
                    {errors.title && <div className="text-danger small mt-1">{errors.title}</div>}
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="small fw-bold text-muted">Phần trăm điều chỉnh (%)</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        name="discount_percent"
                        placeholder="VD: 20 hoặc -10"
                        className={`promo-input ${errors.discount_percent ? 'is-invalid' : ''}`}
                        value={formData.discount_percent}
                        onChange={handleInputChange}
                      />
                      <InputGroup.Text className="bg-light border-start-0 rounded-end-3">
                        <Percent size={16} />
                      </InputGroup.Text>
                    </InputGroup>
                    {errors.discount_percent && <div className="text-danger small mt-1">{errors.discount_percent}</div>}
                  </Form.Group>

                  <div className="d-flex align-items-center gap-2 mb-3 text-primary">
                    <Calendar size={20} />
                    <h5 className="fw-bold mb-0">Thời hạn áp dụng</h5>
                  </div>

                  <Row className="g-2 mb-4">
                    <Col>
                      <Form.Label className="small fw-bold text-muted">Từ ngày</Form.Label>
                      <Form.Control
                        type="date"
                        name="start_date"
                        className={`promo-input ${errors.start_date ? 'is-invalid' : ''}`}
                        value={formData.start_date}
                        onChange={handleInputChange}
                      />
                    </Col>
                    <Col>
                      <Form.Label className="small fw-bold text-muted">Đến ngày</Form.Label>
                      <Form.Control
                        type="date"
                        name="end_date"
                        className={`promo-input ${errors.end_date ? 'is-invalid' : ''}`}
                        value={formData.end_date}
                        onChange={handleInputChange}
                      />
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label className="small fw-bold text-muted">Mô tả (Không bắt buộc)</Form.Label>
                    <Form.Control
                      as="textarea"
                      name="description"
                      rows={2}
                      className="promo-input"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>

                {/* Cột 2: Chọn phim */}
                <Col md={7} className="ps-md-4 mt-4 mt-md-0">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="d-flex align-items-center gap-2 text-primary">
                      <Film size={20} />
                      <h5 className="fw-bold mb-0">Chọn phim áp dụng</h5>
                    </div>
                    <Button variant="link" size="sm" className="text-decoration-none fw-bold" onClick={selectAllMovies}>
                      {formData.selectedMovieIds.length === mockMovies.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </Button>
                  </div>

                  <div className={`movie-list-container ${errors.movies ? 'border-danger' : ''}`}>
                    <div className="d-flex flex-wrap gap-2">
                      {mockMovies.map(movie => (
                        <Badge 
                          key={movie.id} 
                          bg="light" 
                          text="dark"
                          className={`movie-badge-item px-3 py-2 rounded-pill fw-normal d-flex align-items-center gap-2 ${formData.selectedMovieIds.includes(movie.id) ? 'selected' : ''}`}
                          onClick={() => toggleMovieSelection(movie.id)}
                        >
                          {formData.selectedMovieIds.includes(movie.id) && <CheckCircle2 size={14} />}
                          {movie.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {errors.movies && <div className="text-danger small mt-2 fw-bold">{errors.movies}</div>}

                  <div className="mt-4 p-3 bg-light rounded-3">
                    <h6 className="fw-bold small mb-2">Tóm tắt áp dụng:</h6>
                    <div className="d-flex flex-wrap gap-1">
                      {formData.selectedMovieIds.length > 0 ? (
                        formData.selectedMovieIds.map(id => (
                          <Badge key={id} bg="primary" className="fw-normal">
                            {mockMovies.find(m => m.id === id)?.title}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted small italic">Chưa có phim nào được chọn</span>
                      )}
                    </div>
                  </div>

                  <div className="d-grid gap-2 mt-4 pt-3">
                    <Button type="submit" variant="primary" className="py-2 fw-bold shadow-sm rounded-3">
                      Lưu và Phát hành khuyến mãi
                    </Button>
                    <Button variant="outline-secondary" className="py-2 border-0" onClick={() => navigate('/admin/promotions')}>
                      Hủy bỏ
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddPromotion;
