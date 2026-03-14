import React, { useState } from 'react';
import { Card, Button, Badge, Form, Row, Col, InputGroup, Modal, ProgressBar, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { Search, Filter, Edit3, CheckCircle2, XCircle, Package, DollarSign, ShoppingBag, AlertCircle, Hash, Tag } from 'lucide-react';

const ProductManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [products, setProducts] = useState([
    { 
      product_id: 'PROD-001', 
      CategoriesProducts_id: 'Bắp rang', 
      name: 'Bắp rang bơ mặn (M)', 
      description: 'Bắp rang tươi mới mỗi ngày với hương vị bơ mặn truyền thống.',
      price: 45000, 
      cinema_price: 50000,
      stock: 150,
      max_stock: 200,
      image: '🍿', 
      gradient: 'linear-gradient(135deg, #FFD662 0%, #FFB200 100%)',
      is_selling: true 
    },
    { 
      product_id: 'PROD-002', 
      CategoriesProducts_id: 'Bắp rang', 
      name: 'Bắp rang Caramen (L)', 
      description: 'Hạt bắp nổ đều, phủ lớp caramen vàng óng, giòn tan.',
      price: 55000, 
      cinema_price: 65000,
      stock: 45,
      max_stock: 200,
      image: '🍿', 
      gradient: 'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)',
      is_selling: true 
    },
    { 
      product_id: 'PROD-003', 
      CategoriesProducts_id: 'Nước uống', 
      name: 'Coca Cola 500ml', 
      description: 'Nước giải khát có ga giúp tăng thêm hương vị.',
      price: 20000, 
      cinema_price: 25000,
      stock: 300,
      max_stock: 500,
      image: '🥤', 
      gradient: 'linear-gradient(135deg, #FEB692 0%, #EA5455 100%)',
      is_selling: true 
    },
    { 
      product_id: 'PROD-004', 
      CategoriesProducts_id: 'Combo', 
      name: 'Combo Couple', 
      description: 'Bao gồm 1 Bắp XL và 2 Nước L - Tiết kiệm hơn.',
      price: 110000, 
      cinema_price: 130000,
      stock: 15,
      max_stock: 100,
      image: '🍱', 
      gradient: 'linear-gradient(135deg, #81FFEF 0%, #F067B4 100%)',
      is_selling: false 
    },
    { 
      product_id: 'PROD-005', 
      CategoriesProducts_id: 'Nước uống', 
      name: 'Nước cam ép', 
      description: 'Nước cam ép nguyên chất, giàu vitamin C.',
      price: 30000, 
      cinema_price: 40000,
      stock: 85,
      max_stock: 150,
      image: '🍊', 
      gradient: 'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)',
      is_selling: true 
    }
  ]);

  const toggleSelling = (id) => {
    setProducts(products.map(p => 
      p.product_id === id ? { ...p, is_selling: !p.is_selling } : p
    ));
  };

  const handleEdit = (product) => {
    setSelectedProduct({ ...product });
    setShowEditModal(true);
  };

  const saveChanges = () => {
    setProducts(products.map(p => p.product_id === selectedProduct.product_id ? selectedProduct : p));
    setShowEditModal(false);
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.product_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'All' || p.CategoriesProducts_id === filterCategory;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="product-page-compact text-dark pb-4">
      <style>{`
        .product-page-compact { background: #f8fafc; font-size: 0.9rem; }
        .stat-card {
          border-radius: 16px;
          border: none;
          background: #fff;
          padding: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }
        .stat-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 10px;
        }
        .stat-card h3 { font-size: 1.25rem; font-weight: 800; margin: 0; }
        
        .compact-search-bar {
          background: #fff;
          border-radius: 14px;
          padding: 8px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.03);
        }
        .compact-input {
          border: none;
          padding: 8px 15px 8px 40px;
          border-radius: 10px;
          background: #f1f5f9;
          font-weight: 600;
          font-size: 0.85rem;
          color: #1e293b !important;
        }
        
        .product-compact-card {
          border-radius: 20px;
          border: 1px solid #f1f5f9;
          background: #fff;
          overflow: hidden;
          transition: all 0.3s ease;
          height: 100%;
        }
        .product-compact-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.06);
        }
        .image-container {
          height: 130px;
          display: flex; align-items: center; justify-content: center;
          font-size: 3.5rem;
          position: relative;
          margin: 8px;
          border-radius: 14px;
        }
        .id-label {
          position: absolute; top: 10px; left: 10px;
          background: rgba(255,255,255,0.25);
          backdrop-filter: blur(5px);
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.6rem; font-weight: 800; color: #fff;
        }
        .selling-status {
          position: absolute; top: 10px; right: 10px;
          padding: 4px 10px; border-radius: 8px;
          font-size: 0.65rem; font-weight: 700;
        }
        
        .content-body { padding: 16px; }
        .category-pill {
          padding: 2px 8px; border-radius: 6px;
          font-size: 0.6rem; font-weight: 800;
          text-transform: uppercase;
          background: #f8fafc; color: #94a3b8;
          margin-bottom: 8px; display: inline-block;
        }
        .product-name { font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; line-height: 1.2; height: 2.4em; overflow: hidden; }
        .price-tag { font-size: 1.1rem; font-weight: 900; color: #0d6efd; }
        .system-price { font-size: 0.75rem; color: #94a3b8; text-decoration: line-through; margin-left: 8px; }
        
        .progress-xs { height: 4px; border-radius: 10px; background: #f1f5f9; }
        .stock-label { font-size: 0.7rem; font-weight: 700; color: #64748b; }
        
        .action-btn-sm {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .btn-compact {
          border-radius: 12px;
          padding: 8px 15px;
          font-weight: 700;
          font-size: 0.8rem;
        }
        
        /* Fix màu chữ trong modal */
        .modal-input-custom {
          background: transparent !important;
          border: none !important;
          font-weight: 800 !important;
          color: #1e293b !important;
          font-size: 1.1rem !important;
        }
        .modal-input-custom:focus {
          color: #0d6efd !important;
          box-shadow: none !important;
        }
      `}</style>

      {/* Header Stats */}
      <Row className="mb-4 g-3">
        <Col md={4}>
          <div className="stat-card d-flex align-items-center gap-3">
            <div className="stat-icon bg-primary-subtle text-primary mb-0"><ShoppingBag size={20}/></div>
            <div>
              <p className="text-muted small fw-bold text-uppercase mb-0" style={{fontSize: '0.65rem'}}>Đang kinh doanh</p>
              <h3>{products.filter(p => p.is_selling).length} <small className="fs-6 text-muted fw-normal">SP</small></h3>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="stat-card d-flex align-items-center gap-3">
            <div className="stat-icon bg-warning-subtle text-warning mb-0"><AlertCircle size={20}/></div>
            <div>
              <p className="text-muted small fw-bold text-uppercase mb-0" style={{fontSize: '0.65rem'}}>Cần nhập kho</p>
              <h3>{products.filter(p => p.stock < 50).length} <small className="fs-6 text-muted fw-normal">SP</small></h3>
            </div>
          </div>
        </Col>
        <Col md={4}>
          <div className="stat-card d-flex align-items-center gap-3">
            <div className="stat-icon bg-info-subtle text-info mb-0"><Package size={20}/></div>
            <div>
              <p className="text-muted small fw-bold text-uppercase mb-0" style={{fontSize: '0.65rem'}}>Tổng danh mục</p>
              <h3>3 <small className="fs-6 text-muted fw-normal">Loại</small></h3>
            </div>
          </div>
        </Col>
      </Row>

      {/* Search & Filter */}
      <div className="compact-search-bar mb-4">
        <Row className="g-2 align-items-center">
          <Col md={7} className="position-relative">
            <Search size={16} className="position-absolute" style={{left: '25px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8'}} />
            <Form.Control 
              className="compact-input"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col md={5}>
            <div className="d-flex gap-2">
              <Form.Select 
                className="compact-input border-0"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">Tất cả</option>
                <option value="Bắp rang">Bắp</option>
                <option value="Nước uống">Nước</option>
                <option value="Combo">Combo</option>
              </Form.Select>
              <Button variant="dark" className="rounded-3 px-3 py-1"><Filter size={16}/></Button>
            </div>
          </Col>
        </Row>
      </div>

      {/* Product Grid */}
      <Row className="g-3">
        {filteredProducts.map((p) => (
          <Col key={p.product_id} xs={12} sm={6} md={4} xl={3}>
            <div className="product-compact-card">
              <div className="image-container" style={{ background: p.gradient }}>
                <div className="id-label">{p.product_id}</div>
                <div className={`selling-status ${p.is_selling ? 'bg-white text-success' : 'bg-dark text-white'}`}>
                  {p.is_selling ? '● Bán' : '○ Ẩn'}
                </div>
                {p.image}
              </div>

              <div className="content-body">
                <span className="category-pill">{p.CategoriesProducts_id}</span>
                <h4 className="product-name">{p.name}</h4>
                
                <div className="d-flex align-items-center mb-3">
                  <span className="price-tag">{p.cinema_price.toLocaleString()}đ</span>
                  <span className="system-price">{p.price.toLocaleString()}đ</span>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="stock-label">Tồn kho</span>
                    <span className={`stock-label ${p.stock < 50 ? 'text-danger' : 'text-primary'}`}>{p.stock}/{p.max_stock}</span>
                  </div>
                  <ProgressBar now={(p.stock/p.max_stock)*100} variant={p.stock < 50 ? 'danger' : 'primary'} className="progress-xs" />
                </div>

                <div className="d-flex gap-2">
                  <Button 
                    variant="primary" 
                    className="btn-compact w-100 d-flex align-items-center justify-content-center gap-1"
                    onClick={() => handleEdit(p)}
                  >
                    <Edit3 size={14} /> Thiết lập
                  </Button>
                  <button 
                    className={`action-btn-sm border-0 ${p.is_selling ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}
                    onClick={() => toggleSelling(p.product_id)}
                  >
                    {p.is_selling ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Modal Compact */}
      <Modal 
        show={showEditModal} 
        onHide={() => setShowEditModal(false)} 
        centered
        size="sm"
        contentClassName="border-0 shadow-lg"
        style={{ borderRadius: '25px' }}
      >
        <Modal.Body className="p-0 overflow-hidden">
          {selectedProduct && (
            <div className="d-flex flex-column">
              <div className="p-4 text-center text-white" style={{ background: selectedProduct.gradient }}>
                <div className="fs-1 mb-2">{selectedProduct.image}</div>
                <h5 className="fw-black mb-0">{selectedProduct.name}</h5>
                <Badge bg="white" text="dark" className="rounded-pill px-2 py-1 small opacity-75">{selectedProduct.product_id}</Badge>
              </div>
              
              <div className="p-4 bg-white" style={{marginTop: '-20px', borderRadius: '30px 30px 0 0'}}>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className="stock-label text-uppercase mb-2">Giá bán (VNĐ)</Form.Label>
                    <InputGroup className="bg-light rounded-3 p-1 border">
                      <InputGroup.Text className="bg-transparent border-0 py-0"><DollarSign size={16} className="text-primary"/></InputGroup.Text>
                      <Form.Control 
                        type="number"
                        className="modal-input-custom"
                        value={selectedProduct.cinema_price}
                        onChange={(e) => setSelectedProduct({...selectedProduct, cinema_price: parseInt(e.target.value) || 0})}
                      />
                    </InputGroup>
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Label className="stock-label text-uppercase mb-2">Tồn kho thực tế</Form.Label>
                    <InputGroup className="bg-light rounded-3 p-1 border">
                      <InputGroup.Text className="bg-transparent border-0 py-0"><Package size={16} className="text-warning"/></InputGroup.Text>
                      <Form.Control 
                        type="number"
                        className="modal-input-custom"
                        value={selectedProduct.stock}
                        onChange={(e) => setSelectedProduct({...selectedProduct, stock: parseInt(e.target.value) || 0})}
                      />
                    </InputGroup>
                  </Form.Group>

                  <div className="d-flex gap-2">
                    <Button variant="light" className="w-100 py-2 rounded-3 fw-bold border small" onClick={() => setShowEditModal(false)}>Hủy</Button>
                    <Button variant="primary" className="w-100 py-2 rounded-3 fw-bold shadow-sm small" onClick={saveChanges}>Lưu</Button>
                  </div>
                </Form>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default ProductManagement;