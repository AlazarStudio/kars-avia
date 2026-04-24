import React, { useState, useEffect } from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';
import classes from './Timeline.module.css';
import { BOOKING_STATUS, BOOKING_SOURCE } from '../../constants';

function BookingForm({ booking, rooms, categories, onSave, onDelete, onClose }) {
  const isNew = !booking.id;

  const [form, setForm] = useState({
    guestName: booking.guestName || '',
    phone:     booking.phone || '',
    email:     booking.email || '',
    roomId:    booking.roomId || '',
    checkIn:   booking.checkIn || '',
    checkOut:  booking.checkOut || '',
    adults:    booking.adults || 2,
    children:  booking.children || 0,
    status:    booking.status || 'new',
    source:    booking.source || 'direct',
    notes:     booking.notes || '',
  });

  const nights = form.checkIn && form.checkOut
    ? Math.max(0, differenceInDays(parseISO(form.checkOut), parseISO(form.checkIn)))
    : 0;

  const room = rooms.find(r => r.id === form.roomId);
  const category = categories.find(c => c.id === room?.categoryId);
  const pricePerNight = category?.basePrice || 0;
  const totalPrice = nights * pricePerNight;

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = () => {
    if (!form.guestName.trim() || !form.roomId || !form.checkIn || !form.checkOut) return;
    onSave({
      ...booking,
      ...form,
      adults: Number(form.adults),
      children: Number(form.children),
      totalPrice,
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className={classes.modalOverlay} onClick={onClose} onKeyDown={handleKeyDown}>
      <div className={classes.modal} onClick={e => e.stopPropagation()}>
        <div className={classes.modalHeader}>
          <div className={classes.modalTitle}>
            {isNew ? 'Новое бронирование' : 'Редактировать бронь'}
          </div>
          <button className={classes.modalClose} onClick={onClose}>×</button>
        </div>

        <div className={classes.modalBody}>
          <div className={classes.formGrid}>
            <div className={`${classes.formGroup} ${classes.formFull}`}>
              <div className={classes.formLabel}>ФИО гостя *</div>
              <input className={classes.formInput} value={form.guestName} onChange={set('guestName')} placeholder="Фамилия Имя Отчество" />
            </div>

            <div className={classes.formGroup}>
              <div className={classes.formLabel}>Телефон</div>
              <input className={classes.formInput} value={form.phone} onChange={set('phone')} placeholder="+7 (___) ___-__-__" />
            </div>

            <div className={classes.formGroup}>
              <div className={classes.formLabel}>Email</div>
              <input className={classes.formInput} value={form.email} onChange={set('email')} placeholder="email@domain.ru" type="email" />
            </div>

            <div className={classes.formGroup}>
              <div className={classes.formLabel}>Номер *</div>
              <select className={classes.formSelect} value={form.roomId} onChange={set('roomId')}>
                <option value="">— выберите —</option>
                {categories.map(cat => (
                  <optgroup key={cat.id} label={cat.name}>
                    {rooms.filter(r => r.categoryId === cat.id).map(r => (
                      <option key={r.id} value={r.id}>№{r.number} · {cat.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className={classes.formGroup}>
              <div className={classes.formLabel}>Источник</div>
              <select className={classes.formSelect} value={form.source} onChange={set('source')}>
                {Object.entries(BOOKING_SOURCE).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div className={classes.formGroup}>
              <div className={classes.formLabel}>Дата заезда *</div>
              <input className={classes.formInput} value={form.checkIn} onChange={set('checkIn')} type="date" />
            </div>

            <div className={classes.formGroup}>
              <div className={classes.formLabel}>Дата выезда *</div>
              <input className={classes.formInput} value={form.checkOut} onChange={set('checkOut')} type="date" />
            </div>

            <div className={classes.formGroup}>
              <div className={classes.formLabel}>Взрослых</div>
              <input className={classes.formInput} value={form.adults} onChange={set('adults')} type="number" min="1" max="10" />
            </div>

            <div className={classes.formGroup}>
              <div className={classes.formLabel}>Детей</div>
              <input className={classes.formInput} value={form.children} onChange={set('children')} type="number" min="0" max="5" />
            </div>

            <div className={`${classes.formGroup} ${classes.formFull}`}>
              <div className={classes.formLabel}>Статус</div>
              <div className={classes.statusGrid}>
                {Object.entries(BOOKING_STATUS).map(([key, cfg]) => (
                  <div
                    key={key}
                    className={`${classes.statusOption} ${form.status === key ? classes.selected : ''}`}
                    style={form.status === key ? { background: cfg.color, borderColor: cfg.color } : {}}
                    onClick={() => setForm(prev => ({ ...prev, status: key }))}
                  >
                    {cfg.label}
                  </div>
                ))}
              </div>
            </div>

            <div className={`${classes.formGroup} ${classes.formFull}`}>
              <div className={classes.formLabel}>Примечания</div>
              <textarea className={classes.formTextarea} value={form.notes} onChange={set('notes')} placeholder="Особые пожелания, комментарии..." />
            </div>

            {nights > 0 && (
              <div className={`${classes.priceRow} ${classes.formFull}`}>
                <div>
                  <div className={classes.priceLabel}>{nights} ноч. × {pricePerNight.toLocaleString('ru-RU')} ₽</div>
                </div>
                <div className={classes.priceValue}>{totalPrice.toLocaleString('ru-RU')} ₽</div>
              </div>
            )}
          </div>
        </div>

        <div className={classes.modalFooter}>
          {!isNew && onDelete && (
            <button className={classes.btnDanger} onClick={() => onDelete(booking.id)}>
              Удалить
            </button>
          )}
          <button className={classes.btnSecondary} onClick={onClose}>Отмена</button>
          <button className={classes.btnPrimary} onClick={handleSave}>
            {isNew ? 'Создать бронь' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default BookingForm;
