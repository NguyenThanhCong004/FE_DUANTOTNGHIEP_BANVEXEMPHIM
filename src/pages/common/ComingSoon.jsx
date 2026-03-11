import React from 'react';
import Layout from '../../components/layout/Layout';
import MovieCard from '../../components/common/MovieCard';
import SectionHeader from '../../components/common/SectionHeader';

const ComingSoon = () => {
  const movies = [
    { id: 5, title: 'MINIONS: RISE OF GRU', genre: 'Hoạt hình', posterUrl: 'https://images.moviesanywhere.com/568f6962451515cfb2628469850543f8/2753066a-20e8-4228-a37a-569b0f69903c.jpg', ageLimit: 'P', releaseDate: '20/07/2026' },
    { id: 6, title: 'SPIDER-MAN', genre: 'Hành động', posterUrl: 'https://m.media-amazon.com/images/M/MV5BMzI0NmVkMjEtYmY4MS00ZDMxLTlkZmEtMzU4MDQxYTMzMjU2XkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_.jpg', ageLimit: 'T13', releaseDate: '15/08/2026' }
  ];

  return (
    <Layout>
      <div className="container py-5">
        <SectionHeader 
          title="Phim Sắp Chiếu" 
          gradient="var(--secondary-gradient)" 
          centered={true}
        />
        <div className="row g-4">
          {movies.map(movie => (
            <div key={movie.id} className="col-6 col-md-3">
              <MovieCard movie={movie} isComingSoon={true} />
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ComingSoon;
