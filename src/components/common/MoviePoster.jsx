import React from 'react';

const MoviePoster = ({ src, alt, className = "", style = {} }) => {
  return (
    <div className={`movie-poster-container position-relative ${className}`} style={style}>
      <img src={src} className="w-100" style={{ aspectRatio: '2/3', objectFit: 'cover', borderRadius: '12px' }} alt={alt} />
    </div>
  );
};

export default MoviePoster;
