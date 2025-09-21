import React, { useState, useEffect, useMemo } from "react";
import classes from "./DocumentationList.module.css";
import Filter from "../Filter/Filter";
import Header from "../Header/Header";
import { useQuery } from "@apollo/client";
import { GET_ALL_DOCUMENTATION, getCookie } from "../../../../graphQL_requests";
import {
  FILTER_OPTIONS,
  fullNotifyTime,
  notifyTime,
  roles,
} from "../../../roles";
import MUILoader from "../MUILoader/MUILoader";
import MUITextField from "../MUITextField/MUITextField";
import Notification from "../../Notification/Notification";
import CreateRequestPatchNote from "../CreateRequestPatchNote/CreateRequestPatchNote";
import EditRequestPatchNote from "../EditRequestPatchNote/EditRequestPatchNote";
import InfoTableDataDocumentation from "../InfoTableDataDocumentation/InfoTableDataDocumentation";
import CreateRequestDocumentation from "../CreateRequestDocumentation/CreateRequestDocumentation";
import EditRequestDocumentation from "../EditRequestDocumentation/EditRequestDocumentation";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";

function DocumentationList({ children, user, ...props }) {
  const token = getCookie("token");
  const [showCreateSidebar, setShowCreateSidebar] = useState(false);
  const [showRequestSidebar, setShowRequestSidebar] = useState(false);
  const [companyData, setCompanyData] = useState([]);
  const [filterValue, setFilterValue] = useState("dispatcher");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false); // Флаг, указывающий, идёт ли поиск

  const { loading, error, data, refetch } = useQuery(GET_ALL_DOCUMENTATION, {
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    variables: {
      type: "documentation",
      filter:
        user?.role === roles.hotelAdmin
          ? "hotel"
          : user?.role === roles.airlineAdmin
          ? "airline"
          : filterValue,
    },
  });

  // в этой версии проблема с дублированием
  useEffect(() => {
    if (data && data.getAllDocumentations) {
      // const sortedHotels = [...data.getAllPatchNotes].sort((a, b) =>
      //   a.information?.city?.localeCompare(b.information?.city)
      // );
      setCompanyData(data.getAllDocumentations);
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
    return companyData?.filter((request) => {
      return request?.name.toLowerCase().includes(searchQuery.toLowerCase());

      // &&
      // request?.parentId === null
      // convertToDate(request.date, false).includes(searchQuery.toLowerCase())
    });
  }, [isSearching, companyData, filterValue, searchQuery]);

  const [DocumentationId, setPatchDocumentationId] = useState();
  const [showEditDocumentation, setShowEditDocumentation] = useState(false);
  const toggleEditDocumentation = (documentation) => {
    setPatchDocumentationId(documentation?.id);
    setShowEditDocumentation(true);
  };

  const currentFilterLabel =
    FILTER_OPTIONS.find((o) => o.value === filterValue)?.label ||
    FILTER_OPTIONS[0].label;

  // console.log(filterValue);

  return (
    <>
      <div className={classes.section}>
        <Header>Инструкции</Header>

        <div className={classes.section_searchAndFilter}>
          <div className={classes.section_searchAndFilter}>
            <MUITextField
              label={"Поиск"}
              className={classes.mainSearch}
              value={searchQuery}
              onChange={handleSearch}
            />
            {(user?.role === roles.dispatcerAdmin ||
              user?.role === roles.superAdmin) && (
              <MUIAutocomplete
                dropdownWidth={"200px"}
                label={"Категория"}
                options={FILTER_OPTIONS.map((o) => o.label)}
                value={currentFilterLabel}
                onChange={(event, newLabel) => {
                  const found =
                    FILTER_OPTIONS.find((o) => o.label === newLabel) ||
                    FILTER_OPTIONS[0];
                  setFilterValue(found.value); // <-- кладём value-строку
                }}
              />
            )}
          </div>

          {user.role === roles.superAdmin && (
            <Filter
              toggleSidebar={toggleCreateSidebar}
              handleChange={handleChange}
              // filterData={filterData}
              buttonTitle={"Добавить статью"}
              needDate={false}
            />
          )}
        </div>
        {loading && <MUILoader />}
        {error && <p>Error: {error.message}</p>}

        {!loading && !error && (
          <InfoTableDataDocumentation
            user={user}
            token={token}
            toggleRequestSidebar={toggleEditDocumentation}
            requests={filteredRequests}
            filterValue={filterValue}
          />
        )}
        <CreateRequestDocumentation
          show={showCreateSidebar}
          onClose={toggleCreateSidebar}
          addNotification={addNotification}
          refetchDocumentation={refetch}
        />

        <EditRequestDocumentation
          user={user}
          show={showEditDocumentation}
          onClose={() => setShowEditDocumentation(false)}
          DocumentationId={DocumentationId}
          addNotification={addNotification}
          refetchDocumentation={refetch}
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

export default DocumentationList;
