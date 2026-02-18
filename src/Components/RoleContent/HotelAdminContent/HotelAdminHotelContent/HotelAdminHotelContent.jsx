import { useParams } from "react-router-dom";
import { lazy, Suspense } from "react";

// import HotelAbout_tabComponent from "../../../Blocks/HotelAbout_tabComponent/HotelAbout_tabComponent";
// import HotelCompany_tabComponent from "../../../Blocks/HotelCompany_tabComponent/HotelCompany_tabComponent";
// import HotelNomerFond_tabComponent from "../../../Blocks/HotelNomerFond_tabComponent/HotelNomerFond_tabComponent";
// import HotelShahmatka_tabComponent from "../../../Blocks/HotelShahmatka_tabComponent/HotelShahmatka_tabComponent";
// import HotelTarifs_tabComponent from "../../../Blocks/HotelTarifs_tabComponent/HotelTarifs_tabComponent";
// import HotelSettings_tabComponent from "../../../Blocks/HotelSettings_tabComponent/HotelSettings_tabComponent";

const HotelAboutTab = lazy(() =>
  import("../../../Blocks/HotelAbout_tabComponent/HotelAbout_tabComponent")
);
const HotelRegisterOfContracts = lazy(() =>
  import("../../../Blocks/HotelRegisterOfContracts/HotelRegisterOfContracts")
);
const HotelCompanyTab = lazy(() =>
  import("../../../Blocks/HotelCompany_tabComponent/HotelCompany_tabComponent")
);
const HotelNomerFondTab = lazy(() =>
  import(
    "../../../Blocks/HotelNomerFond_tabComponent/HotelNomerFond_tabComponent"
  )
);
const HotelShahmatkaTab = lazy(() =>
  import(
    "../../../Blocks/HotelShahmatka_tabComponent/HotelShahmatka_tabComponent"
  )
);
const HotelTarifsTab = lazy(() =>
  import("../../../Blocks/HotelTarifs_tabComponent/HotelTarifs_tabComponent")
);
const HotelSettingsTab = lazy(() =>
  import(
    "../../../Blocks/HotelSettings_tabComponent/HotelSettings_tabComponent"
  )
);

import MUILoader from "../../../Blocks/MUILoader/MUILoader";
import classes from "./HotelAdminHotelContent.module.css";

const HotelAdminHotelContent = ({ id, user }) => {
  const params = useParams();

  return (
    <>
      {(params.id == "hotelChess" || params.id == undefined) && (
        <div className={classes.tabPanel}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelShahmatkaTab id={id} user={user} />
          </Suspense>
        </div>
      )}
      {params.id == "hotelTarifs" && (
        <div className={classes.tabPanel}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelTarifsTab
              id={id}
              user={user}
              height={"calc(100vh - 130px)"}
            />
          </Suspense>
        </div>
      )}
      {/* {params.id == "hotelTarifs" && <Non_Found_Page />} */}
      {params.id == "hotelRooms" && (
        <div className={classes.tabPanel}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelNomerFondTab id={id} />
          </Suspense>
        </div>
      )}
      {params.id == "hotelCompany" && (
        <div className={classes.tabPanel}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelCompanyTab id={id} />
          </Suspense>
        </div>
      )}
      {params.id == "hotelAbout" && (
        <div className={classes.tabPanel}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelAboutTab id={id} />
          </Suspense>
        </div>
      )}
      {params.id == "hotelSettings" && (
        <div className={classes.tabPanel}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelSettingsTab id={id} />
          </Suspense>
        </div>
      )}
      {params.id == "hotelRegisterOfContracts" && (
        <div className={classes.tabPanel}>
          <Suspense fallback={<MUILoader fullHeight={"100%"} />}>
            <HotelRegisterOfContracts id={id} user={user} />
          </Suspense>
        </div>
      )}
    </>
  );
};

export default HotelAdminHotelContent;
