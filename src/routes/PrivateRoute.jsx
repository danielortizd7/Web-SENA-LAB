import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext); // ✅ ahora usamos loading
  const location = useLocation();

  console.log("🔒 PrivateRoute Check:", {
    path: location.pathname,
    isAuthenticated,
    user,
    allowedRoles
  });

  // ✅ Espera a que se cargue el contexto antes de decidir
  if (loading) return null;

  // Si no hay usuario autenticado, redirige a /login
  if (!isAuthenticated || !user) {
    console.log("❌ No authenticated user, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se especifican roles permitidos, verificar el rol del usuario
  if (allowedRoles.length > 0) {
    console.log("👤 Checking user role:", {
      userRole: user.rol,
      allowedRoles,
      hasPermission: allowedRoles.includes(user.rol)
    });

    if (!allowedRoles.includes(user.rol)) {
      console.log("⛔ User role not allowed, redirecting to unauthorized");
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Si pasa las validaciones, renderiza el contenido protegido
  console.log("✅ Access granted");
  return children;
};

export default PrivateRoute;
