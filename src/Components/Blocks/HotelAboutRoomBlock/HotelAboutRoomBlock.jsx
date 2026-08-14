import { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { getMediaUrl } from "../../../../graphQL_requests";
import classes from "./HotelAboutRoomBlock.module.css";
import TextEditorOutput from "../TextEditorOutput/TextEditorOutput";

// Код категории → вместимость («до N чел.») как запасной вариант: places
// самого номера точнее и имеет приоритет.
import { CATEGORY_PLACES as categoryPlaces } from "../../../utils/roomCategories.js";

const declension = (number, forms) => {
  const n = Math.abs(Number(number));
  if (!Number.isInteger(n)) return forms[1];
  const opts = [2, 0, 1, 1, 1, 2];
  return forms[
    n % 100 > 4 && n % 100 < 20 ? 2 : opts[n % 10 < 5 ? n % 10 : 5]
  ];
};

function Chevron({ dir = "left" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
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

export default function HotelAboutRoomBlock({ mediaToken, ...props }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const images = props.images || [];
  const count = images.length;

  const roomsCount = Number(props.roomsCount) || 0;
  const places = props.places ?? categoryPlaces[props.category];
  const priceByReq = props.priceForAirReq;
  const price = props.priceForAirline;

  const roomsLabel = roomsCount
    ? `${roomsCount} ${declension(roomsCount, ["номер", "номера", "номеров"])}`
    : null;

  const specs = [
    props.square ? `${props.square} м²` : null,
    places ? `до ${places} чел.` : null,
    roomsLabel,
  ].filter(Boolean);

  const close = () => {
    setOpen(false);
    setIndex(0);
  };
  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);

  const cardImg = count ? getMediaUrl(images[0], mediaToken) : "/no-image.png";
  const priceText = price ? `${price.toLocaleString("ru-RU")} ₽` : "—";

  return (
    <>
      <article className={classes.card} onClick={() => setOpen(true)}>
        <div className={classes.imageWrap}>
          <img src={cardImg} alt={props.name} className={classes.image} />
          {roomsLabel && <span className={classes.countBadge}>{roomsLabel}</span>}
        </div>
        <div className={classes.body}>
          <p className={classes.title}>{props.name}</p>
          {specs.length > 0 && <p className={classes.specs}>{specs.join(" · ")}</p>}
          <div className={classes.footer}>
            {priceByReq ? (
              <span className={classes.priceByReq}>Цена по запросу</span>
            ) : (
              <div className={classes.priceWrap}>
                <span className={classes.price}>{priceText}</span>
                <span className={classes.perNight}>/ ночь</span>
              </div>
            )}
            <span className={classes.more}>Подробнее ›</span>
          </div>
        </div>
      </article>

      <Modal open={open} onClose={close}>
        <Box
          className={classes.backdrop}
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className={classes.modal}>
            <button type="button" className={classes.close} onClick={close} />
            <div className={classes.modalLeft}>
              <div className={classes.slider}>
                <img
                  src={count ? getMediaUrl(images[index], mediaToken) : "/no-image.png"}
                  alt={props.name}
                  className={classes.slideImg}
                />
                {count > 1 && (
                  <>
                    <button
                      type="button"
                      className={`${classes.slideNav} ${classes.slidePrev}`}
                      onClick={prev}
                    >
                      <Chevron dir="left" />
                    </button>
                    <button
                      type="button"
                      className={`${classes.slideNav} ${classes.slideNext}`}
                      onClick={next}
                    >
                      <Chevron dir="right" />
                    </button>
                  </>
                )}
              </div>
              {count > 1 && (
                <div className={classes.modalThumbs}>
                  {images.map((img, i) => (
                    <button
                      type="button"
                      key={i}
                      className={`${classes.modalThumb} ${
                        i === index ? classes.modalThumbActive : ""
                      }`}
                      onClick={() => setIndex(i)}
                    >
                      <img src={getMediaUrl(img, mediaToken)} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className={classes.modalRight}>
              <p className={classes.modalTitle}>{props.name}</p>
              {specs.length > 0 && (
                <p className={classes.modalSpecs}>{specs.join(" · ")}</p>
              )}
              {priceByReq ? (
                <div className={classes.modalPriceByReq}>Цена по запросу</div>
              ) : (
                <div className={classes.modalPrice}>
                  {priceText} <span>/ ночь</span>
                </div>
              )}
              {priceByReq && (
                <p className={classes.priceHint}>
                  Идёт согласование тарифов и условий размещения — точная стоимость
                  будет доступна после уточнения деталей.
                </p>
              )}
              {props.description && (
                <div className={classes.modalDesc}>
                  <TextEditorOutput description={props.description} />
                </div>
              )}
            </div>
          </div>
        </Box>
      </Modal>
    </>
  );
}
