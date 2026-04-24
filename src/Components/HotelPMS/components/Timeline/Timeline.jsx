import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  addDays, subDays, startOfMonth, endOfMonth, addMonths, subMonths,
  differenceInDays, parseISO, format, isSameDay, getDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import classes from './Timeline.module.css';
import { DAY_WIDTH, ROW_HEIGHT, LEFT_PANEL_WIDTH, BOOKING_STATUS, HK_STATUS } from '../../constants';
import BookingForm from './BookingForm';

const TODAY_STR = '2026-04-23';
const TODAY = parseISO(TODAY_STR);

let _nextId = 200;
const uid = () => `b${_nextId++}`;

function Timeline({ bookings: initBookings, rooms, categories }) {
  const [bookings, setBookings] = useState(initBookings);
  const [viewStart, setViewStart] = useState(startOfMonth(TODAY));
  const [daysCount, setDaysCount] = useState(30);
  const [search, setSearch] = useState('');
  const [tooltip, setTooltip] = useState(null); // { booking, x, y }
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);

  // Drag state (ref to avoid re-renders during drag)
  const dragRef = useRef(null);
  const [dragBookingId, setDragBookingId] = useState(null); // id of booking being dragged (for opacity)
  const [ghostBooking, setGhostBooking] = useState(null);   // preview block
  const [selection, setSelection] = useState(null);         // create-by-drag: {roomId, left, width}

  const containerRef = useRef(null);
  const hoveredRoomRef = useRef(null);

  const days = useMemo(() => (
    Array.from({ length: daysCount }, (_, i) => addDays(viewStart, i))
  ), [viewStart, daysCount]);

  const gridWidth = LEFT_PANEL_WIDTH + daysCount * DAY_WIDTH;

  // Compute available rooms count per day (ignoring cancelled)
  const availByDay = useMemo(() => {
    return days.map(day => {
      const occ = new Set(
        bookings.filter(b => {
          if (b.status === 'cancelled' || b.status === 'no_show') return false;
          const ci = parseISO(b.checkIn);
          const co = parseISO(b.checkOut);
          return day >= ci && day < co;
        }).map(b => b.roomId)
      );
      return rooms.length - occ.size;
    });
  }, [days, bookings, rooms]);

  // Filter bookings to visible range
  const visibleBookings = useMemo(() => {
    const end = addDays(viewStart, daysCount);
    return bookings.filter(b => {
      if (search) {
        const q = search.toLowerCase();
        if (!b.guestName.toLowerCase().includes(q)) return false;
      }
      const ci = parseISO(b.checkIn);
      const co = parseISO(b.checkOut);
      return co > viewStart && ci < end;
    });
  }, [bookings, viewStart, daysCount, search]);

  // ── Geometry helpers ──────────────────────────────────────────
  const getBookingLeft = useCallback((checkIn) => {
    const days = differenceInDays(parseISO(checkIn), viewStart);
    return LEFT_PANEL_WIDTH + days * DAY_WIDTH;
  }, [viewStart]);

  const getBookingWidth = useCallback((checkIn, checkOut) => {
    return Math.max(DAY_WIDTH, differenceInDays(parseISO(checkOut), parseISO(checkIn)) * DAY_WIDTH) - 2;
  }, []);

  const getDayFromClientX = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const scrollLeft = containerRef.current.scrollLeft;
    const x = clientX - rect.left + scrollLeft - LEFT_PANEL_WIDTH;
    return Math.floor(x / DAY_WIDTH);
  }, []);

  const dayToDate = useCallback((dayIndex) => (
    format(addDays(viewStart, dayIndex), 'yyyy-MM-dd')
  ), [viewStart]);

  // ── Mouse handlers ────────────────────────────────────────────
  const handleBookingMouseDown = useCallback((e, booking, type) => {
    e.stopPropagation();
    e.preventDefault();
    setTooltip(null);
    const dayIndex = getDayFromClientX(e.clientX);
    dragRef.current = {
      type,
      booking: { ...booking },
      startX: e.clientX,
      startDayIndex: dayIndex,
      origCheckIn: booking.checkIn,
      origCheckOut: booking.checkOut,
      origRoomId: booking.roomId,
    };
    setDragBookingId(booking.id);
    setGhostBooking({ ...booking });
  }, [getDayFromClientX]);

  const handleGridMouseDown = useCallback((e, roomId, dayIndex) => {
    e.preventDefault();
    dragRef.current = {
      type: 'create',
      roomId,
      startDayIndex: dayIndex,
      endDayIndex: dayIndex,
    };
    const left = LEFT_PANEL_WIDTH + dayIndex * DAY_WIDTH;
    setSelection({ roomId, left, width: DAY_WIDTH });
  }, []);

  const handleMouseMove = useCallback((e) => {
    const drag = dragRef.current;
    if (!drag) return;

    const curDayIndex = getDayFromClientX(e.clientX);
    const targetRoomId = hoveredRoomRef.current;

    if (drag.type === 'create') {
      drag.endDayIndex = curDayIndex;
      const startD = Math.min(drag.startDayIndex, drag.endDayIndex);
      const endD   = Math.max(drag.startDayIndex, drag.endDayIndex) + 1;
      setSelection({
        roomId: drag.roomId,
        left: LEFT_PANEL_WIDTH + startD * DAY_WIDTH,
        width: (endD - startD) * DAY_WIDTH,
      });
      return;
    }

    if (drag.type === 'move') {
      const delta = curDayIndex - drag.startDayIndex;
      const newCI = format(addDays(parseISO(drag.origCheckIn), delta), 'yyyy-MM-dd');
      const newCO = format(addDays(parseISO(drag.origCheckOut), delta), 'yyyy-MM-dd');
      setGhostBooking(prev => ({
        ...prev,
        checkIn: newCI,
        checkOut: newCO,
        roomId: targetRoomId || drag.origRoomId,
      }));
      return;
    }

    if (drag.type === 'resize-right') {
      const delta = curDayIndex - drag.startDayIndex;
      const newCO = format(
        addDays(parseISO(drag.origCheckOut), delta),
        'yyyy-MM-dd'
      );
      if (newCO > drag.origCheckIn) {
        setGhostBooking(prev => ({ ...prev, checkOut: newCO }));
      }
      return;
    }

    if (drag.type === 'resize-left') {
      const delta = curDayIndex - drag.startDayIndex;
      const newCI = format(
        addDays(parseISO(drag.origCheckIn), delta),
        'yyyy-MM-dd'
      );
      if (newCI < drag.origCheckOut) {
        setGhostBooking(prev => ({ ...prev, checkIn: newCI }));
      }
    }
  }, [getDayFromClientX]);

  const handleMouseUp = useCallback((e) => {
    const drag = dragRef.current;
    dragRef.current = null;

    if (!drag) return;

    if (drag.type === 'create') {
      const startD = Math.min(drag.startDayIndex, drag.endDayIndex);
      const endD   = Math.max(drag.startDayIndex, drag.endDayIndex) + 1;
      setSelection(null);
      setFormData({
        roomId: drag.roomId,
        checkIn: dayToDate(startD),
        checkOut: dayToDate(endD),
        adults: 2,
        children: 0,
        status: 'new',
        source: 'direct',
      });
      setShowForm(true);
      return;
    }

    const ghost = ghostBooking;
    setDragBookingId(null);
    setGhostBooking(null);

    if (!ghost) return;

    if (drag.type === 'move') {
      const targetRoomId = hoveredRoomRef.current || drag.origRoomId;
      setBookings(prev => prev.map(b =>
        b.id === drag.booking.id
          ? { ...b, checkIn: ghost.checkIn, checkOut: ghost.checkOut, roomId: targetRoomId }
          : b
      ));
    } else if (drag.type === 'resize-right' || drag.type === 'resize-left') {
      setBookings(prev => prev.map(b =>
        b.id === drag.booking.id
          ? { ...b, checkIn: ghost.checkIn, checkOut: ghost.checkOut }
          : b
      ));
    }
  }, [ghostBooking, dayToDate]);

  // Attach global mouse events during drag
  useEffect(() => {
    const onMove = (e) => handleMouseMove(e);
    const onUp   = (e) => handleMouseUp(e);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ── Form handlers ─────────────────────────────────────────────
  const handleFormSave = useCallback((data) => {
    if (data.id) {
      setBookings(prev => prev.map(b => b.id === data.id ? data : b));
    } else {
      setBookings(prev => [...prev, { ...data, id: uid() }]);
    }
    setShowForm(false);
    setFormData(null);
  }, []);

  const handleFormDelete = useCallback((id) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    setShowForm(false);
    setFormData(null);
  }, []);

  const openEditForm = useCallback((booking) => {
    if (dragRef.current) return;
    setFormData({ ...booking });
    setShowForm(true);
  }, []);

  // ── Navigation ────────────────────────────────────────────────
  const goToday = () => setViewStart(startOfMonth(TODAY));
  const prevPeriod = () => setViewStart(v => subDays(v, daysCount));
  const nextPeriod = () => setViewStart(v => addDays(v, daysCount));

  const isDragging = !!dragRef.current || dragBookingId != null;

  const isWeekend = (date) => { const d = getDay(date); return d === 0 || d === 6; };
  const isToday   = (date) => isSameDay(date, TODAY);

  const getRoomNumber = (roomId) => rooms.find(r => r.id === roomId)?.number;

  // ── Render booking block ──────────────────────────────────────
  const renderBooking = useCallback((b, isGhost = false) => {
    const left  = getBookingLeft(b.checkIn);
    const width = getBookingWidth(b.checkIn, b.checkOut);
    const cfg   = BOOKING_STATUS[b.status] || BOOKING_STATUS.new;
    const nights = differenceInDays(parseISO(b.checkOut), parseISO(b.checkIn));
    const isBeingDragged = b.id === dragBookingId && !isGhost;

    return (
      <div
        key={isGhost ? `ghost-${b.id}` : b.id}
        className={`${classes.bookingBlock} ${isBeingDragged ? classes.isDragging : ''} ${isGhost ? classes.isGhost : ''}`}
        style={{
          left,
          width,
          background: cfg.color,
        }}
        onMouseDown={!isGhost ? (e) => handleBookingMouseDown(e, b, 'move') : undefined}
        onClick={!isGhost ? (e) => { e.stopPropagation(); openEditForm(b); } : undefined}
        onMouseEnter={!isGhost ? (e) => {
          if (isDragging) return;
          setTooltip({ booking: b, x: e.clientX, y: e.clientY });
        } : undefined}
        onMouseMove={!isGhost ? (e) => {
          if (isDragging) return;
          setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
        } : undefined}
        onMouseLeave={!isGhost ? () => setTooltip(null) : undefined}
      >
        <div
          className={`${classes.resizeHandle} ${classes.resizeHandleLeft}`}
          onMouseDown={(e) => { e.stopPropagation(); handleBookingMouseDown(e, b, 'resize-left'); }}
        />
        <div className={classes.bookingInner}>
          <div className={classes.bookingText}>
            <div className={classes.bookingGuestName}>{b.guestName.split(' ')[0]} {b.guestName.split(' ')[1]?.[0]}.</div>
            <div className={classes.bookingNights}>{nights} н.</div>
          </div>
        </div>
        <div
          className={`${classes.resizeHandle} ${classes.resizeHandleRight}`}
          onMouseDown={(e) => { e.stopPropagation(); handleBookingMouseDown(e, b, 'resize-right'); }}
        />
      </div>
    );
  }, [getBookingLeft, getBookingWidth, handleBookingMouseDown, openEditForm, dragBookingId, isDragging]);

  // ── Main render ───────────────────────────────────────────────
  return (
    <div className={classes.root}>
      {/* Controls */}
      <div className={classes.controls}>
        <div className={classes.monthNav}>
          <button className={classes.navBtn} onClick={prevPeriod}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div className={classes.monthLabel}>
            {format(viewStart, 'LLLL yyyy', { locale: ru }).replace(/^\w/, c => c.toUpperCase())}
            {daysCount !== 30 && ` · ${daysCount} дн.`}
          </div>
          <button className={classes.navBtn} onClick={nextPeriod}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
        <button className={classes.todayBtn} onClick={goToday}>Сегодня</button>
        <div className={classes.daysToggle}>
          {[14, 30, 60].map(n => (
            <button
              key={n}
              className={`${classes.daysToggleBtn} ${daysCount === n ? classes.active : ''}`}
              onClick={() => setDaysCount(n)}
            >{n} дн</button>
          ))}
        </div>
        <input
          className={classes.searchInput}
          placeholder="Поиск по гостю..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={classes.legend}>
          {Object.entries(BOOKING_STATUS).map(([key, cfg]) => (
            <div key={key} className={classes.legendItem}>
              <div className={classes.legendDot} style={{ background: cfg.color }} />
              {cfg.label}
            </div>
          ))}
        </div>
      </div>

      {/* Timeline grid */}
      <div
        ref={containerRef}
        className={`${classes.timelineWrapper} ${isDragging ? classes.dragging : ''}`}
        onMouseLeave={() => { if (!dragRef.current) setTooltip(null); }}
      >
        <div className={classes.timelineInner} style={{ width: gridWidth, minWidth: gridWidth }}>
          {/* Sticky date header */}
          <div className={classes.stickyHeader}>
            <div className={classes.headerCorner}>
              <span className={classes.headerCornerLabel}>Номер</span>
            </div>
            <div className={classes.datesRow}>
              {days.map((day, i) => (
                <div
                  key={i}
                  className={`${classes.dayCell} ${isWeekend(day) ? classes.isWeekend : ''} ${isToday(day) ? classes.isToday : ''}`}
                >
                  <div className={classes.dayName}>{format(day, 'EE', { locale: ru })}</div>
                  <div className={classes.dayNum}>{format(day, 'd')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Availability row */}
          <div className={classes.availRow}>
            <div className={classes.availCorner}>Своб.</div>
            <div style={{ display: 'flex' }}>
              {availByDay.map((count, i) => (
                <div
                  key={i}
                  className={classes.availCell}
                  style={{ color: count === 0 ? '#EF5350' : count <= 2 ? '#FB8C00' : '#43A047' }}
                >
                  {count}
                </div>
              ))}
            </div>
          </div>

          {/* Category groups */}
          {categories.map(cat => {
            const catRooms = rooms.filter(r => r.categoryId === cat.id);
            return (
              <div key={cat.id} className={classes.categoryGroup}>
                {/* Category header */}
                <div className={classes.categoryHeader} style={{ width: gridWidth }}>
                  <div className={classes.categoryLabel}>
                    <span className={classes.categoryName}>{cat.name}</span>
                    <span className={classes.categoryMeta}>
                      {catRooms.length} ном. · {cat.basePrice.toLocaleString('ru-RU')} ₽/ночь
                    </span>
                  </div>
                  <div className={classes.categoryBgCells}>
                    {days.map((_, i) => <div key={i} className={classes.categoryBgCell} />)}
                  </div>
                </div>

                {/* Room rows */}
                {catRooms.map(room => {
                  const roomBookings = visibleBookings.filter(b => b.roomId === room.id);
                  const hkCfg = HK_STATUS[room.hk] || HK_STATUS.clean;

                  return (
                    <div
                      key={room.id}
                      className={classes.roomRow}
                      style={{ width: gridWidth }}
                      onMouseEnter={() => { hoveredRoomRef.current = room.id; }}
                    >
                      {/* Sticky room label */}
                      <div className={classes.roomLabel}>
                        <div className={classes.roomNumber}>№{room.number}</div>
                        <div className={classes.roomCategory}>{cat.name}</div>
                        <div
                          className={classes.hkBadge}
                          style={{ background: hkCfg.bg, color: hkCfg.color }}
                        >
                          {hkCfg.label}
                        </div>
                      </div>

                      {/* Grid cells */}
                      <div className={classes.roomCells}>
                        {days.map((day, di) => (
                          <div
                            key={di}
                            className={`${classes.gridCell} ${isWeekend(day) ? classes.isWeekend : ''} ${isToday(day) ? classes.isToday : ''}`}
                            onMouseDown={(e) => handleGridMouseDown(e, room.id, di)}
                          />
                        ))}

                        {/* Booking blocks for this room */}
                        {roomBookings.map(b => renderBooking(b))}

                        {/* Ghost block during drag */}
                        {ghostBooking && ghostBooking.roomId === room.id && dragBookingId &&
                          renderBooking({ ...ghostBooking, id: ghostBooking.id }, true)
                        }

                        {/* Create-booking selection rect */}
                        {selection && selection.roomId === room.id && (
                          <div
                            className={classes.selectionRect}
                            style={{ left: selection.left - LEFT_PANEL_WIDTH, width: selection.width }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && !isDragging && (
        <Tooltip booking={tooltip.booking} x={tooltip.x} y={tooltip.y} rooms={rooms} />
      )}

      {/* Booking form modal */}
      {showForm && formData && (
        <BookingForm
          booking={formData}
          rooms={rooms}
          categories={categories}
          onSave={handleFormSave}
          onDelete={handleFormDelete}
          onClose={() => { setShowForm(false); setFormData(null); }}
        />
      )}
    </div>
  );
}

function Tooltip({ booking, x, y, rooms }) {
  const room = rooms.find(r => r.id === booking.roomId);
  const nights = differenceInDays(parseISO(booking.checkOut), parseISO(booking.checkIn));
  const cfg = BOOKING_STATUS[booking.status] || BOOKING_STATUS.new;

  const style = {
    left: Math.min(x + 14, window.innerWidth - 300),
    top: y + 14,
  };
  if (y + 14 + 180 > window.innerHeight) {
    style.top = y - 180;
  }

  return (
    <div className={classes.tooltip} style={style}>
      <div className={classes.tooltipName}>{booking.guestName}</div>
      <div className={classes.tooltipRow}>
        <span className={classes.tooltipLabel}>Номер:</span>
        <span className={classes.tooltipValue}>№{room?.number}</span>
      </div>
      <div className={classes.tooltipRow}>
        <span className={classes.tooltipLabel}>Заезд:</span>
        <span className={classes.tooltipValue}>{format(parseISO(booking.checkIn), 'd MMM yyyy', { locale: ru })}</span>
      </div>
      <div className={classes.tooltipRow}>
        <span className={classes.tooltipLabel}>Выезд:</span>
        <span className={classes.tooltipValue}>{format(parseISO(booking.checkOut), 'd MMM yyyy', { locale: ru })}</span>
      </div>
      <div className={classes.tooltipRow}>
        <span className={classes.tooltipLabel}>Ночей:</span>
        <span className={classes.tooltipValue}>{nights}</span>
      </div>
      <div className={classes.tooltipRow}>
        <span className={classes.tooltipLabel}>Статус:</span>
        <span className={classes.tooltipValue} style={{ color: cfg.color }}>{cfg.label}</span>
      </div>
      {booking.totalPrice > 0 && (
        <div className={classes.tooltipRow}>
          <span className={classes.tooltipLabel}>Сумма:</span>
          <span className={classes.tooltipValue}>{booking.totalPrice.toLocaleString('ru-RU')} ₽</span>
        </div>
      )}
      {booking.notes && (
        <div className={classes.tooltipRow}>
          <span className={classes.tooltipLabel}>Заметка:</span>
          <span className={classes.tooltipValue}>{booking.notes}</span>
        </div>
      )}
    </div>
  );
}

export default Timeline;
