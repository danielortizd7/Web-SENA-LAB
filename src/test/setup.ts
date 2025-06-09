import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Forzar asignación para evitar error de tipos en TypeScript
global.TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder;

beforeEach(() => {
  // Configuración antes de cada prueba
});

afterEach(() => {
  cleanup();
  // Limpieza después de cada prueba
});
