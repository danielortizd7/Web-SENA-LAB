import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import RegistroMuestras from './pages/RegistroMuestras';
import RegistrarResultados from './pages/RegistrarResultados';
import ListaResultados from './pages/ListaResultados';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import PrivateRoute from './routes/PrivateRoute';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
// ... other imports ...

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Rutas protegidas */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
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
          path="/muestras/registro"
          element={
            <PrivateRoute allowedRoles={['administrador']}>
              <Layout>
                <RegistroMuestras />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/resultados"
          element={
            <PrivateRoute allowedRoles={['laboratorista', 'administrador']}>
              <Layout>
                <ListaResultados />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/registrar-resultados"
          element={
            <PrivateRoute allowedRoles={['laboratorista', 'administrador']}>
              <Layout>
                <RegistrarResultados />
              </Layout>
            </PrivateRoute>
          }
        />

        <Route
          path="/registrar-resultados/:idMuestra"
          element={
            <PrivateRoute allowedRoles={['laboratorista', 'administrador']}>
              <Layout>
                <RegistrarResultados />
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App; 