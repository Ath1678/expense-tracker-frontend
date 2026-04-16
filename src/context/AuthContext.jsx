import React, { createContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Validate token or load user profile if needed
        if (token) {
            // Decode token or check expiry (simplified for now)
            const savedUser = JSON.parse(localStorage.getItem("user"));
            if (savedUser) setUser(savedUser);
        }
        setLoading(false);
    }, [token]);

    const login = (data) => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({
            username: data.username,
            email: data.email,
            id: data.id,
            roles: data.roles
        }));
        setToken(data.token);
        setUser({
            username: data.username,
            email: data.email,
            id: data.id,
            roles: data.roles
        });
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
