import React from "react";
import { Link } from "react-router-dom";

export default function EventCard({ event }) {
  const imgSrc =
    event?.posterUrl ||
    event?.imageUrl ||
    "https://via.placeholder.com/400x600?text=Event";

  const title = event?.title ?? "Sự kiện";
  const startDate = event?.startDate ? new Date(event.startDate).toLocaleDateString("vi-VN") : null;

  return (
    <div className="card h-100 p-2 shadow-sm border-0">
      <Link to={`/events/${event?.id}`}>
        <img
          src={imgSrc}
          alt={title}
          className="w-100"
          style={{ aspectRatio: "2/3", objectFit: "cover", borderRadius: 12 }}
        />
      </Link>

      <div className="card-body px-1 text-center">
        <h6 className="fw-bold text-dark text-truncate m-0">{title}</h6>
        <p className="text-muted small mb-3">{startDate ? startDate : ""}</p>

        <Link
          to={`/events/${event?.id}`}
          className="btn btn-gradient w-100 rounded-pill fw-bold py-2 small shadow-sm"
        >
          XEM CHI TIẾT
        </Link>
      </div>
    </div>
  );
}

