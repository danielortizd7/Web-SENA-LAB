import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import senaLogo from "../assets/logo-sena.png";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  Button,
  Modal,
  Box,
  Typography,
  IconButton,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  Pagination,
  Snackbar,
  Alert,
  Grid
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GetAppIcon from "@mui/icons-material/GetApp";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AuthContext from "../context/AuthContext";

// ----- URLs para las peticiones (ajusta si las tuyas son distintas) -----
const BASE_URLS = {
  USUARIOS: "https://backend-sena-lab-1-qpzp.onrender.com/api",
  MUESTRAS: "https://daniel-back-dom.onrender.com/api",
};

const API_URLS = {
  USUARIOS: `${BASE_URLS.USUARIOS}/usuarios`,
  MUESTRAS: `${BASE_URLS.MUESTRAS}/muestras`,
  ANALISIS_FISICOQUIMICOS: `${BASE_URLS.MUESTRAS}/analisis/fisicoquimicos`,
  ANALISIS_MICROBIOLOGICOS: `${BASE_URLS.MUESTRAS}/analisis/microbiologicos`,
};

// Componente personalizado para los botones de acción
const ActionButton = ({ tooltip, onClick, IconComponent }) => (
  <Tooltip title={tooltip} placement="top" arrow>
    <IconButton
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      sx={{
        transition: "transform 0.2s",
        "&:hover": {
          transform: "scale(1.1)",
          backgroundColor: "rgba(57, 169, 0, 0.2)",
        },
      }}
    >
      <IconComponent />
    </IconButton>
  </Tooltip>
);

// Función para obtener propiedades del Chip según el estado
const getEstadoChipProps = (estado) => {
  switch (estado) {
    case "Recibida":
      return { chipColor: "primary", sx: { backgroundColor: "#39A900", color: "white" } };
    case "En análisis":
      return { chipColor: "info", sx: { backgroundColor: "#2196F3", color: "white" } };
    case "Pendiente de resultados":
      return { chipColor: "warning", sx: { backgroundColor: "#FF9800", color: "white" } };
    case "Finalizada":
      return { chipColor: "success", sx: { backgroundColor: "#4CAF50", color: "white" } };
    case "Rechazada":
      return { chipColor: "error", sx: { backgroundColor: "#F44336", color: "white" } };
    default:
      return { chipColor: "default", sx: { backgroundColor: "#666", color: "white" } };
  }
};

// ------------------ Modal para ver detalles de la Muestra ------------------
const DetailMuestraModal = ({ selectedMuestra, onClose, modalStyle, hideClientData }) => (
  <Modal open={selectedMuestra !== null} onClose={onClose}>
    <Box sx={modalStyle}>
      <Typography variant="h6" align="center" sx={{ mb: 2 }}>
        Detalles de la Muestra
      </Typography>
      {selectedMuestra && (
        <TableContainer component={Paper} sx={{ maxWidth: "100%" }}>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>ID Muestra</TableCell>
                <TableCell>{selectedMuestra.id_muestra || "N/A"}</TableCell>
              </TableRow>
              {!hideClientData && (
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Documento</TableCell>
                  <TableCell>{selectedMuestra.documento || "N/A"}</TableCell>
                </TableRow>
              )}
              {!hideClientData && (
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Cliente</TableCell>
                  <TableCell>{selectedMuestra.nombreCliente || "No encontrado"}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Tipo de Análisis</TableCell>
                <TableCell>{selectedMuestra.tipoAnalisis || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Tipo de Muestreo</TableCell>
                <TableCell>{selectedMuestra.tipoMuestreo || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Fecha y Hora de Muestreo</TableCell>
                <TableCell>
                  {selectedMuestra.fechaHoraMuestreo
                    ? new Date(selectedMuestra.fechaHoraMuestreo).toLocaleString()
                    : "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Lugar de Muestreo</TableCell>
                <TableCell>{selectedMuestra.lugarMuestreo || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Identificación de Muestra</TableCell>
                <TableCell>{selectedMuestra.identificacionMuestra || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Plan de Muestreo</TableCell>
                <TableCell>{selectedMuestra.planMuestreo || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Condiciones Ambientales</TableCell>
                <TableCell>{selectedMuestra.condicionesAmbientales || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Preservación de Muestra</TableCell>
                <TableCell>{selectedMuestra.preservacionMuestra || "N/A"}</TableCell>
              </TableRow>
              {selectedMuestra.preservacionMuestra === "Otro" && (
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Detalle de Preservación</TableCell>
                  <TableCell>{selectedMuestra.preservacionMuestraOtra || "N/A"}</TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Análisis Seleccionados</TableCell>
                <TableCell>
                  {selectedMuestra.analisisSeleccionados?.join(", ") || "Ninguno"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Observaciones</TableCell>
                <TableCell>{selectedMuestra.observaciones || "N/A"}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                <TableCell>
                  {(() => {
                    const estadoProps = getEstadoChipProps(selectedMuestra.estado);
                    return (
                      <Chip
                        label={selectedMuestra.estado || "No especificado"}
                        color={estadoProps.chipColor}
                        sx={estadoProps.sx}
                      />
                    );
                  })()}
                </TableCell>
              </TableRow>
              {selectedMuestra.historial && selectedMuestra.historial.length > 0 && (
                <>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Último cambio por</TableCell>
                    <TableCell>
                      {selectedMuestra.historial[selectedMuestra.historial.length - 1]
                        .nombreadministrador || "N/A"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Fecha de cambio</TableCell>
                    <TableCell>
                      {new Date(
                        selectedMuestra.historial[selectedMuestra.historial.length - 1].fechaCambio
                      ).toLocaleString()}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Observaciones Hist.</TableCell>
                    <TableCell>
                      {selectedMuestra.historial[selectedMuestra.historial.length - 1]
                        .observaciones || "N/A"}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  </Modal>
);

// ------------------ Modal para Editar la Muestra (CARGA DINÁMICA) ------------------
const EditMuestraModal = ({ editingMuestra, setEditingMuestra, onSave, modalStyle }) => {
  // Aquí guardamos la lista de análisis disponibles que llegan desde el backend
  const [analisisDisponibles, setAnalisisDisponibles] = useState([]);

  // Función que llama a los endpoints para cargar la lista de análisis
  const cargarAnalisis = async (tipo) => {
    try {
      const token = localStorage.getItem("token");
      let endpoint = "";
      if (tipo === "Fisicoquímico") {
        endpoint = API_URLS.ANALISIS_FISICOQUIMICOS;
      } else if (tipo === "Microbiológico") {
        endpoint = API_URLS.ANALISIS_MICROBIOLOGICOS;
      } else {
        setAnalisisDisponibles([]);
        return;
      }
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Asumiendo que el endpoint devuelve un array de objetos { nombre, unidad, ... }
      if (Array.isArray(response.data)) {
        setAnalisisDisponibles(response.data);
      } else {
        // Ajusta según la forma real en que tu backend devuelve los datos
        setAnalisisDisponibles([]);
      }
    } catch (error) {
      console.error("Error al cargar análisis:", error);
      setAnalisisDisponibles([]);
    }
  };

  // Efecto que se dispara cuando el usuario abre/cambia el tipo de análisis en el modal
  useEffect(() => {
    if (editingMuestra && editingMuestra.tipoAnalisis) {
      cargarAnalisis(editingMuestra.tipoAnalisis);
    } else {
      setAnalisisDisponibles([]);
    }
  }, [editingMuestra?.tipoAnalisis]);

  if (!editingMuestra) return null;

  // Manejo de checkboxes para los análisis seleccionados
  const handleAnalisisChange = (analisisNombre) => {
    setEditingMuestra((prev) => {
      const alreadySelected = prev.analisisSeleccionados?.includes(analisisNombre);
      return {
        ...prev,
        analisisSeleccionados: alreadySelected
          ? prev.analisisSeleccionados.filter((item) => item !== analisisNombre)
          : [...(prev.analisisSeleccionados || []), analisisNombre],
      };
    });
  };

  return (
    <Modal open={editingMuestra !== null} onClose={() => setEditingMuestra(null)}>
      <Box sx={modalStyle}>
        <Typography variant="h6" align="center" sx={{ mb: 2 }}>
          Editar Muestra
        </Typography>
        <Box component="form" noValidate autoComplete="off" sx={{ "& .MuiTextField-root": { mb: 2 } }}>
          {/* Tipo de Análisis */}
          <Typography variant="subtitle2">Tipo de Análisis</Typography>
          <Select
            fullWidth
            value={editingMuestra.tipoAnalisis || ""}
            onChange={(e) =>
              // Al cambiar se reinician los análisis seleccionados
              setEditingMuestra({
                ...editingMuestra,
                tipoAnalisis: e.target.value,
                analisisSeleccionados: [],
              })
            }
          >
            <MenuItem value="Fisicoquímico">Fisicoquímico</MenuItem>
            <MenuItem value="Microbiológico">Microbiológico</MenuItem>
          </Select>

          {/* Tipo de Muestreo */}
          <Typography variant="subtitle2">Tipo de Muestreo</Typography>
          <Select
            fullWidth
            value={editingMuestra.tipoMuestreo || ""}
            onChange={(e) => setEditingMuestra({ ...editingMuestra, tipoMuestreo: e.target.value })}
          >
            <MenuItem value="Simple">Simple</MenuItem>
            <MenuItem value="Compuesto">Compuesto</MenuItem>
          </Select>

          {/* Fecha y Hora de Muestreo */}
          <TextField
            fullWidth
            label="Fecha y Hora de Muestreo"
            type="datetime-local"
            InputLabelProps={{ shrink: true }}
            value={
              editingMuestra.fechaHoraMuestreo
                ? editingMuestra.fechaHoraMuestreo.substring(0, 16)
                : ""
            }
            onChange={(e) =>
              setEditingMuestra({ ...editingMuestra, fechaHoraMuestreo: e.target.value })
            }
          />

          {/* Lugar de Muestreo */}
          <TextField
            fullWidth
            label="Lugar de Muestreo"
            value={editingMuestra.lugarMuestreo || ""}
            onChange={(e) =>
              setEditingMuestra({ ...editingMuestra, lugarMuestreo: e.target.value })
            }
          />

          {/* Identificación de Muestra */}
          <TextField
            fullWidth
            label="Identificación de Muestra"
            value={editingMuestra.identificacionMuestra || ""}
            onChange={(e) =>
              setEditingMuestra({ ...editingMuestra, identificacionMuestra: e.target.value })
            }
          />

          {/* Plan de Muestreo */}
          <TextField
            fullWidth
            label="Plan de Muestreo"
            value={editingMuestra.planMuestreo || ""}
            onChange={(e) =>
              setEditingMuestra({ ...editingMuestra, planMuestreo: e.target.value })
            }
          />

          {/* Condiciones Ambientales */}
          <TextField
            fullWidth
            label="Condiciones Ambientales"
            multiline
            rows={3}
            value={editingMuestra.condicionesAmbientales || ""}
            onChange={(e) =>
              setEditingMuestra({ ...editingMuestra, condicionesAmbientales: e.target.value })
            }
          />

          {/* Preservación de Muestra */}
          <Typography variant="subtitle2">Preservación de Muestra</Typography>
          <Select
            fullWidth
            value={editingMuestra.preservacionMuestra || ""}
            onChange={(e) =>
              setEditingMuestra({ ...editingMuestra, preservacionMuestra: e.target.value })
            }
          >
            <MenuItem value="Refrigeración">Refrigeración</MenuItem>
            <MenuItem value="Congelación">Congelación</MenuItem>
            <MenuItem value="Acidificación">Acidificación</MenuItem>
            <MenuItem value="Otro">Otro</MenuItem>
          </Select>
          {editingMuestra.preservacionMuestra === "Otro" && (
            <TextField
              fullWidth
              label="Detalle de Preservación"
              value={editingMuestra.preservacionMuestraOtra || ""}
              onChange={(e) =>
                setEditingMuestra({ ...editingMuestra, preservacionMuestraOtra: e.target.value })
              }
            />
          )}

          {/* Análisis a Realizar (dinámico, cargado desde el backend) */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Análisis a Realizar
          </Typography>

          {analisisDisponibles.length === 0 ? (
            <Alert severity="info" sx={{ mb: 2 }}>
              No hay análisis disponibles para este tipo (o aún no se han cargado).
            </Alert>
          ) : (
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>
                  {editingMuestra.tipoAnalisis === "Fisicoquímico"
                    ? "Análisis Fisicoquímicos"
                    : "Análisis Microbiológicos"}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {analisisDisponibles.map((analisis) => (
                    <Grid item xs={12} sm={6} key={analisis.nombre}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={editingMuestra.analisisSeleccionados?.includes(analisis.nombre)}
                            onChange={() => handleAnalisisChange(analisis.nombre)}
                          />
                        }
                        label={
                          analisis.unidad && analisis.unidad !== "N/A"
                            ? `${analisis.nombre} (Unidad: ${analisis.unidad})`
                            : analisis.nombre
                        }
                      />
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Observaciones */}
          <TextField
            fullWidth
            label="Observaciones"
            multiline
            rows={3}
            value={editingMuestra.observaciones || ""}
            onChange={(e) =>
              setEditingMuestra({ ...editingMuestra, observaciones: e.target.value })
            }
          />

          <Button variant="contained" color="primary" fullWidth onClick={onSave} sx={{ mt: 2 }}>
            Guardar Cambios
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

// ------------------ Componente Principal Muestras ------------------
const Muestras = () => {
  const [muestras, setMuestras] = useState([]);
  const [filteredMuestras, setFilteredMuestras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // El filtro se basa en "tipoAnalisis"
  const [filterType, setFilterType] = useState("todos");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedMuestra, setSelectedMuestra] = useState(null);
  const [editingMuestra, setEditingMuestra] = useState(null);
  const navigate = useNavigate();
  const { tipoUsuario } = useContext(AuthContext); // Se obtiene el rol del usuario

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("error");

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    maxHeight: "90vh",
    overflowY: "auto",
  };

  // Carga inicial de muestras y usuarios
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setSnackbarMessage("⚠ No tienes autorización. Inicia sesión.");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          setLoading(false);
          return;
        }
        // Cargamos las muestras
        const muestrasResponse = await axios.get(API_URLS.MUESTRAS, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let muestrasData = [];
        if (
          muestrasResponse.data &&
          muestrasResponse.data.data &&
          muestrasResponse.data.data.muestras
        ) {
          muestrasData = muestrasResponse.data.data.muestras;
        }

        // Cargamos los usuarios
        const usuariosResponse = await axios.get(API_URLS.USUARIOS, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const usuariosData = Array.isArray(usuariosResponse.data.usuarios)
          ? usuariosResponse.data.usuarios
          : Array.isArray(usuariosResponse.data)
          ? usuariosResponse.data
          : [];

        // Vinculamos la info del cliente
        const muestrasCompletas = muestrasData.map((muestra) => {
          const usuario = usuariosData.find(
            (user) => user.documento === muestra.documento
          );
          return {
            ...muestra,
            tipoAnalisis: muestra.tipoAnalisis || "N/A",
            tipoMuestreo: muestra.tipoMuestreo || "N/A",
            fechaHoraMuestreo: muestra.fechaHoraMuestreo || "N/A",
            nombreCliente: usuario ? usuario.nombre : "No encontrado",
            telefono: usuario ? usuario.telefono : "No encontrado",
          };
        });

        setMuestras(muestrasCompletas);
        setFilteredMuestras(muestrasCompletas);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setSnackbarMessage("⚠ Error al cargar las muestras. Verifica tu conexión.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtrado local (tipoAnalisis y búsqueda)
  useEffect(() => {
    let filtered = [...muestras];
    if (filterType !== "todos") {
      filtered = filtered.filter(
        (m) =>
          m.tipoAnalisis &&
          m.tipoAnalisis.toLowerCase() === filterType.toLowerCase()
      );
    }
    if (search.trim() !== "") {
      filtered = filtered.filter(
        (m) =>
          (tipoUsuario !== "laboratorista" &&
            m.nombreCliente.toLowerCase().includes(search.toLowerCase())) ||
          String(m.id_muestra).includes(search)
      );
    }
    setFilteredMuestras(filtered);
    setPage(0);
  }, [search, filterType, muestras, tipoUsuario]);

  const handleSearchChange = (e) => setSearch(e.target.value);

  const handleFilterChange = async (e) => {
    const selectedType = e.target.value;
    setFilterType(selectedType);
  };

  // Generar PDF
  const generarPDFMuestra = (muestra, preview = false) => {
    const doc = new jsPDF();
    doc.addImage(senaLogo, "PNG", 10, 10, 40, 25);
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(0, 49, 77);
    doc.rect(0, 35, 210, 10, "F");
    doc.text("Detalles de la Muestra", 14, 42);

    const detallesMuestra = [
      ["ID Muestra", muestra.id_muestra || "N/A"],
      ["Documento", muestra.documento || "N/A"],
      ["Nombre del Cliente", muestra.nombreCliente || "No encontrado"],
      ["Tipo de Análisis", muestra.tipoAnalisis || "N/A"],
      ["Tipo de Muestreo", muestra.tipoMuestreo || "N/A"],
      [
        "Fecha y Hora de Muestreo",
        muestra.fechaHoraMuestreo
          ? new Date(muestra.fechaHoraMuestreo).toLocaleString()
          : "N/A",
      ],
      ["Lugar de Muestreo", muestra.lugarMuestreo || "N/A"],
      ["Identificación de Muestra", muestra.identificacionMuestra || "N/A"],
      ["Plan de Muestreo", muestra.planMuestreo || "N/A"],
      ["Condiciones Ambientales", muestra.condicionesAmbientales || "N/A"],
      ["Preservación de Muestra", muestra.preservacionMuestra || "N/A"],
    ];

    if (muestra.preservacionMuestra === "Otro") {
      detallesMuestra.push([
        "Detalle de Preservación",
        muestra.preservacionMuestraOtra || "N/A",
      ]);
    }

    detallesMuestra.push(
      ["Análisis Seleccionados", muestra.analisisSeleccionados?.join(", ") || "Ninguno"],
      ["Observaciones", muestra.observaciones || "N/A"],
      ["Estado", muestra.estado || "No especificado"]
    );

    if (muestra.historial && muestra.historial.length > 0) {
      const ultimoCambio = muestra.historial[muestra.historial.length - 1];
      detallesMuestra.push(
        ["Último cambio por", ultimoCambio.nombreadministrador || "N/A"],
        ["Fecha de cambio", new Date(ultimoCambio.fechaCambio).toLocaleString()],
        ["Observaciones Hist.", ultimoCambio.observaciones || "N/A"]
      );
    }

    autoTable(doc, {
      startY: 50,
      head: [["Campo", "Valor"]],
      body: detallesMuestra,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 60 },
        1: { cellWidth: 130 },
      },
    });

    let currentY = doc.lastAutoTable.finalY + 20;

    if (muestra.firmas) {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Firmas", 14, currentY);
      currentY += 10;

      if (muestra.firmas.firmaAdministrador) {
        try {
          doc.addImage(muestra.firmas.firmaAdministrador, "PNG", 20, currentY, 70, 30);
          doc.setFontSize(10);
          doc.text("Administrador", 20, currentY + 35);
        } catch (error) {
          console.error("Error al agregar firma del administrador:", error);
        }
      }

      if (muestra.firmas.firmaCliente) {
        try {
          doc.addImage(muestra.firmas.firmaCliente, "PNG", 120, currentY, 70, 30);
          doc.setFontSize(10);
          doc.text("Cliente", 120, currentY + 35);
        } catch (error) {
          console.error("Error al agregar firma del cliente:", error);
        }
      }
      currentY += 50;
    }

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    if (preview) {
      window.open(doc.output("bloburl"), "_blank");
    } else {
      doc.save(`Muestra_${muestra.id_muestra}.pdf`);
    }
  };

  // Edición de la muestra
  const handleEditMuestra = (muestra) => setEditingMuestra(muestra);

  const handleSaveEdit = async () => {
    try {
      const updateData = {
        tipoAnalisis: editingMuestra.tipoAnalisis,
        tipoMuestreo: editingMuestra.tipoMuestreo,
        fechaHoraMuestreo: editingMuestra.fechaHoraMuestreo,
        lugarMuestreo: editingMuestra.lugarMuestreo,
        identificacionMuestra: editingMuestra.identificacionMuestra,
        planMuestreo: editingMuestra.planMuestreo,
        condicionesAmbientales: editingMuestra.condicionesAmbientales,
        preservacionMuestra: editingMuestra.preservacionMuestra,
        preservacionMuestraOtra:
          editingMuestra.preservacionMuestra === "Otro"
            ? editingMuestra.preservacionMuestraOtra
            : "",
        analisisSeleccionados: editingMuestra.analisisSeleccionados,
        observaciones: editingMuestra.observaciones,
      };

      await axios.put(
        `${API_URLS.MUESTRAS}/${editingMuestra.id_muestra}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const updatedMuestras = muestras.map((m) =>
        m.id_muestra === editingMuestra.id_muestra ? { ...m, ...updateData } : m
      );

      setMuestras(updatedMuestras);
      setFilteredMuestras(updatedMuestras);
      setEditingMuestra(null);

      setSnackbarMessage("Muestra actualizada exitosamente");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error al actualizar la muestra:", error);
      setSnackbarMessage(
        "Error al actualizar la muestra: " +
          (error.response?.data?.message || error.message)
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // Para ver los detalles
  const handleViewDetails = (muestra) => {
    setSelectedMuestra(muestra);
  };

  // Para descargar PDF
  const handleDownloadPDF = (muestra) => {
    generarPDFMuestra(muestra);
  };

  // Click en botón "Editar"
  const handleEditClick = (muestra) => {
    handleEditMuestra(muestra);
  };

  if (loading)
    return <CircularProgress sx={{ display: "block", margin: "20px auto" }} />;

  return (
    <Paper sx={{ padding: 2, marginTop: 2, boxShadow: 3 }}>
      <Typography variant="h4" align="center" sx={{ marginBottom: 2, fontWeight: "bold" }}>
        Muestras Registradas
      </Typography>

      {/* Filtro por tipo de análisis */}
      <Select value={filterType} onChange={handleFilterChange} fullWidth sx={{ marginBottom: 2 }}>
        <MenuItem value="todos">Todos</MenuItem>
        <MenuItem value="Fisicoquímico">Fisicoquímico</MenuItem>
        <MenuItem value="Microbiológico">Microbiológico</MenuItem>
      </Select>

      {/* Búsqueda */}
      <TextField
        label="Buscar muestra (ID o cliente)"
        variant="outlined"
        fullWidth
        sx={{ marginBottom: 2 }}
        onChange={handleSearchChange}
      />

      {filteredMuestras.length > 0 ? (
        <>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#39A900" }}>
                <TableRow>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>ID</TableCell>
                  {tipoUsuario !== "laboratorista" && (
                    <>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Cliente</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Documento</TableCell>
                    </>
                  )}
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Tipo de Análisis</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Estado</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Fecha</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Análisis</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredMuestras
                  .slice(page * rowsPerPage, (page + 1) * rowsPerPage)
                  .map((muestra) => (
                    <TableRow
                      key={muestra._id}
                      onClick={() => setSelectedMuestra(muestra)}
                      sx={{
                        transition: "transform 0.2s",
                        "&:hover": { transform: "scale(1.02)" },
                        cursor: "pointer",
                      }}
                    >
                      <TableCell>{muestra.id_muestra}</TableCell>
                      {tipoUsuario !== "laboratorista" && (
                        <>
                          <TableCell>{muestra.nombreCliente}</TableCell>
                          <TableCell>{muestra.documento}</TableCell>
                        </>
                      )}
                      <TableCell>{muestra.tipoAnalisis}</TableCell>
                      <TableCell>
                        {(() => {
                          const estadoProps = getEstadoChipProps(muestra.estado);
                          return (
                            <Chip
                              label={muestra.estado || "No especificado"}
                              color={estadoProps.chipColor}
                              sx={estadoProps.sx}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {muestra.fechaHoraMuestreo
                          ? new Date(muestra.fechaHoraMuestreo).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {muestra.analisisSeleccionados && muestra.analisisSeleccionados.length > 0
                          ? muestra.analisisSeleccionados.join(", ")
                          : "Ninguno"}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <ActionButton
                            tooltip="Ver Detalles"
                            onClick={() => handleViewDetails(muestra)}
                            IconComponent={VisibilityIcon}
                          />
                          <ActionButton
                            tooltip="Descargar PDF"
                            onClick={() => handleDownloadPDF(muestra)}
                            IconComponent={GetAppIcon}
                          />
                          <ActionButton
                            tooltip="Editar Muestra"
                            onClick={() => handleEditClick(muestra)}
                            IconComponent={EditIcon}
                          />
                          <ActionButton
                            tooltip="Registrar Resultados"
                            onClick={() =>
                              navigate(`/registrar-resultados/${muestra.id_muestra}`)
                            }
                            IconComponent={AssignmentIcon}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Paginación */}
          {filteredMuestras.length > rowsPerPage && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Pagination
                count={Math.ceil(filteredMuestras.length / rowsPerPage)}
                page={page + 1}
                onChange={(event, value) => setPage(value - 1)}
                color="primary"
                sx={{
                  "& .MuiPaginationItem-root": { color: "#39A900" },
                  "& .Mui-selected": {
                    backgroundColor: "#39A900",
                    color: "white",
                    "&:hover": { backgroundColor: "#2d8000" },
                  },
                }}
              />
            </Box>
          )}
        </>
      ) : (
        <Typography variant="body1" sx={{ mt: 2 }}>
          No se encontraron muestras con los filtros aplicados
        </Typography>
      )}

      {/* Modal de Detalles */}
      <DetailMuestraModal
        selectedMuestra={selectedMuestra}
        onClose={() => setSelectedMuestra(null)}
        modalStyle={modalStyle}
        hideClientData={tipoUsuario === "laboratorista"}
      />

      {/* Modal de Edición (usa carga dinámica de análisis) */}
      <EditMuestraModal
        editingMuestra={editingMuestra}
        setEditingMuestra={setEditingMuestra}
        onSave={handleSaveEdit}
        modalStyle={modalStyle}
      />

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default Muestras;
