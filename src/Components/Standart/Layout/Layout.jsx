import React from "react";
import { Outlet } from "react-router-dom";
import { ScriptRunnerProvider } from "../../../contexts/ScriptRunnerContext";

function Empty({ children, ...props }) {
  return (
    <ScriptRunnerProvider>
      <Outlet />
    </ScriptRunnerProvider>
  );
}

export default Empty;