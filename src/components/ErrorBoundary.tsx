import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            ¡Algo salió mal!
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Ocurrió un error en la aplicación. Por favor, intenta de nuevo o contacta al soporte.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.reload()}
            sx={{ bgcolor: '#39A900', '&:hover': { bgcolor: '#2d8600' } }}
          >
            Recargar Página
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;