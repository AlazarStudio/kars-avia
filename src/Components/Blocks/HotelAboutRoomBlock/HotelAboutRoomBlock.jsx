import { useState } from "react";
import Modal from "@mui/material/Modal";67
import Box from "@mui/material/Box";
import { server } from "../../../../graphQL_requests";
import classes from "./HotelAboutRoomBlock.module.css";

function HotelAboutRoomBlock({ isEditing, handleChange, index, ...props }) {
  const [modalIsOpen, setModalIsOpen] = useState(false);

  return (
    <article key={props.id} className={classes.hotelAbout_room}>
      <div className={classes.roomImages_wrapper}>
        <img
          src={
            props.images.length !== 0
              ? `${server}${props.images[0]}`
              : "/no-avatar.png"
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
      
      <Modal
        open={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
      >
        <Box className={classes.modalContent}>
          <img
            src={
              props.images.length !== 0
                ? `${server}${props.images[0]}`
                : "/no-avatar.png"
            }
            className={classes.modalImage}
            alt="Room"
          />
          <button onClick={() => setModalIsOpen(false)} className={classes.closeButton}>X</button>
        </Box>
      </Modal>
    </article>
  );
}

export default HotelAboutRoomBlock;
