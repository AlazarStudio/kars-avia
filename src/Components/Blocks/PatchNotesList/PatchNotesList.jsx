import React, { useState, useEffect, useMemo } from "react";
import classes from "./PatchNotesList.module.css";
import Filter from "../Filter/Filter";
import CreateRequestHotel from "../CreateRequestHotel/CreateRequestHotel";
import Header from "../Header/Header";
import InfoTableDataHotels from "../InfoTableDataHotels/InfoTableDataHotels";
import { useQuery, useSubscription } from "@apollo/client";
import {
  convertToDate,
  GET_ALL_PATCH_NOTES,
  GET_HOTELS,
  GET_HOTELS_SUBSCRIPTION,
  GET_HOTELS_UPDATE_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import { fullNotifyTime, notifyTime, roles } from "../../../roles";
import ReactPaginate from "react-paginate";
import { useLocation, useNavigate } from "react-router-dom";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import Notification from "../../Notification/Notification";
import InfoTableDataPatchNotes from "../InfoTableDataPatchNotes/InfoTableDataPatchNotes";
import CreateRequestPatchNote from "../CreateRequestPatchNote/CreateRequestPatchNote";
import EditRequestPatchNote from "../EditRequestPatchNote/EditRequestPatchNote";
import DateRangeModalSelector from "../DateRangeModalSelector/DateRangeModalSelector";

function PatchNotesList({ children, user, ...props }) {
  const token = getCookie("token");
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [companyData, setCompanyData] = useState([]);
  const [filterData, setFilterData] = useState({ filterSelect: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false); // Флаг, указывающий, идёт ли поиск

  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  const { loading, error, data, refetch } = useQuery(GET_ALL_PATCH_NOTES, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  // в этой версии проблема с дублированием
  useEffect(() => {
    if (data && data.getAllPatchNotes) {
      // const sortedHotels = [...data.getAllPatchNotes].sort((a, b) =>
      //   a.information?.city?.localeCompare(b.information?.city)
      // );
      setCompanyData(data.getAllPatchNotes);
    }

    // if (dataSubscription && dataSubscription.hotelCreated) {
    //   setCompanyData((prevCompanyData) => {
    //     const updatedData = [...prevCompanyData, dataSubscription.hotelCreated];
    //     return updatedData.sort((a, b) =>
    //       a.information?.city?.localeCompare(b.information?.city)
    //     );
    //   });
    //   refetch();
    // }
  }, [data, refetch]);
  // }, [data, refetch, dataSubscription, dataSubscriptionUpd]);

  const toggleCreateSidebar = () => {
    setShowCreateSidebar(!showCreateSidebar);
  };

  const toggleRequestSidebar = () => {
    setShowRequestSidebar(!showRequestSidebar);
  };

  const [notifications, setNotifications] = useState([]);

  const addNotification = (text, status) => {
    const id = Date.now(); // Уникальный ID
    setNotifications((prev) => [...prev, { id, text, status }]);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, fullNotifyTime);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilterData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const filteredRequests = useMemo(() => {
    return companyData.filter((request) => {
      const { startDate, endDate } = dateRange;
      const reqDate = new Date(request.date);

      const matchesSearch =
        request.description.includes(searchQuery.toLowerCase()) ||
        request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        convertToDate(request.date, false).includes(searchQuery.toLowerCase());

      const matchesDate =
        startDate && endDate
          ? reqDate >= startDate && reqDate <= endDate
          : true;

      return matchesSearch && matchesDate;
    });
  }, [isSearching, companyData, filterData, searchQuery, dateRange]);

  // console.log(dateRange);

  const [patchNoteId, setPatchNoteId] = useState();
  const [showEditPatchNote, setShowEditPatchNote] = useState(false);
  const toggleEditPatchNote = (patchNote) => {
    setPatchNoteId(patchNote?.id);
    setShowEditPatchNote(true);
  };
  return (
    <>
      <div className={classes.section}>
        <Header>Patch Notes</Header>

        <div className={classes.section_searchAndFilter}>
          <MUITextField
            label={"Поиск"}
            className={classes.mainSearch}
            value={searchQuery}
            onChange={handleSearch}
          />
          <DateRangeModalSelector
            width={"150px"}
            initialRange={dateRange}
            onChange={(start, end) =>
              setDateRange({ startDate: start, endDate: end })
            }
          />
          {(user.role === roles.superAdmin 
          ) && (
            <div className={classes.filter}>
              <Filter
                toggleSidebar={toggleCreateSidebar}
                handleChange={handleChange}
                filterData={filterData}
                buttonTitle={"Добавить патч"}
                needDate={false}
              />
            </div>
          )}
        </div>
        {loading && <MUILoader />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && (
          <InfoTableDataPatchNotes
            toggleRequestSidebar={toggleEditPatchNote}
            requests={filteredRequests}
          />
        )}
        <CreateRequestPatchNote
          show={showCreateSidebar}
          onClose={toggleCreateSidebar}
          addNotification={addNotification}
          refetchPatchNotes={refetch}
        />

        <EditRequestPatchNote
          user={user}
          show={showEditPatchNote}
          onClose={() => setShowEditPatchNote(false)}
          patchNoteId={patchNoteId}
          addNotification={addNotification}
          refetchPatchNotes={refetch}
        />
        {notifications.map((n, index) => (
          <Notification
            key={n.id}
            text={n.text}
            status={n.status}
            index={index}
            time={notifyTime}
            onClose={() => {
              setNotifications((prev) =>
                prev.filter((notif) => notif.id !== n.id)
              );
            }}
          />
        ))}
      </div>
    </>
  );
}

export default PatchNotesList;
