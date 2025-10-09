import { collection, getDocs, doc, getDoc, query, where, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { getAuth } from "firebase/auth";
import { Report } from "../types/Reports.type";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

    const usuariosPromises = Array.from(usuariosIds).map(id =>
      getDoc(doc(db, "usuarios", id)).then(snap => {
        if (snap.exists()) usuariosCache.set(id, snap.data().nombre);
      })
    );

    await Promise.all([...publicacionesPromises, ...usuariosPromises]);

    publicacionesCache.forEach(pub => {
      if (pub?.autorUid) autoresPublicacionIds.add(pub.autorUid);
    });

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

      const fecha = data.fechaCreacion.toDate().toLocaleDateString("es-BO");

      const nuevoReportador = {
        usuario: autorReporteNombre,
        motivo: data.tipo,
        fecha,
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
          contenido: "Contenido mockeado de la publicación.",
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

        const fechaActual = new Date(fecha);
        const fechaExistente = new Date(existente.ultimaFecha.split('/').reverse().join('-'));
        if (fechaActual > fechaExistente) {
          existente.ultimaFecha = fecha;
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
  accion: string
) => {
  const auth = getAuth();
  const admin = auth.currentUser;
  const adminName = admin?.displayName || admin?.email || "Admin desconocido";
  const fecha = new Date();
  const reportesSnap = await getDocs(
    query(collection(db, "reportes"), where("publicacionUid", "==", publicacionId))
  );
  const userData = await AsyncStorage.getItem("userData");
  await Promise.all(
    reportesSnap.docs.map(docSnap =>
      updateDoc(doc(db, "reportes", docSnap.id), {
        estado: "completado",
        accionTomada: accion,
        fechaRevision: fecha,
        revisadoPor: adminName,
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

export const aplicarStrikeAlAutor = async (autorUid: string) => {
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
};

export const banearUsuarioPorNombre = async (nombre: string) => {
  const usuariosSnap = await getDocs(
    query(collection(db, "usuarios"), where("nombre", "==", nombre))
  );
  const usuarioDoc = usuariosSnap.docs[0];
  if (usuarioDoc) {
    await updateDoc(doc(db, "usuarios", usuarioDoc.id), {
      estado: "baneado",
    });
  }
};