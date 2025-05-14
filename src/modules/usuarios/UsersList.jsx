// src/components/UsersList.jsx
import React, { useState, useEffect, useContext, memo } from "react";
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
  Typography,
  Pagination,
  Snackbar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";

const UsersList = memo(() => {
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
        const response = await axios.get("https://backend-sena-lab-1-qpzp.onrender.com/api/usuarios", {
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
      } else if (tipoUsuario === "super_admin") {
        // Excluir usuarios con rol super_admin
        visibleUsers = visibleUsers.filter(
          (user) => getRoleName(user).toLowerCase() !== "super_admin"
        );
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
        `https://backend-sena-lab-1-qpzp.onrender.com/api/usuarios/${editUser._id}`,
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
        `https://backend-sena-lab-1-qpzp.onrender.com/api/usuarios/${userId}/estado`,
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
    return <CircularProgress style={{ display: "block", margin: "20px auto" }} />;
  }
  if (error) {
    return <Alert severity="error" style={{ margin: "20px" }}>{error}</Alert>;
  }

  // Se actualiza el select de opciones para que el rol super_admin no sea listado para el super administrador
  const getFilterOptions = () => {
    if (tipoUsuario === "laboratorista") return ["cliente"];
    if (tipoUsuario === "administrador") return ["cliente", "laboratorista"];
    if (tipoUsuario === "super_admin") return ["cliente", "laboratorista", "administrador"];
    return ["cliente", "laboratorista", "administrador", "super_admin"];
  };

  return (
    <Paper style={{ padding: 16, marginTop: 16, boxShadow: "0px 3px 6px rgba(0,0,0,0.16)" }}>
      <Select
        value={filterType}
        onChange={handleFilterChange}
        fullWidth
        style={{ marginBottom: 16 }}
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
        style={{ marginBottom: 16 }}
        onChange={handleSearchChange}
      />

      <TableContainer>
        <Table>
          <TableHead style={{ backgroundColor: "#39A900" }}>
            <TableRow>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Nombre</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Documento</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Teléfono</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Dirección</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Email</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Rol</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Activo</TableCell>
              {tipoUsuario !== "laboratorista" && (
                <TableCell style={{ color: "white", fontWeight: "bold" }}>Acciones</TableCell>
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
                  style={{
                    transition: "transform 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
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
        <Box style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <Pagination
            count={Math.ceil(filteredUsers.length / rowsPerPage)}
            page={page + 1}
            onChange={(event, value) => setPage(value - 1)}
            color="primary"
            style={{
              color: "#39A900",
            }}
          />
        </Box>
      )}

      <Dialog open={openEdit} onClose={handleCloseEdit}>
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

      <Dialog open={openDetail} onClose={handleCloseDetail}>
        <DialogTitle>Detalle del Usuario</DialogTitle>
        <DialogContent dividers>
          <Box style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16 }}>
            <Typography variant="h6" align="center">
              {detailUser?.nombre}
            </Typography>
            <Box style={{ marginTop: 8 }}>
              <Typography variant="body1">
                <strong>Documento:</strong> {detailUser?.documento}
              </Typography>
              <Typography variant="body1">
                <strong>Teléfono:</strong> {detailUser?.telefono}
              </Typography>
              <Typography variant="body1">
                <strong>Dirección:</strong> {detailUser?.direccion}
              </Typography>
              <Typography variant="body1">
                <strong>Email:</strong> {detailUser?.email}
              </Typography>
              <Typography variant="body1">
                <strong>Rol:</strong> {getRoleName(detailUser)}
              </Typography>
              <Typography variant="body1">
                <strong>Activo:</strong> {detailUser?.activo ? "Sí" : "No"}
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} style={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
});

export default UsersList;
