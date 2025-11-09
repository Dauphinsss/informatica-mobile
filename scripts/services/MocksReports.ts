import { collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase";

const generateUID = (): string => {
  return Math.random().toString(36).substr(2, 14);
};

export const crearDatosMock = async () => {
  try {
    // Crear usuario mock
    const usuarioRef = await addDoc(collection(db, "usuarios"), {
      correo: "juan@example.com",
      creadoEn: new Date(),
      estado: "activo",
      foto: "",
      nombre: "Juan Pérez",
      rol: "user",
      uid: generateUID(),
      ultimoAcceso: new Date(),
    });

    const MateriaRed = await addDoc(collection(db, "materias"), {
        uid: generateUID(),
        nombre: "Matemáticas",
        descripcion: "Materia de matemáticas para el grado 10",
        estado: "activo",
        creadoEn: new Date(),
    });

    // Crear publicación mock
    const publicacionRef = await addDoc(collection(db, "publicaciones"), {
      uid: generateUID(),
      autorUid: usuarioRef.id,
      subjectUid: MateriaRed.id,
      titulo: "Publicación de prueba",
      descripcion: "Este es un contenido de ejemplo para probar reportes.",      
      fechaCreacion: new Date(),
      ultimaEdicion: new Date(),
      vistas: 0,
      totalValoraciones: 0,
      totalComentarios: 0,
      estado: "activo",
    });

    const reporteRef = await addDoc(collection(db, "reportes"), {
      uid: generateUID(),
      autorUid: usuarioRef.id,
      publicacionUid: publicacionRef.id,
      tipo: "Spam",
      descripcion: "Texto ofensivo en el contenido.",
      fechaCreacion: new Date(),
      estado: "pendiente",
      revisadoPor: null,
      fechaRevision: null,
      accionTomada: null,
    });

    const InscripcionRed = await addDoc(collection(db, "inscripciones"), {
        uid: generateUID(),
        usuarioUid: usuarioRef.id,
        materiaUid: MateriaRed.id,
        fechaInscripcion: new Date(),
        estado: "activo",
    });

    const EstadisticasUsuarioRef = await addDoc(collection(db, "estadisticasUsuario"), {
        uid: generateUID(),
        usuarioUid: usuarioRef.id,
        publicacionesCreadas: 1,
        publicacionesReportadas: 1,
        reportesRecibidos: 1,
        archivosDescargados: 0,
        comentariosRealizados: 0,
        valoracionesRealizadas: 0,
        inscripcionesActivas: 1,
        strikes: 0,
        ultimaActividad: new Date(),
    });

  } catch (error) {
    console.error("❌ Error creando datos mock:", error);
  }
};