import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useSubscription } from "@apollo/client";
import {
  GET_PASSENGER_REQUEST,
  GET_AIRLINE_DEPARTMENT,
  GET_DISPATCHER_DEPARTMENTS,
  PASSENGER_REQUEST_UPDATED_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import { SERVICE_CONFIG } from "../../Blocks/FapV2/fapConstants";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import Header from "../../Blocks/Header/Header";
import MenuDispetcher from "../../Blocks/MenuDispetcher/MenuDispetcher";
import FapWaterMealSection from "../../Blocks/FapV2/FapWaterMealSection/FapWaterMealSection";
import FapLivingSection from "../../Blocks/FapV2/FapLivingSection/FapLivingSection";
import FapTransferSection from "../../Blocks/FapV2/FapTransferSection/FapTransferSection";
import FapBaggageSection from "../../Blocks/FapV2/FapBaggageSection/FapBaggageSection";
import {
  isAirlineRole as isAirlineRoleCheck,
  isDispatcherRole as isDispatcherRoleCheck,
} from "../../../utils/access";
import mainClasses from "../../Pages/Main_page/Main_Page.module.css";
import classes from "./FapServicePage.module.css";

export default function FapServicePage({ user }) {
  const { requestId, serviceKey } = useParams();
  const navigate = useNavigate();
  const token = getCookie("token");

  const [accessMenu, setAccessMenu] = useState({});
  const isDispatcherRole = isDispatcherRoleCheck(user);
  const isAirlineRole = isAirlineRoleCheck(user);
  const dispatcherDepartmentId = user?.dispatcherDepartmentId;

  const { data: airlineDepartmentData } = useQuery(GET_AIRLINE_DEPARTMENT, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { airlineDepartmentId: user?.airlineDepartmentId },
    skip: !isAirlineRole || !user?.airlineDepartmentId,
  });

  const { data: dispatcherDepartmentsData } = useQuery(GET_DISPATCHER_DEPARTMENTS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { pagination: { all: true } },
    skip: !isDispatcherRole,
  });

  useEffect(() => {
    if (isDispatcherRole) {
      const department = dispatcherDepartmentsData?.dispatcherDepartments?.departments?.find(
        (item) => item.id === dispatcherDepartmentId
      );
      setAccessMenu(department?.accessMenu || {});
      return;
    }
    if (isAirlineRole) {
      setAccessMenu(airlineDepartmentData?.airlineDepartment?.accessMenu || {});
      return;
    }
    setAccessMenu({});
  }, [isDispatcherRole, isAirlineRole, dispatcherDepartmentId, dispatcherDepartmentsData, airlineDepartmentData]);

  const { loading, data, refetch } = useQuery(GET_PASSENGER_REQUEST, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: { passengerRequestId: requestId },
  });

  useSubscription(PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, {
    onData: () => refetch(),
  });

  const request = data?.passengerRequest;
  const cfg = SERVICE_CONFIG[serviceKey];
  const noop = () => {};

  const renderSection = () => {
    if (!request || !cfg) return null;

    switch (serviceKey) {
      case "water":
        return (
          <FapWaterMealSection
            service={request.waterService}
            serviceKind="WATER"
            label={cfg.label}
            color={cfg.color}
            requestId={request.id}
            onRefetch={refetch}
            isOpen={true}
            onToggle={noop}
          />
        );
      case "meal":
        return (
          <FapWaterMealSection
            service={request.mealService}
            serviceKind="MEAL"
            label={cfg.label}
            color={cfg.color}
            requestId={request.id}
            onRefetch={refetch}
            isOpen={true}
            onToggle={noop}
          />
        );
      case "living":
        return (
          <FapLivingSection
            service={request.livingService}
            color={cfg.color}
            request={request}
            onRefetch={refetch}
            isOpen={true}
            onToggle={noop}
          />
        );
      case "transfer":
        return (
          <FapTransferSection
            service={request.transferService}
            color={cfg.color}
            request={request}
            onRefetch={refetch}
            isOpen={true}
            onToggle={noop}
          />
        );
      case "baggage":
        return (
          <FapBaggageSection
            service={request.baggageDeliveryService}
            color={cfg.color}
            request={request}
            onRefetch={refetch}
            isOpen={true}
            onToggle={noop}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={mainClasses.main}>
      <MenuDispetcher id="fapv2" user={user} accessMenu={accessMenu} />

      <div className={classes.page}>
        <Header>
          <div className={classes.headerNav}>
            <button
              className={classes.backBtn}
              onClick={() => navigate(`/fapv2/${requestId}`)}
            >
              <img src="/arrow.png" alt="" />
            </button>
            <span className={classes.headerNavTitle}>
              {request
                ? `${request.flightNumber} — ${cfg?.label ?? serviceKey}`
                : cfg?.label ?? serviceKey}
            </span>
          </div>
        </Header>

        {loading ? (
          <div className={classes.loader}>
            <MUILoader />
          </div>
        ) : (
          <div className={classes.content}>{renderSection()}</div>
        )}
      </div>
    </div>
  );
}
