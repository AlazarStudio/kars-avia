import { useParams } from "react-router-dom";

import AirlineAbout_tabComponent from "../../../Blocks/AirlineAbout_tabComponent/AirlineAbout_tabComponent";
import AirlineShahmatka_tabComponent_Staff from "../../../Blocks/AirlineShahmatka_tabComponent_Staff/AirlineShahmatka_tabComponent_Staff";
import AirlineCompany_tabComponent from "../../../Blocks/AirlineCompany_tabComponent/AirlineCompany_tabComponent";

import classes from "./AirlineAdminAirlineContent.module.css";

const AirlineAdminAirlineContent = ({ id, user }) => {
  const params = useParams();

  return (
    <>
      {(params.id == "airlineCompany" || params.id == undefined) && (
        <div className={classes.tabPanel}>
          <AirlineCompany_tabComponent id={id} />
        </div>
      )}
      {params.id == "airlineStaff" && (
        <div className={classes.tabPanel}>
          <AirlineShahmatka_tabComponent_Staff id={id} />
        </div>
      )}
      {params.id == "airlineAbout" && (
        <div className={classes.tabPanel}>
          <AirlineAbout_tabComponent id={id} />
        </div>
      )}
    </>
  );
};

export default AirlineAdminAirlineContent;
