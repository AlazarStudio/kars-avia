import { useParams } from "react-router-dom";
import { lazy, Suspense } from "react";

// import HotelAbout_tabComponent from "../../../Blocks/HotelAbout_tabComponent/HotelAbout_tabComponent";

const HotelAboutTab = lazy(() =>
  import("../../../Blocks/HotelAbout_tabComponent/HotelAbout_tabComponent")
);

import MUILoader from "../../../Blocks/MUILoader/MUILoader";
import classes from "./AirlineAdminHotelContent.module.css";

const AirlineAdminHotelContent = ({ id, user }) => {
  return (
    <div className={classes.tabPanel}>
      <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
        <HotelAboutTab id={id} />
      </Suspense>
    </div>
  );
};

export default AirlineAdminHotelContent;
