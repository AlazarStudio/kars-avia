import React, { useEffect, useState } from "react";
import { sanitizeHtml } from "../../../utils/sanitizeHtml";

function TextEditorOutput({ description }) {
  return (
    <div className="ql-snow" style={{ overflowY: "scroll" }}>
      <div
        className="ql-editor"
        style={{ padding: 0 }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
      />
    </div>
  );
}

export default TextEditorOutput;
