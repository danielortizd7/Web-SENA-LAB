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
  Grid,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GetAppIcon from "@mui/icons-material/GetApp";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AuthContext from "../context/AuthContext";
import { muestrasService } from "../services/muestras.service";

// ----- URLs para las peticiones -----
const BASE_URLS = {
  USUARIOS: "https://backend-sena-lab-1-qpzp.onrender.com/api",
  MUESTRAS: "https://backend-registro-muestras.onrender.com/api",
};

const API_URLS = {
  USUARIOS: `${BASE_URLS.USUARIOS}/usuarios`,
  MUESTRAS: `${BASE_URLS.MUESTRAS}/muestras`,
  ANALISIS_FISICOQUIMICOS: `${BASE_URLS.MUESTRAS}/analisis/fisicoquimicos`,
  ANALISIS_MICROBIOLOGICOS: `${BASE_URLS.MUESTRAS}/analisis/microbiologicos`,
};

/**
 * Formatea la fecha y hora completa (para detalle y PDF).
 * Si el objeto fechaHoraMuestreo es { fecha, hora } con fecha en formato "dd/MM/yyyy",
 * lo transforma a un string ISO y lo muestra en formato local.
 */
function formatFechaHora(fechaHoraMuestreo) {
  if (!fechaHoraMuestreo) return "N/A";
  if (fechaHoraMuestreo.fecha && fechaHoraMuestreo.hora) {
    let { fecha, hora } = fechaHoraMuestreo;
    if (fecha.includes("/")) {
      const [dd, MM, yyyy] = fecha.split("/");
      fecha = `${yyyy}-${MM}-${dd}`;
    }
    const isoDate = `${fecha}T${hora}`;
    const d = new Date(isoDate);
    return isNaN(d) ? `${fechaHoraMuestreo.fecha} ${fechaHoraMuestreo.hora}` : d.toLocaleString();
  } else {
    const d = new Date(fechaHoraMuestreo);
    return isNaN(d) ? fechaHoraMuestreo : d.toLocaleString();
  }
}

/**
 * Formatea solamente la fecha (sin hora) para mostrar en la tabla.
 */
function formatFecha(fechaHoraMuestreo) {
  if (!fechaHoraMuestreo) return "N/A";
  if (fechaHoraMuestreo.fecha && fechaHoraMuestreo.hora) {
    let { fecha } = fechaHoraMuestreo;
    if (fecha.includes("/")) {
      const [dd, MM, yyyy] = fecha.split("/");
      fecha = `${yyyy}-${MM}-${dd}`;
    }
    const d = new Date(`${fecha}T00:00`);
    return isNaN(d) ? fechaHoraMuestreo.fecha : d.toLocaleDateString();
  } else {
    const d = new Date(fechaHoraMuestreo);
    return isNaN(d) ? fechaHoraMuestreo : d.toLocaleDateString();
  }
}

/**
 * Convierte fechaHoraMuestreo en formato ISO (yyyy-mm-dd) a partir de la propiedad "fecha".
 */
function convertFechaToISO(fechaHoraMuestreo) {
  if (!fechaHoraMuestreo) return "";
  if (fechaHoraMuestreo.fecha) {
    let fecha = fechaHoraMuestreo.fecha;
    if (fecha.includes("/")) {
      const [dd, MM, yyyy] = fecha.split("/");
      fecha = `${yyyy}-${MM}-${dd}`;
    }
    return fecha;
  }
  return "";
}

/**
 * Convierte un string ISO (formato "yyyy-MM-ddThh:mm") al objeto que espera el backend,
 * con formato: { fecha: "dd/MM/yyyy", hora: "hh:mm AM/PM" }.
 * Si ya es un objeto con { fecha, hora } o una instancia de Date, se maneja correctamente.
 */
function convertISOToFechaHoraObject(isoInput) {
  if (!isoInput) return null;
  if (typeof isoInput === "object") {
    if (isoInput.fecha && isoInput.hora) return isoInput;
    if (isoInput instanceof Date) {
      const dd = String(isoInput.getDate()).padStart(2, "0");
      const MM = String(isoInput.getMonth() + 1).padStart(2, "0");
      const yyyy = isoInput.getFullYear();
      const fecha = `${dd}/${MM}/${yyyy}`;
      let hours = isoInput.getHours();
      const minutes = String(isoInput.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      let hours12 = hours % 12;
      if (hours12 === 0) hours12 = 12;
      const hora = `${hours12}:${minutes} ${ampm}`;
      return { fecha, hora };
    }
  }
  if (typeof isoInput !== "string") return null;
  const parts = isoInput.split("T");
  if (parts.length < 2) return null;
  const [datePart, timePart] = parts;
  const [yyyy, MM, dd] = datePart.split("-");
  const fecha = `${dd}/${MM}/${yyyy}`;
  let [hours, minutes] = timePart.split(":");
  hours = parseInt(hours, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  let hours12 = hours % 12;
  if (hours12 === 0) hours12 = 12;
  const hora = `${hours12}:${minutes} ${ampm}`;
  return { fecha, hora };
}

/**
 * Componente para el botón con tooltip.
 */
const ActionButton = ({ tooltip, onClick, IconComponent }) => (
  <Tooltip title={tooltip} placement="top" arrow>
    <IconButton
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      sx={{
        transition: "transform 0.2s",
        "&:hover": { transform: "scale(1.1)", backgroundColor: "rgba(57, 169, 0, 0.2)" },
      }}
    >
      <IconComponent />
    </IconButton>
  </Tooltip>
);

/**
 * Retorna las propiedades para el Chip según el estado.
 */
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

/* ======================== MODALES ======================== */

/* Modal de Detalle Completo: se muestran todos los datos */
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
                <TableCell>{selectedMuestra.id_muestra || selectedMuestra._id || "N/A"}</TableCell>
              </TableRow>
              {!hideClientData && (
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Documento</TableCell>
                  <TableCell>
                    {selectedMuestra.documento || selectedMuestra.cliente?.documento || "N/A"}
                  </TableCell>
                </TableRow>
              )}
              {!hideClientData && (
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Cliente</TableCell>
                  <TableCell>
                    {selectedMuestra.nombreCliente || selectedMuestra.cliente?.nombre || "No encontrado"}
                  </TableCell>
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
                <TableCell>{formatFechaHora(selectedMuestra.fechaHoraMuestreo)}</TableCell>
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
                <TableCell sx={{ fontWeight: "bold" }}>Tipo de Agua</TableCell>
                <TableCell>
                  {selectedMuestra.tipoDeAgua?.descripcionCompleta ||
                    selectedMuestra.tipoDeAgua?.tipo ||
                    "N/A"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Análisis Seleccionados</TableCell>
                <TableCell>
                  {Array.isArray(selectedMuestra.analisisSeleccionados)
                    ? selectedMuestra.analisisSeleccionados.join(", ")
                    : "Ninguno"}
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
                    <TableCell sx={{ fontWeight: "bold" }}>Muestra creada por:</TableCell>
                    <TableCell>
                      {selectedMuestra.historial[selectedMuestra.historial.length - 1].administrador?.nombre || "N/A"}
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
                      {selectedMuestra.historial[selectedMuestra.historial.length - 1].observaciones || "N/A"}
                    </TableCell>
                  </TableRow>
                </>
              )}
              {selectedMuestra.firmas && (
                <>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Firma del Administrador</TableCell>
                    <TableCell>
                      {selectedMuestra.firmas.administrador?.firmaAdministrador ? (
                        <img
                          src={selectedMuestra.firmas.administrador.firmaAdministrador}
                          alt="Firma del Administrador"
                          style={{ maxWidth: "200px", maxHeight: "100px" }}
                        />
                      ) : (
                        "No disponible"
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Firma del Cliente</TableCell>
                    <TableCell>
                      {selectedMuestra.firmas.cliente?.firmaCliente ? (
                        <img
                          src={selectedMuestra.firmas.cliente.firmaCliente}
                          alt="Firma del Cliente"
                          style={{ maxWidth: "200px", maxHeight: "100px" }}
                        />
                      ) : (
                        "No disponible"
                      )}
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

/* ======================== MODAL DE EDICIÓN ======================== */
/* Se utiliza la función convertISOToFechaHoraObject para transformar el valor del input antes de enviarlo */
const EditMuestraModal = ({ editingMuestra, setEditingMuestra, onSave, modalStyle }) => {
  const [analisisDisponibles, setAnalisisDisponibles] = useState([]);

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
      setAnalisisDisponibles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error al cargar análisis:", error);
      setAnalisisDisponibles([]);
    }
  };

  useEffect(() => {
    if (editingMuestra && editingMuestra.tipoAnalisis) {
      cargarAnalisis(editingMuestra.tipoAnalisis);
    } else {
      setAnalisisDisponibles([]);
    }
  }, [editingMuestra?.tipoAnalisis]);

  if (!editingMuestra) return null;

  // Obtener el valor para el input "datetime-local"
  const fechaInputValue = (() => {
    const fh = editingMuestra.fechaHoraMuestreo;
    if (!fh) return "";
    if (typeof fh === "string") {
      return fh.substring(0, 16);
    }
    if (typeof fh === "object" && fh.fecha && fh.hora) {
      let fecha = fh.fecha;
      if (fecha.includes("/")) {
        const [dd, MM, yyyy] = fecha.split("/");
        fecha = `${yyyy}-${MM}-${dd}`;
      }
      // Función para convertir la hora de 12h a 24h:
      const convertTimeTo24 = (timeStr) => {
        if (!timeStr) return "";
        const parts = timeStr.trim().split(" ");
        if (parts.length !== 2) return timeStr;
        const [time, modifier] = parts;
        let [hours, minutes] = time.split(":");
        hours = parseInt(hours, 10);
        if (modifier.toUpperCase() === "PM" && hours !== 12) {
          hours += 12;
        }
        if (modifier.toUpperCase() === "AM" && hours === 12) {
          hours = 0;
        }
        return `${hours < 10 ? "0" + hours : hours}:${minutes}`;
      };
      const time24 = convertTimeTo24(fh.hora);
      return `${fecha}T${time24}`;
    }
    return "";
  })();

  // Convierte el string ISO al objeto que espera el backend.
  const convertedFechaHora = convertISOToFechaHoraObject(editingMuestra.fechaHoraMuestreo);

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
            onChange={(e) =>
              setEditingMuestra({ ...editingMuestra, tipoMuestreo: e.target.value })
            }
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
            value={fechaInputValue}
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
            value={editingMuestra.preservacionMuestrea || editingMuestra.preservacionMuestra || ""}
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
          {/* Análisis a Realizar */}
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

/* =================== COMPONENTE PRINCIPAL: Muestras =================== */
const Muestras = () => {
  const [muestras, setMuestras] = useState([]);
  const [filteredMuestras, setFilteredMuestras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [filterDate, setFilterDate] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [selectedMuestra, setSelectedMuestra] = useState(null);
  const [editingMuestra, setEditingMuestra] = useState(null);
  const navigate = useNavigate();
  const { tipoUsuario } = useContext(AuthContext);
  // Define la variable que indica si se debe ocultar la información del cliente
  const hideClientData = tipoUsuario === "laboratorista";

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

  // Aplica los filtros (búsqueda y fecha)
  const applyFilters = () => {
    let filtered = [...muestras];
    if (search.trim() !== "") {
      filtered = filtered.filter((muestra) =>
        (muestra.id_muestra?.toLowerCase().includes(search.toLowerCase()) ||
          muestra.cliente?.nombre?.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (filterDate !== "") {
      filtered = filtered.filter((muestra) => {
        const fechaISO = convertFechaToISO(muestra.fechaHoraMuestreo);
        return fechaISO === filterDate;
      });
    }
    setFilteredMuestras(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [muestras, search, filterDate]);

  const fetchMuestras = async (
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    tipo = filterType
  ) => {
    try {
      setLoading(true);
      const params = { page, limit, sortBy, sortOrder, ...(tipo !== "todos" && { tipoAnalisis: tipo }) };
      const queryParams = new URLSearchParams(params).toString();
      console.log("Fetching muestras with query:", queryParams);
      const response = await axios.get(`${API_URLS.MUESTRAS}?${queryParams}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log("Response from backend:", response.data);
      if (
        response.data &&
        response.data.data &&
        response.data.data.data &&
        response.data.data.pagination
      ) {
        const muestrasData = response.data.data.data;
        const paginationData = response.data.data.pagination;
        setMuestras(muestrasData);
        setFilteredMuestras(muestrasData);
        setPagination({
          page: paginationData.currentPage,
          limit: paginationData.limit,
          total: paginationData.total,
          totalPages: paginationData.totalPages,
        });
      } else {
        console.warn("Unexpected response structure:", response.data);
        setMuestras([]);
        setFilteredMuestras([]);
        setPagination({ page: 1, limit, total: 0, totalPages: 1 });
      }
    } catch (error) {
      console.error("Error fetching muestras:", error);
      setSnackbarMessage(
        "Error al cargar las muestras: " + (error.response?.data?.message || error.message)
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setMuestras([]);
      setFilteredMuestras([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMuestras(pagination.page, pagination.limit);
  }, []);

  const handlePageChange = (event, value) => {
    fetchMuestras(value, pagination.limit, "createdAt", "desc", filterType);
  };

  const handleFilterChange = (e) => {
    const newType = e.target.value;
    setFilterType(newType);
    fetchMuestras(1, pagination.limit, "createdAt", "desc", newType);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleDateChange = (e) => {
    setFilterDate(e.target.value);
  };

  const handleClearFilters = () => {
    setFilterType("todos");
    setFilterDate("");
    setSearch("");
    fetchMuestras(1, pagination.limit, "createdAt", "desc", "todos");
  };

  // Función para generar PDF (detalle completo)
  const generarPDFMuestra = (muestra, preview = false) => {
    const doc = new jsPDF();
    doc.addImage(senaLogo, "PNG", 10, 10, 40, 25);
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFillColor(0, 49, 77);
    doc.rect(0, 35, 210, 10, "F");
    doc.text("Detalles de la Muestra", 14, 42);

    const detallesMuestra = [
      ["ID Muestra", muestra.id_muestrea || muestra.id_muestra || muestra._id || "N/A"],
      ["Documento", muestra.documento || muestra.cliente?.documento || "N/A"],
      ["Nombre del Cliente", muestra.nombreCliente || muestra.cliente?.nombre || "No encontrado"],
      ["Tipo de Análisis", muestra.tipoAnalisis || "N/A"],
      ["Tipo de Muestreo", muestra.tipoMuestreo || "N/A"],
      ["Fecha y Hora de Muestreo", formatFechaHora(muestra.fechaHoraMuestreo)],
      ["Lugar de Muestreo", muestra.lugarMuestreo || "N/A"],
      ["Identificación de Muestra", muestra.identificacionMuestra || "N/A"],
      ["Plan de Muestreo", muestra.planMuestreo || "N/A"],
      ["Condiciones Ambientales", muestra.condicionesAmbientales || "N/A"],
      ["Preservación de Muestra", muestra.preservacionMuestra || "N/A"],
      [
        "Tipo de Agua",
        muestra.tipoDeAgua?.descripcionCompleta || muestra.tipoDeAgua?.tipo || "N/A",
      ],
    ];

    if (muestra.preservacionMuestra === "Otro") {
      detallesMuestra.push(["Detalle de Preservación", muestra.preservacionMuestraOtra || "N/A"]);
    }

    detallesMuestra.push(
      ["Análisis Seleccionados", Array.isArray(muestra.analisisSeleccionados) ? muestra.analisisSeleccionados.join(", ") : "Ninguno"],
      ["Observaciones", muestra.observaciones || "N/A"],
      ["Estado", muestra.estado || "No especificado"]
    );

    if (muestra.historial && muestra.historial.length > 0) {
      const ultimoCambio = muestra.historial[muestra.historial.length - 1];
      detallesMuestra.push(
        ["Último cambio por", ultimoCambio.administrador?.nombre || "N/A"],
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
      let adminFirma = null;
      let adminLabel = "Administrador";
      if (muestra.firmas.firmaAdministrador) {
        adminFirma =
          typeof muestra.firmas.firmaAdministrador === "object"
            ? muestra.firmas.firmaAdministrador.firma
            : muestra.firmas.firmaAdministrador;
      } else if (muestra.firmas.firmaLaboratorista) {
        adminFirma =
          typeof muestra.firmas.firmaLaboratorista === "object"
            ? muestra.firmas.firmaLaboratorista.firma
            : muestra.firmas.firmaLaboratorista;
        adminLabel = "Laboratorista";
      }
      if (adminFirma) {
        const adminCedula = muestra.firmas.cedulaAdministrador || muestra.firmas.cedulaLaboratorista || "";
        try {
          doc.addImage(adminFirma, "PNG", 20, currentY, 70, 30);
          doc.setFontSize(10);
          doc.text(adminLabel + (adminCedula ? ` (${adminCedula})` : ""), 20, currentY + 35);
        } catch (error) {
          console.error("Error al agregar firma del " + adminLabel + ":", error);
        }
      }
      let clienteFirma = null;
      if (muestra.firmas.firmaCliente) {
        clienteFirma =
          typeof muestra.firmas.firmaCliente === "object"
            ? muestra.firmas.firmaCliente.firma
            : muestra.firmas.firmaCliente;
      }
      if (clienteFirma) {
        const clienteCedula = muestra.firmas.cedulaCliente || "";
        try {
          doc.addImage(clienteFirma, "PNG", 120, currentY, 70, 30);
          doc.setFontSize(10);
          doc.text("Cliente" + (clienteCedula ? ` (${clienteCedula})` : ""), 120, currentY + 35);
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
      doc.save(`Muestra_${muestra.id_muestrea || muestra.id_muestra || muestra._id}.pdf`);
    }
  };

  const handleEditMuestra = (muestra) => setEditingMuestra(muestra);

  // Al guardar, convertir el valor del input (en formato ISO) al objeto que espera el backend.
  const handleSaveEdit = async () => {
    try {
      const updateData = {
        tipoAnalisis: editingMuestra.tipoAnalisis,
        tipoMuestreo: editingMuestra.tipoMuestreo,
        // Se transforma el string ISO del input al objeto esperado por el backend
        fechaHoraMuestreo: convertISOToFechaHoraObject(editingMuestra.fechaHoraMuestreo),
        lugarMuestreo: editingMuestra.lugarMuestreo,
        identificacionMuestra: editingMuestra.identificacionMuestra,
        planMuestreo: editingMuestra.planMuestreo,
        condicionesAmbientales: editingMuestra.condicionesAmbientales,
        preservacionMuestra: editingMuestra.preservacionMuestra,
        preservacionMuestraOtra:
          editingMuestra.preservacionMuestra === "Otro" ? editingMuestra.preservacionMuestraOtra : "",
        analisisSeleccionados: editingMuestra.analisisSeleccionados,
        observaciones: editingMuestra.observaciones,
      };

      // Imprime en consola el objeto updateData para verificar el formato
      console.log("updateData a enviar:", updateData);

      await axios.put(
        `${API_URLS.MUESTRAS}/${editingMuestra.id_muestra || editingMuestra._id}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const updatedMuestras = muestras.map((m) =>
        (m.id_muestra === editingMuestra.id_muestrea || m.id_muestrea === editingMuestra.id_muestrea || m.id_muestra === editingMuestra.id_muestra || m._id === editingMuestra._id)
          ? { ...m, ...updateData }
          : m
      );
      setMuestras(updatedMuestras);
      setFilteredMuestras(updatedMuestras);
      setEditingMuestra(null);
      setSnackbarMessage("Muestra actualizada exitosamente");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error al actualizar la muestra:", error);
      setSnackbarMessage("Error al actualizar la muestra: " + (error.response?.data?.message || error.message));
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleViewDetails = (muestra) => setSelectedMuestra(muestra);
  const handleDownloadPDF = (muestra) => generarPDFMuestra(muestra);
  const handleEditClick = (muestra) => handleEditMuestra(muestra);

  if (loading)
    return <CircularProgress sx={{ display: "block", margin: "20px auto" }} />;

  return (
    <Paper sx={{ padding: 2, marginTop: 2, boxShadow: 3 }}>
      <Typography variant="h4" align="center" sx={{ marginBottom: 2, fontWeight: "bold" }}>
        Muestras Registradas
      </Typography>
      {/* Controles de Filtro y Búsqueda */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={3}>
          <Select value={filterType} onChange={handleFilterChange} fullWidth>
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="Fisicoquímico">Fisicoquímico</MenuItem>
            <MenuItem value="Microbiológico">Microbiológico</MenuItem>
          </Select>
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            type="date"
            label="Filtrar por Fecha"
            fullWidth
            value={filterDate}
            onChange={handleDateChange}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Buscar (ID o Cliente)"
            variant="outlined"
            fullWidth
            value={search}
            onChange={handleSearchChange}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button variant="outlined" fullWidth onClick={handleClearFilters}>
            Limpiar Filtros
          </Button>
        </Grid>
      </Grid>
      {/* Tabla Resumida */}
      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: "#39A900" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>ID Muestra</TableCell>
              {!hideClientData && (
                <>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Cliente</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Documento</TableCell>
                </>
              )}
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Estado</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Fecha</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Lugar de Muestreo</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Tipo de Análisis</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredMuestras.map((muestra) => (
              <TableRow
                key={muestra.id_muestrea || muestra.id_muestra || muestra._id}
                sx={{
                  transition: "transform 0.2s",
                  "&:hover": { transform: "scale(1.02)" },
                  cursor: "pointer",
                }}
              >
                <TableCell onClick={() => setSelectedMuestra(muestra)}>
                  {muestra.id_muestrea || muestra.id_muestra || muestra._id}
                </TableCell>
                {!hideClientData && (
                  <>
                    <TableCell onClick={() => setSelectedMuestra(muestra)}>
                      {muestra.cliente?.nombre || "N/A"}
                    </TableCell>
                    <TableCell onClick={() => setSelectedMuestra(muestra)}>
                      {muestra.cliente?.documento || "N/A"}
                    </TableCell>
                  </>
                )}
                <TableCell onClick={() => setSelectedMuestra(muestra)}>
                  <Chip label={muestra.estado} sx={getEstadoChipProps(muestra.estado).sx} />
                </TableCell>
                <TableCell onClick={() => setSelectedMuestra(muestra)}>
                  {formatFecha(muestra.fechaHoraMuestreo)}
                </TableCell>
                <TableCell onClick={() => setSelectedMuestra(muestra)}>
                  {muestra.lugarMuestreo}
                </TableCell>
                <TableCell onClick={() => setSelectedMuestra(muestra)}>
                  <Typography variant="subtitle1" color="text.primary">
                    {muestra.tipoAnalisis || "N/A"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: "flex", gap: 1 }} onClick={(e) => e.stopPropagation()}>
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
                        navigate(`/registrar-resultados/${muestra.id_muestrea || muestra.id_muestrea || muestra.id_muestrea || muestra._id}`)
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
      <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
        <Pagination
          count={pagination.totalPages}
          page={pagination.page}
          onChange={handlePageChange}
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
      <DetailMuestraModal
        selectedMuestra={selectedMuestra}
        onClose={() => setSelectedMuestra(null)}
        modalStyle={modalStyle}
        hideClientData={hideClientData}
      />
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
