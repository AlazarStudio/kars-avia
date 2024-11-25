import { useParams } from "react-router-dom";

import HotelAbout_tabComponent from "../../../Blocks/HotelAbout_tabComponent/HotelAbout_tabComponent";

import classes from "./AirlineAdminHotelContent.module.css";

const AirlineAdminHotelContent = ({ id, user }) => {

  return (
    <div className={classes.tabPanel}>
      <HotelAbout_tabComponent id={id} />
    </div>
  );
};

export default AirlineAdminHotelContent;
