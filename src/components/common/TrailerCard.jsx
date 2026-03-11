import React from 'react';

const TrailerCard = ({ trailerUrl, title }) => {
  return (
    <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden bg-white bg-opacity-10" style={{ backdropFilter: 'blur(10px)' }}>
      <div className="card-header bg-dark bg-opacity-50 text-white fw-bold py-3 border-0">
        <i className="fab fa-youtube text-danger me-2"></i>{title || 'TRAILER PHIM'}
      </div>
      <div className="card-body p-0">
        <div className="ratio ratio-16x9">
          <iframe src={trailerUrl} title="Trailer" allowFullScreen></iframe>
        </div>
      </div>
    </div>
  );
};

export default TrailerCard;
