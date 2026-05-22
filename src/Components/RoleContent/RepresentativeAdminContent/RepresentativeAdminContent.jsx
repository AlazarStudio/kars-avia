import { useParams } from "react-router-dom";

import AirlinePage from "../../Blocks/AirlinePage/AirlinePage";
import AirlinesList from "../../Blocks/AirlinesList/AirlinesList";
import HotelPage from "../../Blocks/HotelPage/HotelPage";
import Reports from "../../Blocks/Reports/Reports";
import RepresentativeAirlineCompany_tabComponent from "../../Blocks/RepresentativeAirlineCompany_tabComponent/RepresentativeAirlineCompany_tabComponent";
import DocumentationList from "../../Blocks/DocumentationList/DocumentationList";
import PatchNotesList from "../../Blocks/PatchNotesList/PatchNotesList";
import UpdatesList from "../../Blocks/UpdatesList/UpdatesList";
import RegisterOfContracts from "../../Blocks/RegisterOfContracts/RegisterOfContracts";
import Analytics from "../../Pages/AnalyticsForAvia/Analytics/Analytics";
import RepresentativeRequests from "../../Blocks/RepresentativeRequests/RepresentativeRequests";
import FapV2 from "../../Pages/FapV2/FapV2";

const RepresentativeAdminContent = ({ user }) => {
  const { id, hotelID, airlineID } = useParams();

  return (
    <>
      {(id === "representativeRequests" || (!id && !hotelID && !airlineID)) && (
        <RepresentativeRequests user={user} />
      )}
      {id === "fapv2" && <FapV2 user={user} />}
      {id === "representativeCompany" && <RepresentativeAirlineCompany_tabComponent user={user} id={user?.airlineId} />}
      {id === "airlines" && <AirlinesList user={user} representative={true}/>}
      {id === "reports" && <Reports user={user} />}
      {id === "analytics" && <Analytics user={user} />}
      {id === "documentation" && <DocumentationList user={user} />}
      {/* {id === "updates" && <UpdatesList user={user} />} */}
      {/* {id === "patchNotes" && <PatchNotesList user={user} />} */}
      {!id && hotelID && <HotelPage id={hotelID} user={user} />}
      {!id && airlineID && <AirlinePage id={airlineID} user={user} />}
    </>
  );
};

export default RepresentativeAdminContent;
