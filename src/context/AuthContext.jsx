import React, { createContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: null,
    token: null,
    tipoUsuario: null,
    isAuthenticated: false
  });

  const [loading, setLoading] = useState(true); // ✅ NUEVO: estado de carga

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log("🔄 Loading stored user data:", parsedUser);

        const userRole = typeof parsedUser.rol === 'string'
          ? parsedUser.rol
          : (parsedUser.rol?.nombre || parsedUser.tipoUsuario || 'usuario');

        const normalizedUser = {
          ...parsedUser,
          rol: userRole.toLowerCase()
        };

        console.log("📋 Normalized user data:", normalizedUser);

        setAuth({
          user: normalizedUser,
          token: storedToken,
          tipoUsuario: normalizedUser.rol,
          isAuthenticated: true
        });

        localStorage.setItem("user", JSON.stringify(normalizedUser));
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }

    setLoading(false); // ✅ FIN del proceso de carga
  }, []);

  const login = (userData) => {
    console.log("📥 Login data received:", userData);

    const userRole = typeof userData.rol === 'string'
      ? userData.rol
      : (userData.rol?.nombre || userData.tipoUsuario || 'usuario');

    const normalizedUser = {
      ...userData,
      rol: userRole.toLowerCase()
    };

    console.log("🔐 Normalized login data:", normalizedUser);

    const authData = {
      user: normalizedUser,
      token: userData.token,
      tipoUsuario: normalizedUser.rol,
      isAuthenticated: true
    };

    setAuth(authData);
    localStorage.setItem("user", JSON.stringify(normalizedUser));
    localStorage.setItem("token", userData.token);
  };

  const logout = () => {
    setAuth({
      user: null,
      token: null,
      tipoUsuario: null,
      isAuthenticated: false
    });
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{
      ...auth,
      login,
      logout,
      loading // ✅ PASARLO al contexto
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
