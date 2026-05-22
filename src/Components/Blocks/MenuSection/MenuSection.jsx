import { useEffect, useState } from "react";
import classes from "./MenuSection.module.css";

function MenuSection({
  title,
  storageKey,
  defaultOpen = true,
  hasActive = false,
  menuOpen = true,
  children,
}) {
  const fullKey = storageKey ? `menuSection:${storageKey}` : null;

  const [open, setOpen] = useState(() => {
    if (!fullKey || typeof window === "undefined") return defaultOpen;
    const stored = window.localStorage.getItem(fullKey);
    if (stored === null) return defaultOpen;
    return stored === "true";
  });

  useEffect(() => {
    if (hasActive) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActive]);

  useEffect(() => {
    if (fullKey) window.localStorage.setItem(fullKey, String(open));
  }, [open, fullKey]);

  if (!menuOpen) {
    return <div className={classes.sectionCompact}>{children}</div>;
  }

  return (
    <div className={classes.section}>
      <button
        type="button"
        className={classes.sectionHeader}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={classes.sectionTitle}>{title}</span>
        <span
          className={`${classes.sectionChevron} ${
            open ? classes.sectionChevronOpen : ""
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div
        className={`${classes.sectionContent} ${
          open ? classes.sectionContentOpen : ""
        }`}
      >
        <div className={classes.sectionInner}>{children}</div>
      </div>
    </div>
  );
}

export default MenuSection;
