// src/components/UserProfile.jsx
import React, { useContext } from "react";
import { Avatar, Box, Typography, Chip } from "@mui/material";
import { motion } from "framer-motion";
import AuthContext from "../context/AuthContext";

const UserProfile = ({ onEdit }) => {
  const { user } = useContext(AuthContext);

  // Función para obtener un Chip estilizado según el rol
  const getRoleChip = (role) => {
    switch (role) {
      case "super_admin":
        return (
          <Chip
            label="Super Administrador"
            sx={{
              backgroundColor: "#00324D",
              color: "white",
              fontWeight: "bold",
              mt: 1,
            }}
          />
        );
      case "administrador":
        return (
          <Chip
            label="Administrador"
            sx={{
              backgroundColor: "#1565C0",
              color: "white",
              fontWeight: "bold",
              mt: 1,
            }}
          />
        );
      case "laboratorista":
        return (
          <Chip
            label="Laboratorista"
            sx={{
              backgroundColor: "#4CAF50",
              color: "white",
              fontWeight: "bold",
              mt: 1,
            }}
          />
        );
      case "cliente":
        return (
          <Chip
            label="Cliente"
            sx={{
              backgroundColor: "#FF9800",
              color: "white",
              fontWeight: "bold",
              mt: 1,
            }}
          />
        );
      default:
        return (
          <Chip
            label="Sin Rol"
            sx={{
              backgroundColor: "#9E9E9E",
              color: "white",
              fontWeight: "bold",
              mt: 1,
            }}
          />
        );
    }
  };

  return (
    <Box sx={{ p: 2, textAlign: "center" }}>
      <motion.div layoutId="profile-avatar">
        {user && user.fotoPerfil ? (
          <Avatar
            src={user.fotoPerfil}
            onClick={onEdit}
            sx={{
              width: { xs: 64, sm: 72, md: 80 },
              height: { xs: 64, sm: 72, md: 80 },
              margin: "0 auto",
              transition: "transform 0.3s",
              "&:hover": { transform: "scale(1.1)", cursor: "pointer" },
            }}
          />
        ) : (
          <Avatar
            onClick={onEdit}
            sx={{
              width: { xs: 64, sm: 72, md: 80 },
              height: { xs: 64, sm: 72, md: 80 },
              margin: "0 auto",
              transition: "transform 0.3s",
              "&:hover": { transform: "scale(1.1)", cursor: "pointer" },
            }}
          >
            {user && user.nombre ? user.nombre.charAt(0).toUpperCase() : "U"}
          </Avatar>
        )}
      </motion.div>

      <Typography
        variant="h6"
        sx={{ mt: 1, fontSize: { xs: "1rem", sm: "1.1rem", md: "1.2rem" } }}
      >
        {user ? user.nombre : "Usuario"}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.85rem" } }}
      >
        {user ? user.telefono : ""}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem", md: "0.85rem" } }}
      >
        {user ? user.direccion : ""}
      </Typography>

      {/* Mostrar rol en forma de Chip */}
      {user && user.rol && getRoleChip(user.rol)}
    </Box>
  );
};

export default UserProfile;
