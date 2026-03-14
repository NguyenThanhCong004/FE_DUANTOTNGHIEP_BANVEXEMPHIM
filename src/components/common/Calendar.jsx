import React, { useState, useMemo } from 'react';
import { Button, Badge, Row, Col } from 'react-bootstrap';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  differenceInDays,
  isWithinInterval,
  startOfDay,
  endOfDay
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const Calendar = ({ events, onEventClick, renderEvent }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Tính toán các ngày hiển thị trong lịch
  const { days, monthStart, monthEnd, startDate, endDate } = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = startDate;
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    return { days, monthStart, monthEnd, startDate, endDate };
  }, [currentMonth]);

  // Chia danh sách ngày thành từng tuần
  const weeks = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [days]);

  const renderHeader = () => {
    return (
      <div className="d-flex justify-content-between align-items-center mb-4 px-4 pt-4">
        <h4 className="fw-bold mb-0 text-capitalize text-primary">
          {format(currentMonth, 'MMMM yyyy', { locale: vi })}
        </h4>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" size="sm" onClick={prevMonth} className="rounded-circle p-2">
            <ChevronLeft size={20} />
          </Button>
          <Button variant="outline-primary" size="sm" onClick={() => setCurrentMonth(new Date())} className="px-3 fw-bold">
            Tháng này
          </Button>
          <Button variant="outline-primary" size="sm" onClick={nextMonth} className="rounded-circle p-2">
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    );
  };

  const renderDayNames = () => {
    const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    return (
      <div className="d-grid shadow-sm" style={{ gridTemplateColumns: 'repeat(7, 1fr)', backgroundColor: '#f8f9fa' }}>
        {dayNames.map((name, index) => (
          <div key={index} className="py-3 text-center border-end">
            <small className="text-primary fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '1px' }}>{name}</small>
          </div>
        ))}
      </div>
    );
  };

  const renderWeeks = () => {
    return (
      <div className="calendar-body border-start border-top">
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="calendar-week-row" style={{ position: 'relative', minHeight: '160px' }}>
            {/* Lớp nền: Các ô ngày */}
            <div className="d-grid border-bottom" style={{ gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '160px' }}>
              {week.map((day, dayIdx) => {
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());
                return (
                  <div 
                    key={dayIdx} 
                    className={`calendar-day-cell border-end ${!isCurrentMonth ? 'bg-light bg-opacity-50 text-muted' : 'bg-white'}`}
                  >
                    <div className={`px-2 py-1 d-flex justify-content-between align-items-center ${isToday ? 'bg-primary bg-opacity-10' : ''}`}
                         style={{ borderBottom: '1px solid rgba(0,0,0,0.03)' }}>
                      <span className={`fw-bold ${isToday ? 'bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm' : (isCurrentMonth ? 'text-dark' : 'text-muted')}`}
                            style={isToday ? { width: '28px', height: '28px', fontSize: '0.9rem' } : { fontSize: '0.9rem' }}>
                        {format(day, 'd')}
                      </span>
                      {isToday && <small className="text-primary fw-bold" style={{ fontSize: '0.65rem' }}>Hôm nay</small>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Lớp sự kiện: Các thanh kéo dài */}
            <div className="calendar-events-layer" style={{ position: 'absolute', top: '45px', left: 0, right: 0, bottom: 0, pointerEvents: 'none' }}>
              <div className="d-grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'min-content', gap: '6px 0', padding: '0 4px' }}>
                {renderWeekEvents(week)}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderWeekEvents = (week) => {
    const weekStart = startOfDay(week[0]);
    const weekEnd = endOfDay(week[6]);

    const weekEvents = events.filter(event => {
      const start = startOfDay(new Date(event.startDate || event.date));
      const end = endOfDay(new Date(event.endDate || event.date));
      return (start <= weekEnd && end >= weekStart);
    });

    weekEvents.sort((a, b) => {
      const startA = new Date(a.startDate || a.date);
      const startB = new Date(b.startDate || b.date);
      if (isSameDay(startA, startB)) {
        const durA = differenceInDays(new Date(a.endDate || a.date), startA);
        const durB = differenceInDays(new Date(b.endDate || b.date), startB);
        return durB - durA;
      }
      return startA - startB;
    });

    const rows = [];
    return weekEvents.map((event, idx) => {
      const eventStart = startOfDay(new Date(event.startDate || event.date));
      const eventEnd = endOfDay(new Date(event.endDate || event.date));
      
      const startCol = Math.max(0, differenceInDays(eventStart, weekStart)) + 1;
      const endCol = Math.min(7, differenceInDays(eventEnd, weekStart) + 1) + 1;
      
      const span = endCol - startCol;

      let rowIndex = 0;
      while (rows[rowIndex] && rows[rowIndex].some(r => (startCol < r.end && endCol > r.start))) {
        rowIndex++;
      }
      if (!rows[rowIndex]) rows[rowIndex] = [];
      rows[rowIndex].push({ start: startCol, end: endCol });

      return (
        <div 
          key={event.id || idx}
          className="calendar-event-bar px-1"
          style={{ 
            gridColumn: `${startCol} / span ${span}`,
            gridRow: rowIndex + 1,
            pointerEvents: 'auto',
            cursor: 'pointer',
            zIndex: 10,
            marginBottom: '2px'
          }}
          onClick={() => onEventClick && onEventClick(event)}
        >
          {renderEvent ? renderEvent(event) : (
            <Badge bg="info" className="w-100 text-start text-truncate fw-normal py-1 shadow-sm border-0">
              {event.title || event.staffName}
            </Badge>
          )}
        </div>
      );
    });
  };

  return (
    <div className="calendar-container bg-white rounded-4 shadow-sm overflow-hidden border">
      <style>{`
        .calendar-day-cell:hover {
          background-color: rgba(13, 110, 253, 0.02) !important;
        }
        .calendar-event-bar {
          transition: transform 0.1s;
        }
        .calendar-event-bar:hover {
          transform: translateY(-1px);
          filter: brightness(1.1);
          z-index: 100 !important;
        }
        .calendar-week-row {
          border-bottom: 1px solid #dee2e6;
        }
        .calendar-week-row:last-child {
          border-bottom: none;
        }
        .calendar-day-cell span {
          color: #000 !important; /* Chữ số ngày màu đen */
          font-weight: 700 !important;
        }
        .text-primary.fw-bold.text-uppercase {
          color: #000 !important; /* Tên thứ (T2, T3...) màu đen */
        }
      `}</style>
      {renderHeader()}
      {renderDayNames()}
      {renderWeeks()}
    </div>
  );
};

export default Calendar;
