import React, { useEffect, useMemo, useState } from "react";
import classes from "./DocumentationList.module.css";
import Header from "../Header/Header";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import { FILTER_OPTIONS, roles } from "../../../roles";
import DocumentationList1 from "./DocumentationListComponents/DocumentationList1/DocumentationList1";

function DocumentationList({ children, user, ...props }) {
  const canSwitchTabs =
    user?.role === roles.dispatcerAdmin || user?.role === roles.superAdmin;

  const availableFilters = useMemo(() => {
    if (user?.role === roles.hotelAdmin) {
      return FILTER_OPTIONS.filter((option) => option.value === "hotel");
    }
    if (user?.role === roles.airlineAdmin) {
      return FILTER_OPTIONS.filter((option) => option.value === "airline");
    }
    if (canSwitchTabs) {
      return FILTER_OPTIONS;
    }
    return FILTER_OPTIONS.filter((option) => option.value === "dispatcher");
  }, [canSwitchTabs, user?.role]);

  const [filterValue, setFilterValue] = useState(
    () => availableFilters[0]?.value || "dispatcher"
  );

  useEffect(() => {
    if (!availableFilters.length) return;
    const hasCurrentFilter = availableFilters.some(
      (option) => option.value === filterValue
    );
    if (!hasCurrentFilter) {
      setFilterValue(availableFilters[0].value);
    }
  }, [availableFilters, filterValue]);

  const currentFilterLabel =
    availableFilters.find((option) => option.value === filterValue)?.label ||
    availableFilters[0]?.label ||
    "";

  return (
    <div className={classes.section}>
      <Header>{"\u0418\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u0438"}</Header>

      <div className={classes.section_searchAndFilter}>
        {canSwitchTabs && (
          <MUIAutocomplete
            dropdownWidth={"180px"}
            label={""}
            labelOnFocus={currentFilterLabel}
            labelOnFocusOnly={true}
            animateLabelOnFocus={true}
            moveValueToLabelOnFocus={true}
            hideLabelOnFocus={false}
            options={availableFilters.map((option) => option.label)}
            value={currentFilterLabel}
            onChange={(event, newLabel) => {
              const found =
                availableFilters.find((option) => option.label === newLabel) ||
                availableFilters[0];
              if (found?.value) {
                setFilterValue(found.value);
              }
            }}
          />
        )}
      </div>

      <div className={classes.documentationBlock}>
        <DocumentationList1
          key={`doc-tab-${filterValue}`}
          user={user}
          filterValue={filterValue}
        />
      </div>
    </div>
  );
}

export default DocumentationList;
