import React, { useState } from 'react';
import classes from './Rooms.module.css';
import { HK_STATUS } from '../../constants';

function Rooms({ rooms: initRooms, setRooms, categories }) {
  const [rooms, setLocalRooms] = useState(initRooms);
  const [hkMenu, setHkMenu] = useState(null); // { roomId, x, y }

  const changeHk = (roomId, status) => {
    const updated = rooms.map(r => r.id === roomId ? { ...r, hk: status } : r);
    setLocalRooms(updated);
    if (setRooms) setRooms(updated);
    setHkMenu(null);
  };

  const openHkMenu = (e, roomId) => {
    e.stopPropagation();
    setHkMenu({ roomId, x: e.clientX, y: e.clientY });
  };

  return (
    <div className={classes.root} onClick={() => setHkMenu(null)}>
      <div className={classes.pageHeader}>
        <div className={classes.pageTitle}>Номерной фонд</div>
        <button className={classes.btnAdd}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Добавить номер
        </button>
      </div>

      {categories.map(cat => {
        const catRooms = rooms.filter(r => r.categoryId === cat.id);
        const readyCount = catRooms.filter(r => r.hk === 'ready').length;
        return (
          <div key={cat.id} className={classes.categorySection}>
            <div className={classes.catHeader}>
              <div>
                <div className={classes.catName}>{cat.name}</div>
                <div className={classes.catMeta}>{catRooms.length} номеров · {readyCount} готово · вместимость {cat.capacity} чел.</div>
              </div>
              <div className={classes.catPrice}>{cat.basePrice.toLocaleString('ru-RU')} ₽/ночь</div>
            </div>
            <div className={classes.roomsGrid}>
              {catRooms.map(room => {
                const hkCfg = HK_STATUS[room.hk] || HK_STATUS.clean;
                return (
                  <div key={room.id} className={classes.roomCard}>
                    <div className={classes.roomNumber}>№{room.number}</div>
                    <div className={classes.roomFloor}>{room.floor} этаж</div>
                    <div
                      className={classes.hkBadge}
                      style={{ background: hkCfg.bg, color: hkCfg.color }}
                      onClick={(e) => openHkMenu(e, room.id)}
                      title="Изменить статус уборки"
                    >
                      <div className={classes.hkDot} style={{ background: hkCfg.color }} />
                      {hkCfg.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {hkMenu && (
        <div
          className={classes.hkMenu}
          style={{ left: hkMenu.x, top: hkMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          {Object.entries(HK_STATUS).map(([key, cfg]) => (
            <div
              key={key}
              className={classes.hkMenuItem}
              onClick={() => changeHk(hkMenu.roomId, key)}
            >
              <div className={classes.hkDot} style={{ background: cfg.color }} />
              {cfg.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Rooms;
