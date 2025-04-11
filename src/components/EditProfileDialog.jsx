// src/components/EditProfileDialog.jsx
import React, { useState, useContext, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Avatar, IconButton 
} from '@mui/material';
import { motion } from 'framer-motion';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import AuthContext from '../context/AuthContext';

const EditProfileDialog = ({ open, handleClose }) => {
  const { user, login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    fotoPerfil: '',
  });
  const [previewPhoto, setPreviewPhoto] = useState('');

  // Precarga los datos actuales del usuario al abrir el diálogo
  useEffect(() => {
    if (user) {
      setFormData({
        nombre: user.nombre || '',
        email: user.email || '',
        telefono: user.telefono || '',
        direccion: user.direccion || '',
        fotoPerfil: user.fotoPerfil || '',
      });
      setPreviewPhoto(user.fotoPerfil || '');
    }
  }, [user, open]);

  // Manejo de cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejo de carga de nueva foto de perfil
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setPreviewPhoto(previewURL);
      // Aquí se enviaría el archivo al backend en un escenario real
      setFormData(prev => ({ ...prev, fotoPerfil: previewURL }));
    }
  };

  // Simula la actualización del perfil
  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedUser = { ...user, ...formData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    login(updatedUser);
    alert("¡Perfil actualizado (simulación)!");
    handleClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #f0f0f0, #ffffff)',
          borderRadius: 3,
          p: 0,
          overflow: 'hidden'
        },
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', p: 2 }}>
        Editar Perfil
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ backgroundColor: '#e3f2fd', p: 2, textAlign: 'center', position: 'relative' }}>
            <motion.div layoutId="profile-avatar">
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                {previewPhoto ? (
                  <Avatar
                    src={previewPhoto}
                    sx={{
                      width: { xs: 100, sm: 120, md: 140 },
                      height: { xs: 100, sm: 120, md: 140 },
                      mb: 1,
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: { xs: 100, sm: 120, md: 140 },
                      height: { xs: 100, sm: 120, md: 140 },
                      mb: 1,
                    }}
                  >
                    {formData.nombre ? formData.nombre.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                )}
                <IconButton
                  component="label"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: 'white',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' },
                  }}
                >
                  <PhotoCamera fontSize="small" />
                  <input hidden accept="image/*" type="file" onChange={handlePhotoChange} />
                </IconButton>
              </Box>
            </motion.div>
          </Box>
          {/* Separador tipo ola */}
          <Box sx={{ width: '100%', overflow: 'hidden', lineHeight: 0 }}>
            <svg
              viewBox="0 0 500 80"
              preserveAspectRatio="none"
              style={{ display: 'block', width: '100%', height: '40px' }}
            >
              <path
                d="M0,30 C150,80 350,0 500,30 L500,80 L0,80 Z"
                style={{ fill: '#e3f2fd' }}
              />
            </svg>
          </Box>
          <Box sx={{ p: 3, backgroundColor: '#ffffff' }}>
            <TextField
              name="nombre"
              label="Nombre"
              value={formData.nombre}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              name="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              sx={{ mb: 2 }}
            />
            <TextField
              name="telefono"
              label="Teléfono"
              value={formData.telefono}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              name="direccion"
              label="Dirección"
              value={formData.direccion}
              onChange={handleChange}
              fullWidth
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', p: 2, gap: 2 }}>
          <Button 
            onClick={handleClose} 
            variant="outlined" 
            sx={{ borderColor: '#1565C0', color: '#1565C0' }}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            sx={{ backgroundColor: '#1565C0', '&:hover': { backgroundColor: '#00324D' } }}
          >
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditProfileDialog;
