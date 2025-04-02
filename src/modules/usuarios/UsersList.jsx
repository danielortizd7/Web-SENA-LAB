import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  IconButton,
  Box,
  Grid,
  Typography,
  Pagination,
  Snackbar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";

const UsersList = () => {
  const { tipoUsuario } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editUser, setEditUser] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const navigate = useNavigate();

  // Función auxiliar para obtener el nombre del rol
  // Retorna una cadena (o cadena vacía en caso de no encontrarla)
  const getRoleName = (user) => {
    if (!user || !user.rol) return "";
    return typeof user.rol === "string" ? user.rol : user.rol.name || "";
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No tienes permiso para acceder a esta información. Inicia sesión.");
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get("https://back-usuarios-f.onrender.com/api/usuarios", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Aseguramos que response.data sea un array
        setUsers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Error al cargar los usuarios.");
          console.error("❌ Error en la solicitud:", error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    try {
      let visibleUsers = Array.isArray(users) ? [...users] : [];

      if (tipoUsuario === "laboratorista") {
        visibleUsers = visibleUsers.filter(
          (user) => getRoleName(user).toLowerCase() === "cliente"
        );
      } else if (tipoUsuario === "administrador") {
        visibleUsers = visibleUsers.filter((user) => {
          const role = getRoleName(user).toLowerCase();
          return role === "cliente" || role === "laboratorista";
        });
      }

      if (filterType !== "todos") {
        visibleUsers = visibleUsers.filter(
          (user) => getRoleName(user).toLowerCase() === filterType.toLowerCase()
        );
      }

      if (search.trim() !== "") {
        visibleUsers = visibleUsers.filter(
          (user) =>
            user.nombre?.toLowerCase().includes(search.toLowerCase()) ||
            (user.documento && user.documento.toString().includes(search))
        );
      }

      setFilteredUsers(visibleUsers);
      setPage(0);
    } catch (err) {
      console.error("Error en el filtrado:", err);
      setFilteredUsers([]);
    }
  }, [search, filterType, users, tipoUsuario]);

  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleFilterChange = (e) => setFilterType(e.target.value);
  const handleEditClick = (user) => {
    setEditUser(user);
    setOpenEdit(true);
  };
  const handleCloseEdit = () => {
    setOpenEdit(false);
    setEditUser(null);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleEditSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!editUser || !editUser._id) {
      setSnackbarMessage("No se encontró el usuario a editar.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    const datosActualizados = {
      nombre: editUser.nombre,
      documento: editUser.documento,
      telefono: editUser.telefono,
      direccion: editUser.direccion,
      email: editUser.email,
    };
    try {
      await axios.put(
        `https://back-usuarios-f.onrender.com/api/usuarios/${editUser._id}`,
        datosActualizados,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setUsers(
        users.map((user) =>
          user._id === editUser._id ? { ...user, ...datosActualizados } : user
        )
      );
      handleCloseEdit();
    } catch (error) {
      console.error("❌ Error al actualizar usuario:", error);
      setSnackbarMessage(
        error.response?.data?.message || "Error al actualizar usuario."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleToggleActivo = async (userId, nuevoEstado) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `https://back-usuarios-f.onrender.com/api/usuarios/${userId}/estado`,
        { activo: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, activo: nuevoEstado } : user
        )
      );
      setSnackbarMessage(`Usuario ${nuevoEstado ? "activado" : "desactivado"} con éxito.`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("❌ Error al actualizar el estado:", error);
      setSnackbarMessage(
        error.response?.data?.message || "Error al actualizar el estado del usuario."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleRowClick = (user) => {
    setDetailUser(user);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setDetailUser(null);
  };

  if (loading) {
    return <CircularProgress sx={{ display: "block", margin: "20px auto" }} />;
  }
  if (error) {
    return <Alert severity="error" sx={{ margin: "20px" }}>{error}</Alert>;
  }

  const getFilterOptions = () => {
    if (tipoUsuario === "laboratorista") return ["cliente"];
    if (tipoUsuario === "administrador") return ["cliente", "laboratorista"];
    return ["cliente", "laboratorista", "administrador", "super_admin"];
  };

  return (
    <Paper sx={{ padding: 2, marginTop: 2, boxShadow: 3 }}>
      <Select
        value={filterType}
        onChange={handleFilterChange}
        fullWidth
        sx={{ marginBottom: 2 }}
      >
        <MenuItem value="todos">Todos</MenuItem>
        {getFilterOptions().map((rol) => (
          <MenuItem key={rol} value={rol}>
            {rol.charAt(0).toUpperCase() + rol.slice(1)}
          </MenuItem>
        ))}
      </Select>

      <TextField
        label="Buscar usuario (nombre o documento)"
        variant="outlined"
        fullWidth
        sx={{ marginBottom: 2 }}
        onChange={handleSearchChange}
      />

      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: "#39A900" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Nombre</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Documento</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Teléfono</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Dirección</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Rol</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Activo</TableCell>
              {tipoUsuario !== "laboratorista" && (
                <TableCell sx={{ color: "white", fontWeight: "bold" }}>
                  Acciones
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user) => (
                <TableRow
                  key={user._id}
                  onClick={() => handleRowClick(user)}
                  sx={{
                    transition: "transform 0.2s",
                    "&:hover": { transform: "scale(1.02)", cursor: "pointer" },
                  }}
                >
                  <TableCell>{user.nombre}</TableCell>
                  <TableCell>{user.documento}</TableCell>
                  <TableCell>{user.telefono}</TableCell>
                  <TableCell>{user.direccion}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleName(user)}</TableCell>
                  <TableCell>{user.activo ? "Sí" : "No"}</TableCell>
                  {tipoUsuario !== "laboratorista" && (
                    <TableCell>
                      {tipoUsuario === "super_admin" && (
                        <>
                          <Switch
                            checked={user.activo}
                            onChange={() =>
                              handleToggleActivo(user._id, !user.activo)
                            }
                            color="primary"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {getRoleName(user).toLowerCase() === "administrador" && (
                            <IconButton
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(user);
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                        </>
                      )}
                      {tipoUsuario === "administrador" &&
                        getRoleName(user).toLowerCase() !== "administrador" &&
                        getRoleName(user).toLowerCase() !== "super_admin" && (
                          <IconButton
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(user);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredUsers.length > rowsPerPage && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={Math.ceil(filteredUsers.length / rowsPerPage)}
            page={page + 1}
            onChange={(event, value) => setPage(value - 1)}
            color="primary"
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#39A900",
              },
              "& .Mui-selected": {
                backgroundColor: "#39A900",
                color: "white",
                "&:hover": {
                  backgroundColor: "#2d8000",
                },
              },
            }}
          />
        </Box>
      )}

      <Dialog
        open={openEdit}
        onClose={handleCloseEdit}
        disableEnforceFocus
        disableRestoreFocus
      >
        <DialogTitle>Editar Usuario</DialogTitle>
        <DialogContent>
          {["nombre", "documento", "telefono", "direccion", "email"].map((field) => (
            <TextField
              key={field}
              fullWidth
              margin="dense"
              label={field}
              value={editUser?.[field] || ""}
              onChange={(e) =>
                setEditUser({ ...editUser, [field]: e.target.value })
              }
            />
          ))}
          {getRoleName(editUser) && (
            <TextField
              fullWidth
              margin="dense"
              label="Rol"
              value={getRoleName(editUser)}
              InputProps={{ readOnly: true }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Cancelar</Button>
          <Button onClick={handleEditSubmit} variant="contained" color="primary">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openDetail}
        onClose={handleCloseDetail}
        disableEnforceFocus
        disableRestoreFocus
      >
        <DialogTitle>Detalle del Usuario</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ border: "1px solid #ccc", borderRadius: 2, padding: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" align="center">
                  {detailUser?.nombre}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Documento:</strong> {detailUser?.documento}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Teléfono:</strong> {detailUser?.telefono}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Dirección:</strong> {detailUser?.direccion}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body1">
                  <strong>Email:</strong> {detailUser?.email}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Rol:</strong> {getRoleName(detailUser)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">
                  <strong>Activo:</strong> {detailUser?.activo ? "Sí" : "No"}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default UsersList;
