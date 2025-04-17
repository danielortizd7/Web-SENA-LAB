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
    if (!auth.token || !auth.user) return;

    const userId = auth.user.usuarioId || auth.user._id || auth.user.id;

    if (!userId) {
      console.warn("No encuentro userId en auth.user:", auth.user);
      return;
    }

    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/${userId}/perfil`, {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      })
      .then(({ data }) => setPerfil(data))
      .catch((err) => {
        console.error("Error fetching perfil:", err);
        setPerfil(null);
      });
  }, [auth.token, auth.user]);

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
    // El perfil se obtiene automáticamente con el useEffect
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
  };

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        perfil,
        loading,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
