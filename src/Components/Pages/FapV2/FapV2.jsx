import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useSubscription } from "@apollo/client";
import classes from "./FapV2.module.css";
import {
  GET_PASSENGER_REQUESTS,
  GET_AIRLINES_RELAY,
  GET_AIRPORTS_RELAY,
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
import MUIAutocompleteColor from "../../Blocks/MUIAutocompleteColor/MUIAutocompleteColor";
import Button from "../../Standart/Button/Button";
import CreateRepresentativeRequest from "../../Blocks/CreateRepresentativeRequest/CreateRepresentativeRequest";
import { useDebounce } from "../../../hooks/useDebounce";
import Header from "../../Blocks/Header/Header";
import { roles } from "../../../roles";

const STATUS_OPTIONS = [
  { value: null, label: "Все статусы" },
  { value: "CREATED", label: "Создан" },
  { value: "ACCEPTED", label: "Принят" },
  { value: "IN_PROGRESS", label: "В работе" },
  { value: "COMPLETED", label: "Завершён" },
  { value: "CANCELLED", label: "Отменён" },
];

const LS_STATUS_KEY = "statusFilterFapV2";

export default function FapV2({ user, accessMenu }) {
  const navigate = useNavigate();
  const token = getCookie("token");

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 400);

  const [statusOption, setStatusOption] = useState(() => {
    const saved = localStorage.getItem(LS_STATUS_KEY);
    return STATUS_OPTIONS.find((o) => o.value === saved) ?? STATUS_OPTIONS[0];
  });

  const [selectedAirline, setSelectedAirline] = useState(null);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [airlines, setAirlines] = useState([]);
  const [airports, setAirports] = useState([]);
  const [showCreate, setShowCreate] = useState(false);

  const { data: airlinesData } = useQuery(GET_AIRLINES_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    skip: user?.role === roles.airlineAdmin,
  });
  const { data: airportsData } = useQuery(GET_AIRPORTS_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  useEffect(() => {
    if (airlinesData) setAirlines(airlinesData.airlines.airlines || []);
  }, [airlinesData]);

  useEffect(() => {
    if (airportsData) setAirports(airportsData.airports || []);
  }, [airportsData]);

  const { loading, data, refetch } = useQuery(GET_PASSENGER_REQUESTS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: {
      skip: 0,
      take: 100,
      filter: {
        status: statusOption?.value ?? undefined,
        search: debouncedSearch || undefined,
        airlineId: selectedAirline?.id,
        airportId: selectedAirport?.id,
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
    Object.values(SERVICE_CONFIG).filter((s) => req[s.key]?.plan?.enabled);

  const handleStatusChange = (val) => {
    const option = val || STATUS_OPTIONS[0];
    setStatusOption(option);
    localStorage.setItem(LS_STATUS_KEY, option.value ?? "");
  };

  return (
    <div className={classes.section}>
      <Header>ФАП — заявки</Header>
      <div className={classes.toolbar}>
        <div className={classes.filters}>
          {user?.role !== roles.airlineAdmin && (
            <MUIAutocomplete
              dropdownWidth="170px"
              label="Авиакомпания"
              options={["Все авиакомпании", ...airlines.map((a) => a.name)]}
              value={selectedAirline ? selectedAirline.name : ""}
              onChange={(_, newValue) => {
                if (!newValue || newValue === "Все авиакомпании") {
                  setSelectedAirline(null);
                } else {
                  setSelectedAirline(airlines.find((a) => a.name === newValue) || null);
                }
              }}
            />
          )}
          <MUIAutocompleteColor
            dropdownWidth="170px"
            label="Аэропорт"
            options={[{ id: null, name: "Все аэропорты", code: "" }, ...airports]}
            getOptionLabel={(o) => (o ? `${o.code} ${o.name}`.trim() : "")}
            renderOption={(optionProps, option) => {
              const isAll = !option.code;
              if (isAll) {
                return (
                  <li {...optionProps} key={option.id ?? "all"}>
                    <span style={{ color: "black" }}>{option.name}</span>
                  </li>
                );
              }
              const words = `${option.code} ${option.name}`.trim().split(" ");
              return (
                <li {...optionProps} key={option.id}>
                  {words.map((word, i) => (
                    <span key={i} style={{ color: i === 0 ? "black" : "gray", marginRight: "4px" }}>
                      {word}
                    </span>
                  ))}
                </li>
              );
            }}
            value={selectedAirport || ""}
            onChange={(_, newValue) => {
              if (!newValue || newValue.name === "Все аэропорты") {
                setSelectedAirport(null);
              } else {
                setSelectedAirport(airports.find((a) => a === newValue) || null);
              }
            }}
          />
          <MUIAutocomplete
            dropdownWidth="170px"
            label="Статус"
            options={STATUS_OPTIONS}
            value={statusOption}
            onChange={(_, val) => handleStatusChange(val)}
            getOptionLabel={(o) => o?.label ?? ""}
            isOptionEqualToValue={(o, v) => o?.value === v?.value}
          />
          <MUITextField
            className={classes.searchWrap}
            label="Поиск"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        {(!user?.airlineId || accessMenu?.requestCreate) && (
          <Button
            backgroundcolor="var(--dark-blue)"
            color="#fff"
            onClick={() => setShowCreate(true)}
          >
            Создать заявку
          </Button>
        )}
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
                      {req.airline?.name && <span>{req.airline.name}</span>}
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
