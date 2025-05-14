// src/routes/AppRouter.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from "../components/Layout";
import PrivateRoute from "./PrivateRoute";
import { CircularProgress, Box } from "@mui/material";

// Carga dinámica de páginas
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Users = lazy(() => import("../pages/Users"));
const Muestras = lazy(() => import("../pages/Muestras"));
const Login = lazy(() => import("../pages/Login"));
const RegistroMuestras = lazy(() => import("../pages/RegistroMuestras"));
const RecuperarContrasena = lazy(() => import("../pages/RecuperarContrasena"));
const CambiarContrasena = lazy(() => import("../pages/CambiarContrasena"));
const RegistrarResultados = lazy(() => import("../pages/RegistrarResultados"));
const Unauthorized = lazy(() => import("../pages/Unauthorized"));
const ListaResultados = lazy(() => import("../pages/ListaResultados"));
const Auditorias = lazy(() => import("../pages/Auditorias"));

const AppRouter = () => {
  return (
    <Router>
      <Suspense fallback={<Box sx={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}><CircularProgress color="primary" size={60} /></Box>}>
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

          <Route
            path="/auditorias"
            element={
              <PrivateRoute>
                <Layout>
                  <Auditorias />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRouter;
