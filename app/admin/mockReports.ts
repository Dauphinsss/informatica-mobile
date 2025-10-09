type ReportStatus = 'pendiente' | 'completado';

interface Report {
  id: string;
  publicacionId: string;
  titulo: string;
  autor: string;
  totalReportes: number;
  ultimoMotivo: string;
  ultimoReportadoPor: string;
  ultimaFecha: string;
  contenido: string;
  estado: ReportStatus;
  reportadores: Array<{
    usuario: string;
    motivo: string;
    fecha: string;
  }>;
  strikesAutor: number;
  // Campos opcionales para mock de decisiones tomadas por admin
  decision?: string;
  fechaDecision?: string;
}

export const reportesEjemplo: Report[] = [
  {
    id: '1',
    publicacionId: 'pub-001',
    titulo: 'JavaScript Avanzado',
    autor: 'Joy Valvez',
    totalReportes: 3,
    ultimoMotivo: 'Spam',
    ultimoReportadoPor: 'María García',
    ultimaFecha: '12/10/25',
    contenido: 'Contenido de la publicación sobre JavaScript avanzado con ejemplos prácticos y ejercicios.',
    estado: 'pendiente',
    reportadores: [
      { usuario: 'María García', motivo: 'Spam', fecha: '12/10/25' },
      { usuario: 'Carlos López', motivo: 'Spam', fecha: '11/10/25' },
      { usuario: 'Ana Martínez', motivo: 'Contenido inapropiado', fecha: '10/10/25' },
    ],
    strikesAutor: 2,
  },
  {
    id: '2',
    publicacionId: 'pub-002',
    titulo: 'React Native Básico',
    autor: 'Joy Valvez',
    totalReportes: 1,
    ultimoMotivo: 'Contenido inapropiado',
    ultimoReportadoPor: 'Pedro Ruiz',
    ultimaFecha: '12/10/25',
    contenido: 'Tutorial completo sobre React Native para principiantes.',
    estado: 'pendiente',
    reportadores: [
      { usuario: 'Pedro Ruiz', motivo: 'Contenido inapropiado', fecha: '12/10/25' },
    ],
    strikesAutor: 1,
  },
  {
    id: '3',
    publicacionId: 'pub-003',
    titulo: 'Python para principiantes',
    autor: 'Luis Torres',
    totalReportes: 5,
    ultimoMotivo: 'Spam',
    ultimoReportadoPor: 'Elena Rojas',
    ultimaFecha: '11/10/25',
    contenido: 'Curso completo de Python desde cero con proyectos prácticos.',
    estado: 'completado',
    // Decisión tomada por el administrador para este reporte (mock)
    decision: 'Publicación eliminada y autor sancionado (strike aplicado)',
    fechaDecision: '11/10/25',
    reportadores: [
      { usuario: 'Elena Rojas', motivo: 'Spam', fecha: '11/10/25' },
      { usuario: 'Diego Soto', motivo: 'Spam', fecha: '11/10/25' },
      { usuario: 'Carmen Vega', motivo: 'Spam', fecha: '10/10/25' },
      { usuario: 'Roberto Kim', motivo: 'Spam', fecha: '10/10/25' },
      { usuario: 'Sofia Luna', motivo: 'Contenido inapropiado', fecha: '09/10/25' },
    ],
    strikesAutor: 2,
  },
  {
    id: '4',
    publicacionId: 'pub-004',
    titulo: 'Node.js Backend',
    autor: 'María González',
    totalReportes: 2,
    ultimoMotivo: 'Información errónea',
    ultimoReportadoPor: 'Juan Pérez',
    ultimaFecha: '11/10/25',
    contenido: 'Guía para crear APIs RESTful con Node.js y Express.',
    estado: 'pendiente',
    reportadores: [
      { usuario: 'Juan Pérez', motivo: 'Información errónea', fecha: '11/10/25' },
      { usuario: 'Laura Díaz', motivo: 'Spam', fecha: '10/10/25' },
    ],
    strikesAutor: 0,
  },
];

export default reportesEjemplo;