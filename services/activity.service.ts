import { db } from "@/firebase";
import { ActivityLog, ActivityType } from "@/scripts/types/Activity.type";
import {
    addDoc,
    collection,
    doc,
    DocumentData,
    getCountFromServer,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    QueryDocumentSnapshot,
    startAfter,
    Timestamp,
    Unsubscribe,
} from "firebase/firestore";

type CachedUser = {
  nombre: string;
  foto: string | null;
  rol: string;
};

const userCache = new Map<string, CachedUser>();

const normalizeRole = (role?: string | null): string => {
  const normalized = String(role || "").trim().toLowerCase();
  if (
    normalized === "admin" ||
    normalized === "administrador" ||
    normalized === "administrator"
  ) {
    return "admin";
  }
  return "usuario";
};

const getActivityPrimaryUid = (activity: ActivityLog): string | null => {
  if (activity.tipo === "usuario_registrado") {
    return (
      activity.relacionadoUid ||
      activity.metadata?.usuarioUid ||
      activity.actorUid ||
      null
    );
  }

  return activity.actorUid || null;
};

const getUserDataCached = async (uid: string): Promise<CachedUser> => {
  const cached = userCache.get(uid);
  if (cached) return cached;

  try {
    const snap = await getDoc(doc(db, "usuarios", uid));
    if (!snap.exists()) {
      const fallback = { nombre: "Usuario", foto: null, rol: "usuario" };
      userCache.set(uid, fallback);
      return fallback;
    }

    const data = snap.data() as any;
    const hydrated: CachedUser = {
      nombre: data?.nombre || data?.correo || "Usuario",
      foto: data?.foto || null,
      rol: normalizeRole(data?.rol),
    };
    userCache.set(uid, hydrated);
    return hydrated;
  } catch {
    const fallback = { nombre: "Usuario", foto: null, rol: "usuario" };
    userCache.set(uid, fallback);
    return fallback;
  }
};

const hydrateActivityActors = async (
  activities: ActivityLog[],
): Promise<ActivityLog[]> => {
  const uniqueUids = Array.from(
    new Set(
      activities
        .map((activity) => getActivityPrimaryUid(activity))
        .filter((uid): uid is string => typeof uid === "string" && uid.length > 0),
    ),
  );

  await Promise.all(uniqueUids.map((uid) => getUserDataCached(uid)));

  return activities.map((activity) => {
    const primaryUid = getActivityPrimaryUid(activity);
    if (!primaryUid) {
      return {
        ...activity,
        actorRol: normalizeRole(activity.actorRol),
      };
    }

    const user = userCache.get(primaryUid);
    if (!user) return activity;

    const actorRol =
      activity.tipo === "publicacion_eliminada"
        ? normalizeRole(activity.actorRol || user.rol)
        : normalizeRole(activity.actorRol || user.rol);

    return {
      ...activity,
      actorUid: activity.actorUid || primaryUid,
      actorNombre: activity.actorNombre || user.nombre,
      actorFoto: activity.actorFoto ?? user.foto,
      actorRol,
    };
  });
};

export const registrarActividadCliente = async (
  tipo: ActivityType,
  titulo: string,
  descripcion: string,
  actorUid?: string,
  actorNombre?: string,
  relacionadoUid?: string,
  metadata?: { [key: string]: any }
): Promise<void> => {
  try {
    const actividadRef = collection(db, "actividad_reciente");
    const cleanMetadata: { [key: string]: any } = {};
    if (metadata) {
      Object.keys(metadata).forEach(key => {
        if (metadata[key] !== undefined) {
          cleanMetadata[key] = metadata[key];
        }
      });
    }

    await addDoc(actividadRef, {
      tipo,
      titulo,
      descripcion,
      timestamp: Timestamp.now(),
      actorUid: actorUid || null,
      actorNombre: actorNombre || null,
      actorFoto: null,
      actorRol: null,
      relacionadoUid: relacionadoUid || null,
      metadata: cleanMetadata,
    });

  } catch (error) {
    console.error("[Actividad Cliente] Error registrando:", error);
    throw error;
  }
};

export const obtenerActividadesRecientes = async (
  limitCount: number = 10,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ activities: ActivityLog[]; lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
  try {
    const actividadRef = collection(db, "actividad_reciente");
    let q = query(actividadRef, orderBy("timestamp", "desc"), limit(limitCount));

    if (lastDoc) {
      q = query(actividadRef, orderBy("timestamp", "desc"), startAfter(lastDoc), limit(limitCount));
    }

    const snapshot = await getDocs(q);
    
    const activities: ActivityLog[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ActivityLog));
    const hydrated = await hydrateActivityActors(activities);

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

    return { activities: hydrated, lastVisible };
  } catch (error) {
    console.error("[Actividad] Error obteniendo actividades:", error);
    return { activities: [], lastVisible: null };
  }
};

export const obtenerActividadesPreview = async (count: number = 10): Promise<ActivityLog[]> => {
  try {
    const { activities } = await obtenerActividadesRecientes(count);
    return activities;
  } catch (error) {
    console.error("[Actividad] Error obteniendo preview:", error);
    return [];
  }
};

export const escucharActividadesRecientes = (
  count: number = 10,
  callback: (activities: ActivityLog[]) => void
): Unsubscribe => {
  const actividadRef = collection(db, "actividad_reciente");
  const q = query(actividadRef, orderBy("timestamp", "desc"), limit(count));

  return onSnapshot(q, (snapshot) => {
    const activities: ActivityLog[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ActivityLog));

    void (async () => {
      callback(await hydrateActivityActors(activities));
    })();
  }, (error) => {
    console.error("[Actividad] Error en listener:", error);
    callback([]);
  });
};

export const contarTotalActividades = async (): Promise<number> => {
  try {
    const actividadRef = collection(db, "actividad_reciente");
    const snapshot = await getCountFromServer(actividadRef);
    return snapshot.data().count;
  } catch (error) {
    console.error("[Actividad] Error contando actividades:", error);
    return 0;
  }
};

export const obtenerActividadesPorPagina = async (
  page: number,
  itemsPerPage: number = 20
): Promise<{ activities: ActivityLog[]; totalCount: number }> => {
  try {
    const totalCount = await contarTotalActividades();
    const offset = (page - 1) * itemsPerPage;
    
    const actividadRef = collection(db, "actividad_reciente");
    const q = query(actividadRef, orderBy("timestamp", "desc"), limit(offset + itemsPerPage));
    
    const snapshot = await getDocs(q);
    const allDocs = snapshot.docs.slice(offset, offset + itemsPerPage);
    
    const activities: ActivityLog[] = allDocs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as ActivityLog));
    const hydrated = await hydrateActivityActors(activities);

    return { activities: hydrated, totalCount };
  } catch (error) {
    console.error("[Actividad] Error obteniendo actividades por página:", error);
    return { activities: [], totalCount: 0 };
  }
};
