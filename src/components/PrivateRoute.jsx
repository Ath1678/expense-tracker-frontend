import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const PrivateRoute = () => {
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
