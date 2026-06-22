import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, Newspaper } from "lucide-react";
import { formatDate } from "../../utils/formatters";

export default function EventCard({ event }) {
  const imgSrc = event?.posterUrl || event?.imageUrl || "";
  const title = event?.title ?? "Sự kiện";
  const dateLabel =
    event?.dateLabel ||
    (event?.startDate
      ? formatDate(event.startDate, {
          day: "2-digit",
          month: "long",
          year: "numeric",
        })
      : null);
  const excerpt = event?.excerpt || event?.summary || "";

  return (
    <Link to={`/events/${event?.id}`} className="event-post-card" aria-label={`Xem bài viết ${title}`}>
      <div className="event-post-media">
        {imgSrc ? (
          <img src={imgSrc} alt={title} />
        ) : (
          <div className="event-post-empty">
            <Newspaper size={34} />
          </div>
        )}
      </div>

      <div className="event-post-body">
        {dateLabel && (
          <div className="event-post-meta">
            <CalendarDays size={15} />
            {dateLabel}
          </div>
        )}

        <h3 className="event-post-title">{title}</h3>
        {excerpt && <p className="event-post-excerpt">{excerpt}</p>}

        <span className="event-post-action">
          Đọc thêm
          <ArrowRight size={15} />
        </span>
      </div>
    </Link>
  );
}
