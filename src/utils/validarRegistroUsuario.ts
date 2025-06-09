// Funciones de validación para el registro de usuarios
export const validarRegistroUsuario = (usuario: any, userRole: string) => {
  const errores: Record<string, string> = {};

  // Solo administrador puede registrar
  if (userRole !== 'administrador') {
    errores.auth = 'Solo los administradores pueden registrar usuarios';
    return errores;
  }

  // Campos obligatorios generales
  if (!usuario.tipo) errores.tipo = 'El tipo de usuario es obligatorio';
  if (!usuario.nombre) errores.nombre = 'El nombre es obligatorio';
  if (!usuario.documento) {
    errores.documento = 'El documento es obligatorio';
  } else if (!/^\d+$/.test(usuario.documento)) {
    errores.documento = 'El documento debe contener solo numeros';
  }
  if (!usuario.telefono) {
    errores.telefono = 'El telefono es obligatorio';
  } else if (!/^\d{10}$/.test(usuario.telefono)) {
    errores.telefono = 'El telefono debe contener exactamente 10 digitos numericos';
  }
  if (!usuario.direccion) errores.direccion = 'La direccion es obligatoria';
  if (!usuario.email) {
    errores.email = 'El correo es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario.email)) {
    errores.email = 'El correo electronico no tiene un formato valido';
  }

  // Si no es cliente, validar password
  if (usuario.tipo !== 'cliente') {
    if (!usuario.password) {
      errores.password = 'La contrasena es obligatoria';
    } else {
      if (usuario.password.length < 8) {
        errores.password = 'La contrasena debe tener al menos 8 caracteres';
      } else if (!/[A-Z]/.test(usuario.password)) {
        errores.password = 'La contrasena debe incluir al menos una letra mayuscula';
      } else if (!/\d/.test(usuario.password)) {
        errores.password = 'La contrasena debe incluir al menos un numero';
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(usuario.password)) {
        errores.password = 'La contrasena debe incluir al menos un caracter especial';
      }
    }
  }

  // Si es cliente, validar tipo_cliente y razonSocial
  if (usuario.tipo === 'cliente') {
    if (!usuario.tipo_cliente) errores.tipo_cliente = 'El tipo de cliente es obligatorio';
    if (!usuario.razonSocial) errores.razonSocial = 'La razon social es obligatoria';
  }

  return errores;
};
