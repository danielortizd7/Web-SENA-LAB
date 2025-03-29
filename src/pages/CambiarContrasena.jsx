import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { TextField, Button, Box, Typography, Paper, Alert, CircularProgress } from "@mui/material";

const CambiarContrasena = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); 
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setLoading(true);

    if (!password || !confirmPassword) {
      setError("⚠ Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("⚠ Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("⚠ La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const url = "https://back-usuarios-f.onrender.com/api/usuarios/cambiar-contrasena";
      const response = await axios.post(url, { token, password });

      if (response.data.success) {
        setMensaje("✅ Contraseña actualizada con éxito. Redirigiendo al login...");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(response.data.message || "⚠ No se pudo actualizar la contraseña.");
      }
    } catch (error) {
      setError("❌ Error al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Paper sx={{ padding: 4, width: 320, textAlign: "center" }}>
        <Typography variant="h5" sx={{ marginBottom: 2, fontWeight: "bold" }}>
          Restablecer Contraseña
        </Typography>
        {mensaje && <Alert severity="success">{mensaje}</Alert>}
        {error && <Alert severity="error">{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Nueva Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Confirmar Contraseña"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            required
          />
          {loading ? (
            <CircularProgress size={24} sx={{ alignSelf: "center", margin: 2 }} />
          ) : (
            <Button type="submit" variant="contained" sx={{ backgroundColor: "#39A900", color: "white" }}>
              Guardar Contraseña
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default CambiarContrasena;
