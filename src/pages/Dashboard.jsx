import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Button,
  Modal,
} from "@mui/material";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import PeopleIcon from "@mui/icons-material/People";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

// Estilo para el modal
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 500 },
  bgcolor: "background.paper",
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

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
        p: 3,
        textAlign: "center",
        borderRadius: 2,
        background: `linear-gradient(45deg, ${color}20, #ffffff)`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        transition: "transform 0.3s",
        "&:hover": { transform: "scale(1.05)" },
      }}
    >
      <Box sx={{ mb: 2, color }}>{icon}</Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h4" color={color}>
        <CountUp end={value} duration={2.5} />
      </Typography>
    </Paper>
  </motion.div>
);

// Componente para tarjeta de muestra en cotización
const QuotationCard = ({ sample, onViewDetails }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3 }}
    style={{ minWidth: 300, marginRight: 16 }}
  >
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        background: "linear-gradient(45deg, #39A90010, #ffffff)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        transition: "transform 0.3s",
        "&:hover": { transform: "scale(1.03)" },
      }}
    >
      <Typography variant="h6" color="#39A900">
        Muestra #{sample.id_muestra || sample._id}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Cliente: {sample.cliente?.nombre || "N/A"}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Fecha: {sample.fechaHoraMuestreo ? new Date(sample.fechaHoraMuestreo).toLocaleDateString() : "N/A"}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Análisis: {sample.tipoAnalisis || "N/A"}
      </Typography>
      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => onViewDetails(sample)}
          sx={{ borderColor: "#39A900", color: "#39A900" }}
        >
          Detalles
        </Button>
      </Box>
    </Paper>
  </motion.div>
);

const Dashboard = () => {
  // Estados para estadísticas de muestras
  const [sampleStats, setSampleStats] = useState({
    totalSamples: 0,
    pendingSamples: 0,
    verifiedSamples: 0,
    quotationSamples: [],
  });
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [sampleError, setSampleError] = useState(null);

  // Estados para la información de usuarios
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    roleDistribution: [],
  });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState(null);

  // Estados para la modal de detalles de muestra
  const [selectedSample, setSelectedSample] = useState(null);
  const [openModal, setOpenModal] = useState(false);

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
        let allSamples = [];
        let page = 1;
        const limit = 100; // Límite por página
        let hasMore = true;

        // Obtener estadísticas de muestras desde /api/ingreso-resultados/resultados
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
        let quotationSamples = [];
        try {
          page = 1;
          hasMore = true;
          let allQuotationSamples = [];

          while (hasMore) {
            const response = await axios.get(
              `https://backend-registro-muestras.onrender.com/api/muestras?page=${page}&limit=${limit}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log(`Respuesta de la API de muestras (página ${page}):`, response.data);

            let samples = [];
            if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
              samples = response.data.data.data;
            } else if (response.data && Array.isArray(response.data.data)) {
              samples = response.data.data;
            } else if (Array.isArray(response.data)) {
              samples = response.data;
            } else {
              console.warn("Estructura inesperada en la respuesta de muestras:", response.data);
              samples = [];
            }

            allQuotationSamples = [...allQuotationSamples, ...samples];

            const totalPages = response.data.data?.pagination?.totalPages || 1;
            hasMore = page < totalPages;
            page += 1;
          }

          console.log("Todas las muestras procesadas (muestras):", allQuotationSamples);

          quotationSamples = allQuotationSamples
            .filter((s) => s.estado && s.estado.toLowerCase() === "en cotizacion")
            .sort((a, b) => new Date(b.fechaHoraMuestreo) - new Date(a.fechaHoraMuestreo))
            .slice(0, 10); // Limitar a 10 para el carrusel
        } catch (err) {
          console.error("Error al cargar muestras para cotización:", err);
          setSampleError("Error al cargar las muestras en cotización. Verifica la conexión o el token.");
        }

        console.log("Estadísticas calculadas:", {
          totalSamples,
          pendingSamples,
          verifiedSamples,
          quotationSamplesLength: quotationSamples.length,
        });

        setSampleStats({
          totalSamples,
          pendingSamples,
          verifiedSamples,
          quotationSamples,
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
        if (Array.isArray(response.data)) {
          users = response.data;
        } else if (response.data && response.data.usuarios) {
          users = response.data.usuarios;
        } else {
          console.warn("Estructura inesperada en la respuesta de usuarios:", response.data);
          users = [];
        }

        console.log("Usuarios procesados:", users);

        const totalUsers = users.length;
        const roleCounts = {};
        users.forEach((user) => {
          const role = user.rol?.nombre || user.rol || "Sin Rol";
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
        const roleDistribution = Object.keys(roleCounts).map((role) => ({
          role,
          count: roleCounts[role],
        }));

        console.log("Estadísticas de usuarios:", { totalUsers, roleDistribution });

        setUserStats({ totalUsers, roleDistribution });
      } catch (err) {
        console.error("Error al cargar usuarios:", err);
        setUserError("Error al cargar la información de usuarios. Verifica la conexión o el token.");
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // Funciones para la modal
  const handleViewDetails = (sample) => {
    setSelectedSample(sample);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedSample(null);
  };

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
        {/* Título principal */}
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

        {/* Errores */}
        {(sampleError || userError) && (
          <Grid item xs={12}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {sampleError || userError}
            </Alert>
          </Grid>
        )}

        {/* Estadísticas de Muestras */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Total Muestras"
              value={sampleStats.totalSamples}
              icon={<AssignmentIcon sx={{ fontSize: 40 }} />}
              color="#39A900"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Muestras Pendientes"
              value={sampleStats.pendingSamples}
              icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
              color="#FF9800"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Muestras Verificadas"
              value={sampleStats.verifiedSamples}
              icon={<AssignmentIcon sx={{ fontSize: 40 }} />}
              color="#4CAF50"
            />
          </Grid>
        </Grid>

        {/* Muestras en Cotización */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
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
            <Box
              sx={{
                display: "flex",
                overflowX: "auto",
                pb: 2,
                "&::-webkit-scrollbar": {
                  height: 8,
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "#39A900",
                  borderRadius: 4,
                },
              }}
            >
              {sampleStats.quotationSamples.map((sample) => (
                <QuotationCard
                  key={sample.id_muestra || sample._id}
                  sample={sample}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </Box>
          )}
        </Paper>

        {/* Estadísticas de Usuarios */}
        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 2,
            background: "linear-gradient(45deg, #ffffff, #d7f7dd)",
          }}
        >
          <Typography variant="h5" sx={{ mb: 2, color: "#39A900" }}>
            Usuarios Registrados
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <StatCard
                title="Total Usuarios"
                value={userStats.totalUsers}
                icon={<PeopleIcon sx={{ fontSize: 40 }} />}
                color="#2196F3"
              />
            </Grid>
            {userStats.roleDistribution.map((roleItem) => (
              <Grid item xs={12} sm={4} key={roleItem.role}>
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
                      background: "linear-gradient(45deg, #2196F320, #ffffff)",
                    }}
                  >
                    <Typography variant="h6" color="text.secondary">
                      {roleItem.role}
                    </Typography>
                    <Typography variant="h4" color="#2196F3">
                      <CountUp end={roleItem.count} duration={2.5} />
                    </Typography>
                  </Paper>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Modal de Detalles de Muestra */}
        <Modal open={openModal} onClose={handleCloseModal}>
          <Box sx={modalStyle}>
            {selectedSample && (
              <>
                <Typography variant="h6" sx={{ mb: 2, color: "#39A900" }}>
                  Detalles de la Muestra #{selectedSample.id_muestra || selectedSample._id}
                </Typography>
                <Typography variant="body1">
                  <strong>Cliente:</strong> {selectedSample.cliente?.nombre || "N/A"}
                </Typography>
                <Typography variant="body1">
                  <strong>Fecha:</strong>{" "}
                  {selectedSample.fechaHoraMuestreo
                    ? new Date(selectedSample.fechaHoraMuestreo).toLocaleString()
                    : "N/A"}
                </Typography>
                <Typography variant="body1">
                  <strong>Tipo de Análisis:</strong> {selectedSample.tipoAnalisis || "N/A"}
                </Typography>
                <Typography variant="body1">
                  <strong>Estado:</strong> {selectedSample.estado || "N/A"}
                </Typography>
                <Typography variant="body1">
                  <strong>Lugar:</strong> {selectedSample.lugarMuestreo || "N/A"}
                </Typography>
              </>
            )}
          </Box>
        </Modal>
      </motion.div>
    </Box>
  );
};

export default Dashboard;