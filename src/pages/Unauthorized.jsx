import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
    const navigate = useNavigate();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                textAlign: 'center',
                p: 3
            }}
        >
            <Typography variant="h4" gutterBottom>
                Acceso No Autorizado
            </Typography>
            <Typography variant="body1" gutterBottom>
                No tienes permisos para acceder a esta página.
            </Typography>
            <Button
                variant="contained"
                onClick={() => navigate('/login')}
                sx={{ 
                    mt: 2,
                    backgroundColor: '#39A900',
                    color: 'white',
                    '&:hover': {
                        backgroundColor: '#2d7f00'
                    }
                }}
            >
                Volver al Login
            </Button>
        </Box>
    );
};

export default Unauthorized; 