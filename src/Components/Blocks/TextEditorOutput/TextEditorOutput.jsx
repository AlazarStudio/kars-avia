import React, { useEffect, useState } from "react";

function TextEditorOutput({ description }) {
  return (
    <div className="ql-snow">
      <div
        className="ql-editor"
        style={{ padding: 0 }}
        dangerouslySetInnerHTML={{ __html: description }}
      />
    </div>
  );
}

export default TextEditorOutput;
