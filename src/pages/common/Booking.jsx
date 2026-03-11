import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';

const Booking = () => {
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedCombos, setSelectedCombos] = useState({}); 
  
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seatsPerRow = 10;
  const SEAT_PRICE = 95000;

  const toggleSeat = (id) => {
    if (selectedSeats.includes(id)) {
      setSelectedSeats(selectedSeats.filter(s => s !== id));
    } else {
      setSelectedSeats([...selectedSeats, id]);
    }
  };

  const combos = [
    { id: 1, name: "Combo Hoạt Hình", price: 85000, desc: "1 Bắp lớn + 1 Nước ngọt" },
    { id: 2, name: "Combo Đôi Bạn", price: 125000, desc: "1 Bắp lớn + 2 Nước ngọt" }
  ];

  const updateCombo = (id, delta) => {
    setSelectedCombos(prev => {
      const currentQty = prev[id] || 0;
      const newQty = Math.max(0, currentQty + delta);
      return { ...prev, [id]: newQty };
    });
  };

  const seatPriceTotal = selectedSeats.length * SEAT_PRICE;
  const comboPriceTotal = combos.reduce((total, combo) => {
    return total + (combo.price * (selectedCombos[combo.id] || 0));
  }, 0);
  const totalPrice = seatPriceTotal + comboPriceTotal;

  return (
    <Layout>
      <div className="container my-5 pt-4">
        {/* THÔNG TIN PHIM TÓM TẮT */}
        <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white bg-opacity-10" style={{ backdropFilter: 'blur(10px)' }}>
           <div className="d-flex align-items-center flex-wrap gap-4">
              <Link to="/movie/1" className="btn btn-outline-light border-opacity-25 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
                <i className="fas fa-arrow-left text-white"></i>
              </Link>
              <img src="https://www.elleman.vn/app/uploads/2018/04/25/Avengers-Infinity-War-ELLE-Man-featured-01-01.jpg" width="60" height="85" className="rounded shadow-sm" style={{ objectFit:'cover' }} />
              <div className="flex-grow-1">
                 <h5 className="fw-black m-0 text-white uppercase tracking-tighter">AVENGERS: ENDGAME</h5>
                 <div className="d-flex flex-wrap gap-3 mt-1">
                    <small className="text-light opacity-75 fw-bold"><i className="fas fa-video me-1"></i> Đạo diễn: Anthony Russo</small>
                    <small className="text-light opacity-75 fw-bold"><i className="fas fa-globe me-1"></i> Quốc gia: Mỹ</small>
                    <small className="text-light opacity-75 fw-bold"><i className="fas fa-door-open me-1"></i> Phòng: 01</small>
                 </div>
              </div>
              <div className="ms-auto d-none d-md-block text-end">
                 <div className="badge bg-warning bg-opacity-10 text-warning px-3 py-2 rounded-pill fw-bold">
                    <i className="fas fa-hourglass-half me-2"></i>05:00
                 </div>
              </div>
           </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            {/* SƠ ĐỒ GHẾ */}
            <div className="card p-4 border-0 shadow-lg bg-white bg-opacity-10 rounded-5 mb-4" style={{ backdropFilter: 'blur(10px)' }}>
              <div className="text-center mb-5">
                 <div className="mx-auto shadow-sm" style={{ width: '85%', height: '12px', background: 'var(--secondary-gradient)', borderRadius: '100px' }}></div>
                 <small className="text-light opacity-50 fw-bold tracking-widest uppercase mt-2 d-block">Màn Hình</small>
              </div>

              <div className="seat-grid overflow-auto py-3 text-center">
                <div style={{ minWidth: '550px' }}>
                  {rows.map(row => (
                    <div key={row} className="d-flex align-items-center justify-content-center mb-3">
                      <div className="fw-bold text-light opacity-50 me-3" style={{ width: '20px' }}>{row}</div>
                      <div className="d-flex gap-2">
                        {[...Array(seatsPerRow)].map((_, i) => {
                          const id = `${row}${i+1}`;
                          const isSelected = selectedSeats.includes(id);
                          const isVip = row === 'E' || row === 'F';
                          return (
                            <button
                              key={id}
                              onClick={() => toggleSeat(id)}
                              className="border-0 rounded-3 d-flex align-items-center justify-content-center fw-bold transition-all"
                              style={{
                                width: '36px', height: '36px',
                                background: isSelected ? 'var(--primary-gradient)' : (isVip ? 'rgba(251, 140, 0, 0.1)' : 'rgba(255, 255, 255, 0.05)'),
                                color: isSelected ? 'white' : (isVip ? '#FB8C00' : 'rgba(255,255,255,0.6)'),
                                border: isVip && !isSelected ? '1px solid rgba(251, 140, 0, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                                transform: isSelected ? 'scale(1.1) translateY(-3px)' : 'none'
                              }}
                            >
                              {i+1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COMBO BẮP NƯỚC */}
            <div className="card p-4 border-0 shadow-lg bg-white bg-opacity-10 rounded-5" style={{ backdropFilter: 'blur(10px)' }}>
               <h4 className="fw-black text-white mb-4 tracking-tighter uppercase"><i className="fas fa-popcorn text-warning me-3"></i>Combo Bắp Nước</h4>
               <div className="row g-3">
                  {combos.map(combo => (
                    <div key={combo.id} className="col-md-6">
                       <div className="d-flex align-items-center p-3 border border-white border-opacity-10 rounded-4 bg-white bg-opacity-5">
                          <div className="flex-grow-1">
                             <h6 className="fw-bold m-0 text-white">{combo.name}</h6>
                             <div className="fw-bold text-danger small">{combo.price.toLocaleString()}đ</div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                             <button onClick={() => updateCombo(combo.id, -1)} className="btn btn-sm btn-outline-light border-opacity-25 rounded-circle" style={{width:30,height:30,padding:0}}>-</button>
                             <span className="fw-bold text-white mx-1">{selectedCombos[combo.id] || 0}</span>
                             <button onClick={() => updateCombo(combo.id, 1)} className="btn btn-sm btn-light rounded-circle" style={{width:30,height:30,padding:0}}>+</button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card p-4 border-0 shadow-lg rounded-5 bg-white bg-opacity-10 sticky-top" style={{ top: '100px', backdropFilter: 'blur(20px)' }}>
              <h4 className="fw-black text-white mb-4 uppercase tracking-tighter border-bottom border-white border-opacity-10 pb-3">Hóa đơn của bạn</h4>
              
              <div className="bg-white bg-opacity-5 p-3 rounded-4 mb-4">
                 <div className="d-flex justify-content-between mb-2">
                    <span className="text-light opacity-50 small fw-bold">PHIM:</span>
                    <span className="text-white fw-bold text-end small">AVENGERS: ENDGAME</span>
                 </div>
                 
                 <div className="d-flex justify-content-between mb-2 border-top border-white border-opacity-5 pt-2">
                    <span className="text-light opacity-50 small fw-bold">GHẾ ({selectedSeats.length}):</span>
                    <div className="text-end">
                       <div className="text-primary fw-bold small">{selectedSeats.length > 0 ? selectedSeats.join(', ') : '---'}</div>
                       {selectedSeats.length > 0 && <small className="text-light opacity-50">[{SEAT_PRICE.toLocaleString()}đ/ghế]</small>}
                    </div>
                 </div>
                 
                 {combos.map(combo => (selectedCombos[combo.id] > 0) && (
                    <div key={combo.id} className="d-flex justify-content-between mb-2">
                       <span className="text-light opacity-50 small fw-bold">{combo.name.toUpperCase()}:</span>
                       <div className="text-end">
                          <span className="text-warning fw-bold small">x{selectedCombos[combo.id]}</span>
                          <div className="text-light opacity-50" style={{ fontSize:'10px' }}>[{(combo.price).toLocaleString()}đ/món]</div>
                       </div>
                    </div>
                 ))}

                 <div className="d-flex justify-content-between align-items-center mt-3 border-top border-white border-opacity-10 pt-3">
                    <span className="text-light opacity-50 small fw-bold">TỔNG TIỀN:</span>
                    <h3 className="text-danger fw-black m-0">{totalPrice.toLocaleString()}đ</h3>
                 </div>
              </div>

              <Link to="/success" className="btn btn-gradient w-100 rounded-pill py-3 fw-bold shadow-lg">
                THANH TOÁN NGAY <i className="fas fa-magic ms-2"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Booking;
