import { db } from "@/firebase";
import { ActivityLog, ActivityType } from "@/scripts/types/Activity.type";
import {
    addDoc,
    collection,
    DocumentData,
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

    const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

    return { activities, lastVisible };
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

    callback(activities);
  }, (error) => {
    console.error("[Actividad] Error en listener:", error);
    callback([]);
  });
};