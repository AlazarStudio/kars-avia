import { useEffect, useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { getMediaUrl } from "../../../../graphQL_requests.js";
import ImageIcon from "../../../shared/icons/ImageIcon.jsx";
import classes from "./HotelAboutGallery.module.css";

// Больше четырёх плиток лента не показывает: если кадров больше, четвёртая
// становится «+N» и ведёт в лайтбокс с первого скрытого кадра.
const MAX_THUMBS = 4;

function Chevron({ dir = "left" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ZoomGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function HotelAboutGallery({ images = [], mediaToken }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const count = images.length;
  const safeIndex = count ? Math.min(index, count - 1) : 0;

  useEffect(() => {
    if (index > count - 1) setIndex(0);
  }, [count, index]);

  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, count]);

  if (!count) {
    return (
      <div className={classes.gallery}>
        <div className={`${classes.hero} ${classes.heroEmpty}`}>
          <ImageIcon width={28} height={28} color="#b3b8ca" />
          <span>В галерее нет изображений</span>
        </div>
      </div>
    );
  }

  const heroUrl = getMediaUrl(images[safeIndex], mediaToken);
  const hasMore = count > MAX_THUMBS;
  // Плитка «+N» занимает последнее место в ленте, поэтому обычных на одну меньше.
  const moreIndex = MAX_THUMBS - 1;
  const visibleThumbs = images.slice(0, hasMore ? moreIndex : MAX_THUMBS);
  const hiddenCount = count - visibleThumbs.length;

  return (
    <div className={classes.gallery}>
      <div className={classes.hero} onClick={() => setLightbox(true)}>
        <img src={heroUrl} alt="" className={classes.heroImg} />
        {count > 1 && (
          <>
            <button
              type="button"
              className={`${classes.navBtn} ${classes.navPrev}`}
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
            >
              <Chevron dir="left" />
            </button>
            <button
              type="button"
              className={`${classes.navBtn} ${classes.navNext}`}
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
            >
              <Chevron dir="right" />
            </button>
          </>
        )}
        <span className={classes.countBadge}>
          <ZoomGlyph />
          {safeIndex + 1} / {count}
        </span>
      </div>

      {count > 1 && (
        <div className={classes.thumbs}>
          {visibleThumbs.map((img, i) => (
            <button
              type="button"
              key={i}
              className={`${classes.thumb} ${
                i === safeIndex ? classes.thumbActive : ""
              }`}
              onClick={() => setIndex(i)}
            >
              <img src={getMediaUrl(img, mediaToken)} alt="" />
            </button>
          ))}
          {hasMore && (
            <button
              type="button"
              className={classes.thumb}
              onClick={() => {
                setIndex(moreIndex);
                setLightbox(true);
              }}
            >
              <img src={getMediaUrl(images[moreIndex], mediaToken)} alt="" />
              <span className={classes.thumbMore}>+{hiddenCount}</span>
            </button>
          )}
        </div>
      )}

      <Modal open={lightbox} onClose={() => setLightbox(false)}>
        <Box className={classes.lightbox} onClick={() => setLightbox(false)}>
          <button
            type="button"
            className={classes.lightboxClose}
            onClick={() => setLightbox(false)}
          />
          <div
            className={classes.lightboxStage}
            onClick={(e) => e.stopPropagation()}
          >
            {count > 1 && (
              <button
                type="button"
                className={`${classes.lightboxNav} ${classes.lightboxPrev}`}
                onClick={prev}
              >
                <Chevron dir="left" />
              </button>
            )}
            <img src={heroUrl} alt="" className={classes.lightboxImg} />
            {count > 1 && (
              <button
                type="button"
                className={`${classes.lightboxNav} ${classes.lightboxNext}`}
                onClick={next}
              >
                <Chevron dir="right" />
              </button>
            )}
          </div>
          <div
            className={classes.lightboxBottom}
            onClick={(e) => e.stopPropagation()}
          >
            <span className={classes.lightboxCounter}>
              {safeIndex + 1} / {count}
            </span>
            {count > 1 && (
              <div className={classes.lightboxThumbs}>
                {images.map((img, i) => (
                  <button
                    type="button"
                    key={i}
                    className={`${classes.lightboxThumb} ${
                      i === safeIndex ? classes.lightboxThumbActive : ""
                    }`}
                    onClick={() => setIndex(i)}
                  >
                    <img src={getMediaUrl(img, mediaToken)} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </Box>
      </Modal>
    </div>
  );
}
