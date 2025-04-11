// src/components/Navbar.jsx
import React, { useContext, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Divider,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Estado para controlar el menú del avatar
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: "linear-gradient(90deg, #00324D, #1565C0)",
        boxShadow: "none",
        paddingX: 2,
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* Título de la aplicación */}
        <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: "bold" }}>
          Laboratorio SENA
        </Typography>

        {/* Ícono de notificaciones */}
        <IconButton size="large" sx={{ color: "white", mr: 1 }}>
          <NotificationsIcon />
        </IconButton>

        {/* Avatar interactivo con menú personalizado */}
        {user && (
          <Box sx={{ ml: 2 }}>
            <IconButton
              onClick={handleMenuOpen}
              sx={{
                p: 0,
                "&:hover": {
                  transform: "scale(1.1)",
                  transition: "transform 0.3s",
                },
              }}
            >
              <Avatar
                alt={user.nombre}
                src={user.fotoPerfil}
                sx={{
                  width: 40,
                  height: 40,
                  border: "2px solid #ffffff",
                  boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.3)",
                  transition: "border-color 0.3s",
                  "&:hover": { borderColor: "#FF9800" },
                }}
              >
                {!user.fotoPerfil && user.nombre ? user.nombre.charAt(0) : ""}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              PaperProps={{
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  minWidth: 220,
                  backgroundColor: "#f9f9f9",
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
                  p: 1,
                },
              }}
            >
              <Box sx={{ p: 1, textAlign: "center" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                  {user.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {user.email}
                </Typography>
                <Divider sx={{ my: 1 }} />
              </Box>
              <MenuItem
                onClick={handleLogout}
                sx={{
                  "&:hover": {
                    backgroundColor: "#E53935", // tono rojo bonito
                    color: "#fff",
                  },
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                  Cerrar Sesión
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
