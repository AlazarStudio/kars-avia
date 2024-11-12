import { createContext, useContext, useEffect, useState } from "react";
import { decodeJWT, getCookie } from "../graphQL_requests";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = getCookie("token");

        if (token) {
            const decodedUser = decodeJWT(token);
            setUser(decodedUser);
        }

        setLoading(false);  // Завершение загрузки
    }, []);

    if (loading) {
        return <div>Загрузка...</div>;
    }

    return (
        <AuthContext.Provider value={{ user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
