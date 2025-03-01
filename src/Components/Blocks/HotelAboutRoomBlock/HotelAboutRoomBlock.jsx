import { useState } from "react";
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import { server } from "../../../../graphQL_requests";
import classes from "./HotelAboutRoomBlock.module.css";
import "swiper/css";
import "swiper/css/pagination";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

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
    <article key={props.id} className={classes.hotelAbout_room}>
      <div className={classes.roomImages_wrapper}>
        <img
          src={
            props.images.length !== 0
              ? `${server}${props.images[0]}`
              : "/no-image.png"
          }
          className={classes.roomImage}
          onClick={() => setModalIsOpen(true)}
          alt="Room"
        />
      </div>
      <div className={classes.roomInfoItem}>
        <p style={{ fontWeight: "600" }}>{props.name}</p>
      </div>
      <div className={`${classes.roomInfoItem} ${classes.ri_textarea}`}>
        <p>{props.description ? props.description : "Описания нет"}</p>
      </div>

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
    </article>
  );
}

export default HotelAboutRoomBlock;
