import { auth, db } from "@/firebase";
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
    publicacionId?: string;
    actorUid?: string;
    actorNombre?: string;
    actorFoto?: string | null;
    accion?: string;
    tipo?: string;
    publicacionTitulo?: string;
    motivo?: string;
    decision?: string;
    tipoAccion?: string;
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
  const userSettings = await getNotificationSettings(userId);
  const accion = metadata?.accion;
  const tipoData = metadata?.tipo;
  
  if (accion === 'admin_decision' || tipoData === 'admin_decision') {
    if (!userSettings.adminAlertsEnabled) {
      return null;
    }
  }
  
  if (accion === 'ver_publicacion' || tipoData === 'publicacion') {
    if (!userSettings.newPublicationsEnabled) {
      return null;
    }
  }
  
  if (accion === 'ver_materia' || tipoData === 'materia') {
    if (!userSettings.newSubjectsEnabled) {
      return null;
    }
  }

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

    const q = query(
      notifUsuarioRef,
      where("userId", "==", userId),
      limit(100) // Máximo 100 notificaciones recientes
    );

    return onSnapshot(
      q,
      async (snapshot) => {
        try {
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

          const notifIds = [
            ...new Set(notificacionesUsuario.map((n) => n.notificacionId)),
          ];

          const batchSize = 10;
          const notifIdBatches: string[][] = [];
          for (let i = 0; i < notifIds.length; i += batchSize) {
            notifIdBatches.push(notifIds.slice(i, i + batchSize));
          }

          const notifSnapshots = await Promise.all(
            notifIdBatches.map((batch) =>
              getDocs(
                query(
                  collection(db, "notificaciones"),
                  where(documentId(), "in", batch)
                )
              )
            )
          );

          const notifMap = new Map<string, any>();
          notifSnapshots.forEach((snapshot) => {
            snapshot.docs.forEach((docSnap) => {
              notifMap.set(docSnap.id, docSnap.data());
            });
          });

          const notificacionesCompletas: NotificacionCompleta[] =
            notificacionesUsuario
              .map((notifUsuario) => {
                const notifData = notifMap.get(notifUsuario.notificacionId);
                if (!notifData) return null;
                return {
                  id: notifUsuario.id,
                  ...notifData,
                  leida: notifUsuario.leida,
                  creadoEn: notifUsuario.creadoEn,
                } as NotificacionCompleta;
              })
              .filter((item): item is NotificacionCompleta => item !== null);

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

export const eliminarNotificacionesUsuarioBatch = async (
  notificacionUsuarioIds: string[]
) => {
  if (!notificacionUsuarioIds.length) return;

  const currentUser = auth.currentUser;
  if (!currentUser?.uid) {
    throw new Error("Usuario no autenticado para eliminar notificaciones.");
  }

  const uniqueIds = [...new Set(notificacionUsuarioIds)];
  const batchSize = 30;
  const allowedIds: string[] = [];

  try {
    for (let i = 0; i < uniqueIds.length; i += batchSize) {
      const idChunk = uniqueIds.slice(i, i + batchSize);
      const snap = await getDocs(
        query(
          collection(db, "notificacionesUsuario"),
          where("userId", "==", currentUser.uid),
          where(documentId(), "in", idChunk)
        )
      );
      snap.docs.forEach((d) => allowedIds.push(d.id));
    }
  } catch (error) {
    console.warn(
      "⚠️ No se pudo validar IDs por query; se intentará borrado individual.",
      error
    );
  }

  const idsToDelete = allowedIds.length > 0 ? allowedIds : uniqueIds;
  let deletedCount = 0;

  for (const id of idsToDelete) {
    try {
      const notifUsuarioRef = doc(db, "notificacionesUsuario", id);
      await updateDoc(notifUsuarioRef, { eliminada: true });
      deletedCount++;
    } catch (error) {
      console.warn(`⚠️ No se pudo eliminar notificación ${id}:`, error);
    }
  }

  if (deletedCount === 0) {
    console.warn("⚠️ No se eliminó ninguna notificación del lote.");
  }
};

export const obtenerContadorNoLeidas = (
  userId: string,
  onUpdate: (count: number) => void
) => {
  const notifUsuarioRef = collection(db, "notificacionesUsuario");
  const q = query(
    notifUsuarioRef,
    where("userId", "==", userId),
    limit(100) // Suficiente para contador
  );

  return onSnapshot(q, (snapshot) => {
    const noLeidas = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return data.leida === false && !data.eliminada;
    });
    onUpdate(noLeidas.length);
  });
};

export const notificarUsuariosMateria = async (
  materiaId: string,
  materiaNombre: string,
  titulo: string,
  descripcion: string,
  tipo: "info" | "exito" | "advertencia" | "error" = "info",
  icono: string = "school",
  publicacionId: string,
  actor?: { uid?: string; nombre?: string; foto?: string | null }
) => {
  try {
    const usuariosRef = collection(db, "usuarios");
    const q = query(
      usuariosRef,
      where("materiasInscritas", "array-contains", materiaId),
      where("estado", "==", "activo")
    );
    const snapshot = await getDocs(q);

    const userIds = snapshot.docs.map((doc) => doc.id);

    if (userIds.length === 0) {
      return;
    }

    const usuariosConNotificacionesHabilitadas: string[] = [];
    
    for (const userId of userIds) {
      const userSettings = await getNotificationSettings(userId);
      if (userSettings.newPublicationsEnabled) {
        usuariosConNotificacionesHabilitadas.push(userId);
      }
    }

    if (usuariosConNotificacionesHabilitadas.length === 0) {
      return;
    }

    const notificacionRef = await addDoc(collection(db, "notificaciones"), {
      titulo,
      descripcion,
      icono,
      tipo,
      creadoEn: serverTimestamp(),
      metadata: {
        materiaId,
        materiaNombre,
        accion: 'ver_publicacion',
        publicacionId,
        actorUid: actor?.uid || null,
        actorNombre: actor?.nombre || null,
        actorFoto: actor?.foto || null,
      },
    });

    const batch = writeBatch(db);
    const timestamp = serverTimestamp();

    usuariosConNotificacionesHabilitadas.forEach((userId) => {
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

  } catch (error) {
    console.error("Error al notificar usuarios de materia:", error);
    throw error;
  }
};

export const notificarCreacionMateria = async (
  materiaId: string,
  materiaNombre: string,
  materiaDescripcion: string,
  materiaSemestre?: number
) => {
  try {
    const usuariosRef = collection(db, "usuarios");
    const snapshot = await getDocs(usuariosRef);

    const usuariosActivos = snapshot.docs.filter((doc) => {
      const data = doc.data();
      
      if (data.estado !== "activo") {
        return false;
      }
      
      if (!materiaSemestre && materiaSemestre !== 0) {
        return true;
      }
      
      if (materiaSemestre === 10) {
        return true;
      }
      
      const semestresUsuario = data.semestres || [];
      if (semestresUsuario.length === 0) {
        return materiaSemestre === 1;
      }
      
      return semestresUsuario.includes(materiaSemestre);
    });

    const userIds = usuariosActivos.map((doc) => doc.id);

    if (userIds.length === 0) {
      return;
    }

    const usuariosConNotificacionesHabilitadas: string[] = [];
    
    for (const userId of userIds) {
      const userSettings = await getNotificationSettings(userId);
      if (userSettings.newSubjectsEnabled) {
        usuariosConNotificacionesHabilitadas.push(userId);
      }
    }

    if (usuariosConNotificacionesHabilitadas.length === 0) {
      return;
    }

    const notificacionRef = await addDoc(collection(db, "notificaciones"), {
      titulo: "Nueva materia disponible",
      descripcion: `Se ha creado la materia: ${materiaNombre}`,
      icono: "school",
      tipo: "info",
      creadoEn: serverTimestamp(),
      metadata: {
        materiaId,
        materiaNombre,
        accion: "ver_materia",
      },
    });

    const batch = writeBatch(db);
    const timestamp = serverTimestamp();

    usuariosConNotificacionesHabilitadas.forEach((userId) => {
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
      accion: 'admin_decision',
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
  
  const usuariosConNotificacionesHabilitadas: string[] = [];
  
  for (const userId of userIds) {
    const userSettings = await getNotificationSettings(userId);
    if (userSettings.adminAlertsEnabled) {
      usuariosConNotificacionesHabilitadas.push(userId);
    }
  }

  if (usuariosConNotificacionesHabilitadas.length === 0) {
    return;
  }

  await crearNotificacionMasiva(
    usuariosConNotificacionesHabilitadas,
    titulo,
    descripcion,
    'info',
    'account-alert',
    {
      tipo: 'admin_decision',
      accion: 'admin_decision',
      publicacionTitulo,
      motivo,
      decision,
      tipoAccion,
    }
  );
};
