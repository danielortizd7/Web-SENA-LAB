import { validarRegistroUsuario } from '../../utils/validarRegistroUsuario';


//cliente 
const usuarioClienteValido = {
  tipo: 'cliente',
  nombre: 'Cliente',
  documento: '1234567890',
  telefono: '1234567890',
  direccion: 'Calle',
  email: 'cliente@mail.com',
  tipo_cliente: 'empresas',
  razonSocial: 'Empresa S.A.'
};
// laboratorista 
const usuarioLaboratoristaValido = {
  tipo: 'laboratorista',
  nombre: 'Lab',
  documento: '1234567890',
  telefono: '1234567890',
  direccion: 'Calle',
  email: 'lab@mail.com',
  password: 'Abcdefg1!'
};
// administrador 
const usuarioAdministradorValido = {
  tipo: 'administrador',
  nombre: 'Admin',
  documento: '1234567890',
  telefono: '1234567890',
  direccion: 'Calle',
  email: 'admin@mail.com',
  password: 'Admin123!'
};
const usuarioIncompleto = {
  tipo: 'cliente'
};

describe('Validación de Registro de Usuario', () => {
  it('no permite registrar si no es administrador', () => {
    // Puedes modificar usuarioClienteValido para probar otros roles
    const errores = validarRegistroUsuario(usuarioClienteValido, 'laboratorista');
    expect(errores.auth).toBe('Solo los administradores pueden registrar usuarios');
  });

  it('valida todos los campos obligatorios para cliente', () => {
    // Puedes modificar usuarioIncompleto para probar otros casos
    const errores = validarRegistroUsuario(usuarioIncompleto, 'administrador');
    expect(errores.nombre).toBe('El nombre es obligatorio');
    expect(errores.documento).toBe('El documento es obligatorio');
    expect(errores.telefono).toBe('El telefono es obligatorio');
    expect(errores.direccion).toBe('La direccion es obligatoria');
    expect(errores.email).toBe('El correo es obligatorio');
    expect(errores.tipo_cliente).toBe('El tipo de cliente es obligatorio');
    expect(errores.razonSocial).toBe('La razon social es obligatoria');
  });

  it('valida formato de correo', () => {
    // Puedes modificar usuarioClienteValido para probar otros correos
    const usuario = { ...usuarioClienteValido, email: 'correo-malo' };
    const errores = validarRegistroUsuario(usuario, 'administrador');
    expect(errores.email).toBe('El correo electronico no tiene un formato valido');
  });

  it('valida password para laboratorista', () => {
    // Puedes modificar usuarioLaboratoristaValido para probar contraseñas
    const usuario = { ...usuarioLaboratoristaValido, password: 'abc' };
    const errores = validarRegistroUsuario(usuario, 'administrador');
    expect(errores.password).toBe('La contrasena debe tener al menos 8 caracteres');
  });

  it('valida password segura para laboratorista', () => {
    // Puedes modificar usuarioLaboratoristaValido para probar contraseñas
    const usuario1 = { ...usuarioLaboratoristaValido, password: 'abcdefgh' };
    expect(validarRegistroUsuario(usuario1, 'administrador').password).toBe('La contrasena debe incluir al menos una letra mayuscula');
    const usuario2 = { ...usuarioLaboratoristaValido, password: 'Abcdefgh' };
    expect(validarRegistroUsuario(usuario2, 'administrador').password).toBe('La contrasena debe incluir al menos un numero');
    const usuario3 = { ...usuarioLaboratoristaValido, password: 'Abcdefg1' };
    expect(validarRegistroUsuario(usuario3, 'administrador').password).toBe('La contrasena debe incluir al menos un caracter especial');
  });

  it('permite registro correcto de cliente', () => {
    // Puedes modificar usuarioClienteValido para probar otros datos válidos
    const errores = validarRegistroUsuario(usuarioClienteValido, 'administrador');
    expect(Object.keys(errores).length).toBe(0);
  });

  it('permite registro correcto de laboratorista', () => {
    // Puedes modificar usuarioLaboratoristaValido para probar otros datos válidos
    const errores = validarRegistroUsuario(usuarioLaboratoristaValido, 'administrador');
    expect(Object.keys(errores).length).toBe(0);
  });

  it('permite registro correcto de administrador', () => {
    // Puedes modificar usuarioAdministradorValido para probar otros datos válidos
    const errores = validarRegistroUsuario(usuarioAdministradorValido, 'administrador');
    expect(Object.keys(errores).length).toBe(0);
  });
});

// TESTS POR TIPO DE USUARIO Y CAMPOS OBLIGATORIOS

describe('Validacion de campos obligatorios por tipo de usuario', () => {
  it('cliente: falta cada campo obligatorio', () => {
    const campos = [
      { campo: 'nombre', valor: undefined, error: 'El nombre es obligatorio' },
      { campo: 'documento', valor: undefined, error: 'El documento es obligatorio' },
      { campo: 'telefono', valor: undefined, error: 'El telefono es obligatorio' },
      { campo: 'direccion', valor: undefined, error: 'La direccion es obligatoria' },
      { campo: 'email', valor: undefined, error: 'El correo es obligatorio' },
      { campo: 'tipo_cliente', valor: undefined, error: 'El tipo de cliente es obligatorio' },
      { campo: 'razonSocial', valor: undefined, error: 'La razon social es obligatoria' }
    ];
    for (const { campo, valor, error } of campos) {
      const usuario = { ...usuarioClienteValido, [campo]: valor };
      const errores = validarRegistroUsuario(usuario, 'administrador');
      expect(errores[campo]).toBe(error);
    }
  });

  it('laboratorista: falta cada campo obligatorio', () => {
    const campos = [
      { campo: 'nombre', valor: undefined, error: 'El nombre es obligatorio' },
      { campo: 'documento', valor: undefined, error: 'El documento es obligatorio' },
      { campo: 'telefono', valor: undefined, error: 'El telefono es obligatorio' },
      { campo: 'direccion', valor: undefined, error: 'La direccion es obligatoria' },
      { campo: 'email', valor: undefined, error: 'El correo es obligatorio' },
      { campo: 'password', valor: undefined, error: 'La contrasena es obligatoria' }
    ];
    for (const { campo, valor, error } of campos) {
      const usuario = { ...usuarioLaboratoristaValido, [campo]: valor };
      const errores = validarRegistroUsuario(usuario, 'administrador');
      expect(errores[campo]).toBe(error);
    }
  });

  it('administrador: falta cada campo obligatorio', () => {
    const campos = [
      { campo: 'nombre', valor: undefined, error: 'El nombre es obligatorio' },
      { campo: 'documento', valor: undefined, error: 'El documento es obligatorio' },
      { campo: 'telefono', valor: undefined, error: 'El telefono es obligatorio' },
      { campo: 'direccion', valor: undefined, error: 'La direccion es obligatoria' },
      { campo: 'email', valor: undefined, error: 'El correo es obligatorio' },
      { campo: 'password', valor: undefined, error: 'La contrasena es obligatoria' }
    ];
    for (const { campo, valor, error } of campos) {
      const usuario = { ...usuarioAdministradorValido, [campo]: valor };
      const errores = validarRegistroUsuario(usuario, 'administrador');
      expect(errores[campo]).toBe(error);
    }
  });
});

// TESTS DE CAMPOS OBLIGATORIOS Y ERRORES POR CAMBIO EN CADA TIPO DE USUARIO

describe('Validación de campos obligatorios y errores por tipo de usuario', () => {
  it('cliente: error si falta un campo obligatorio', () => {
    const usuario = { ...usuarioClienteValido, nombre: '' };
    const errores = validarRegistroUsuario(usuario, 'administrador');
    expect(errores.nombre).toBe('El nombre es obligatorio');
  });
  it('laboratorista: error si falta un campo obligatorio', () => {
    const usuario = { ...usuarioLaboratoristaValido, email: '' };
    const errores = validarRegistroUsuario(usuario, 'administrador');
    expect(errores.email).toBe('El correo es obligatorio');
  });
  it('administrador: error si falta un campo obligatorio', () => {
    const usuario = { ...usuarioAdministradorValido, password: '' };
    const errores = validarRegistroUsuario(usuario, 'administrador');
    expect(errores.password).toBe('La contrasena es obligatoria');
  });
  it('cliente: error si documento no es numerico', () => {
    const usuario = { ...usuarioClienteValido, documento: 'abc' };
    const errores = validarRegistroUsuario(usuario, 'administrador');
    expect(errores.documento).toBe('El documento debe contener solo numeros');
  });
  it('administrador: error si email es invalido', () => {
    const usuario = { ...usuarioAdministradorValido, email: 'correo-malo' };
    const errores = validarRegistroUsuario(usuario, 'administrador');
    expect(errores.email).toBe('El correo electronico no tiene un formato valido');
  });
});
