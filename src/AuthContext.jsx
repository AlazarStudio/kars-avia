import { createContext, useContext, useEffect, useState } from "react";
import { decodeJWT, getCookie } from "../graphQL_requests";
import MUILoader from "./Components/Blocks/MUILoader/MUILoader";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getCookie("token");

    if (token) {
      try {
        const decodedUser = decodeJWT(token);
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
