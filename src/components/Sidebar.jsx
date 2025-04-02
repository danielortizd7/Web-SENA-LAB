// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import { NavLink } from "react-router-dom";

// Iconos
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import ScienceIcon from "@mui/icons-material/Science";
import BiotechIcon from "@mui/icons-material/Biotech";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import SupervisorAccountIcon from "@mui/icons-material/SupervisorAccount";
import PersonIcon from "@mui/icons-material/Person";

// Logo SENA
import senaLogo from "../assets/sena-logo.png";

// Ancho del Drawer
const drawerWidth = 240;

const Sidebar = () => {
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const role = (user.rol || "").toLowerCase();
        setUserRole(role);
      }
    } catch (error) {
      console.error("Error leyendo user de localStorage:", error);
    }
  }, []);

  const menuItems = [
    {
      text: "Panel",
      icon: <DashboardIcon />,
      path: "/dashboard",
      roles: [],
    },
    {
      text: "Usuarios",
      icon: <PeopleIcon />,
      path: "/users",
      roles: ["administrador", "super_admin", "laboratorista"],
    },
    {
      text: "Muestras",
      icon: <ScienceIcon />,
      path: "/muestras",
      roles: [],
    },
    {
      text: "Registrar Muestra",
      icon: <BiotechIcon />,
      path: "/registro-muestras",
      roles: ["administrador", "super_admin"],
    },
    {
      text: "Lista Resultados",
      icon: <AssignmentIcon />,
      path: "/lista-resultados",
      roles: ["laboratorista", "administrador", "super_admin"],
    },
  ];

  const shouldShowMenuItem = (item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(userRole);
  };

  const renderUserRoleChip = (role) => {
    switch (role) {
      case "super_admin":
        return (
          <Chip
            icon={<VerifiedUserIcon />}
            label="Super Administrador"
            sx={{ backgroundColor: "#00324D", color: "white", fontWeight: "bold" }}
          />
        );
      case "administrador":
        return (
          <Chip
            icon={<AdminPanelSettingsIcon />}
            label="Administrador"
            sx={{ backgroundColor: "#1565C0", color: "white", fontWeight: "bold" }}
          />
        );
      case "laboratorista":
        return (
          <Chip
            icon={<BiotechIcon />}
            label="Laboratorista"
            sx={{ backgroundColor: "#4CAF50", color: "white", fontWeight: "bold" }}
          />
        );
      case "cliente":
        return (
          <Chip
            icon={<PersonIcon />}
            label="Cliente"
            sx={{ backgroundColor: "#FF9800", color: "white", fontWeight: "bold" }}
          />
        );
      default:
        return (
          <Chip
            icon={<SupervisorAccountIcon />}
            label="Sin Rol"
            sx={{ backgroundColor: "#9E9E9E", color: "white", fontWeight: "bold" }}
          />
        );
    }
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        backgroundColor: "#fff", // Fondo blanco limpio
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Toolbar>
          <Box sx={{ width: "100%", textAlign: "center", p: 1 }}>
            <img src={senaLogo} alt="Logo SENA" width="80" />
          </Box>
        </Toolbar>

        <Box sx={{ p: 2, textAlign: "center" }}>{renderUserRoleChip(userRole)}</Box>

        <Divider sx={{ mb: 1 }} />

        <List>
          {menuItems.map((item) => {
            if (!shouldShowMenuItem(item)) return null;
            return (
              <NavLink
                to={item.path}
                key={item.text}
                style={({ isActive }) => ({
                  textDecoration: "none",
                  color: isActive ? "#00324D" : "#000",
                })}
              >
                <ListItem
                  button
                  sx={{
                    m: 1,
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      backgroundColor: "#f0f0f0",
                      transform: "scale(1.02)",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    },
                    ...(window.location.pathname === item.path && {
                      backgroundColor: "#E0F2F1",
                      boxShadow: "inset 3px 0 0 #39A900",
                    }),
                  }}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontWeight: "bold" }}
                  />
                </ListItem>
              </NavLink>
            );
          })}
        </List>
      </Box>

      <Box sx={{ p: 2, textAlign: "center", fontSize: "12px", color: "#777" }}>
        © {new Date().getFullYear()} SENA
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          borderRight: "none",
          boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
          backgroundColor: "#fff",
        },
      }}
      open
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
