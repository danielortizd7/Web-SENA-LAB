import React, { useState, useContext, useEffect } from "react";
import UsersList from "../modules/usuarios/UsersList";
import RegistroUsuario from "../modules/usuarios/RegistroUsuario";
import { Button, Paper } from "@mui/material";
import AuthContext from "../context/AuthContext";

const Users = () => {
  const { tipoUsuario } = useContext(AuthContext);
  const [vista, setVista] = useState("lista");

  // Evitar que laboratorista pueda acceder a la vista de registro
  useEffect(() => {
    if (tipoUsuario === "laboratorista") {
      setVista("lista");
    }
  }, [tipoUsuario]);

  return (
    <Paper sx={{ padding: 3 }}>
      <Button
        variant="contained"
        color={vista === "lista" ? "primary" : "secondary"}
        onClick={() => setVista("lista")}
        sx={{ marginRight: 2 }}
      >
        Ver Usuarios
      </Button>

      {/* ✅ Mostrar botón de registro solo si NO es laboratorista */}
      {tipoUsuario !== "laboratorista" && (
        <Button
          variant="contained"
          color={vista === "registro" ? "primary" : "secondary"}
          onClick={() => setVista("registro")}
        >
          Registrar Usuario
        </Button>
      )}

      {/* Render de la vista seleccionada */}
      {vista === "lista" ? <UsersList /> : <RegistroUsuario />}
    </Paper>
  );
};

export default Users;
