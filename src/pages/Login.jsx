import React, { useState, useContext } from "react";
import axios from "axios";
import { TextField, Button, Box, Typography, Paper, Alert, CircularProgress } from "@mui/material";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!credentials.email || !credentials.password) {
      setError("⚠ Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      setError("⚠ Por favor, ingresa un correo electrónico válido.");
      setLoading(false);
      return;
    }

    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/usuarios/login`;
      console.log("🔑 Intentando login en:", url);
      
      const response = await axios.post(url, credentials);
      console.log("📡 Respuesta del servidor:", response.data);

      if (response.data && response.data.token) {
        const { token, usuario } = response.data;
        console.log("👤 Datos del usuario:", usuario);

        // Asegurarse de que el rol esté presente
        if (!usuario.rol) {
          console.error("❌ El usuario no tiene un rol asignado");
          setError("Error: Usuario sin rol asignado");
          setLoading(false);
          return;
        }

        const usuarioFinal = {
          ...usuario,
          email: credentials.email,
          token: token,
          rol: usuario.rol
        };

        console.log("✅ Usuario final:", usuarioFinal);
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(usuarioFinal));
        
        login(usuarioFinal);
        navigate("/dashboard");
      } else {
        console.error("❌ Respuesta sin token:", response.data);
        setError("Error: Respuesta inválida del servidor");
      }
    } catch (error) {
      console.error("❌ Error en login:", error.response?.data || error.message);
      setError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Error al iniciar sesión"
      );
    }
    setLoading(false);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Paper sx={{ padding: 4, width: 320, textAlign: "center" }}>
        <Typography variant="h5" sx={{ marginBottom: 2, fontWeight: "bold" }}>Iniciar Sesión</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Correo" name="email" type="email" onChange={handleChange} fullWidth required />
          <TextField label="Contraseña" name="password" type="password" onChange={handleChange} fullWidth required />
          {loading ? (
            <CircularProgress size={24} sx={{ alignSelf: "center", margin: 2 }} />
          ) : (
            <Button type="submit" variant="contained" sx={{ backgroundColor: "#39A900", color: "white" }}>
              Ingresar
            </Button>
          )}
        </Box>
        <Typography variant="body2" sx={{ marginTop: 2 }}>
          <a href="/recuperar-contrasena" style={{ color: "#39A900", textDecoration: "none" }}>
            ¿Olvidaste tu contraseña?
          </a>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;
