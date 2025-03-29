import React, { useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress
} from "@mui/material";

const RecuperarContrasena = () => {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manejar cambios en el input
  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setLoading(true);

    // Validación básica del email
    if (!email) {
      setError("⚠ Debes ingresar un correo electrónico.");
      setLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("⚠ Ingresa un correo válido.");
      setLoading(false);
      return;
    }

    try {
      // URL de la API desde variable de entorno
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/solicitar-recuperacion`;
      
      // Enviar solicitud a la API
      const response = await axios.post(url, { email });

      if (response.status === 200) {
        setMensaje("✅ Si el correo existe, se enviará un enlace de recuperación.");
      } else {
        setError("⚠ No se pudo procesar la solicitud.");
      }
    } catch (error) {
      console.error("Error en la recuperación:", error);
      setError("❌ Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
      }}
    >
      <Paper sx={{ padding: 4, width: 350, textAlign: "center", boxShadow: 3 }}>
        <Typography variant="h5" sx={{ marginBottom: 2, fontWeight: "bold" }}>
          🔑 Recuperar Contraseña
        </Typography>

        {mensaje && <Alert severity="success">{mensaje}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
          <TextField
            label="Correo electrónico"
            name="email"
            type="email"
            value={email}
            onChange={handleChange}
            fullWidth
            required
          />

          {loading ? (
            <CircularProgress size={24} sx={{ alignSelf: "center", margin: 2 }} />
          ) : (
            <Button
              type="submit"
              variant="contained"
              sx={{ backgroundColor: "#39A900", color: "white" }}
              fullWidth
            >
              Enviar correo
            </Button>
          )}
        </Box>

        <Typography variant="body2" sx={{ marginTop: 2 }}>
          <a href="/login" style={{ color: "#39A900", textDecoration: "none" }}>
            Volver al inicio de sesión
          </a>
        </Typography>
      </Paper>
    </Box>
  );
};

export default RecuperarContrasena;
