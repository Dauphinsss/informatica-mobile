import { db, storage } from "@/firebase";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  query,
  QuerySnapshot,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import {
  deleteObject,
  ref
} from "firebase/storage";
import { Report } from "../types/Reports.type";
async function actualizarEstadisticasUsuario(usuarioUid: string, cambios: Record<string, number>) {
  if (!usuarioUid) return;
  const data: Record<string, any> = {};
  Object.entries(cambios).forEach(([k, v]) => (data[k] = increment(v)));
  await setDoc(doc(db, "estadisticasUsuario", usuarioUid), data, { merge: true });
}
export const obtenerReportes = async (): Promise<Report[]> => {
  const reportes: Report[] = [];
  const usuariosCache = new Map<string, string>();
  const publicacionesCache = new Map<string, any>();
  const estadisticasCache = new Map<string, number>();
  const agrupados = new Map<string, Report>();

  try {
    const reportesSnap = await getDocs(collection(db, "reportes"));

    const publicacionesIds = new Set<string>();
    const usuariosIds = new Set<string>();
    const autoresPublicacionIds = new Set<string>();

    reportesSnap.docs.forEach(doc => {
      const data = doc.data();
      publicacionesIds.add(data.publicacionUid);
      usuariosIds.add(data.autorUid);
    });

    const publicacionesPromises = Array.from(publicacionesIds).map(id =>
      getDoc(doc(db, "publicaciones", id)).then(snap => {
        if (snap.exists()) publicacionesCache.set(id, snap.data());
      })
    );

    await Promise.all(publicacionesPromises);

    publicacionesCache.forEach(pub => {
      if (pub?.autorUid) {
        autoresPublicacionIds.add(pub.autorUid);
        usuariosIds.add(pub.autorUid);
      }
    });

    const usuariosPromises = Array.from(usuariosIds).map(id =>
      getDoc(doc(db, "usuarios", id)).then(snap => {
        if (snap.exists()) usuariosCache.set(id, snap.data().nombre);
      })
    );

    await Promise.all(usuariosPromises);

    const estadisticasPromises = Array.from(autoresPublicacionIds).map(uid =>
      getDocs(
        query(collection(db, "estadisticasUsuario"), where("usuarioUid", "==", uid))
      ).then(snap => {
        const data = snap.docs[0]?.data();
        estadisticasCache.set(uid, data?.strikes ?? 0);
      })
    );

    await Promise.all(estadisticasPromises);

    for (const reporteDoc of reportesSnap.docs) {
      const data = reporteDoc.data();
      const publicacionId = data.publicacionUid;
      const publicacion = publicacionesCache.get(publicacionId);
      const autorPublicacionNombre = usuariosCache.get(publicacion?.autorUid) ?? "Autor desconocido";
      const autorPublicacionUid = publicacion?.autorUid ?? "unknown-uid";
      const autorReporteNombre = usuariosCache.get(data.autorUid) ?? "Usuario desconocido";
      const strikesAutor = estadisticasCache.get(publicacion?.autorUid) ?? 0;

      const fechaDate = data.fechaCreacion.toDate();
      const fecha = fechaDate.toLocaleDateString("es-BO");
      const fechaTimestamp = fechaDate.getTime();

      const nuevoReportador = {
        usuario: autorReporteNombre,
        motivo: data.tipo,
        fecha,
        fechaTimestamp,
        uid: data.autorUid,
      };

      if (!agrupados.has(publicacionId)) {
        agrupados.set(publicacionId, {
          id: reporteDoc.id,
          publicacionId,
          titulo: publicacion?.titulo ?? "Sin título",
          autor: autorPublicacionNombre,
          autorUid: autorPublicacionUid,
          totalReportes: 1,
          ultimoMotivo: data.tipo,
          ultimoReportadoPor: autorReporteNombre,
          ultimaFecha: fecha,
          ultimaFechaTimestamp: fechaTimestamp,
          contenido: publicacion?.descripcion ?? "Sin descripción",
          estado: data.estado,
          reportadores: [nuevoReportador],
          strikesAutor,
          decision: data.accionTomada ?? undefined,
          fechaDecision: data.fechaRevision
            ? data.fechaRevision.toDate().toLocaleDateString("es-BO")
            : undefined,
        });
      } else {
        const existente = agrupados.get(publicacionId)!;
        existente.totalReportes += 1;
        existente.reportadores.push(nuevoReportador);

        if (fechaTimestamp > (existente.ultimaFechaTimestamp ?? 0)) {
          existente.ultimaFecha = fecha;
          existente.ultimaFechaTimestamp = fechaTimestamp;
          existente.ultimoMotivo = data.tipo;
          existente.ultimoReportadoPor = autorReporteNombre;
          existente.estado = data.estado;
          existente.decision = data.accionTomada ?? existente.decision;
          existente.fechaDecision = data.fechaRevision
            ? data.fechaRevision.toDate().toLocaleDateString("es-BO")
            : existente.fechaDecision;
        }
      }
    }
    reportes.push(...agrupados.values());
  } catch (error) {
    console.error("Error al obtener reportes agrupados:", error);
  }
  return reportes;
};

export const completarReportesDePublicacion = async (
  publicacionId: string,
  accion: string,
  motivoDecision: string
) => {
  const auth = getAuth();
  const admin = auth.currentUser;
  const adminName = admin?.displayName || admin?.email || "Admin desconocido";
  const fecha = new Date();
  const reportesSnap = await getDocs(
    query(collection(db, "reportes"), where("publicacionUid", "==", publicacionId))
  );
  
  await Promise.all(
    reportesSnap.docs.map(docSnap =>
      updateDoc(doc(db, "reportes", docSnap.id), {
        estado: "completado",
        accionTomada: accion,
        fechaRevision: fecha,
        revisadoPor: adminName,
        motivoDecision: motivoDecision,
      })
    )
  );

  return fecha;
};

export const eliminarPublicacion = async (publicacionId: string) => {
  await updateDoc(doc(db, "publicaciones", publicacionId), {
    estado: "eliminado",
  });
};

export const eliminarPublicacionYArchivos = async (publicacionId: string) => {
  try {
    let autorPublicacionUid: string | undefined;
    try {
      const pubSnap = await getDoc(doc(db, "publicaciones", publicacionId));
      if (pubSnap.exists()) {
        const pubData = pubSnap.data() as any;
        autorPublicacionUid = pubData?.autorUid;
      }
    } catch (e) {
      console.warn("No se pudo leer autor de la publicación:", e);
    }

    const archivosSnap = await getDocs(
      query(
        collection(db, "archivos"),
        where("publicacionId", "==", publicacionId),
        where("activo", "==", true)
      )
    );

    const eliminarArchivosStorage = archivosSnap.docs.map(async (archivoDoc) => {
      const archivoData = archivoDoc.data();

      if (!archivoData.esEnlaceExterno && archivoData.webUrl) {
        try {
          const storageUrl = archivoData.webUrl;
          const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/`;
          const filePath = decodeURIComponent(
            storageUrl.replace(baseUrl, '').split('?')[0]
          );
          
          const storageRef = ref(storage, filePath);
          await deleteObject(storageRef);
        } catch (storageError) {
          console.warn(`No se pudo eliminar de Storage: ${archivoData.titulo}`, storageError);
        }
      } else {
      }

      await updateDoc(doc(db, "archivos", archivoDoc.id), {
        activo: false
      });
    });

    await Promise.all(eliminarArchivosStorage);

    await updateDoc(doc(db, "publicaciones", publicacionId), {
      estado: "eliminado",
    });
    if (autorPublicacionUid) {
      actualizarEstadisticasUsuario(autorPublicacionUid, { publicacionesEliminadas: 1 }).catch(
        (e) => console.error("estadisticas: publicacionesEliminadas", e)
      );
    }
  } catch (error) {
    console.error("Error al eliminar publicación y archivos:", error);
    throw error;
  }
};

export const aplicarStrikeAlAutor = async (autorUid: string) => {
  try {
    const estadisticasSnap = await getDocs(
      query(collection(db, "estadisticasUsuario"), where("usuarioUid", "==", autorUid))
    );
    
    const estadisticaDoc = estadisticasSnap.docs[0];
    if (estadisticaDoc) {
      const actual = estadisticaDoc.data().strikes ?? 0;
      await updateDoc(doc(db, "estadisticasUsuario", estadisticaDoc.id), {
        strikes: actual + 1,
      });
    }
  } catch (error) {
    console.error("Error al aplicar strike:", error);
    throw error;
  }
};

export const banearUsuarioPorNombre = async (nombre: string) => {
  try {
    const usuariosSnap = await getDocs(
      query(collection(db, "usuarios"), where("nombre", "==", nombre))
    );
    
    const usuarioDoc = usuariosSnap.docs[0];
    if (usuarioDoc) {
      await updateDoc(doc(db, "usuarios", usuarioDoc.id), {
        estado: "suspendido",
      });
    }
  } catch (error) {
    console.error("Error al banear usuario:", error);
    throw error;
  }
};

export const escucharReportes = (onChange: (reportes: Report[]) => void) => {
  const usuariosCache = new Map<string, string>();
  const publicacionesCache = new Map<string, any>();
  const estadisticasCache = new Map<string, number>();

  const procesarSnapshot = async (reportesSnap: QuerySnapshot<DocumentData>) => {
    const agrupados = new Map<string, Report>();
    const publicacionesIds = new Set<string>();
    const usuariosIds = new Set<string>();
    const autoresPublicacionIds = new Set<string>();

    reportesSnap.docs.forEach(doc => {
      const data = doc.data();
      publicacionesIds.add(data.publicacionUid);
      usuariosIds.add(data.autorUid);
    });

    const publicacionesPromises = Array.from(publicacionesIds).map(id =>
      getDoc(doc(db, "publicaciones", id)).then(snap => {
        if (snap.exists()) publicacionesCache.set(id, snap.data());
      })
    );
    await Promise.all(publicacionesPromises);

    publicacionesCache.forEach(pub => {
      if (pub?.autorUid) {
        autoresPublicacionIds.add(pub.autorUid);
        usuariosIds.add(pub.autorUid);
      }
    });

    const usuariosPromises = Array.from(usuariosIds).map(id =>
      getDoc(doc(db, "usuarios", id)).then(snap => {
        if (snap.exists()) usuariosCache.set(id, snap.data().nombre);
      })
    );
    await Promise.all(usuariosPromises);

    const estadisticasPromises = Array.from(autoresPublicacionIds).map(uid =>
      getDocs(
        query(collection(db, "estadisticasUsuario"), where("usuarioUid", "==", uid))
      ).then(snap => {
        const data = snap.docs[0]?.data();
        estadisticasCache.set(uid, data?.strikes ?? 0);
      })
    );
    await Promise.all(estadisticasPromises);

    for (const reporteDoc of reportesSnap.docs) {
      const data = reporteDoc.data();
      const publicacionId = data.publicacionUid;
      const publicacion = publicacionesCache.get(publicacionId);
      const autorPublicacionNombre = usuariosCache.get(publicacion?.autorUid) ?? "Autor desconocido";
      const autorPublicacionUid = publicacion?.autorUid ?? "unknown-uid";
      const autorReporteNombre = usuariosCache.get(data.autorUid) ?? "Usuario desconocido";
      const strikesAutor = estadisticasCache.get(publicacion?.autorUid) ?? 0;

      const fechaDate = data.fechaCreacion.toDate();
      const fecha = fechaDate.toLocaleDateString("es-BO");
      const fechaTimestamp = fechaDate.getTime();

      const nuevoReportador = {
        usuario: autorReporteNombre,
        motivo: data.tipo,
        fecha,
        fechaTimestamp,
        uid: data.autorUid,
      };

      if (!agrupados.has(publicacionId)) {
        agrupados.set(publicacionId, {
          id: reporteDoc.id,
          publicacionId,
          titulo: publicacion?.titulo ?? "Sin título",
          autor: autorPublicacionNombre,
          autorUid: autorPublicacionUid,
          totalReportes: 1,
          ultimoMotivo: data.tipo,
          ultimoReportadoPor: autorReporteNombre,
          ultimaFecha: fecha,
          ultimaFechaTimestamp: fechaTimestamp,
          contenido: publicacion?.descripcion ?? "Sin descripción",
          estado: data.estado,
          reportadores: [nuevoReportador],
          strikesAutor,
          decision: data.accionTomada ?? undefined,
          fechaDecision: data.fechaRevision
            ? data.fechaRevision.toDate().toLocaleDateString("es-BO")
            : undefined,
          motivoDecision: data.motivoDecision ?? undefined,
        });
      } else {
        const existente = agrupados.get(publicacionId)!;
        existente.totalReportes += 1;
        existente.reportadores.push(nuevoReportador);
        if (data.motivoDecision) existente.motivoDecision = data.motivoDecision;

        if (fechaTimestamp > (existente.ultimaFechaTimestamp ?? 0)) {
          existente.ultimaFecha = fecha;
          existente.ultimaFechaTimestamp = fechaTimestamp;
          existente.ultimoMotivo = data.tipo;
          existente.ultimoReportadoPor = autorReporteNombre;
          existente.estado = data.estado;
          existente.decision = data.accionTomada ?? existente.decision;
          if (data.motivoDecision) existente.motivoDecision = data.motivoDecision;
          existente.fechaDecision = data.fechaRevision
            ? data.fechaRevision.toDate().toLocaleDateString("es-BO")
            : existente.fechaDecision;
        }
      }
    }
    onChange(Array.from(agrupados.values()));
  };

  const unsubscribe = onSnapshot(collection(db, "reportes"), (snap) => {
    procesarSnapshot(snap);
  });
  return unsubscribe;
};