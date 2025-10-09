export interface Subject {
  id: string;
  name: string;
  code: string;
  professor: string;
  semester: number;
  enrolled: boolean;
  materialsCount: number;
  lastActivity: string;
  description: string;
}

export interface Material {
  id: string;
  subjectId: string;
  title: string;
  type: 'pdf' | 'document' | 'exam' | 'book' | 'presentation';
  uploadedBy: string;
  uploadDate: string;
  downloadCount: number;
  size: string;
  description?: string;
}

export const MOCK_SUBJECTS: Subject[] = [
  {
    id: 'inf-101',
    name: 'Introducción a la Programación',
    code: 'INF-101',
    professor: 'Dr. Carlos Mendoza',
    semester: 1,
    enrolled: true,
    materialsCount: 24,
    lastActivity: '2025-10-08',
    description: 'Fundamentos de programación y lógica computacional'
  },
  {
    id: 'inf-102',
    name: 'Elementos de Programación y Estructura de Datos',
    code: 'INF-102',
    professor: 'Dra. Ana Gutierrez',
    semester: 2,
    enrolled: true,
    materialsCount: 18,
    lastActivity: '2025-10-07',
    description: 'Estructuras de datos fundamentales y algoritmos'
  },
  {
    id: 'inf-201',
    name: 'Programación Funcional',
    code: 'INF-201',
    professor: 'Dr. Miguel Rojas',
    semester: 3,
    enrolled: true,
    materialsCount: 15,
    lastActivity: '2025-10-06',
    description: 'Paradigma de programación funcional y sus aplicaciones'
  },
  {
    id: 'mat-205',
    name: 'Teoría de Grafos',
    code: 'MAT-205',
    professor: 'Dr. Luis Vargas',
    semester: 4,
    enrolled: true,
    materialsCount: 12,
    lastActivity: '2025-10-05',
    description: 'Teoría matemática de grafos y sus aplicaciones en informática'
  }
];

export const MOCK_MATERIALS: Material[] = [
  // Introducción a la Programación
  {
    id: 'mat-001',
    subjectId: 'inf-101',
    title: 'Fundamentos de Algoritmos',
    type: 'pdf',
    uploadedBy: 'Juan Pérez',
    uploadDate: '2025-10-08',
    downloadCount: 45,
    size: '2.4 MB',
    description: 'Conceptos básicos de algoritmos y estructuras de control'
  },
  {
    id: 'mat-002',
    subjectId: 'inf-101',
    title: 'Primer Parcial 2024',
    type: 'exam',
    uploadedBy: 'María López',
    uploadDate: '2025-10-07',
    downloadCount: 78,
    size: '1.2 MB'
  },
  {
    id: 'mat-003',
    subjectId: 'inf-101',
    title: 'Ejercicios Resueltos - Variables y Tipos',
    type: 'document',
    uploadedBy: 'Carlos Silva',
    uploadDate: '2025-10-06',
    downloadCount: 32,
    size: '892 KB'
  },

  // Elementos de Programación
  {
    id: 'mat-004',
    subjectId: 'inf-102',
    title: 'Estructuras de Datos en C++',
    type: 'book',
    uploadedBy: 'Ana García',
    uploadDate: '2025-10-07',
    downloadCount: 65,
    size: '15.8 MB',
    description: 'Libro completo sobre estructuras de datos'
  },
  {
    id: 'mat-005',
    subjectId: 'inf-102',
    title: 'Implementación de Listas Enlazadas',
    type: 'presentation',
    uploadedBy: 'Roberto Mamani',
    uploadDate: '2025-10-06',
    downloadCount: 23,
    size: '3.1 MB'
  },

  // Programación Funcional
  {
    id: 'mat-006',
    subjectId: 'inf-201',
    title: 'Introducción a Haskell',
    type: 'pdf',
    uploadedBy: 'Elena Vargas',
    uploadDate: '2025-10-06',
    downloadCount: 41,
    size: '4.7 MB'
  },
  {
    id: 'mat-007',
    subjectId: 'inf-201',
    title: 'Examen Final 2023',
    type: 'exam',
    uploadedBy: 'Diego Morales',
    uploadDate: '2025-10-05',
    downloadCount: 56,
    size: '1.8 MB'
  },

  // Teoría de Grafos
  {
    id: 'mat-008',
    subjectId: 'mat-205',
    title: 'Algoritmos de Grafos',
    type: 'pdf',
    uploadedBy: 'Sofía Quispe',
    uploadDate: '2025-10-05',
    downloadCount: 29,
    size: '6.2 MB'
  },
  {
    id: 'mat-009',
    subjectId: 'mat-205',
    title: 'Ejercicios de Árboles',
    type: 'document',
    uploadedBy: 'Fernando Cruz',
    uploadDate: '2025-10-04',
    downloadCount: 18,
    size: '1.5 MB'
  }
];

// Función helper para obtener materiales de una materia
export const getMaterialsBySubject = (subjectId: string): Material[] => {
  return MOCK_MATERIALS.filter(material => material.subjectId === subjectId);
};

// Función helper para obtener materias inscritas
export const getEnrolledSubjects = (): Subject[] => {
  return MOCK_SUBJECTS.filter(subject => subject.enrolled);
};