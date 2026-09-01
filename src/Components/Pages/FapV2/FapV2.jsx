import React, { useEffect, useRef, useState } from "react";
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
  formatDate,
} from "../../Blocks/FapV2/fapConstants";
import MUILoader from "../../Blocks/MUILoader/MUILoader";
import MUITextField from "../../Blocks/MUITextField/MUITextField";
import MUIAutocomplete from "../../Blocks/MUIAutocomplete/MUIAutocomplete";
import FilterPopoverButton from "../../Blocks/FilterPopoverButton/FilterPopoverButton";
import MUIAutocompleteColor from "../../Blocks/MUIAutocompleteColor/MUIAutocompleteColor";
import Button from "../../Standart/Button/Button";
import CreateRepresentativeRequest from "../../Blocks/CreateRepresentativeRequest/CreateRepresentativeRequest";
import { useDebounce } from "../../../hooks/useDebounce";
import useInfiniteScroll from "../../../hooks/useInfiniteScroll";
import InfiniteScrollSentinel from "../../Blocks/InfiniteScrollSentinel/InfiniteScrollSentinel";
import DateRangeModalSelector from "../../Blocks/DateRangeModalSelector/DateRangeModalSelector";
import Header from "../../Blocks/Header/Header";
import ServiceProgressDot from "../../Blocks/FapV2/ServiceProgressDot/ServiceProgressDot";
import { roles } from "../../../roles";
import {
  canAccessMenu,
  isAirlineRole,
  isHotelScoped,
} from "../../../utils/access";

const SERVICE_ORDER = [
  "water",
  "meal",
  "living",
  "transfer",
  "transferDeparture",
  "baggage",
];

const PAGE_SIZE = 30;

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
const LIST_STATE_KEY = "fapListScrollState";

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
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
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

  const resetKeysValues = [
    statusOption?.value,
    debouncedSearch,
    effectiveAirlineId,
    selectedAirport?.id,
    dateRange.startDate,
    dateRange.endDate,
  ];
  const listSignature = JSON.stringify(resetKeysValues);

  // Возврат из заявки: восстанавливаем окно подгрузки и позицию скролла,
  // только если фильтры те же, что при уходе (иначе список другой).
  const [savedListState] = useState(() => {
    try {
      const raw = sessionStorage.getItem(LIST_STATE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const restoreState =
    savedListState && savedListState.sig === listSignature ? savedListState : null;

  useEffect(() => {
    if (savedListState && !restoreState) {
      try {
        sessionStorage.removeItem(LIST_STATE_KEY);
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    items: requests,
    loading,
    loadingMore,
    hasMore,
    wrapperRef,
    sentinelRef,
    refreshWindow,
  } = useInfiniteScroll(GET_PASSENGER_REQUESTS, {
    take: PAGE_SIZE,
    initialTake:
      restoreState && restoreState.loaded > PAGE_SIZE
        ? Math.min(Math.ceil(restoreState.loaded / PAGE_SIZE) * PAGE_SIZE, 300)
        : undefined,
    context: { headers: { Authorization: `Bearer ${token}` } },
    buildVariables: (page, take) => ({
      skip: page * take,
      take,
      filter: {
        status: statusOption?.value ?? undefined,
        search: debouncedSearch || undefined,
        airlineId: effectiveAirlineId,
        airportId: selectedAirport?.id,
        dateFrom: dateRange.startDate
          ? dateRange.startDate.toISOString()
          : undefined,
        dateTo: dateRange.endDate
          ? new Date(new Date(dateRange.endDate).setHours(23, 59, 59, 999)).toISOString()
          : undefined,
      },
    }),
    getItems: (d) => d?.passengerRequests,
    resetKeys: resetKeysValues,
  });

  const rememberListState = () => {
    try {
      sessionStorage.setItem(
        LIST_STATE_KEY,
        JSON.stringify({
          scrollTop: wrapperRef.current?.scrollTop || 0,
          loaded: requests.length,
          sig: listSignature,
        })
      );
    } catch {
      /* приватный режим — просто без восстановления */
    }
  };

  // ⚠️ scrollTo с behavior:"instant" обязателен: глобальный `* { scroll-behavior:
  // smooth }` (src/index.css) превратил бы присвоение scrollTop в анимацию,
  // под которой сентинел успевает пересечься и дёрнуть лишнюю догрузку.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    if (!restoreState) return;
    if (loading || requests.length === 0) return;
    restoredRef.current = true;
    try {
      sessionStorage.removeItem(LIST_STATE_KEY);
    } catch {
      /* ignore */
    }
    wrapperRef.current?.scrollTo({
      top: restoreState.scrollTop,
      behavior: "instant",
    });
  }, [loading, requests.length, restoreState, wrapperRef]);

  useSubscription(PASSENGER_REQUEST_CREATED_SUBSCRIPTION, {
    onData: () => refreshWindow(),
  });

  useSubscription(PASSENGER_REQUEST_UPDATED_SUBSCRIPTION, {
    onData: () => refreshWindow(),
  });

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

  const activeFilterCount =
    (selectedAirline ? 1 : 0) +
    (selectedAirport ? 1 : 0) +
    (statusOption?.value ? 1 : 0) +
    (dateRange.startDate || dateRange.endDate ? 1 : 0);

  const handleResetFilters = () => {
    setSelectedAirline(null);
    setSelectedAirport(null);
    setDateRange({ startDate: null, endDate: null });
    handleStatusChange(STATUS_OPTIONS[0]);
  };

  return (
    <div className={classes.section}>
      <Header>ФАП — заявки</Header>
      <div className={classes.toolbar}>
        <FilterPopoverButton
          activeCount={activeFilterCount}
          onReset={handleResetFilters}
        >
          {!isAirlineRole(user) && (
            <MUIAutocomplete
              dropdownWidth="100%"
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
            dropdownWidth="100%"
            label="Аэропорт"
            hideLabelOnFocus={false}
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
                    <span
                      key={i}
                      style={{ color: i === 0 ? "black" : "gray", marginRight: "4px" }}
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
                setSelectedAirport(airports.find((a) => a === newValue) || null);
              }
            }}
          />
          <MUIAutocomplete
            dropdownWidth="100%"
            label="Статус"
            hideLabelOnFocus={false}
            options={STATUS_OPTIONS}
            value={statusOption}
            onChange={(_, val) => handleStatusChange(val)}
            getOptionLabel={(o) => o?.label ?? ""}
            isOptionEqualToValue={(o, v) => o?.value === v?.value}
          />
          <DateRangeModalSelector
            initialRange={dateRange}
            onChange={(startDate, endDate) => setDateRange({ startDate, endDate })}
            width="100%"
          />
        </FilterPopoverButton>
        <MUITextField
          className={classes.searchWrap}
          label="Поиск"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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

      <div className={classes.grid} ref={wrapperRef}>
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
                onClick={() => {
                  rememberListState();
                  navigate(`/far/${req.id}`);
                }}
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
                        {req.flightDate && <> · {formatDate(req.flightDate)}</>}
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

                {/* Гостинице ряд услуг не показываем: она работает только со
                    своим проживанием, чужие услуги заявки — не её зона. */}
                {(!isHotelScoped(user) || showCrew) && (
                  <div className={classes.serviceRow}>
                    {!isHotelScoped(user) && (
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
                    )}
                    {showCrew && (
                      <span className={classes.cardCrew}>экипаж {crewCount}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
        {!loading && (
          <div className={classes.sentinelWrap}>
            <InfiniteScrollSentinel
              sentinelRef={sentinelRef}
              loadingMore={loadingMore}
              hasMore={hasMore}
              hasItems={requests.length > 0}
              endLabel="Больше заявок нет"
            />
          </div>
        )}
      </div>

      {showCreate && (
        <CreateRepresentativeRequest
          show={showCreate}
          onClose={() => {
            setShowCreate(false);
            refreshWindow();
          }}
          user={user}
        />
      )}
    </div>
  );
}
