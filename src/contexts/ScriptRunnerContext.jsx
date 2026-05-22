import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { decodeJWT } from "../../graphQL_requests";
import { roles } from "../roles";
import { authService } from "../services/authService";
import ScriptRunner from "../Components/Blocks/ScriptRunner/ScriptRunner";

const SCRIPT_RUNNER_STORAGE_KEY = "scriptRunnerEnabled";

const ScriptRunnerContext = createContext(null);

export function ScriptRunnerProvider({ children }) {
  const token = authService.getAccessToken();
  const user = token ? decodeJWT(token) : null;
  const isAvailable = user?.role === roles.superAdmin;

  const [isEnabled, setIsEnabled] = useState(() => {
    try {
      return localStorage.getItem(SCRIPT_RUNNER_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isAvailable && isEnabled) {
      setIsEnabled(false);
    }
  }, [isAvailable, isEnabled]);

  useEffect(() => {
    try {
      if (isEnabled && isAvailable) {
        localStorage.setItem(SCRIPT_RUNNER_STORAGE_KEY, "true");
      } else {
        localStorage.removeItem(SCRIPT_RUNNER_STORAGE_KEY);
      }
    } catch {
      // ignore localStorage errors
    }
  }, [isAvailable, isEnabled]);

  const openScriptRunner = useCallback(() => {
    if (!isAvailable) return;
    setIsEnabled(true);
  }, [isAvailable]);

  const closeScriptRunner = useCallback(() => {
    setIsEnabled(false);
  }, []);

  const value = useMemo(
    () => ({
      isAvailable,
      isEnabled: isEnabled && isAvailable,
      openScriptRunner,
      closeScriptRunner,
    }),
    [isAvailable, isEnabled, openScriptRunner, closeScriptRunner]
  );

  return (
    <ScriptRunnerContext.Provider value={value}>
      {children}
      {value.isEnabled && (
        <ScriptRunner show={value.isEnabled} onClose={closeScriptRunner} />
      )}
    </ScriptRunnerContext.Provider>
  );
}

export function useScriptRunner() {
  const context = useContext(ScriptRunnerContext);
  if (!context) {
    throw new Error("useScriptRunner must be used within ScriptRunnerProvider");
  }
  return context;
}
