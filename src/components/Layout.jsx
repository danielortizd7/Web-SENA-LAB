// src/components/Layout.jsx
import React from "react";
import { Box, CssBaseline, AppBar, Toolbar } from "@mui/material";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      {/* Barra superior fija */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "#00324D",
        }}
      >
        <Toolbar>
          {/* Aquí se eliminó el botón de menú responsive */}
          <Navbar />
        </Toolbar>
      </AppBar>

      {/* Sidebar permanente, sin lógica para móviles */}
      <Sidebar />

      {/* Contenido principal con margen para no taparse con el Sidebar y el AppBar */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: "64px",      // Espacio para el AppBar
          ml: "240px",     // Espacio para el Sidebar permanente
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
