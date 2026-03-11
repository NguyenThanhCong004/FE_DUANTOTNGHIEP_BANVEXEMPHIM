import React from 'react';

const ReviewItem = ({ review }) => {
  const { user, rating, comment, avatar } = review;
  
  return (
    <div className="review-item border-bottom border-white border-opacity-5 py-4">
      <div className="d-flex align-items-start gap-3">
        <img src={avatar || "https://via.placeholder.com/55"} className="rounded-circle shadow-sm" width="55" height="55" alt="Avatar" />
        <div className="flex-grow-1">
          <h6 className="fw-bold mb-0 text-white">{user}</h6>
          <div className="text-warning small mb-1">
            {[...Array(5)].map((_, i) => (
              <i key={i} className={`${i < rating ? 'fas' : 'far'} fa-star`}></i>
            ))}
          </div>
          <p className="mb-0 text-light opacity-75">{comment}</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewItem;
