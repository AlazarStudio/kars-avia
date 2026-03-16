import { createContext, useContext, useEffect, useState } from "react";
import { decodeJWT } from "../graphQL_requests";
import { authService } from "./services/authService";
import MUILoader from "./Components/Blocks/MUILoader/MUILoader";

const AuthContext = createContext();

function getExternalUserContext() {
  try {
    const raw = document.cookie
      .split("; ")
      .find((row) => row.startsWith("externalUserContext="));
    if (!raw) return null;
    const value = raw.split("=").slice(1).join("=").trim();
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getAccessToken();

    if (token) {
      try {
        const decodedUser = decodeJWT(token);
        if (decodedUser?.subjectType === "EXTERNAL_USER") {
          const ctx = getExternalUserContext();
          if (ctx) {
            decodedUser.scope = ctx.scope;
            decodedUser.hotelId = ctx.hotelId ?? undefined;
            decodedUser.driverId = ctx.driverId ?? undefined;
          }
        }
        setUser(decodedUser);
      } catch {
        setUser(null);
      }
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    const unsub = authService.addLogoutListener(() => setUser(null));
    return unsub;
  }, []);

  if (loading) {
    return <MUILoader fullHeight={'100vh'}/>;
  }

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
