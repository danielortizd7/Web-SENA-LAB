// src/components/Layout.jsx
import React, { useState } from "react";
import { Box, CssBaseline, AppBar, Toolbar, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children }) => {
  // Estado para controlar el menú en dispositivos móviles
  const [mobileOpen, setMobileOpen] = useState(false);

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
          // Quitamos la lógica de "width" y "ml" para que en escritorio no se recorte
          backgroundColor: "#00324D",
        }}
      >
        <Toolbar>
          {/* Botón de menú SOLO visible en pantallas pequeñas */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          {/* Tu componente Navbar */}
          <Navbar />
        </Toolbar>
      </AppBar>

      {/* Sidebar que se muestra permanente en md+ y temporal en xs/sm */}
      <Sidebar mobileOpen={mobileOpen} handleDrawerToggle={handleDrawerToggle} />

      {/* Contenido principal, dejando espacio arriba para la AppBar */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: "64px", // altura del AppBar
          // Dejamos margen izquierdo en pantallas md+ para no tapar el contenido
          marginLeft: { md: "240px" },
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
