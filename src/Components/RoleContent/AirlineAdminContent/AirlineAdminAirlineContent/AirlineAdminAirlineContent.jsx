import { useParams } from "react-router-dom";
import { lazy, Suspense } from "react";

// import AirlineAbout_tabComponent from "../../../Blocks/AirlineAbout_tabComponent/AirlineAbout_tabComponent";
// import AirlineShahmatka_tabComponent_Staff from "../../../Blocks/AirlineShahmatka_tabComponent_Staff/AirlineShahmatka_tabComponent_Staff";
// import AirlineCompany_tabComponent from "../../../Blocks/AirlineCompany_tabComponent/AirlineCompany_tabComponent";

const AirlineCompanyTab = lazy(() =>
  import(
    "../../../Blocks/AirlineCompany_tabComponent/AirlineCompany_tabComponent"
  )
);
const AirlineShahmatkaTabStaff = lazy(() =>
  import(
    "../../../Blocks/AirlineShahmatka_tabComponent_Staff/AirlineShahmatka_tabComponent_Staff"
  )
);
const AirlineAboutTab = lazy(() =>
  import("../../../Blocks/AirlineAbout_tabComponent/AirlineAbout_tabComponent")
);

import MUILoader from "../../../Blocks/MUILoader/MUILoader";
import classes from "./AirlineAdminAirlineContent.module.css";

const AirlineAdminAirlineContent = ({ id, user }) => {
  const params = useParams();

  return (
    <>
      {(params.id == "airlineCompany" || params.id == undefined) && (
        <div className={classes.tabPanel}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <AirlineCompanyTab id={id} />
          </Suspense>
        </div>
      )}
      {params.id == "airlineStaff" && (
        <div className={classes.tabPanel}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <AirlineShahmatkaTabStaff id={id} />
          </Suspense>
        </div>
      )}
      {params.id == "airlineAbout" && (
        <div className={classes.tabPanel}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <AirlineAboutTab id={id} />
          </Suspense>
        </div>
      )}
    </>
  );
};

export default AirlineAdminAirlineContent;
