import React from 'react';

const MoviePoster = ({ src, alt, ageLimit, isComingSoon = false, className = "", style = {} }) => {
  return (
    <div className={`movie-poster-container position-relative ${className}`} style={style}>
      {ageLimit && (
        <span className={`position-absolute top-0 start-0 badge badge-toon ${isComingSoon ? 'bg-info text-white' : 'bg-danger'} m-3 z-3 shadow-sm`}>
          {ageLimit}
        </span>
      )}
      <img src={src} className="w-100" style={{ aspectRatio: '2/3', objectFit: 'cover', borderRadius: '12px' }} alt={alt} />
    </div>
  );
};

export default MoviePoster;
