import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Box, Button, Typography, Alert } from '@mui/material';

interface SignaturePadProps {
  onSave: (firma: string) => void;
  titulo: string;
  disabled?: boolean;
  firma?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  titulo,
  disabled = false,
  firma = ''
}) => {
  const padRef = useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(!firma);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // Si hay una firma guardada, mostrarla en el pad
    if (firma && padRef.current) {
      const ctx = padRef.current.getCanvas().getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          setIsEmpty(false);
          setHasChanges(false);
        };
        img.src = firma;
      }
    }
  }, [firma]);

  const clear = () => {
    if (padRef.current) {
      padRef.current.clear();
      setIsEmpty(true);
      setHasChanges(false);
    }
  };

  const save = () => {
    if (padRef.current && !padRef.current.isEmpty()) {
      try {
        const firma = padRef.current.toDataURL('image/png');
        onSave(firma);
        setIsEmpty(false);
        setHasChanges(false);
      } catch (error) {
        console.error('Error al guardar la firma:', error);
      }
    }
  };

  const handleBegin = () => {
    setIsEmpty(false);
    setHasChanges(true);
  };

  const handleEnd = () => {
    if (padRef.current) {
      const isEmpty = padRef.current.isEmpty();
      setIsEmpty(isEmpty);
      if (!isEmpty) {
        setHasChanges(true);
      }
    }
  };

  return (
    <Box sx={{ 
      border: '1px solid #ccc', 
      p: 2, 
      borderRadius: 1,
      backgroundColor: disabled ? '#f5f5f5' : '#fff'
    }}>
      <Typography variant="subtitle1" gutterBottom color="primary">
        {titulo}
      </Typography>

      {disabled ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No tienes permisos para firmar en esta sección
        </Alert>
      ) : (
        <>
          <Box sx={{
            border: '1px solid #eee',
            mb: 2,
            position: 'relative',
            '& canvas': {
              width: '100% !important',
              height: '200px !important',
              border: '1px solid #ddd',
              borderRadius: '4px',
              backgroundColor: '#fff'
            }
          }}>
            <SignatureCanvas
              ref={padRef}
              canvasProps={{
                width: 500,
                height: 200,
                className: 'signature-canvas'
              }}
              backgroundColor="#fff"
              onBegin={handleBegin}
              onEnd={handleEnd}
            />
            {isEmpty && !firma && (
              <Typography
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#999',
                  pointerEvents: 'none'
                }}
              >
                Firme aquí
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={clear}
              size="small"
              disabled={disabled || (!hasChanges && !firma)}
            >
              Limpiar
            </Button>
            <Button
              variant="contained"
              onClick={save}
              size="small"
              disabled={disabled || isEmpty || !hasChanges}
            >
              Guardar Firma
            </Button>
          </Box>

          {!isEmpty && !hasChanges && firma && (
            <Alert severity="success" sx={{ mt: 1 }}>
              ✓ Firma guardada correctamente
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default SignaturePad; 