import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./components/Dashboard";
import Income from "./pages/Income";
import Recurring from "./pages/Recurring";
import Layout from "./components/Layout";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/" element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="income" element={<Income />} />
              <Route path="recurring" element={<Recurring />} />
              <Route path="" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
