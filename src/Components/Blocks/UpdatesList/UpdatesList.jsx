import React from "react";
import DocumentationList from "../DocumentationList/DocumentationList";

function UpdatesList({ user }) {
  return (
    <DocumentationList
      user={user}
      documentationType="update"
      title="Обновления"
    />
  );
}

export default UpdatesList;
