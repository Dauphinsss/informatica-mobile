import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { Publicacion, ArchivoPublicacion } from "../types/Publication.type";

/**
 * Crea una nueva publicación
 */
export const crearPublicacion = async (
  materiaId: string,
  autorUid: string,
  autorNombre: string,
  titulo: string,
  descripcion: string
): Promise<string> => {
  try {
    const publicacionData = {
      materiaId,
      autorUid,
      autorNombre,
      titulo,
      descripcion,
      fechaPublicacion: Timestamp.now(),
      vistas: 0,
      totalCalificaciones: 0,
      totalComentarios: 0,
      estado: "activo",
    };

    const docRef = await addDoc(collection(db, "publicaciones"), publicacionData);
    return docRef.id;
  } catch (error) {
    console.error("Error al crear publicación:", error);
    throw error;
  }
};

/**
 * Obtiene todas las publicaciones de una materia
 */
export const obtenerPublicacionesPorMateria = async (
  materiaId: string
): Promise<Publicacion[]> => {
  const publicaciones: Publicacion[] = [];
  try {
    const publicacionesSnap = await getDocs(
      query(
        collection(db, "publicaciones"),
        where("materiaId", "==", materiaId),
        where("estado", "==", "activo"),
        orderBy("fechaPublicacion", "desc")
      )
    );

    publicacionesSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      publicaciones.push({
        id: docSnap.id,
        ...data,
        fechaPublicacion: data.fechaPublicacion.toDate(),
      } as Publicacion);
    });
  } catch (error) {
    console.error("Error al obtener publicaciones:", error);
  }
  return publicaciones;
};

/**
 * Obtiene una publicación por ID
 */
export const obtenerPublicacionPorId = async (
  publicacionId: string
): Promise<Publicacion | null> => {
  try {
    const publicacionDoc = await getDoc(doc(db, "publicaciones", publicacionId));
    if (publicacionDoc.exists()) {
      const data = publicacionDoc.data();
      return {
        id: publicacionDoc.id,
        ...data,
        fechaPublicacion: data.fechaPublicacion.toDate(),
      } as Publicacion;
    }
  } catch (error) {
    console.error("Error al obtener publicación:", error);
  }
  return null;
};

/**
 * Obtiene los archivos de una publicación con información del tipo
 */
export const obtenerArchivosConTipo = async (
  publicacionId: string
): Promise<ArchivoPublicacion[]> => {
  const archivos: ArchivoPublicacion[] = [];
  try {
    // Obtener archivos
    const archivosSnap = await getDocs(
      query(
        collection(db, "archivos"),
        where("publicacionId", "==", publicacionId),
        where("activo", "==", true)
      )
    );

    // Obtener tipos de archivo únicos
    const tiposIds = new Set<string>();
    archivosSnap.docs.forEach((doc) => {
      tiposIds.add(doc.data().tipoArchivoId);
    });

    // Cargar tipos de archivo
    const tiposCache = new Map<string, any>();
    await Promise.all(
      Array.from(tiposIds).map(async (tipoId) => {
        const tipoDoc = await getDoc(doc(db, "tiposArchivo", tipoId));
        if (tipoDoc.exists()) {
          tiposCache.set(tipoId, tipoDoc.data());
        }
      })
    );

    // Construir array de archivos con información del tipo
    archivosSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const tipoInfo = tiposCache.get(data.tipoArchivoId);
      
      archivos.push({
        id: docSnap.id,
        ...data,
        fechaSubida: data.fechaSubida.toDate(),
        tipoNombre: tipoInfo?.nombre || "Archivo",
        extension: tipoInfo?.extensiones?.[0] || "",
      } as ArchivoPublicacion);
    });
  } catch (error) {
    console.error("Error al obtener archivos:", error);
  }
  return archivos;
};

/**
 * Incrementa el contador de vistas de una publicación
 */
export const incrementarVistas = async (publicacionId: string): Promise<void> => {
  try {
    const publicacionRef = doc(db, "publicaciones", publicacionId);
    const publicacionSnap = await getDoc(publicacionRef);
    
    if (publicacionSnap.exists()) {
      const vistaActual = publicacionSnap.data().vistas || 0;
      await updateDoc(publicacionRef, {
        vistas: vistaActual + 1,
      });
    }
  } catch (error) {
    console.error("Error al incrementar vistas:", error);
  }
};

/**
 * Elimina una publicación (eliminación lógica)
 */
export const eliminarPublicacion = async (publicacionId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, "publicaciones", publicacionId), {
      estado: "eliminado",
    });
  } catch (error) {
    console.error("Error al eliminar publicación:", error);
    throw error;
  }
};