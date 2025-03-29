// src/routes/AppRouter.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from "../components/Layout";
import PrivateRoute from "./PrivateRoute";

// Importaciones de tus páginas
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users";
import Muestras from "../pages/Muestras";
import Login from "../pages/Login";
import RegistroMuestras from "../pages/RegistroMuestras";
import RecuperarContrasena from "../pages/RecuperarContrasena";
import CambiarContrasena from "../pages/CambiarContrasena";
import RegistrarResultados from "../pages/RegistrarResultados";
import Unauthorized from "../pages/Unauthorized";
import ListaResultados from "../pages/ListaResultados";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
        <Route path="/restablecer-password" element={<CambiarContrasena />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Rutas protegidas */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/users"
          element={
            <PrivateRoute allowedRoles={["administrador", "super_admin", "laboratorista"]}>
              <Layout>
                <Users />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/muestras"
          element={
            <PrivateRoute>
              <Layout>
                <Muestras />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/registro-muestras"
          element={
            <PrivateRoute allowedRoles={["administrador", "super_admin"]}>
              <Layout>
                <RegistroMuestras />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/lista-resultados"
          element={
            <PrivateRoute allowedRoles={["laboratorista", "administrador", "super_admin"]}>
              <Layout>
                <ListaResultados />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/registrar-resultados/:idMuestra"
          element={
            <PrivateRoute allowedRoles={["laboratorista", "administrador", "super_admin"]}>
              <Layout>
                <RegistrarResultados />
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default AppRouter;
