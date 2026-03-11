import React from 'react';

const ComboCard = ({ combo }) => {
  return (
    <div className="card h-100 p-3 border-0 bg-white bg-opacity-10 text-center shadow-sm" style={{ backdropFilter: 'blur(10px)' }}>
      <div className="bg-white bg-opacity-10 rounded-4 p-4 mb-3 mx-auto shadow-inner" style={{ width: 'fit-content' }}>
        <img src={combo.img} width="80" height="80" style={{ objectFit: 'contain' }} alt={combo.name} />
      </div>
      <h6 className="fw-bold text-white mb-1 text-truncate">{combo.name}</h6>
      <p className="text-light opacity-50 small mb-3">{combo.desc}</p>
      <div className="fw-black text-warning fs-5">{(combo.price).toLocaleString()}đ</div>
    </div>
  );
};

export default ComboCard;
