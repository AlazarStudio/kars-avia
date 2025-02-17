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

      <Modal open={modalIsOpen} onClose={() => setModalIsOpen(false)}>
        <Box className={classes.modalContent}>
          <Swiper
            className={classes.sliderBox}
            spaceBetween={50}
            slidesPerView={1}
            direction="horizontal"
            // loop={true}
            // autoplay={{
            //   delay: 3000,
            //   disableOnInteraction: false,
            // }}
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
                    alt=""
                    className={classes.modalImage}
                  />
                </SwiperSlide>
              ))
            ) : (
              <img
                src={"/no-image.png"}
                className={classes.modalImage}
                alt="Room"
              />
            )}
          </Swiper>
          <button
            onClick={() => setModalIsOpen(false)}
            className={classes.closeButton}
          >
            X
          </button>
          <div className={classes.swiperButtons}>
            <button
              onClick={() => swiper.slidePrev()}
              style={{ position: "absolute", left: "-100px" }}
            >
              <img
                src="/swiper-arrow.png"
                alt=""
                style={{ rotate: "180deg" }}
              />
            </button>
            <button
              onClick={() => swiper.slideNext()}
              style={{ position: "absolute", right: "-100px" }}
            >
              <img src="/swiper-arrow.png" alt="" />
            </button>
          </div>
          {/* <img
            src={
              props.images.length !== 0
                ? `${server}${props.images[0]}`
                : "/no-image.png"
            }
            className={classes.modalImage}
            alt="Room"
          />
          <button onClick={() => setModalIsOpen(false)} className={classes.closeButton}>X</button> */}
        </Box>
      </Modal>
    </article>
  );
}

export default HotelAboutRoomBlock;
