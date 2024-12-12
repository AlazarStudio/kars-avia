import { server } from "../../../../graphQL_requests";
import classes from "./HotelAboutRoomBlock.module.css";

function HotelAboutRoomBlock({ isEditing, handleChange, index, ...props }) {
  return (
    <article key={props.id} className={classes.hotelAbout_room}>
      {/* {props.images.length !== 0 ? ( */}
        <div className={classes.roomImages_wrapper}>
          {/* <label>Изображения</label> */}
          {/* {props.images.length > 0
          ? props.images.map((img, index) => (
              <img
                key={index}
                src={`${server}${img}`}
                alt={`Room ${props.name}`}
                className={classes.roomImage}
              />
            ))
          : "Нет изображений"} */}

          <img
            src={props.images.length !== 0 ? `${server}${props.images[0]}` : '/no-avatar.png'}
            className={classes.roomImage}
          />
        </div>
      {/* ) : (
        <p className={classes.noImage}>Нет изображения</p>
      )} */}
      <div className={classes.roomInfoItem}>
        {/* <label>Название</label> */}
        <p style={{fontWeight:"600"}}>{props.name}</p>
        {/* <input
          type="text"
          name={`rooms.${index}.name`} // Формируем имя с индексом
          value={props.name}
          onChange={handleChange}
          disabled={!isEditing}
        /> */}
      </div>
      {/* <div>
            <strong>Категория:</strong>{" "}
            {props.category === "onePlace"
              ? "Одноместный"
              : props.category === "twoPlace"
              ? "Двухместный"
              : "Другое"}
          </div>
          <div>
            <strong>Мест:</strong> {props.places}
          </div>
          <div>
            <strong>Резерв:</strong> {props.reserve ? "Да" : "Нет"}
          </div>
          <div>
            <strong>Активен:</strong> {props.active ? "Да" : "Нет"}
          </div> */}
      <div className={`${classes.roomInfoItem} ${classes.ri_textarea}`}>
        {/* <label>Описание</label> */}
        <p>{props.description ? props.description : "Описания нет"}</p>
        {/* <textarea
          type="text"
          name={`rooms.${index}.description`} // Формируем имя с индексом
          value={props.description || ""}
          onChange={handleChange}
          disabled={!isEditing}
        /> */}
      </div>
    </article>
  );
}

export default HotelAboutRoomBlock;
