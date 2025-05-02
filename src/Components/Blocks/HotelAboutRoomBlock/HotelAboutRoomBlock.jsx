import { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { server } from "../../../../graphQL_requests";
import classes from "./HotelAboutRoomBlock.module.css";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

// Карты соответствия для категорий и количества кроватей
const categoryMap = {
  luxe: "Люкс 2 места",
  apartment: "Апартаменты",
  studio: "Студия",
  onePlace: "1 место",
  twoPlace: "2 места",
  threePlace: "3 места",
  fourPlace: "4 места",
  fivePlace: "5 мест",
  sixPlace: "6 мест",
  sevenPlace: "7 мест",
  eightPlace: "8 мест",
  ninePlace: "9 мест",
  tenPlace: "10 мест",
};

const bedsMap = {
  1: "1 кровать",
  2: "2 кровати",
  3: "3 кровати",
  4: "4 кровати",
  5: "5 кроватей",
  6: "6 кроватей",
  7: "7 кроватей",
  8: "8 кроватей",
};

function HotelAboutRoomBlock({ isEditing, handleChange, index, ...props }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [swiper, setSwiper] = useState();
  const [activeIndex, setActiveIndex] = useState(0);

  const closeModal = () => {
    setModalIsOpen(false);
    setActiveIndex(0);
  };

  const handleModalClick = (e) => {
    // Если клик был по фону (а не по изображению), закрыть модальное окно
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return (
    <>
      <article
        key={props.id}
        className={classes.hotelAbout_room}
        onClick={() => setModalIsOpen(true)}
      >
        <div className={classes.roomImages_wrapper}>
          <img
            src={
              props.images.length !== 0
                ? `${server}${props.images[0]}`
                : "/no-image.png"
            }
            className={classes.roomImage}
            alt="Room"
          />
        </div>
        <div className={classes.roomInfoItem}>
          <p>{props.name}</p>
        </div>
        {/* Отображаем категорию через карту соответствия */}
        <div className={classes.roomInfoItem} style={{ fontWeight: "500" }}>
          <p className="blueText">
            {categoryMap[props.category] || "Неизвестная категория"}
          </p>
          {props.beds && (
            <p className="blueText">
              {bedsMap[props.beds] || "Количество кроватей не задано"}
            </p>
          )}
        </div>

        {/* Отображаем количество кроватей через карту соответствия */}
        <div className={classes.roomInfoItem} style={{ fontWeight: "400" }}>
          {props.description}
        </div>
        {/* <div className={`${classes.roomInfoItem} ${classes.ri_textarea}`}>
        <p>{props.description ? props.description : "Описания нет"}</p>
      </div> */}
      </article>
      <Modal open={modalIsOpen} onClose={closeModal}>
        <Box
          className={classes.modalContent}
          onClick={handleModalClick} // Закрытие при клике на фон
        >
          <img
            onClick={closeModal}
            className={classes.closeButton}
            src="/closeSwiper.webp"
            alt=""
          />
          <Swiper
            className={classes.sliderBox}
            spaceBetween={50}
            slidesPerView={1}
            direction="horizontal"
            pagination={{ clickable: true }}
            onSwiper={setSwiper}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            modules={[Autoplay, Pagination]}
          >
            {props.images.length !== 0 ? (
              props.images.map((slide, index) => (
                <SwiperSlide key={index} className={classes.swiperSlide}>
                  <img
                    src={`${server}${slide}`}
                    alt="Room"
                    className={classes.modalImage}
                  />
                </SwiperSlide>
              ))
            ) : (
              <img
                src={"/no-image.png"}
                alt="Room"
                className={classes.modalImage}
              />
            )}
          </Swiper>
          <div
            className={classes.swiperButtons}
            style={props.images.length <= 1 ? { display: "none" } : {}}
          >
            <button
              onClick={() => swiper.slidePrev()}
              style={{
                opacity: activeIndex === 0 ? 0.5 : 1,
                cursor: activeIndex === 0 ? "auto" : "pointer",
                userSelect: "none",
              }}
              disabled={activeIndex === 0}
            >
              <img
                src="/swiper-arrow.png"
                alt=""
                style={{ rotate: "180deg" }}
              />
            </button>
            <button
              onClick={() => swiper.slideNext()}
              style={{
                opacity: activeIndex === props.images.length - 1 ? 0.5 : 1,
                cursor:
                  activeIndex === props.images.length - 1 ? "auto" : "pointer",
                userSelect: "none",
              }}
              disabled={activeIndex === props.images.length - 1}
            >
              <img src="/swiper-arrow.png" alt="" />
            </button>
          </div>
        </Box>
      </Modal>
    </>
  );
}

export default HotelAboutRoomBlock;
