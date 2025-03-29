import React, { forwardRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Box, Typography, Button } from '@mui/material';

interface FirmasDigitalesProps {
  onLimpiarFirma: (tipo: 'laboratorista' | 'cliente') => void;
  firmaLaboratoristaRef: React.RefObject<SignatureCanvas | null>;
  firmaClienteRef: React.RefObject<SignatureCanvas | null>;
}

const FirmasDigitales = forwardRef<HTMLDivElement, FirmasDigitalesProps>(({
  onLimpiarFirma,
  firmaLaboratoristaRef,
  firmaClienteRef
}, ref) => {
  return (
    <Box ref={ref} sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Firmas Digitales
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Firma del Laboratorista
        </Typography>
        <Box sx={{ border: '1px solid #ccc', mb: 1 }}>
          <SignatureCanvas
            ref={firmaLaboratoristaRef as any}
            canvasProps={{
              width: 500,
              height: 200,
              className: 'firma-canvas'
            }}
          />
        </Box>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => onLimpiarFirma('laboratorista')}
          sx={{ mr: 1 }}
        >
          Limpiar
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Firma del Cliente
        </Typography>
        <Box sx={{ border: '1px solid #ccc', mb: 1 }}>
          <SignatureCanvas
            ref={firmaClienteRef as any}
            canvasProps={{
              width: 500,
              height: 200,
              className: 'firma-canvas'
            }}
          />
        </Box>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => onLimpiarFirma('cliente')}
          sx={{ mr: 1 }}
        >
          Limpiar
        </Button>
      </Box>
    </Box>
  );
});

FirmasDigitales.displayName = 'FirmasDigitales';

export default FirmasDigitales; 