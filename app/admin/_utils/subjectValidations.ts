// Función para normalizar texto (quitar acentos y convertir a minúsculas)
export const normalizeText = (text: string) => {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};

// Validar campos del formulario
export const validateSubjectFields = (formData: {
  nombre: string;
  descripcion: string;
  semestre: string;
}) => {
  const errors = {
    nombre: '',
    descripcion: '',
    semestre: ''
  };

  // Validar nombre (permite letras, números, espacios, acentos y caracteres comunes)
  const nombreRegex = /^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑüÜ,.;:()\-]+$/;
  if (!formData.nombre.trim()) {
    errors.nombre = 'El nombre es obligatorio';
  } else if (formData.nombre.length > 30) {
    errors.nombre = 'El nombre no puede tener más de 30 caracteres';
  } else if (!nombreRegex.test(formData.nombre)) {
    errors.nombre = 'El nombre contiene caracteres no válidos';
  }

  // Validar descripción
  if (!formData.descripcion.trim()) {
    errors.descripcion = 'La descripción es obligatoria';
  }

  // Validar semestre (número entre 1-12)
  const semestre = parseInt(formData.semestre);
  if (!formData.semestre) {
    errors.semestre = 'El semestre es obligatorio';
  } else if (isNaN(semestre) || semestre < 1 || semestre > 10) {
    errors.semestre = 'El semestre debe ser un número entre 1 y 10';
  }

  const isValid = !Object.values(errors).some(error => error !== '');
  return { isValid, errors };
};

export default { normalizeText, validateSubjectFields };