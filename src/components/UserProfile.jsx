// src/components/UserProfile.jsx
import React, { useContext } from "react";
import { Avatar, Box, Typography, Chip } from "@mui/material";
import { motion } from "framer-motion";
import AuthContext from "../context/AuthContext";

const UserProfile = ({ onEdit }) => {
  const { perfil, user, loading } = useContext(AuthContext);

  // 1) Mientras lee el localStorage y no sabe si hay token/user
  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography>Cargando sesión…</Typography>
      </Box>
    );
  }

  // 2) Si ya cargó pero no hay perfil (error o no encontrado)
  if (!perfil) {
    return (
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography>No se encontró tu perfil.</Typography>
      </Box>
    );
  }

  // 3) Ya tenemos perfil, lo mostramos
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const base = import.meta.env.VITE_BACKEND_URL || window.location.origin;
    return `${base}${url}`;
  };

  const roleConfig = {
    super_admin: { label: "Super Administrador", color: "#00324D" },
    administrador: { label: "Administrador", color: "#1565C0" },
    laboratorista: { label: "Laboratorista", color: "#4CAF50" },
    cliente: { label: "Cliente", color: "#FF9800" },
  };
  const rolKey = user?.rol;
  const role = roleConfig[rolKey] || { label: "Sin Rol", color: "#9E9E9E" };

  return (
    <Box sx={{ p: 2, textAlign: "center" }}>
      <motion.div layoutId="profile-avatar">
        {perfil.fotoPerfil ? (
          <Avatar
            src={getImageUrl(perfil.fotoPerfil)}
            onClick={onEdit}
            sx={{
              width: 80,
              height: 80,
              m: "0 auto",
              transition: "transform 0.3s",
              "&:hover": { transform: "scale(1.1)", cursor: "pointer" },
            }}
          />
        ) : (
          <Avatar
            onClick={onEdit}
            sx={{ width: 80, height: 80, m: "0 auto" }}
          >
            {perfil.nombre.charAt(0).toUpperCase()}
          </Avatar>
        )}
      </motion.div>

      <Typography variant="h6" sx={{ mt: 1 }}>
        {perfil.nombre}
      </Typography>

      <Chip
        label={role.label}
        sx={{ backgroundColor: role.color, color: "white", mt: 1 }}
      />
    </Box>
  );
};

export default UserProfile;
