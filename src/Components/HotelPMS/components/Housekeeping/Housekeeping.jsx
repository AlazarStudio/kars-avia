import React, { useState, useMemo } from 'react';
import classes from './Housekeeping.module.css';
import { HK_STATUS } from '../../constants';

const HK_FLOW = {
  dirty:    ['cleaning'],
  cleaning: ['checking'],
  checking: ['clean', 'dirty'],
  clean:    ['ready'],
  ready:    ['dirty'],
};

function Housekeeping({ rooms: initRooms, setRooms, categories }) {
  const [rooms, setLocalRooms] = useState(initRooms);
  const [filter, setFilter] = useState('all');

  const changeHk = (roomId, status) => {
    const updated = rooms.map(r => r.id === roomId ? { ...r, hk: status } : r);
    setLocalRooms(updated);
    if (setRooms) setRooms(updated);
  };

  const counts = useMemo(() => {
    const c = { all: rooms.length };
    Object.keys(HK_STATUS).forEach(k => { c[k] = rooms.filter(r => r.hk === k).length; });
    return c;
  }, [rooms]);

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.hk === filter);

  const getCatName = (catId) => categories.find(c => c.id === catId)?.name || '';

  return (
    <div className={classes.root}>
      <div className={classes.pageHeader}>
        <div className={classes.pageTitle}>Уборка</div>
      </div>

      <div className={classes.statsRow}>
        <div
          className={`${classes.statChip} ${filter === 'all' ? classes.active : ''}`}
          style={filter === 'all' ? { color: '#1E88E5' } : {}}
          onClick={() => setFilter('all')}
        >
          <div className={classes.statCount}>{counts.all}</div>
          <div className={classes.statLabel}>Всего</div>
        </div>
        {Object.entries(HK_STATUS).map(([key, cfg]) => (
          <div
            key={key}
            className={`${classes.statChip} ${filter === key ? classes.active : ''}`}
            style={filter === key ? { color: cfg.color } : {}}
            onClick={() => setFilter(key)}
          >
            <div className={classes.statDot} style={{ background: cfg.color }} />
            <div>
              <div className={classes.statCount}>{counts[key]}</div>
              <div className={classes.statLabel}>{cfg.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={classes.grid}>
        {filtered.map(room => {
          const hkCfg = HK_STATUS[room.hk] || HK_STATUS.clean;
          const nextStatuses = HK_FLOW[room.hk] || [];
          return (
            <div
              key={room.id}
              className={classes.card}
              style={{ borderColor: hkCfg.bg }}
            >
              <div className={classes.cardTop}>
                <div>
                  <div className={classes.roomNum}>№{room.number}</div>
                  <div className={classes.roomCat}>{getCatName(room.categoryId)} · {room.floor} эт.</div>
                </div>
                <div
                  className={classes.hkBadge}
                  style={{ background: hkCfg.bg, color: hkCfg.color }}
                >
                  {hkCfg.label}
                </div>
              </div>
              <div className={classes.cardActions}>
                {nextStatuses.map(next => (
                  <button
                    key={next}
                    className={`${classes.actionBtn} ${next === nextStatuses[0] ? classes.primary : ''}`}
                    onClick={() => changeHk(room.id, next)}
                  >
                    → {HK_STATUS[next]?.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Housekeeping;
