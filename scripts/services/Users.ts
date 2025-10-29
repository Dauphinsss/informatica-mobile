import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "@/firebase";

export const crearEstadisticasUsuario = async (usuarioUid: string) => {
  const estadisticasSnap = await getDocs(query(collection(db, "estadisticasUsuario"), where("usuarioUid", "==", usuarioUid)));
  if (estadisticasSnap.empty) {
    await setDoc(doc(db, "estadisticasUsuario", usuarioUid), {
      archivosDescargados: 0,
      comentariosRealizados: 0,
      publicacionesCreadas: 0,
      publicacionesReportadas: 0,
      reportesRecibidos: 0,
      strikes: 0,
      uid: usuarioUid,
      usuarioUid: usuarioUid,
      valoracionesRealizadas: 0,
    });
    console.log(`Estadísticas creadas para usuario ${usuarioUid}`);
  }
};