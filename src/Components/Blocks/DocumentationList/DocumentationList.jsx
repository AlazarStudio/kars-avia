import React, { useEffect, useMemo, useState } from "react";
import classes from "./DocumentationList.module.css";
import Header from "../Header/Header";
import MUITextField from "../MUITextField/MUITextField";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import DocumentationList1 from "./DocumentationListComponents/DocumentationList1/DocumentationList1";
import {
  DEFAULT_DOCUMENTATION_FILTER,
  DOCUMENTATION_FILTER_OPTIONS,
  getDocumentationFilterOption,
  hasDocumentationFilterSwitcherAccess,
  normalizeDocumentationFilter,
  resolveDocumentationFilterForUser,
} from "./documentationFilters";

function DocumentationList({ children, user, ...props }) {
  const canSwitchTabs = hasDocumentationFilterSwitcherAccess(user);
  const defaultFilterValue = useMemo(
    () =>
      normalizeDocumentationFilter(resolveDocumentationFilterForUser(user)) ||
      DEFAULT_DOCUMENTATION_FILTER,
    [user]
  );

  const availableFilters = useMemo(() => {
    if (canSwitchTabs) {
      return DOCUMENTATION_FILTER_OPTIONS;
    }
    const currentOption =
      getDocumentationFilterOption(defaultFilterValue) ||
      getDocumentationFilterOption(DEFAULT_DOCUMENTATION_FILTER);
    return currentOption ? [currentOption] : [];
  }, [canSwitchTabs, defaultFilterValue]);

  const [filterValue, setFilterValue] = useState(
    () => availableFilters[0]?.value || defaultFilterValue
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!availableFilters.length) return;
    if (!canSwitchTabs) {
      if (filterValue !== defaultFilterValue) {
        setFilterValue(defaultFilterValue);
      }
      return;
    }
    const hasCurrentFilter = availableFilters.some(
      option => option.value === filterValue
    );
    if (!hasCurrentFilter) {
      setFilterValue(availableFilters[0].value);
    }
  }, [availableFilters, canSwitchTabs, defaultFilterValue, filterValue]);

  const currentFilterLabel =
    availableFilters.find((opt) => opt.value === filterValue)?.label ?? "";

  return (
    <div className={classes.section}>
      <Header>{"\u0418\u043d\u0441\u0442\u0440\u0443\u043a\u0446\u0438\u0438"}</Header>

      <div className={classes.section_searchAndFilter}>
        {canSwitchTabs && availableFilters.length > 0 && (
          <MUIAutocomplete
            dropdownWidth="170px"
            label="Раздел"
            hideLabelOnFocus={false}
            disableClearable
            options={availableFilters.map((opt) => opt.label)}
            value={currentFilterLabel}
            onChange={(event, newLabel) => {
              const option = availableFilters.find((opt) => opt.label === newLabel);
              if (option?.value != null) setFilterValue(option.value);
            }}
          />
        )}
        <MUITextField
          label="Поиск"
          className={classes.mainSearch}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value ?? "")}
          inputProps={{ "aria-label": "Поиск по инструкциям" }}
        />
      </div>

      <div className={classes.documentationBlock}>
        <DocumentationList1
          key={`doc-tab-${filterValue}`}
          user={user}
          filterValue={filterValue}
          showFilterSwitcher={canSwitchTabs}
          filterOptions={availableFilters}
          onFilterValueChange={setFilterValue}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          controlsAtTop
        />
      </div>
    </div>
  );
}

export default DocumentationList;
