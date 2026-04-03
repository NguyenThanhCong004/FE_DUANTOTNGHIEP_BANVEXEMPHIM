import React from 'react';

const ReviewItem = ({ review }) => {
  const { user, rating, comment, avatar } = review;

  const fallbackLetter = String(user ?? "")
    .trim()
    .split(/\s+/)
    .slice(-1)[0]?.[0]
    ?.toUpperCase();
  
  return (
    <div className="review-item border-bottom border-white border-opacity-5 py-4">
      <div className="d-flex align-items-start gap-3">
        {avatar ? (
          <img src={avatar} className="rounded-circle shadow-sm" width="55" height="55" alt="Avatar" />
        ) : (
          <div
            className="rounded-circle shadow-sm d-flex align-items-center justify-content-center"
            style={{ width: 55, height: 55, background: "linear-gradient(135deg,#7b1fa2,#e91e8c)", color: "#fff", fontWeight: 900 }}
          >
            {fallbackLetter || "?"}
          </div>
        )}
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
