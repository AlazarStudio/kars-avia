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
  getMediaUrl,
} from "../../../../graphQL_requests";
import {
  SERVICE_CONFIG,
  REQUEST_STATUS_CONFIG,
  getServiceByKey,
  formatDateTime,
} from "../../Blocks/FapV2/fapConstants";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import MUITextField from "../../Blocks/MUITextField/MUITextField";
import MUIAutocomplete from "../../Blocks/MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../../Blocks/MUIAutocompleteColor/MUIAutocompleteColor";
import Button from "../../Standart/Button/Button";
import CreateRepresentativeRequest from "../../Blocks/CreateRepresentativeRequest/CreateRepresentativeRequest";
import { useDebounce } from "../../../hooks/useDebounce";
import Header from "../../Blocks/Header/Header";
import ServiceProgressDot from "../../Blocks/FapV2/ServiceProgressDot/ServiceProgressDot";
import { roles } from "../../../roles";
import { canAccessMenu, isAirlineRole } from "../../../utils/access";

const SERVICE_ORDER = [
  "water",
  "meal",
  "living",
  "transfer",
  "transferDeparture",
  "baggage",
];

const LOGO_PALETTE = [
  "#0057C3",
  "#80BD3B",
  "#0E7BC1",
  "#D62027",
  "#003D7A",
  "#E5A11D",
  "#C8102E",
  "#7C3AED",
  "#10B981",
];

function logoColor(name) {
  if (!name) return "#0057C3";
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return LOGO_PALETTE[Math.abs(h) % LOGO_PALETTE.length];
}

const PlaneSvg = ({ size = 14, color = "#545873" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M21 16v-2l-8-5V3.5C13 2.7 12.3 2 11.5 2S10 2.7 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1L15 22v-1.5L13 19v-5.5L21 16z"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PinSvg = ({ size = 14, color = "#545873" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M21 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 1 1 18 0Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="1.8" />
  </svg>
);

const ClockSvg = ({ size = 14, color = "#0057C3" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
    <path
      d="M12 7v5l3 2"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const STATUS_OPTIONS = [
  { value: null, label: "Все статусы" },
  ...Object.entries(REQUEST_STATUS_CONFIG).map(([value, { label }]) => ({
    value,
    label,
  })),
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
    skip: isAirlineRole(user),
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

  const effectiveAirlineId = isAirlineRole(user)
    ? user?.airlineId
    : selectedAirline?.id;

  const { loading, data, refetch } = useQuery(GET_PASSENGER_REQUESTS, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    variables: {
      skip: 0,
      take: 100,
      filter: {
        status: statusOption?.value ?? undefined,
        search: debouncedSearch || undefined,
        airlineId: effectiveAirlineId,
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

  const serviceDots = (req) =>
    SERVICE_ORDER.map((key) => {
      const svc = getServiceByKey(req, key);
      const enabled = !!svc?.plan?.enabled;
      return { key, enabled, status: svc?.status };
    });

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
          {!isAirlineRole(user) && (
            <MUIAutocomplete
              dropdownWidth="170px"
              label="Авиакомпания"
              hideLabelOnFocus={false}
              options={["Все авиакомпании", ...airlines.map((a) => a.name)]}
              value={selectedAirline ? selectedAirline.name : ""}
              onChange={(_, newValue) => {
                if (!newValue || newValue === "Все авиакомпании") {
                  setSelectedAirline(null);
                } else {
                  setSelectedAirline(
                    airlines.find((a) => a.name === newValue) || null,
                  );
                }
              }}
            />
          )}
          <MUIAutocompleteColor
            dropdownWidth="170px"
            label="Аэропорт"
            hideLabelOnFocus={false}
            options={[
              { id: null, name: "Все аэропорты", code: "" },
              ...airports,
            ]}
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
                    <span
                      key={i}
                      style={{
                        color: i === 0 ? "black" : "gray",
                        marginRight: "4px",
                      }}
                    >
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
                setSelectedAirport(
                  airports.find((a) => a === newValue) || null,
                );
              }
            }}
          />
          <MUIAutocomplete
            dropdownWidth="170px"
            label="Статус"
            hideLabelOnFocus={false}
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
        {canAccessMenu(accessMenu, "reserveCreate", user) && (
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
            <MUILoader fullHeight={"60vh"} />
          </div>
        ) : requests.length === 0 ? (
          <div className={classes.empty}>Заявки не найдены</div>
        ) : (
          requests.map((req) => {
            const statusCfg = REQUEST_STATUS_CONFIG[req.status] || {};
            const dots = serviceDots(req);
            const airlineName = req.airline?.name || "";
            const logoUrl = req.airline?.images?.[0]
              ? getMediaUrl(req.airline.images[0])
              : null;
            const crewCount = req.crewMembers?.length || 0;
            const showCrew = req.includesCrew && crewCount > 0;
            return (
              <div
                key={req.id}
                className={classes.card}
                onClick={() => navigate(`/far/${req.id}`)}
              >
                {/* Kicker: request number + status */}
                <div className={classes.cardKicker}>
                  <span className={classes.cardKickerLabel}>Заявка</span>
                  <span className={classes.cardKickerValue}>
                    {req.requestNumber || req.flightNumber}
                  </span>
                  <span className={classes.cardKickerSpacer} />
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

                {/* Identity: big logo + airline + flight */}
                <div className={classes.cardIdentity}>
                  <span
                    className={classes.cardLogoBig}
                    style={{
                      background: logoUrl ? "#fff" : logoColor(airlineName),
                      boxShadow: logoUrl
                        ? "0 4px 12px rgba(20, 30, 60, 0.12)"
                        : `0 4px 12px ${logoColor(airlineName)}40`,
                    }}
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="" />
                    ) : (
                      (airlineName.trim().charAt(0) || "?").toUpperCase()
                    )}
                  </span>
                  <div className={classes.cardIdentityText}>
                    <div className={classes.cardAirlineName}>
                      {airlineName || "—"}
                    </div>
                    {req.flightNumber && (
                      <div className={classes.cardFlightLine}>
                        <PlaneSvg />
                        Рейс{" "}
                        <strong
                          style={{ color: "var(--text)", fontWeight: 700 }}
                        >
                          {req.flightNumber}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className={classes.cardLines}>
                  {req.airport?.code && (
                    <div className={classes.cardLine}>
                      <PinSvg />
                      <strong>{req.airport.code}</strong>
                      {req.airport.name &&
                        req.airport.name !== req.airport.code && (
                          <>{req.airport.name}</>
                        )}
                    </div>
                  )}
                  {req.createdAt && (
                    <div className={classes.cardLine}>
                      <ClockSvg />
                      <span className={classes.cardLineTime}>
                        {formatDateTime(req.createdAt)}
                      </span>
                    </div>
                  )}
                </div>

                <div className={classes.serviceRow}>
                  <div className={classes.serviceDots}>
                    {dots.map((d) => (
                      <ServiceProgressDot
                        key={d.key}
                        serviceKey={d.key}
                        status={d.status}
                        disabled={!d.enabled}
                        size={32}
                      />
                    ))}
                  </div>
                  {showCrew && (
                    <span className={classes.cardCrew}>экипаж {crewCount}</span>
                  )}
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
