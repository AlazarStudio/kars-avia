import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useSubscription } from "@apollo/client";
import classes from "./FapV2.module.css";
import {
  GET_PASSENGER_REQUESTS,
  PASSENGER_REQUEST_CREATED_SUBSCRIPTION,
  PASSENGER_REQUEST_UPDATED_SUBSCRIPTION,
  getCookie,
} from "../../../../graphQL_requests";
import {
  SERVICE_CONFIG,
  REQUEST_STATUS_CONFIG,
  formatDate,
  formatTime,
} from "../../Blocks/FapV2/fapConstants";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import MUITextField from "../../Blocks/MUITextField/MUITextField";
import MUIAutocomplete from "../../Blocks/MUIAutocomplete/MUIAutocomplete";
import Button from "../../Standart/Button/Button";
import CreateRepresentativeRequest from "../../Blocks/CreateRepresentativeRequest/CreateRepresentativeRequest";
import { useDebounce } from "../../../hooks/useDebounce";
import Header from "../../Blocks/Header/Header";

const STATUS_OPTIONS = [
  { value: null, label: "Все статусы" },
  { value: "CREATED", label: "Создан" },
  { value: "ACCEPTED", label: "Принят" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "COMPLETED", label: "Завершён" },
  { value: "CANCELLED", label: "Отменён" },
];

export default function FapV2({ user }) {
  const navigate = useNavigate();
  const token = getCookie("token");

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);
  const [statusOption, setStatusOption] = useState(STATUS_OPTIONS[0]);
  const [showCreate, setShowCreate] = useState(false);

  const { loading, data, refetch } = useQuery(GET_PASSENGER_REQUESTS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: {
      skip: 0,
      take: 100,
      filter: {
        status: statusOption?.value ?? undefined,
        search: debouncedSearch || undefined,
      },
    },
  });

  useSubscription(PASSENGER_REQUEST_CREATED_SUBSCRIPTION, {
    onData: () => refetch(),
  });

  useSubscription(PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, {
    onData: () => refetch(),
  });

  const requests = data?.passengerRequests || [];

  const enabledServices = (req) =>
    Object.values(SERVICE_CONFIG).filter(
      (s) => req[s.key]?.plan?.enabled
    );

  return (
    <div className={classes.section}>
      <Header>ФАП — заявки</Header>
      <div className={classes.toolbar}>
        <MUITextField
          className={classes.searchWrap}
          label="Поиск по рейсу"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <MUIAutocomplete
          className={classes.statusWrap}
          label="Статус"
          options={STATUS_OPTIONS}
          value={statusOption}
          onChange={(_, val) => setStatusOption(val || STATUS_OPTIONS[0])}
          getOptionLabel={(o) => o?.label ?? ""}
          isOptionEqualToValue={(o, v) => o?.value === v?.value}
          dropdownWidth="200px"
        />
        <Button
          backgroundcolor="var(--dark-blue)"
          color="#fff"
          onClick={() => setShowCreate(true)}
        >
          + Создать заявку
        </Button>
      </div>

      <div className={classes.grid}>
        {loading ? (
          <div className={classes.loader}>
            <MUILoader />
          </div>
        ) : requests.length === 0 ? (
          <div className={classes.empty}>Заявки не найдены</div>
        ) : (
          requests.map((req) => {
              const statusCfg = REQUEST_STATUS_CONFIG[req.status] || {};
              const services = enabledServices(req);
              return (
                <div
                  key={req.id}
                  className={classes.card}
                  onClick={() => navigate(`/fapv2/${req.id}`)}
                >
                  <div className={classes.cardTop}>
                    <div className={classes.cardFlight}>
                      <div className={classes.flightNumber}>
                        {req.flightNumber}
                      </div>
                      <div className={classes.flightMeta}>
                        {req.airline?.name && (
                          <span>{req.airline.name}</span>
                        )}
                        {req.airport?.code && (
                          <>
                            <span className={classes.dot} />
                            <span>{req.airport.code}</span>
                          </>
                        )}
                        {req.waterService?.plan?.plannedAt && (
                          <>
                            <span className={classes.dot} />
                            <span>
                              {formatTime(req.waterService.plan.plannedAt)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span
                      className={classes.statusBadge}
                      style={{
                        color: statusCfg.color,
                        background: statusCfg.bg,
                      }}
                    >
                      {statusCfg.label || req.status}
                    </span>
                  </div>

                  {services.length > 0 && (
                    <div className={classes.cardServices}>
                      {services.map((s) => (
                        <span
                          key={s.key}
                          className={classes.serviceChip}
                          style={{ color: s.color, background: s.bg }}
                        >
                          {s.label}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className={classes.cardBottom}>
                    <span className={classes.cardDate}>
                      {formatDate(req.createdAt)}
                    </span>
                  </div>
                </div>
              );
          })
        )}
      </div>

      {showCreate && (
        <CreateRepresentativeRequest
          show={showCreate}
          onClose={() => {
            setShowCreate(false);
            refetch();
          }}
          user={user}
        />
      )}
    </div>
  );
}
