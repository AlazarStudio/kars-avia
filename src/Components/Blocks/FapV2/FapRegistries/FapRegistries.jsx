import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@apollo/client";
import classes from "./FapRegistries.module.css";
import {
  GET_PASSENGER_SERVICE_REGISTRIES,
  GET_AIRLINES_RELAY,
  GET_AIRPORTS_RELAY,
  getCookie,
} from "../../../../../graphQL_requests";
import Header from "../../Header/Header";
import Button from "../../../Standart/Button/Button";
import MUILoader from "../../MUILoader/MUILoader";
import MUIAutocomplete from "../../MUIAutocomplete/MUIAutocomplete";
import MUIAutocompleteColor from "../../MUIAutocompleteColor/MUIAutocompleteColor";
import FilterPopoverButton from "../../FilterPopoverButton/FilterPopoverButton";
import DateRangeModalSelector from "../../DateRangeModalSelector/DateRangeModalSelector";
import useInfiniteScroll from "../../../../hooks/useInfiniteScroll";
import InfiniteScrollSentinel from "../../InfiniteScrollSentinel/InfiniteScrollSentinel";
import FapRegistryRow from "./FapRegistryRow";
import FapRegistryCreateSidebar from "./FapRegistryCreateSidebar";
import FapRegistryView from "./FapRegistryView";
import { REGISTRY_KIND_OPTIONS, REGISTRY_STAGE_OPTIONS } from "../fapRegistryStages";
import { readRegistryLink, withRegistryLink } from "../fapRegistryLink";
import {
  canAccessMenu,
  isAirlineRole,
  isDispatcherRole,
  isSuperAdmin,
} from "../../../../utils/access";
import { toDateInputValue } from "../../../../utils/dateInputValue.js";

const PAGE_SIZE = 30;

export default function FapRegistries({ user, accessMenu }) {
  const token = getCookie("token");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const openedId = readRegistryLink(searchParams);

  const isAirline = isAirlineRole(user);
  const isDispatcher = isSuperAdmin(user) || isDispatcherRole(user);
  const canCreate = isDispatcher && canAccessMenu(accessMenu, "reserveUpdate", user);

  const [kindOption, setKindOption] = useState(REGISTRY_KIND_OPTIONS[0]);
  const [stageOption, setStageOption] = useState(REGISTRY_STAGE_OPTIONS[0]);
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [selectedAirport, setSelectedAirport] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [showCreate, setShowCreate] = useState(false);

  const { data: airlinesData } = useQuery(GET_AIRLINES_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
    skip: isAirline,
  });
  const { data: airportsData } = useQuery(GET_AIRPORTS_RELAY, {
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const airlines = airlinesData?.airlines?.airlines ?? [];
  const airports = airportsData?.airports ?? [];

  // Дата фильтра → YYYY-MM-DD в локальном времени (бэк считает московские сутки).
  const filter = {
    kind: kindOption?.value ?? undefined,
    stage: stageOption?.value ?? undefined,
    airlineId: selectedAirline?.id ?? undefined,
    airportId: selectedAirport?.id ?? undefined,
    dateFrom: toDateInputValue(dateRange.startDate) || undefined,
    dateTo: toDateInputValue(dateRange.endDate) || undefined,
  };

  const {
    items: registries,
    hasMore,
    loading,
    loadingMore,
    wrapperRef,
    sentinelRef,
  } = useInfiniteScroll(GET_PASSENGER_SERVICE_REGISTRIES, {
    take: PAGE_SIZE,
    enabled: !openedId,
    context: { headers: { Authorization: `Bearer ${token}` } },
    buildVariables: (page, take) => ({ skip: page * take, take, filter }),
    getItems: (d) => d?.passengerServiceRegistries ?? [],
    resetKeys: [
      filter.kind,
      filter.stage,
      filter.airlineId,
      filter.airportId,
      filter.dateFrom,
      filter.dateTo,
    ],
  });

  // Открытый реестр живёт в адресе: ссылка из письма открывает его сразу, F5
  // держит. Пока карточка открыта, список не грузится (enabled: !openedId), а
  // при закрытии useInfiniteScroll сам перечитывает голову — стадия могла
  // смениться.
  const openRegistry = (id) =>
    setSearchParams(withRegistryLink(searchParams, id), { replace: true });
  const closeRegistry = () =>
    setSearchParams(withRegistryLink(searchParams, null), { replace: true });

  const activeFilterCount =
    (kindOption?.value ? 1 : 0) +
    (stageOption?.value ? 1 : 0) +
    (selectedAirline ? 1 : 0) +
    (selectedAirport ? 1 : 0) +
    (dateRange.startDate || dateRange.endDate ? 1 : 0);

  const resetFilters = () => {
    setKindOption(REGISTRY_KIND_OPTIONS[0]);
    setStageOption(REGISTRY_STAGE_OPTIONS[0]);
    setSelectedAirline(null);
    setSelectedAirport(null);
    setDateRange({ startDate: null, endDate: null });
  };

  if (openedId) {
    return (
      <div className={classes.section}>
        <FapRegistryView
          id={openedId}
          user={user}
          canManage={canCreate}
          onClose={closeRegistry}
        />
      </div>
    );
  }

  return (
    <div className={classes.section}>
      <Header>ФАП — реестры услуг</Header>
      <div className={classes.toolbar}>
        <button
          type="button"
          className={classes.backBtn}
          onClick={() => navigate("/far")}
        >
          ← К заявкам
        </button>
        <FilterPopoverButton activeCount={activeFilterCount} onReset={resetFilters}>
          <MUIAutocomplete
            dropdownWidth="100%"
            label="Вид"
            hideLabelOnFocus={false}
            options={REGISTRY_KIND_OPTIONS}
            value={kindOption}
            onChange={(_, v) => setKindOption(v || REGISTRY_KIND_OPTIONS[0])}
            getOptionLabel={(o) => o?.label ?? ""}
            isOptionEqualToValue={(o, v) => o?.value === v?.value}
          />
          {!isAirline && (
            <MUIAutocomplete
              dropdownWidth="100%"
              label="Авиакомпания"
              hideLabelOnFocus={false}
              options={["Все авиакомпании", ...airlines.map((a) => a.name)]}
              value={selectedAirline ? selectedAirline.name : ""}
              onChange={(_, v) =>
                setSelectedAirline(
                  !v || v === "Все авиакомпании"
                    ? null
                    : airlines.find((a) => a.name === v) || null,
                )
              }
            />
          )}
          <MUIAutocompleteColor
            dropdownWidth="100%"
            label="Аэропорт"
            hideLabelOnFocus={false}
            options={[{ id: null, name: "Все аэропорты", code: "" }, ...airports]}
            getOptionLabel={(o) => (o ? `${o.code} ${o.name}`.trim() : "")}
            renderOption={(optionProps, option) => (
              <li {...optionProps} key={option.id ?? "all"}>
                <span style={{ color: "black" }}>
                  {`${option.code} ${option.name}`.trim()}
                </span>
              </li>
            )}
            value={selectedAirport || ""}
            isOptionEqualToValue={(o, v) => o?.id === v?.id}
            onChange={(_, v) => setSelectedAirport(!v || !v.id ? null : v)}
          />
          <MUIAutocomplete
            dropdownWidth="100%"
            label="Стадия"
            hideLabelOnFocus={false}
            options={REGISTRY_STAGE_OPTIONS.filter(
              (o) => isDispatcher || o.value !== "DRAFT",
            )}
            value={stageOption}
            onChange={(_, v) => setStageOption(v || REGISTRY_STAGE_OPTIONS[0])}
            getOptionLabel={(o) => o?.label ?? ""}
            isOptionEqualToValue={(o, v) => o?.value === v?.value}
          />
          <DateRangeModalSelector
            initialRange={dateRange}
            onChange={(startDate, endDate) => setDateRange({ startDate, endDate })}
            width="100%"
          />
        </FilterPopoverButton>
        <span className={classes.spacer} />
        {canCreate && (
          <Button
            backgroundcolor="var(--dark-blue)"
            color="#fff"
            onClick={() => setShowCreate(true)}
          >
            Сформировать
          </Button>
        )}
      </div>

      <div className={classes.list} ref={wrapperRef}>
        {loading ? (
          <div className={classes.loader}>
            <MUILoader fullHeight="60vh" />
          </div>
        ) : registries.length === 0 ? (
          <div className={classes.empty}>Реестров нет</div>
        ) : (
          <>
            <div className={classes.head}>
              <span>Номер</span>
              <span>Вид</span>
              <span>Авиакомпания</span>
              <span>Город</span>
              <span>Период</span>
              <span>Строк</span>
              <span>Сумма для АК</span>
              <span>Стадия</span>
            </div>
            {registries.map((r) => (
              <FapRegistryRow
                key={r.id}
                registry={r}
                onOpen={() => openRegistry(r.id)}
              />
            ))}
          </>
        )}
        <InfiniteScrollSentinel
          sentinelRef={sentinelRef}
          loadingMore={loadingMore}
          hasMore={hasMore}
          hasItems={registries.length > 0}
        />
      </div>

      {canCreate && (
        <FapRegistryCreateSidebar
          show={showCreate}
          onClose={() => setShowCreate(false)}
          airlines={airlines}
          airports={airports}
          onCreated={(id) => {
            setShowCreate(false);
            openRegistry(id);
          }}
        />
      )}
    </div>
  );
}
