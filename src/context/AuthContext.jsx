import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: null,
    token: null,
    tipoUsuario: null,
    isAuthenticated: false
  });

  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [isPerfilManuallyUpdated, setIsPerfilManuallyUpdated] = useState(false);

  // Carga inicial desde localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setAuth({
        user: parsedUser,
        token: storedToken,
        tipoUsuario: parsedUser.rol,
        isAuthenticated: true
      });
    }

    setLoading(false);
  }, []);

  // Fetch del perfil del usuario autenticado
  useEffect(() => {
    if (!auth.token || !auth.user || !auth.isAuthenticated) return;

    if (isPerfilManuallyUpdated) {
      console.log("Perfil ya actualizado manualmente, no se hace fetch.");
      return;
    }

    const userId = auth.user.usuarioId || auth.user._id || auth.user.id;

    if (!userId) {
      console.warn("No encuentro userId en auth.user:", auth.user);
      return;
    }

    console.log("Haciendo fetch del perfil desde el servidor...");
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/${userId}/perfil`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
          'Cache-Control': 'no-cache' // Evita el caché
        }
      })
      .then(({ data }) => {
        console.log("Datos del perfil obtenidos del servidor:", data);
        setPerfil(data);
      })
      .catch((err) => {
        console.error("Error fetching perfil:", err);
        setPerfil(null);
      });
  }, [auth, isPerfilManuallyUpdated]);

  // Función login
  const login = (userData) => {
    if (!userData.token) {
      console.error("Falta token en login");
      return;
    }

    localStorage.setItem("token", userData.token);
    localStorage.setItem("user", JSON.stringify(userData));

    setAuth({
      user: userData,
      token: userData.token,
      tipoUsuario: userData.rol,
      isAuthenticated: true
    });

    setPerfil(userData);
    setIsPerfilManuallyUpdated(false);
  };

  // Función para actualizar el perfil directamente
  const updatePerfil = (newPerfil) => {
    console.log("Actualizando perfil manualmente:", newPerfil);
    setPerfil(newPerfil);
    setIsPerfilManuallyUpdated(true);
  };

  // Función logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setAuth({
      user: null,
      token: null,
      tipoUsuario: null,
      isAuthenticated: false
    });

    setPerfil(null);
    setIsPerfilManuallyUpdated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        perfil,
        loading,
        login,
        updatePerfil,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;