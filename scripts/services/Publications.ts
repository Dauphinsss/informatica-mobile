import { db } from "@/firebase";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
} from "firebase/firestore";
import { ArchivoPublicacion, Publicacion } from "../types/Publication.type";

const ADMIN_ROLE_VALUES = new Set(["admin", "administrador", "administrator"]);
const authorRoleCache = new Map<string, "admin" | "usuario">();

const normalizeAuthorRole = (role?: string | null): "admin" | "usuario" => {
  const normalized = String(role || "")
    .trim()
    .toLowerCase();
  return ADMIN_ROLE_VALUES.has(normalized) ? "admin" : "usuario";
};

const hydratePublicationsAuthorRoles = async (
  publicaciones: Publicacion[],
): Promise<Publicacion[]> => {
  const missingRoleAuthorIds = Array.from(
    new Set(
      publicaciones
        .filter((pub) => normalizeAuthorRole(pub.autorRol) !== "admin")
        .map((pub) => pub.autorUid)
        .filter((uid): uid is string => typeof uid === "string" && uid !== ""),
    ),
  ).filter((uid) => !authorRoleCache.has(uid));

  if (missingRoleAuthorIds.length > 0) {
    await Promise.all(
      missingRoleAuthorIds.map(async (uid) => {
        try {
          const userSnap = await getDoc(doc(db, "usuarios", uid));
          const role = userSnap.exists()
            ? normalizeAuthorRole(userSnap.data()?.rol)
            : "usuario";
          authorRoleCache.set(uid, role);
        } catch {
          authorRoleCache.set(uid, "usuario");
        }
      }),
    );
  }

  return publicaciones.map((pub) => {
    const current = normalizeAuthorRole(pub.autorRol);
    if (current === "admin") {
      return { ...pub, autorRol: "admin" };
    }

    const cached = pub.autorUid ? authorRoleCache.get(pub.autorUid) : undefined;
    return {
      ...pub,
      autorRol: cached || "usuario",
    };
  });
};

export const crearPublicacion = async (
  materiaId: string,
  autorUid: string,
  autorNombre: string,
  autorFoto: string | null,
  titulo: string,
  descripcion: string,
  autorRol?: string,
): Promise<string> => {
  try {
    const autorRolNormalizado = normalizeAuthorRole(autorRol);
    const estadoInicial = autorRolNormalizado === "admin" ? "activo" : "pendiente";

    const publicacionData = {
      materiaId,
      autorUid,
      autorNombre,
      autorFoto: autorFoto || null,
      autorRol: autorRolNormalizado,
      titulo,
      descripcion,
      fechaPublicacion: Timestamp.now(),
      vistas: 0,
      totalCalificaciones: 0,
      totalComentarios: 0,
      estado: estadoInicial,
    };

    const docRef = await addDoc(
      collection(db, "publicaciones"),
      publicacionData,
    );
    return docRef.id;
  } catch (error) {
    console.error("Error al crear publicación:", error);
    throw error;
  }
};

export const obtenerPublicacionesPorMateria = async (
  materiaId: string,
): Promise<Publicacion[]> => {
  const publicaciones: Publicacion[] = [];
  try {
    const publicacionesSnap = await getDocs(
      query(
        collection(db, "publicaciones"),
        where("materiaId", "==", materiaId),
        where("estado", "==", "activo"),
        orderBy("fechaPublicacion", "desc"),
      ),
    );

    publicacionesSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      publicaciones.push({
        id: docSnap.id,
        ...data,
        autorFoto: data.autorFoto ?? null,
        autorRol: normalizeAuthorRole(data.autorRol),
        fechaPublicacion: data.fechaPublicacion.toDate(),
      } as Publicacion);
    });

    return await hydratePublicationsAuthorRoles(publicaciones);
  } catch (error) {
    console.error("Error al obtener publicaciones:", error);
  }
  return publicaciones;
};

export const obtenerPublicacionPorId = async (
  publicacionId: string,
): Promise<Publicacion | null> => {
  try {
    const publicacionDoc = await getDoc(
      doc(db, "publicaciones", publicacionId),
    );
    if (publicacionDoc.exists()) {
      const data = publicacionDoc.data();
      const publication = {
        id: publicacionDoc.id,
        ...data,
        autorFoto: data.autorFoto ?? null,
        autorRol: normalizeAuthorRole(data.autorRol),
        fechaPublicacion: data.fechaPublicacion.toDate(),
      } as Publicacion;
      const [hydrated] = await hydratePublicationsAuthorRoles([publication]);
      return hydrated || publication;
    }
  } catch (error) {
    console.error("Error al obtener publicación:", error);
  }
  return null;
};

export const obtenerArchivosConTipo = async (
  publicacionId: string,
): Promise<ArchivoPublicacion[]> => {
  const archivos: ArchivoPublicacion[] = [];
  try {
    const archivosSnap = await getDocs(
      query(
        collection(db, "archivos"),
        where("publicacionId", "==", publicacionId),
        where("activo", "==", true),
      ),
    );

    const tiposIds = new Set<string>();
    archivosSnap.docs.forEach((doc) => {
      tiposIds.add(doc.data().tipoArchivoId);
    });

    const tiposCache = new Map<string, any>();
    await Promise.all(
      Array.from(tiposIds).map(async (tipoId) => {
        const tipoDoc = await getDoc(doc(db, "tiposArchivo", tipoId));
        if (tipoDoc.exists()) {
          tiposCache.set(tipoId, tipoDoc.data());
        }
      }),
    );

    archivosSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const tipoInfo = tiposCache.get(data.tipoArchivoId);

      archivos.push({
        id: docSnap.id,
        ...data,
        fechaSubida: data.fechaSubida.toDate(),
        tipoNombre: tipoInfo?.nombre || "Archivo",
        extension: tipoInfo?.extensiones?.[0] || "",
        esEnlaceExterno: data.esEnlaceExterno || false,
      } as ArchivoPublicacion);
    });

    archivos.sort((a, b) => {
      const ordenA =
        typeof a.orden === "number" ? a.orden : Number.MAX_SAFE_INTEGER;
      const ordenB =
        typeof b.orden === "number" ? b.orden : Number.MAX_SAFE_INTEGER;

      if (ordenA !== ordenB) {
        return ordenA - ordenB;
      }

      return (
        (a.fechaSubida instanceof Date ? a.fechaSubida.getTime() : 0) -
        (b.fechaSubida instanceof Date ? b.fechaSubida.getTime() : 0)
      );
    });
  } catch (error) {
    console.error("Error al obtener archivos:", error);
  }
  return archivos;
};

export const incrementarVistas = async (
  publicacionId: string,
): Promise<void> => {
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

export const eliminarPublicacion = async (
  publicacionId: string,
): Promise<void> => {
  try {
    await updateDoc(doc(db, "publicaciones", publicacionId), {
      estado: "eliminado",
    });
  } catch (error) {
    console.error("Error al eliminar publicación:", error);
    throw error;
  }
};

export const obtenerPublicacionesPorAutor = async (
  autorUid: string,
): Promise<Publicacion[]> => {
  const publicaciones: Publicacion[] = [];
  try {
    const publicacionesSnap = await getDocs(
      query(
        collection(db, "publicaciones"),
        where("autorUid", "==", autorUid),
        where("estado", "==", "activo"),
        orderBy("fechaPublicacion", "desc"),
      ),
    );
    publicacionesSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      publicaciones.push({
        id: docSnap.id,
        ...data,
        autorFoto: data.autorFoto ?? null,
        autorRol: normalizeAuthorRole(data.autorRol),
        fechaPublicacion: data.fechaPublicacion.toDate(),
      } as Publicacion);
    });
    return await hydratePublicationsAuthorRoles(publicaciones);
  } catch (error) {
    console.error("Error al obtener publicaciones por autor:", error);
  }
  return publicaciones;
};

export function escucharPublicacionesPorAutor(
  autorUid: string,
  callback: (publicaciones: Publicacion[]) => void,
): Unsubscribe {
  const publicacionesQuery = query(
    collection(db, "publicaciones"),
    where("autorUid", "==", autorUid),
    where("estado", "==", "activo"),
    orderBy("fechaPublicacion", "desc"),
  );
  return onSnapshot(publicacionesQuery, (pubsSnap) => {
    void (async () => {
      const pubs = pubsSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          autorFoto: data.autorFoto ?? null,
          autorRol: normalizeAuthorRole(data.autorRol),
          fechaPublicacion: data.fechaPublicacion.toDate(),
        } as Publicacion;
      });
      callback(await hydratePublicationsAuthorRoles(pubs));
    })();
  });
}

export function escucharPublicacionesPorMateria(
  materiaId: string,
  callback: (publicaciones: Publicacion[]) => void,
): Unsubscribe {
  const publicacionesQuery = query(
    collection(db, "publicaciones"),
    where("materiaId", "==", materiaId),
    where("estado", "==", "activo"),
    orderBy("fechaPublicacion", "desc"),
  );
  return onSnapshot(publicacionesQuery, (pubsSnap) => {
    void (async () => {
      const pubs = pubsSnap.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          autorFoto: data.autorFoto ?? null,
          autorRol: normalizeAuthorRole(data.autorRol),
          fechaPublicacion: data.fechaPublicacion.toDate(),
        } as Publicacion;
      });
      callback(await hydratePublicationsAuthorRoles(pubs));
    })();
  });
}

export function escucharUltimasPublicaciones(
  cantidad: number,
  callback: (publicaciones: Publicacion[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const publicacionesQuery = query(
    collection(db, "publicaciones"),
    where("estado", "==", "activo"),
    orderBy("fechaPublicacion", "desc"),
    limit(cantidad),
  );
  return onSnapshot(
    publicacionesQuery,
    (pubsSnap) => {
      void (async () => {
        const pubs = pubsSnap.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            autorFoto: data.autorFoto ?? null,
            autorRol: normalizeAuthorRole(data.autorRol),
            fechaPublicacion: data.fechaPublicacion.toDate(),
          } as Publicacion;
        });
        callback(await hydratePublicationsAuthorRoles(pubs));
      })();
    },
    (error) => {
      console.error("Error en escucharUltimasPublicaciones:", error);
      if (onError) onError(error);
    },
  );
}
