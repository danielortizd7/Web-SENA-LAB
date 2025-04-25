import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

// Registrar los elementos de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Estilo para el fondo del dashboard
const dashboardStyle = {
  background: "linear-gradient(135deg, #f5f7fa 0%, #d7f7dd 100%)",
  minHeight: "100vh",
  padding: { xs: 2, md: 4 },
};

// Componente para tarjeta de estadística
const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Paper
      elevation={3}
      sx={{
        p: 2,
        textAlign: "center",
        borderRadius: 2,
        background: `linear-gradient(45deg, ${color}20, #ffffff)`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        transition: "transform 0.3s",
        "&:hover": { transform: "scale(1.05)" },
      }}
    >
      <Box sx={{ mb: 1, color }}>{icon}</Box>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h5" color={color}>
        <CountUp end={value} duration={2.5} />
      </Typography>
    </Paper>
  </motion.div>
);

// Componente para los gráficos
const SampleCharts = ({ sampleStats }) => {
  // Gráfico de Dona 1: Distribución de Muestras (Recibidas, En Análisis, Finalizadas)
  const distributionData = {
    labels: ["Muestras Recibidas", "Muestras en Análisis", "Finalizadas"],
    datasets: [
      {
        data: [
          sampleStats.totalSamples,
          sampleStats.pendingSamples,
          sampleStats.verifiedSamples,
        ],
        backgroundColor: ["#39A900", "#FF9800", "#2E7D32"], // Cambiado #4CAF50 por #2E7D32
        hoverBackgroundColor: ["#2D8A00", "#F57C00", "#1B5E20"], // Ajustado hover
        borderWidth: 1,
      },
    ],
  };

  // Gráfico de Dona 2: Total de Muestras por Tipo de Análisis (Microbiológicos, Fisicoquímicos)
  const analysisTypeData = {
    labels: ["Microbiológicos", "Fisicoquímicos"],
    datasets: [
      {
        data: [
          sampleStats.microbiologicalSamples,
          sampleStats.physicochemicalSamples,
        ],
        backgroundColor: ["#2196F3", "#FF6384"],
        hoverBackgroundColor: ["#1976D2", "#FF4069"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
    },
    cutout: "60%", // Estilo de dona
  };

  return (
    <Grid container spacing={2} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderRadius: 2,
            background: "linear-gradient(45deg, #ffffff, #d7f7dd)",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: "#39A900" }}>
            Distribución de Muestras
          </Typography>
          <Box sx={{ maxWidth: 300, margin: "0 auto" }}>
            <Doughnut data={distributionData} options={chartOptions} />
          </Box>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderRadius: 2,
            background: "linear-gradient(45deg, #ffffff, #d7f7dd)",
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, color: "#39A900" }}>
            Muestras por Tipo de Análisis
          </Typography>
          <Box sx={{ maxWidth: 300, margin: "0 auto" }}>
            <Doughnut data={analysisTypeData} options={chartOptions} />
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
};

const Dashboard = () => {
  // Estados para estadísticas de muestras
  const [sampleStats, setSampleStats] = useState({
    totalAllSamples: 0,
    totalSamples: 0,
    pendingSamples: 0,
    verifiedSamples: 0,
    quotationSamples: [],
    microbiologicalSamples: 0,
    physicochemicalSamples: 0,
  });
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [sampleError, setSampleError] = useState(null);

  // Estados para la información de usuarios
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    clientCount: 0,
  });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState(null);

  // Carga de datos de muestras (para estadísticas)
  useEffect(() => {
    const fetchSamplesStats = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setSampleError("No tienes permiso para acceder a las muestras. Inicia sesión.");
        setLoadingSamples(false);
        return;
      }

      try {
        // Obtener Total de Muestras desde /api/muestras
        let allMuestras = [];
        let pageMuestras = 1;
        let hasMoreMuestras = true;
        const limit = 100;

        while (hasMoreMuestras) {
          const response = await axios.get(
            `https://backend-registro-muestras.onrender.com/api/muestras?page=${pageMuestras}&limit=${limit}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log(`Respuesta de la API de muestras (página ${pageMuestras}):`, response.data);

          let muestras = [];
          if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
            muestras = response.data.data.data;
          } else if (response.data && Array.isArray(response.data.data)) {
            muestras = response.data.data;
          } else if (Array.isArray(response.data)) {
            muestras = response.data;
          } else {
            console.warn("Estructura inesperada en la respuesta de muestras:", response.data);
            muestras = [];
          }

          allMuestras = [...allMuestras, ...muestras];

          const totalPagesMuestras = response.data.data?.pagination?.totalPages || 1;
          hasMoreMuestras = pageMuestras < totalPagesMuestras;
          pageMuestras += 1;
        }

        const totalAllSamples = allMuestras.length;

        // Calcular muestras por tipo de análisis
        const microbiologicalSamples = allMuestras.filter(
          (sample) => (sample.tipoAnalisis || "").toLowerCase() === "microbiológico"
        ).length;
        const physicochemicalSamples = allMuestras.filter(
          (sample) => (sample.tipoAnalisis || "").toLowerCase() === "fisicoquímico"
        ).length;

        // Obtener estadísticas desde /api/ingreso-resultados/resultados
        let allSamples = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await axios.get(
            `https://backend-registro-muestras.onrender.com/api/ingreso-resultados/resultados?page=${page}&limit=${limit}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          console.log(`Respuesta de la API de resultados (página ${page}):`, response.data);

          let samples = [];
          if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
            samples = response.data.data.data;
          } else if (response.data && Array.isArray(response.data.data)) {
            samples = response.data.data;
          } else if (Array.isArray(response.data)) {
            samples = response.data;
          } else {
            console.warn("Estructura inesperada en la respuesta de resultados:", response.data);
            samples = [];
          }

          allSamples = [...allSamples, ...samples];

          const totalPages = response.data.data?.pagination?.totalPages || 1;
          hasMore = page < totalPages;
          page += 1;
        }

        console.log("Todas las muestras procesadas (resultados):", allSamples);

        const totalSamples = allSamples.length;
        const pendingSamples = allSamples.filter(
          (s) => !s.verificado
        ).length;
        const verifiedSamples = allSamples.filter(
          (s) => s.verificado
        ).length;

        // Obtener muestras en cotización desde /api/muestras
        let quotationSamples = allMuestras
          .filter((s) => s.estado && s.estado.toLowerCase() === "en cotizacion")
          .sort((a, b) => new Date(b.fechaHoraMuestreo) - new Date(a.fechaHoraMuestreo))
          .slice(0, 10);

        console.log("Estadísticas calculadas:", {
          totalAllSamples,
          totalSamples,
          pendingSamples,
          verifiedSamples,
          quotationSamplesLength: quotationSamples.length,
          microbiologicalSamples,
          physicochemicalSamples,
        });

        setSampleStats({
          totalAllSamples,
          totalSamples,
          pendingSamples,
          verifiedSamples,
          quotationSamples,
          microbiologicalSamples,
          physicochemicalSamples,
        });
      } catch (err) {
        console.error("Error al cargar estadísticas de muestras:", err);
        setSampleError("Error al cargar las estadísticas de muestras. Verifica la conexión o el token.");
      } finally {
        setLoadingSamples(false);
      }
    };
    fetchSamplesStats();
  }, []);

  // Carga de datos de usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserError("No tienes permiso para acceder a los usuarios. Inicia sesión.");
        setLoadingUsers(false);
        return;
      }
      try {
        const response = await axios.get(
          "https://backend-sena-lab-1-qpzp.onrender.com/api/usuarios",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("Respuesta completa de la API de usuarios:", response.data);

        let users = [];
        if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
          users = response.data.data.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          users = response.data.data;
        } else if (response.data && Array.isArray(response.data.usuarios)) {
          users = response.data.usuarios;
        } else if (Array.isArray(response.data)) {
          users = response.data;
        } else {
          console.warn("Estructura inesperada en la respuesta de usuarios:", response.data);
          users = [];
        }

        console.log("Usuarios procesados:", users);

        if (users.length === 0) {
          setUserError("No se encontraron usuarios en la respuesta de la API.");
          setUserStats({ totalUsers: 0, clientCount: 0 });
          setLoadingUsers(false);
          return;
        }

        const totalUsers = users.length;

        const rolesUnicos = [...new Set(users.map(user => {
          if (typeof user.rol === 'object' && user.rol !== null) {
            return user.rol.nombre || user.rol.name || JSON.stringify(user.rol);
          }
          return user.rol || "Sin Rol";
        }))];
        console.log("Roles únicos encontrados:", rolesUnicos);

        const clientCount = users.filter(user => {
          const roleValue = user.rol?.nombre || user.rol?.name || user.rol || "";
          return String(roleValue).toLowerCase() === "cliente";
        }).length;

        console.log("Estadísticas de usuarios:", { totalUsers, clientCount });

        setUserStats({ totalUsers, clientCount });
      } catch (err) {
        console.error("Error al cargar usuarios:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setUserError("Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.");
        } else {
          setUserError("Error al cargar la información de usuarios: " + (err.response?.data?.message || err.message));
        }
        setUserStats({ totalUsers: 0, clientCount: 0 });
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  if (loadingSamples || loadingUsers) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress sx={{ color: "#39A900" }} />
      </Box>
    );
  }

  return (
    <Box sx={dashboardStyle}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Typography
          variant="h3"
          align="center"
          sx={{
            mb: 4,
            fontWeight: "bold",
            color: "#39A900",
            textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          Panel de Control
        </Typography>

        {(sampleError || userError) && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {sampleError || userError}
            </Alert>
          </Grid>
        )}

        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={3}>
            <StatCard
              title="Muestras Recibidas"
              value={sampleStats.totalAllSamples}
              icon={<AssignmentIcon sx={{ fontSize: 30 }} />}
              color="#2196F3"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <StatCard
              title="Muestras en Análisis"
              value={sampleStats.totalSamples}
              icon={<AssignmentIcon sx={{ fontSize: 30 }} />}
              color="#39A900"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <StatCard
              title="Muestras por Verificar"
              value={sampleStats.pendingSamples}
              icon={<TrendingUpIcon sx={{ fontSize: 30 }} />}
              color="#FF9800"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <StatCard
              title="Finalizadas"
              value={sampleStats.verifiedSamples}
              icon={<DoneAllIcon sx={{ fontSize: 30 }} />}
              color="#2E7D32" // Color ajustado para que coincida con el gráfico
            />
          </Grid>
        </Grid>

        <SampleCharts sampleStats={sampleStats} />

        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderRadius: 2,
            mb: 4,
            background: "linear-gradient(45deg, #ffffff, #d7f7dd)",
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, color: "#39A900" }}>
            Muestras en Cotización
          </Typography>
          {sampleStats.quotationSamples.length === 0 ? (
            <Alert severity="info">No hay muestras en cotización.</Alert>
          ) : (
            <TableContainer sx={{ maxHeight: 300 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f7fa" }}>
                      Muestra #
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f7fa" }}>
                      Cliente
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", backgroundColor: "#f5f7fa" }}>
                      Análisis
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sampleStats.quotationSamples.map((sample) => (
                    <TableRow key={sample.id_muestra || sample._id}>
                      <TableCell>{sample.id_muestra || sample._id}</TableCell>
                      <TableCell>{sample.cliente?.nombre || "N/A"}</TableCell>
                      <TableCell>{sample.tipoAnalisis || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Paper
          elevation={3}
          sx={{
            p: 2,
            borderRadius: 2,
            background: "linear-gradient(45deg, #ffffff, #d7f7dd)",
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, color: "#39A900" }}>
            Usuarios Registrados
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="Total Usuarios"
                value={userStats.totalUsers}
                icon={<PeopleIcon sx={{ fontSize: 30 }} />}
                color="#2196F3"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <StatCard
                title="Clientes"
                value={userStats.clientCount}
                icon={<PersonIcon sx={{ fontSize: 30 }} />}
                color="#2196F3"
              />
            </Grid>
          </Grid>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Dashboard;