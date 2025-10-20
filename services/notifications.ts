import { db } from "@/firebase";
import {
  addDoc,
  collection,
  doc,
  documentId,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { enviarNotificacionLocal } from "./pushNotifications";

export interface NotificacionBase {
  id: string;
  titulo: string;
  descripcion: string;
  icono: string;
  tipo: "info" | "exito" | "advertencia" | "error";
  creadoEn: any;
  metadata?: {
    materiaId?: string;
    materiaNombre?: string;
    accion?: string;
  };
}

export interface NotificacionUsuario {
  notificacionId: string;
  userId: string;
  leida: boolean;
  creadoEn: any;
}

export interface NotificacionCompleta extends NotificacionBase {
  leida: boolean;
}

export const crearNotificacionMasiva = async (
  userIds: string[],
  titulo: string,
  descripcion: string,
  tipo: "info" | "exito" | "advertencia" | "error" = "info",
  icono: string = "bell",
  metadata?: any
) => {
  try {
    const notificacionRef = await addDoc(collection(db, "notificaciones"), {
      titulo,
      descripcion,
      icono,
      tipo,
      creadoEn: serverTimestamp(),
      metadata: metadata || {},
    });

    const batch = writeBatch(db);
    const timestamp = serverTimestamp();

    userIds.forEach((userId) => {
      const refId = `${userId}_${notificacionRef.id}`;
      const notifUsuarioRef = doc(db, "notificacionesUsuario", refId);

      batch.set(notifUsuarioRef, {
        notificacionId: notificacionRef.id,
        userId,
        leida: false,
        creadoEn: timestamp,
      });
    });

    await batch.commit();

    return notificacionRef.id;
  } catch (error) {
    throw error;
  }
};

export const crearNotificacion = async (
  userId: string,
  titulo: string,
  descripcion: string,
  tipo: "info" | "exito" | "advertencia" | "error" = "info",
  icono: string = "bell",
  metadata?: any,
  enviarPush: boolean = true
) => {
  const notifId = await crearNotificacionMasiva(
    [userId],
    titulo,
    descripcion,
    tipo,
    icono,
    metadata
  );

  if (enviarPush) {
    try {
      await enviarNotificacionLocal(titulo, descripcion, metadata);
    } catch (error) {
      console.error("Error al enviar push:", error);
    }
  }

  return notifId;
};

export const escucharNotificaciones = (
  userId: string,
  onSuccess: (notificaciones: NotificacionCompleta[]) => void,
  onError?: (error: Error) => void
) => {
  try {
    const notifUsuarioRef = collection(db, "notificacionesUsuario");

    // ✅ Optimizado: Solo where() + limit para reducir datos
    const q = query(
      notifUsuarioRef, 
      where("userId", "==", userId),
      limit(100) // Máximo 100 notificaciones recientes
    );

    return onSnapshot(
      q,
      async (snapshot) => {
        try {
          // Obtener todas las referencias de notificaciones del usuario
          // ✅ Filtrar las eliminadas en el cliente
          const notificacionesUsuario = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter(
              (notif: any) => !notif.eliminada
            ) as (NotificacionUsuario & { id: string })[];

          if (notificacionesUsuario.length === 0) {
            onSuccess([]);
            return;
          }

          // ✅ OPTIMIZACIÓN: Obtener todos los IDs únicos de notificaciones
          const notifIds = [
            ...new Set(
              notificacionesUsuario.map((n) => n.notificacionId)
            ),
          ];

          // ✅ Hacer una sola query batch con documentId() (máx 10 por batch)
          const notificacionesCompletas: NotificacionCompleta[] = [];
          const batchSize = 10;

          for (let i = 0; i < notifIds.length; i += batchSize) {
            const batch = notifIds.slice(i, i + batchSize);
            const notifQuery = query(
              collection(db, "notificaciones"),
              where(documentId(), "in", batch)
            );
            
            const notifSnapshot = await getDocs(notifQuery);
            const notifMap = new Map();
            
            notifSnapshot.docs.forEach((doc) => {
              notifMap.set(doc.id, doc.data());
            });

            // Combinar datos
            notificacionesUsuario.forEach((notifUsuario) => {
              if (batch.includes(notifUsuario.notificacionId)) {
                const notifData = notifMap.get(notifUsuario.notificacionId);
                
                if (notifData) {
                  notificacionesCompletas.push({
                    id: notifUsuario.id,
                    ...notifData,
                    leida: notifUsuario.leida,
                    creadoEn: notifUsuario.creadoEn,
                  } as NotificacionCompleta);
                }
              }
            });
          }

          // ✅ Ordenar en el cliente por fecha (más reciente primero)
          notificacionesCompletas.sort((a, b) => {
            const timeA = a.creadoEn?.toMillis ? a.creadoEn.toMillis() : 0;
            const timeB = b.creadoEn?.toMillis ? b.creadoEn.toMillis() : 0;
            return timeB - timeA;
          });

          onSuccess(notificacionesCompletas);
        } catch (err) {
          console.error("Error al procesar notificaciones:", err);
          if (onError) onError(err as Error);
        }
      },
      (error) => {
        console.error("Error en listener:", error);
        if (onError) onError(error);
      }
    );
  } catch (error) {
    console.error("Error al configurar listener:", error);
    if (onError) onError(error as Error);
    return () => {};
  }
};

/**
 * Marcar una notificación como leída
 */
export const marcarComoLeida = async (notificacionUsuarioId: string) => {
  try {
    const notifUsuarioRef = doc(
      db,
      "notificacionesUsuario",
      notificacionUsuarioId
    );
    await updateDoc(notifUsuarioRef, {
      leida: true,
    });
  } catch (error) {
    console.error("Error al marcar como leída:", error);
    throw error;
  }
};

/**
 * Eliminar la relación usuario-notificación (no elimina la notificación original)
 */
export const eliminarNotificacionUsuario = async (
  notificacionUsuarioId: string
) => {
  try {
    const notifUsuarioRef = doc(
      db,
      "notificacionesUsuario",
      notificacionUsuarioId
    );
    await updateDoc(notifUsuarioRef, {
      eliminada: true,
    });
  } catch (error) {
    console.error("❌ Error al eliminar notificación:", error);
    throw error;
  }
};

/**
 * Obtener contador de notificaciones no leídas
 */
export const obtenerContadorNoLeidas = (
  userId: string,
  onUpdate: (count: number) => void
) => {
  const notifUsuarioRef = collection(db, "notificacionesUsuario");
  // ✅ Optimizado: Solo where() + limit para evitar cargar todas
  const q = query(
    notifUsuarioRef, 
    where("userId", "==", userId),
    limit(100) // Suficiente para contador
  );

  return onSnapshot(q, (snapshot) => {
    // Filtrar no leídas y no eliminadas en el cliente
    const noLeidas = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return data.leida === false && !data.eliminada;
    });
    onUpdate(noLeidas.length);
  });
};

/**
 * Notificar a todos los usuarios inscritos en una materia
 */
export const notificarUsuariosMateria = async (
  materiaId: string,
  materiaNombre: string,
  titulo: string,
  descripcion: string,
  tipo: "info" | "exito" | "advertencia" | "error" = "info",
  icono: string = "school"
) => {
  try {
    // Obtener usuarios inscritos en la materia
    const inscripcionesRef = collection(db, "inscripciones");
    const q = query(inscripcionesRef, where("materiaId", "==", materiaId));
    const snapshot = await getDocs(q);

    const userIds = snapshot.docs.map((doc) => doc.data().userId);

    if (userIds.length === 0) {
      console.log("No hay usuarios inscritos en esta materia");
      return;
    }

    // Crear notificación masiva
    await crearNotificacionMasiva(userIds, titulo, descripcion, tipo, icono, {
      materiaId,
      materiaNombre,
      accion: "notificacion_materia",
    });

    // Enviar notificación push local a cada usuario
    try {
      await enviarNotificacionLocal(titulo, descripcion, {
        tipo: "materia",
        materiaId,
        materiaNombre,
        accion: "ver_materia",
      });
    } catch (error) {
      console.error("Error al enviar push:", error);
    }
  } catch (error) {
    console.error("Error al notificar usuarios de materia:", error);
    throw error;
  }
};

/**
 * Notificar cuando se crea una nueva materia (para todos los usuarios)
 */
export const notificarCreacionMateria = async (
  materiaId: string,
  materiaNombre: string,
  materiaDescripcion: string
) => {
  try {
    // Obtener todos los usuarios (sin filtrar por estado para debug)
    const usuariosRef = collection(db, "usuarios");
    const snapshot = await getDocs(usuariosRef);

    // Filtrar usuarios activos en el cliente
    const usuariosActivos = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return data.estado === "activo";
    });

    const userIds = usuariosActivos.map((doc) => doc.id);

    if (userIds.length === 0) {
      return;
    }

    // Crear notificación masiva
    await crearNotificacionMasiva(
      userIds,
      "Nueva materia disponible",
      `Se ha creado la materia: ${materiaNombre}`,
      "info",
      "school",
      {
        materiaId,
        materiaNombre,
        accion: "ver_materia",
      }
    );

    // Enviar notificación push local
    try {
      await enviarNotificacionLocal(
        "Nueva materia disponible",
        `Se ha creado la materia: ${materiaNombre}`,
        {
          tipo: "materia",
          materiaId,
          materiaNombre,
          accion: "ver_materia",
        }
      );
    } catch {
      console.log("Push notification no disponible (Expo Go)");
    }
  } catch (error) {
    console.error("Error al notificar creación de materia:", error);
    throw error;
  }
};
