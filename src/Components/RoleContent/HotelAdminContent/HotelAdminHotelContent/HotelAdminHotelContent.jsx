import { useParams } from "react-router-dom";

import HotelAbout_tabComponent from "../../../Blocks/HotelAbout_tabComponent/HotelAbout_tabComponent";
import HotelCompany_tabComponent from "../../../Blocks/HotelCompany_tabComponent/HotelCompany_tabComponent";
import HotelNomerFond_tabComponent from "../../../Blocks/HotelNomerFond_tabComponent/HotelNomerFond_tabComponent";
import HotelShahmatka_tabComponent from "../../../Blocks/HotelShahmatka_tabComponent/HotelShahmatka_tabComponent";
import HotelTarifs_tabComponent from "../../../Blocks/HotelTarifs_tabComponent/HotelTarifs_tabComponent";

import classes from "./HotelAdminHotelContent.module.css";
import Non_Found_Page from "../../../Pages/Non_Found_Page";

const HotelAdminHotelContent = ({ id, user }) => {
  const params = useParams();

  return (
    <>
      {(params.id == "hotelChess" || params.id == undefined) && (
        <div className={classes.tabPanel}>
          <HotelShahmatka_tabComponent id={id} />
        </div>
      )}
      {/* {params.id == 'hotelTarifs' && (
				<div className={classes.tabPanel}>
					<HotelTarifs_tabComponent id={id} user={user} />
				</div>
			)} */}
      {params.id == "hotelTarifs" && <Non_Found_Page />}
      {params.id == "hotelRooms" && (
        <div className={classes.tabPanel}>
          <HotelNomerFond_tabComponent id={id} />
        </div>
      )}
      {params.id == "hotelCompany" && (
        <div className={classes.tabPanel}>
          <HotelCompany_tabComponent id={id} />
        </div>
      )}
      {params.id == "hotelAbout" && (
        <div className={classes.tabPanel}>
          <HotelAbout_tabComponent id={id} />
        </div>
      )}
    </>
  );
};

export default HotelAdminHotelContent;
