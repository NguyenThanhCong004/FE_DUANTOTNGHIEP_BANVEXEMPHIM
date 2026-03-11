import React from 'react';
import { Link } from 'react-router-dom';
import MoviePoster from './MoviePoster';

const MovieCard = ({ movie, isComingSoon = false }) => {
  return (
    <div className={`card h-100 p-2 shadow-sm border-0 ${isComingSoon ? 'bg-white bg-opacity-75' : ''}`} 
         style={isComingSoon ? { filter: 'grayscale(0.4)' } : {}}>
      <Link to={`/movie/${movie.id}`}>
        <MoviePoster 
          src={movie.posterUrl} 
          alt={movie.title} 
          ageLimit={movie.ageLimit} 
          isComingSoon={isComingSoon} 
        />
      </Link>
      <div className="card-body px-1 text-center">
        <h6 className={`fw-bold text-dark text-truncate m-0 ${!isComingSoon ? 'text-uppercase' : ''}`}>{movie.title}</h6>
        {isComingSoon ? (
          <p className="text-primary small fw-bold mt-2 mb-0"><i className="far fa-calendar-alt me-2"></i>{movie.releaseDate}</p>
        ) : (
          <>
            <p className="text-muted small mb-3">{movie.genre}</p>
            <Link to={`/movie/${movie.id}`} className="btn btn-gradient w-100 rounded-pill fw-bold py-2 small shadow-sm">
              MUA VÉ
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
