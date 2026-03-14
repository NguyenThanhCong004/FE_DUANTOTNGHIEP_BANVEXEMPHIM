import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateMovieType = () => {
  const navigate = useNavigate();
  const [genreName, setGenreName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Thêm thể loại mới:', genreName);
    alert('Thêm thể loại thành công!');
    navigate('/super-admin/movie-types');
  };

  return (
    <div className="create-movie-type p-4">
      <style>{`
        .form-container {
          background: white;
          border-radius: 15px;
          padding: 40px;
          box-shadow: 0 5px 20px rgba(0,0,0,0.05);
          max-width: 800px;
          margin: 0 auto;
        }

        .form-group-custom {
          margin-bottom: 25px;
        }

        .form-label {
          font-weight: bold;
          color: black;
          margin-bottom: 8px;
          display: block;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
        }

        /* Style ô nhập liệu đồng bộ với CreateMovie */
        .custom-input {
          width: 100%;
          height: 50px;
          padding: 10px 20px;
          background-color: whitesmoke !important;
          border: 2px solid black !important;
          border-radius: 10px;
          color: black !important;
          font-weight: 500;
          outline: none;
          transition: all 0.2s ease;
        }

        .custom-input:focus {
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .btn-save {
          background: black;
          color: white;
          border: 2px solid black;
          padding: 12px 40px;
          border-radius: 10px;
          font-weight: bold;
          transition: all 0.2s;
        }

        .btn-save:hover {
          background: whitesmoke;
          color: black;
        }

        .btn-cancel {
          background: white;
          color: black;
          border: 2px solid black;
          padding: 12px 40px;
          border-radius: 10px;
          font-weight: bold;
          margin-right: 15px;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: black;
          margin-bottom: 25px;
          padding-bottom: 10px;
          border-bottom: 3px solid black;
          display: inline-block;
        }
      `}</style>

      <div className="mb-5">
        <h1 className="fw-black text-dark m-0" style={{ letterSpacing: '-1px' }}>Thêm Thể Loại Phim</h1>
        <button className="btn btn-link text-muted p-0 mt-2 text-decoration-none fw-bold" onClick={() => navigate('/super-admin/movie-types')}>
          <i className="bi bi-arrow-left me-2"></i> TRỞ LẠI DANH SÁCH
        </button>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <h5 className="section-title">THÔNG TIN THỂ LOẠI</h5>
          
          <div className="form-group-custom">
            <label className="form-label">Tên thể loại phim</label>
            <input 
              type="text" 
              className="custom-input" 
              placeholder="Ví dụ: Hành động, Kinh dị, Tâm lý..." 
              required 
              value={genreName}
              onChange={(e) => setGenreName(e.target.value)}
            />
          </div>

          <div className="mt-5 border-top pt-4 text-center">
            <button type="button" className="btn btn-cancel" onClick={() => navigate('/super-admin/movie-types')}>
              HỦY BỎ
            </button>
            <button type="submit" className="btn btn-save">
              XÁC NHẬN LƯU THỂ LOẠI
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMovieType;
