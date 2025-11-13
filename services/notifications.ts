import { db } from "@/firebase";
import { getNotificationSettings } from "@/hooks/useNotificationSettings";
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
      const { auth } = require("@/firebase");
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === userId) {
        await enviarNotificacionLocal(titulo, descripcion, metadata);
      }
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
            ...new Set(notificacionesUsuario.map((n) => n.notificacionId)),
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
 * Eliminar múltiples notificaciones de usuario en batch (más eficiente)
 */
export const eliminarNotificacionesUsuarioBatch = async (
  notificacionUsuarioIds: string[]
) => {
  try {
    const batch = writeBatch(db);
    
    notificacionUsuarioIds.forEach((id) => {
      const notifUsuarioRef = doc(db, "notificacionesUsuario", id);
      batch.update(notifUsuarioRef, {
        eliminada: true,
      });
    });

    await batch.commit();
  } catch (error) {
    console.error("❌ Error al eliminar notificaciones en batch:", error);
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
  icono: string = "school",
  publicacionId: string
) => {
  try {
    const settings = await getNotificationSettings();
    if (!settings.newPublicationsEnabled) {
      return;
    }

    const usuariosRef = collection(db, "usuarios");
    const q = query(
      usuariosRef,
      where("materiasInscritas", "array-contains", materiaId),
      where("estado", "==", "activo")
    );
    const snapshot = await getDocs(q);

    let userIds = snapshot.docs.map((doc) => doc.id);
    let currentUserId = null;
    try {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      currentUserId = auth.currentUser?.uid || null;
    } catch {}

    if (currentUserId) {
      userIds = userIds.filter((id) => id !== currentUserId);
    }

    if (userIds.length === 0) {
      console.log("No hay usuarios inscritos en esta materia");
      return;
    }

    await crearNotificacionMasiva(userIds, titulo, descripcion, tipo, icono, {
      materiaId,
      materiaNombre,
      accion: 'ver_publicacion',
      publicacionId,
    });

    try {
      await enviarNotificacionLocal(titulo, descripcion, {
        tipo: 'publicacion',
        materiaId,
        materiaNombre,
        publicacionId,
        accion: 'ver_publicacion',
      });
    } catch (error) {
      console.error('Error al enviar push:', error);
    }
  } catch (error) {
    console.error("Error al notificar usuarios de materia:", error);
    throw error;
  }
};

/**
 * Notificar cuando se crea una nueva materia (solo a usuarios en ese semestre)
 */
export const notificarCreacionMateria = async (
  materiaId: string,
  materiaNombre: string,
  materiaDescripcion: string,
  materiaSemestre?: number
) => {
  try {
    const settings = await getNotificationSettings();
    if (!settings.newSubjectsEnabled) {
      return;
    }

    console.log(`[NOTIF] Creando notificación para materia: ${materiaNombre} (Semestre ${materiaSemestre})`);
    
    const usuariosRef = collection(db, "usuarios");
    const snapshot = await getDocs(usuariosRef);
    
    console.log(`[NOTIF] Total usuarios en BD: ${snapshot.docs.length}`);

    const usuariosActivos = snapshot.docs.filter((doc) => {
      const data = doc.data();
      const nombre = data.nombre || 'Sin nombre';
      const uid = doc.id;
      
      if (data.estado !== "activo") {
        console.log(`[NOTIF] ❌ ${nombre} (${uid}): Estado ${data.estado}`);
        return false;
      }
      
      if (!materiaSemestre && materiaSemestre !== 0) {
        console.log(`[NOTIF] ✅ ${nombre} (${uid}): Sin filtro de semestre`);
        return true;
      }
      
      if (materiaSemestre === 10) {
        console.log(`[NOTIF] ✅ ${nombre} (${uid}): Materia electiva`);
        return true;
      }
      
      const semestresUsuario = data.semestres || [];
      if (semestresUsuario.length === 0) {
        const resultado = materiaSemestre === 1;
        console.log(`[NOTIF] ${resultado ? '✅' : '❌'} ${nombre} (${uid}): Sin semestres, materia es ${materiaSemestre}`);
        return resultado;
      }
      
      const resultado = semestresUsuario.includes(materiaSemestre);
      console.log(`[NOTIF] ${resultado ? '✅' : '❌'} ${nombre} (${uid}): Semestres [${semestresUsuario}], materia ${materiaSemestre}`);
      return resultado;
    });

    let userIds = usuariosActivos.map((doc) => doc.id);
    let currentUserId = null;
    try {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      currentUserId = auth.currentUser?.uid || null;
    } catch {}

    if (currentUserId) {
      console.log(`[NOTIF] Excluyendo usuario actual: ${currentUserId}`);
      userIds = userIds.filter((id) => id !== currentUserId);
    }

    console.log(`[NOTIF] Total usuarios a notificar: ${userIds.length}`);

    if (userIds.length === 0) {
      console.log(`[NOTIF] No hay usuarios para notificar sobre materia de semestre ${materiaSemestre}`);
      return;
    }

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
      console.log("Push notification no disponible");
    }
  } catch (error) {
    console.error("Error al notificar creación de materia:", error);
    throw error;
  }
};

export const notificarDecisionAdminAutor = async ({
  autorUid,
  publicacionTitulo,
  motivo,
  decision,
  tipoAccion
}: {
  autorUid: string;
  publicacionTitulo: string;
  motivo: string;
  decision: string;
  tipoAccion: 'quitar' | 'strike' | 'ban';
}) => {
  const settings = await getNotificationSettings();
  if (!settings.adminAlertsEnabled) {
    return;
  }

  let titulo = '';
  let descripcion = '';
  if (tipoAccion === 'quitar') {
    titulo = 'Tu publicación fue revisada';
    descripcion = `La denuncia sobre "${publicacionTitulo}" fue descartada. Motivo: ${motivo}`;
  } else if (tipoAccion === 'strike') {
    titulo = 'Tu publicación fue eliminada';
    descripcion = `Se eliminó "${publicacionTitulo}" y recibiste un strike. Motivo: ${motivo}`;
  } else if (tipoAccion === 'ban') {
    titulo = 'Has sido baneado';
    descripcion = `Tu publicación "${publicacionTitulo}" fue eliminada y tu cuenta fue baneada. Motivo: ${motivo}`;
  }
  await crearNotificacion(
    autorUid,
    titulo,
    descripcion,
    'info',
    'account-alert',
    {
      tipo: 'admin_decision',
      publicacionTitulo,
      motivo,
      decision,
      tipoAccion,
    },
    true
  );
};

export const notificarDecisionAdminDenunciantes = async ({
  reportadores,
  publicacionTitulo,
  motivo,
  decision,
  tipoAccion
}: {
  reportadores: Array<{ usuario: string; uid?: string }>;
  publicacionTitulo: string;
  motivo: string;
  decision: string;
  tipoAccion: 'quitar' | 'strike' | 'ban';
}) => {
  const settings = await getNotificationSettings();
  if (!settings.adminAlertsEnabled) {
    return;
  }

  let titulo = '';
  let descripcion = '';
  if (tipoAccion === 'quitar') {
    titulo = 'Tu denuncia fue revisada';
    descripcion = `La denuncia sobre "${publicacionTitulo}" fue descartada. Motivo: ${motivo}`;
  } else if (tipoAccion === 'strike') {
    titulo = 'Denuncia aceptada';
    descripcion = `La publicación "${publicacionTitulo}" fue eliminada y el autor recibió un strike. Motivo: ${motivo}`;
  } else if (tipoAccion === 'ban') {
    titulo = 'Denuncia aceptada - usuario baneado';
    descripcion = `La publicación "${publicacionTitulo}" fue eliminada y el autor fue baneado. Motivo: ${motivo}`;
  }
  const userIds = reportadores.map(r => r.uid).filter(Boolean) as string[];
  if (userIds.length === 0) return;
  await crearNotificacionMasiva(
    userIds,
    titulo,
    descripcion,
    'info',
    'account-alert',
    {
      tipo: 'admin_decision',
      publicacionTitulo,
      motivo,
      decision,
      tipoAccion,
    }
  );
};