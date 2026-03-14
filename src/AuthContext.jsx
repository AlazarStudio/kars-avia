import { createContext, useContext, useEffect, useState } from "react";
import { decodeJWT, getCookie } from "../graphQL_requests";
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
    const token = getCookie("token");

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
        // Битый или невалидный токен — не считаем пользователя авторизованным
        setUser(null);
      }
    }

    setLoading(false); // Завершение загрузки
  }, []);

  if (loading) {
    return <MUILoader fullHeight={'100vh'}/>;
  }

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
