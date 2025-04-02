// src/components/Layout.jsx
import React, { useState } from "react";
import { Box, CssBaseline, AppBar, Toolbar, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
// import Sidebar from "./Sidebar"; // Temporalmente removido para pruebas
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  // Estado para controlar el menú en dispositivos móviles
  const [mobileOpen, setMobileOpen] = useState(false);

  // Función que alterna la apertura del Drawer (Sidebar)
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* Barra superior */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "#00324D",
        }}
      >
        <Toolbar>
          {/* Botón de menú visible solo en dispositivos móviles */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Componente Navbar */}
          <Navbar />
        </Toolbar>
      </AppBar>

      {/*
        Sidebar removido temporalmente para pruebas.
        Si al comentar el Sidebar el contenido se muestra correctamente,
        el problema podría estar relacionado con él.
      */}
      {/*
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
      */}

      {/* Contenido principal, sin margen izquierdo ya que el Sidebar está removido */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: "64px", // Espacio para el AppBar
          // marginLeft: { md: "240px" }, // Removido temporalmente
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
