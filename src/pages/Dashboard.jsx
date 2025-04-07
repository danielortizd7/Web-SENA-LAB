// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Modal,
  Box,
} from "@mui/material";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

const Dashboard = () => {
  // Estados para estadísticas de muestras
  const [sampleStats, setSampleStats] = useState(null);
  const [allSamples, setAllSamples] = useState([]);
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [sampleError, setSampleError] = useState(null);

  // Estados para la información de usuarios
  const [userStats, setUserStats] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState(null);

  // Estados para la modal de detalles de muestra
  const [selectedSample, setSelectedSample] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  // Función para generar la distribución por tipo de muestra (Agua, Suelo, Otros)
  const generateTypeDistribution = (samples) => {
    const typeCounts = { Agua: 0, Suelo: 0, Otros: 0 };
    samples.forEach((sample) => {
      const type = sample.tipoMuestra ? sample.tipoMuestra.toLowerCase() : "otros";
      if (type === "agua") {
        typeCounts.Agua += 1;
      } else if (type === "suelo") {
        typeCounts.Suelo += 1;
      } else {
        typeCounts.Otros += 1;
      }
    });
    return Object.keys(typeCounts).map((key) => ({
      type: key,
      count: typeCounts[key],
    }));
  };

  // Carga de datos de muestras
  useEffect(() => {
    const fetchSamples = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setSampleError("No tienes permiso para acceder a las muestras.");
        setLoadingSamples(false);
        return;
      }
      try {
        const response = await axios.get(
          "https://backend-registro-muestras.onrender.com/api/muestras",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        let samples = [];
        if (response.data && response.data.data && response.data.data.muestras) {
          samples = response.data.data.muestras;
        } else if (Array.isArray(response.data)) {
          samples = response.data;
        }
        setAllSamples(samples);
        const totalSamples = samples.length;
        // Se asume que las muestras con estado "recibida" son pendientes
        const pendingSamples = samples.filter(
          (s) => s.estado && s.estado.toLowerCase() === "recibida"
        ).length;
        const verifiedSamples = totalSamples - pendingSamples;
        const typeDistribution = generateTypeDistribution(samples);
        setSampleStats({
          totalSamples,
          pendingSamples,
          verifiedSamples,
          typeDistribution,
        });
      } catch (err) {
        console.error("Error al cargar muestras:", err);
        setSampleError("Error al cargar las muestras.");
      } finally {
        setLoadingSamples(false);
      }
    };
    fetchSamples();
  }, []);

  // Carga de datos de usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserError("No tienes permiso para acceder a los usuarios.");
        setLoadingUsers(false);
        return;
      }
      try {
        const response = await axios.get(
          "https://backend-sena-lab-1-qpzp.onrender.com/api/usuarios",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        let users = [];
        if (Array.isArray(response.data)) {
          users = response.data;
        } else if (response.data && response.data.usuarios) {
          users = response.data.usuarios;
        } else {
          users = response.data;
        }
        const totalUsers = users.length;
        // Calculamos la distribución por rol, omitiendo aquellos sin rol definido
        const roleCounts = {};
        users.forEach((user) => {
          const role = user.rol?.nombre;
          if (role) {
            roleCounts[role] = (roleCounts[role] || 0) + 1;
          }
        });
        const roleDistribution = Object.keys(roleCounts).map((role) => ({
          role,
          count: roleCounts[role],
        }));
        setUserStats({ totalUsers, roleDistribution });
      } catch (err) {
        console.error("Error al cargar usuarios:", err);
        setUserError("Error al cargar la información de usuarios.");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Funciones para la modal de detalles de muestra
  const handleRowClick = (sample) => {
    setSelectedSample(sample);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedSample(null);
  };

  if (loadingSamples || loadingUsers) {
    return (
      <Grid container justifyContent="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Grid>
    );
  }

  if (sampleError || userError) {
    return <Alert severity="error">{sampleError || userError}</Alert>;
  }

  // Colores para el gráfico de pastel
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  // Cálculo de las últimas 5 muestras (ordenadas por fecha, las más recientes primero)
  const recentSamples = [...allSamples]
    .filter((sample) => sample.fechaHora)
    .sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))
    .slice(0, 5);

  return (
    <Grid container spacing={3}>
      {/* Título general */}
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Panel de Muestras y Usuarios
        </Typography>
      </Grid>

      {/* Tarjetas KPI para Muestras */}
      <Grid item xs={12} sm={6} md={4}>
        <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6">Total Muestras</Typography>
          <Typography variant="h4">{sampleStats.totalSamples}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6">Muestras Pendientes</Typography>
          <Typography variant="h4">{sampleStats.pendingSamples}</Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={4}>
        <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6">Muestras Verificadas</Typography>
          <Typography variant="h4">{sampleStats.verifiedSamples}</Typography>
        </Paper>
      </Grid>

      {/* Gráfica: Distribución por Tipo de Muestra */}
      <Grid item xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Distribución por Tipo de Muestra
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sampleStats.typeDistribution}
                dataKey="count"
                nameKey="type"
                outerRadius={100}
                label={({ type, count }) => `${type}: ${count}`}
              >
                {sampleStats.typeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>

      {/* Tabla de las últimas muestras */}
      <Grid item xs={12} md={6}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Últimas Muestras Registradas
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID Muestra</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentSamples.map((sample) => (
                  <TableRow
                    key={sample.id_muestra}
                    hover
                    onClick={() => handleRowClick(sample)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>{sample.id_muestra}</TableCell>
                    <TableCell>
                      {new Date(sample.fechaHora).toLocaleString()}
                    </TableCell>
                    <TableCell>{sample.tipoMuestra}</TableCell>
                    <TableCell>{sample.estado}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* Información de Usuarios (sin gráficos) */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Información de Usuarios
          </Typography>
          <Typography variant="body1">
            Total de Usuarios: {userStats.totalUsers}
          </Typography>
          {userStats.roleDistribution.map((roleInfo) => (
            <Typography key={roleInfo.role} variant="body2">
              {roleInfo.role}: {roleInfo.count}
            </Typography>
          ))}
        </Paper>
      </Grid>

      {/* Modal para detalles de la muestra */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={modalStyle}>
          {selectedSample && (
            <>
              <Typography variant="h6" gutterBottom>
                Detalles de la Muestra
              </Typography>
              <Typography variant="body2">
                <strong>ID Muestra:</strong> {selectedSample.id_muestra}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha:</strong>{" "}
                {new Date(selectedSample.fechaHora).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Tipo:</strong> {selectedSample.tipoMuestra}
              </Typography>
              <Typography variant="body2">
                <strong>Estado:</strong> {selectedSample.estado}
              </Typography>
              {/* Puedes agregar más detalles aquí según los campos disponibles */}
            </>
          )}
        </Box>
      </Modal>
    </Grid>
  );
};

export default Dashboard;
