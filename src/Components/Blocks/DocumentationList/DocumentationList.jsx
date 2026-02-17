import React, { useState } from "react";
import classes from "./DocumentationList.module.css";
import Header from "../Header/Header";
import {
  FILTER_OPTIONS,
  roles,
} from "../../../roles";
import MUIAutocomplete from "../MUIAutocomplete/MUIAutocomplete";
import DocumentationList1 from "./DocumentationListComponents/DocumentationList1/DocumentationList1"

function DocumentationList({ children, user, ...props }) {
  const [filterValue, setFilterValue] = useState("dispatcher");

  const currentFilterLabel =
    FILTER_OPTIONS.find((o) => o.value === filterValue)?.label ||
    FILTER_OPTIONS[0].label;

  return (
    <>
      <div className={classes.section}>
        <Header>Инструкции</Header>

        <div className={classes.section_searchAndFilter}>
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
                setFilterValue(found.value);
              }}
            />
          )}
        </div>

        <div className={classes.documentationBlock}>
          <DocumentationList1 user={user} filterValue={filterValue} />
        </div>
      </div>
    </>
  );
}

export default DocumentationList;
