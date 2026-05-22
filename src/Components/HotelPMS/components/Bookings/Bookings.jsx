import React, { useState, useMemo } from 'react';
import { parseISO, format, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import classes from './Bookings.module.css';
import { BOOKING_STATUS, BOOKING_SOURCE } from '../../constants';
import BookingForm from '../Timeline/BookingForm';

let _nextId = 300;
const uid = () => `b${_nextId++}`;

function Bookings({ bookings: initBookings, setBookings, rooms, categories }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(null);

  const bookings = initBookings;

  const filtered = useMemo(() => {
    return bookings.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          b.guestName.toLowerCase().includes(q) ||
          b.phone?.includes(q) ||
          rooms.find(r => r.id === b.roomId)?.number.includes(q)
        );
      }
      return true;
    }).sort((a, b) => a.checkIn < b.checkIn ? 1 : -1);
  }, [bookings, statusFilter, search, rooms]);

  const statusCounts = useMemo(() => {
    const counts = { all: bookings.length };
    Object.keys(BOOKING_STATUS).forEach(k => {
      counts[k] = bookings.filter(b => b.status === k).length;
    });
    return counts;
  }, [bookings]);

  const getRoomNumber = (roomId) => rooms.find(r => r.id === roomId)?.number || '?';
  const getCategoryName = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    return categories.find(c => c.id === room?.categoryId)?.name || '';
  };

  const openEdit = (booking) => { setFormData({ ...booking }); setShowForm(true); };
  const openNew  = () => { setFormData({ adults: 2, children: 0, status: 'new', source: 'direct' }); setShowForm(true); };

  const handleSave = (data) => {
    if (data.id) {
      setBookings(prev => prev.map(b => b.id === data.id ? data : b));
    } else {
      setBookings(prev => [...prev, { ...data, id: uid() }]);
    }
    setShowForm(false);
    setFormData(null);
  };

  const handleDelete = (id) => {
    setBookings(prev => prev.filter(b => b.id !== id));
    setShowForm(false);
    setFormData(null);
  };

  return (
    <div className={classes.root}>
      <div className={classes.pageHeader}>
        <div className={classes.pageTitle}>Бронирования</div>
        <div className={classes.headerRight}>
          <input
            className={classes.searchInput}
            placeholder="Поиск по гостю, телефону, номеру..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={classes.btnAdd} onClick={openNew}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Новая бронь
          </button>
        </div>
      </div>

      <div className={classes.filterRow}>
        <div
          className={`${classes.filterChip} ${statusFilter === 'all' ? classes.active : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          Все ({statusCounts.all})
        </div>
        {Object.entries(BOOKING_STATUS).map(([key, cfg]) => (
          statusCounts[key] > 0 && (
            <div
              key={key}
              className={`${classes.filterChip} ${statusFilter === key ? classes.active : ''}`}
              style={statusFilter === key ? { background: cfg.color, borderColor: cfg.color } : {}}
              onClick={() => setStatusFilter(key)}
            >
              {cfg.label} ({statusCounts[key]})
            </div>
          )
        ))}
      </div>

      <div className={classes.table}>
        <div className={classes.tableHead}>
          <div className={classes.th}>Гость</div>
          <div className={classes.th}>Номер</div>
          <div className={classes.th}>Заезд</div>
          <div className={classes.th}>Выезд</div>
          <div className={classes.th}>Статус</div>
          <div className={classes.th}>Сумма</div>
          <div className={classes.th}></div>
        </div>
        <div className={classes.tableBody}>
          {filtered.length === 0 && (
            <div className={classes.empty}>Бронирования не найдены</div>
          )}
          {filtered.map(b => {
            const cfg = BOOKING_STATUS[b.status] || BOOKING_STATUS.new;
            const nights = differenceInDays(parseISO(b.checkOut), parseISO(b.checkIn));
            return (
              <div key={b.id} className={classes.tableRow} onClick={() => openEdit(b)}>
                <div className={classes.td}>
                  <div className={classes.guestName}>{b.guestName}</div>
                  <div className={classes.guestPhone}>{b.phone || '—'} · {b.adults} взр{b.children ? `, ${b.children} дет` : ''}</div>
                </div>
                <div className={classes.td}>
                  <div className={classes.roomBadge}>№{getRoomNumber(b.roomId)}</div>
                  <div style={{ fontSize: 10, color: '#8896AB', marginTop: 2 }}>{getCategoryName(b.roomId)}</div>
                </div>
                <div className={classes.td}>{format(parseISO(b.checkIn), 'd MMM', { locale: ru })}</div>
                <div className={classes.td}>{format(parseISO(b.checkOut), 'd MMM', { locale: ru })} <span style={{ color: '#8896AB', fontSize: 11 }}>({nights} н.)</span></div>
                <div className={classes.td}>
                  <span className={classes.statusBadge} style={{ background: cfg.color + '22', color: cfg.color }}>
                    {cfg.label}
                  </span>
                </div>
                <div className={`${classes.td} ${classes.price}`}>
                  {b.totalPrice ? `${b.totalPrice.toLocaleString('ru-RU')} ₽` : '—'}
                </div>
                <div className={classes.td}>
                  <button className={classes.actionBtn} onClick={e => { e.stopPropagation(); openEdit(b); }}>
                    Открыть
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showForm && formData && (
        <BookingForm
          booking={formData}
          rooms={rooms}
          categories={categories}
          onSave={handleSave}
          onDelete={formData.id ? handleDelete : undefined}
          onClose={() => { setShowForm(false); setFormData(null); }}
        />
      )}
    </div>
  );
}

export default Bookings;
