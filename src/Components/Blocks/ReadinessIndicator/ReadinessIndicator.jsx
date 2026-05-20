import React, { useState } from 'react';
import { Menu } from '@mui/material';
import classes from './ReadinessIndicator.module.css';

function ReadinessIndicator({ done, total, groups }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const isReady = done === total;
  const percent = Math.round((done / total) * 100);
  const tone = isReady ? 'green' : percent >= 60 ? 'amber' : 'red';

  const handleOpen = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    setAnchorEl(null);
  };

  return (
    <>
      <button
        className={`${classes.badge} ${classes[tone]}`}
        onClick={handleOpen}
      >
        <span className={classes.dot} />
        <span className={classes.fraction}>{done}/{total}</span>
      </button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{ paper: { className: classes.paper } }}
        MenuListProps={{ sx: { paddingTop: 0, paddingBottom: 0 } }}
      >
        <div className={classes.popupHeader}>
          <div className={classes.popupTitle}>Готовность к работе</div>
          <div className={classes.progressRow}>
            <div className={classes.progressTrack}>
              <div
                className={`${classes.progressFill} ${classes[`fill_${tone}`]}`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className={`${classes.popupFraction} ${classes[`text_${tone}`]}`}>
              {done} из {total}
            </span>
          </div>
        </div>

        <div className={classes.popupBody}>
          {[...groups].sort((a, b) => {
            const missA = a.items.filter(i => !i.done).length;
            const missB = b.items.filter(i => !i.done).length;
            return missB - missA;
          }).map(({ tab, items }) => (
            <div key={tab} className={classes.group}>
              <div className={classes.groupLabel}>{tab}</div>
              {[...items].sort((a, b) => a.done - b.done).map(({ key, label, done: itemDone }) => (
                <div key={key} className={classes.item}>
                  <span className={`${classes.itemBadge} ${itemDone ? classes.itemBadgeDone : classes.itemBadgeMiss}`}>
                    {itemDone ? '✓' : '✗'}
                  </span>
                  <span className={`${classes.itemLabel} ${itemDone ? classes.itemLabelDone : classes.itemLabelMiss}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Menu>
    </>
  );
}

export default ReadinessIndicator;
