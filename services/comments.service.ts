import { Comment } from "@/app/subjects/types/comment.type";
import { db } from "@/firebase";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export const comentariosService = {
  async actualizarEstadisticasUsuario(
    usuarioUid: string,
    cambios: Record<string, number>,
  ) {
    try {
      if (!usuarioUid) return;
      const data: Record<string, any> = {};
      Object.entries(cambios).forEach(([key, value]) => {
        data[key] = increment(value);
      });

      await setDoc(doc(db, "estadisticasUsuario", usuarioUid), data, {
        merge: true,
      });
    } catch (error) {
      console.error(
        "Error actualizando estadisticasUsuario (comentariosService):",
        error,
      );
    }
  },

  async obtenerComentariosPorPublicacion(
    publicacionId: string,
  ): Promise<Comment[]> {
    try {
      const q = query(
        collection(db, "comentarios"),
        where("publicacionId", "==", publicacionId),
        where("estado", "==", "activo"),
        orderBy("fechaCreacion", "asc"),
      );

      const querySnapshot = await getDocs(q);
      const comentarios: Comment[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        comentarios.push({
          id: docSnap.id,
          ...data,
          fechaCreacion: data.fechaCreacion.toDate(),
        } as Comment);
      });

      return this.organizarComentarios(comentarios);
    } catch (error) {
      console.error("Error obteniendo comentarios:", error);
      throw error;
    }
  },

  organizarComentarios(comentarios: Comment[]): Comment[] {
    const comentariosMap = new Map<string, Comment>();
    const comentariosPrincipales: Comment[] = [];

    comentarios.forEach((comment) => {
      comentariosMap.set(comment.id, { ...comment, respuestas: [] });
    });

    comentarios.forEach((comment) => {
      const commentWithReplies = comentariosMap.get(comment.id)!;

      if (comment.comentarioPadreId) {
        const parent = comentariosMap.get(comment.comentarioPadreId);
        if (parent) {
          parent.respuestas = parent.respuestas || [];
          parent.respuestas.push(commentWithReplies);
        }
      } else {
        comentariosPrincipales.push(commentWithReplies);
      }
    });

    return comentariosPrincipales;
  },

  async crearComentario(
    comentario: Omit<Comment, "id" | "fechaCreacion">,
  ): Promise<string> {
    try {
      const comentarioData = {
        ...comentario,
        autorFoto: comentario.autorFoto || null,
        comentarioPadreId: comentario.comentarioPadreId || null,
        fechaCreacion: Timestamp.now(),
        estado: "activo",
        likes: 0,
      };

      const docRef = await addDoc(
        collection(db, "comentarios"),
        comentarioData,
      );

      await updateDoc(doc(db, "publicaciones", comentario.publicacionId), {
        totalComentarios: increment(1),
      });

      if (comentario.autorUid) {
        if (comentario.comentarioPadreId) {
          await this.actualizarEstadisticasUsuario(comentario.autorUid, {
            respuestasRealizadas: 1,
          });
        } else {
          await this.actualizarEstadisticasUsuario(comentario.autorUid, {
            comentariosRealizados: 1,
          });
        }
      }

      return docRef.id;
    } catch (error) {
      console.error("Error creando comentario:", error);
      throw error;
    }
  },

  async eliminarComentario(
    comentarioId: string,
    publicacionId: string,
  ): Promise<void> {
    try {
      const comentarioSnap = await getDoc(doc(db, "comentarios", comentarioId));
      const comentarioData = comentarioSnap.exists()
        ? (comentarioSnap.data() as any)
        : null;
      const autorUid: string | null = comentarioData?.autorUid ?? null;
      const isRespuesta = !!comentarioData?.comentarioPadreId;

      await updateDoc(doc(db, "comentarios", comentarioId), {
        estado: "eliminado",
      });

      await updateDoc(doc(db, "publicaciones", publicacionId), {
        totalComentarios: increment(-1),
      });

      if (autorUid) {
        if (isRespuesta) {
          await this.actualizarEstadisticasUsuario(autorUid, {
            respuestasRealizadas: -1,
          });
        } else {
          await this.actualizarEstadisticasUsuario(autorUid, {
            comentariosRealizados: -1,
          });
        }
      }
    } catch (error) {
      console.error("Error eliminando comentario:", error);
      throw error;
    }
  },

  async darLikeComentario(
    commentId: string,
    usuarioUid: string,
  ): Promise<void> {
    try {
      const likeRef = collection(db, "likes");
      const q = query(
        likeRef,
        where("comentarioId", "==", commentId),
        where("autorUid", "==", usuarioUid),
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        await addDoc(likeRef, {
          comentarioId: commentId,
          autorUid: usuarioUid,
          fechaCreacion: Timestamp.now(),
        });

        await updateDoc(doc(db, "comentarios", commentId), {
          likes: increment(1),
        });

        await this.actualizarEstadisticasUsuario(usuarioUid, {
          likesEnComentarios: 1,
        });
      } else {
        await this.quitarLikeComentario(commentId, usuarioUid);
      }
    } catch (error) {
      console.error("Error dando like a comentario:", error);
      throw error;
    }
  },

  async quitarLikeComentario(
    commentId: string,
    usuarioUid: string,
  ): Promise<void> {
    try {
      const likeRef = collection(db, "likes");
      const q = query(
        likeRef,
        where("comentarioId", "==", commentId),
        where("autorUid", "==", usuarioUid),
      );

      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map((docSnap) =>
        deleteDoc(docSnap.ref),
      );

      await Promise.all(deletePromises);

      await updateDoc(doc(db, "comentarios", commentId), {
        likes: increment(-1),
      });

      await this.actualizarEstadisticasUsuario(usuarioUid, {
        likesEnComentarios: -1,
      });
    } catch (error) {
      console.error("Error quitando like de comentario:", error);
      throw error;
    }
  },

  suscribirseALikesComentario(
    commentId: string,
    callback: (likes: number, userLiked: boolean) => void,
  ) {
    const usuarioUid = getAuth().currentUser?.uid;

    const likesQuery = query(
      collection(db, "likes"),
      where("comentarioId", "==", commentId),
    );

    return onSnapshot(likesQuery, (snapshot) => {
      const likesCount = snapshot.size;
      const userLiked = usuarioUid
        ? snapshot.docs.some((doc) => doc.data().autorUid === usuarioUid)
        : false;

      callback(likesCount, userLiked);
    });
  },

  suscribirseAComentarios(
    publicacionId: string,
    callback: (comentarios: Comment[]) => void,
  ): () => void {
    try {
      const q = query(
        collection(db, "comentarios"),
        where("publicacionId", "==", publicacionId),
        where("estado", "==", "activo"),
        orderBy("fechaCreacion", "asc"),
      );

      return onSnapshot(q, (querySnapshot) => {
        const comentarios: Comment[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          comentarios.push({
            id: doc.id,
            ...data,
            autorRol: data.autorRol || "usuario",
            fechaCreacion: data.fechaCreacion.toDate(),
          } as Comment);
        });

        const comentariosOrganizados = this.organizarComentarios(comentarios);
        callback(comentariosOrganizados);
      });
    } catch (error) {
      console.error("Error en suscripción a comentarios:", error);
      return () => {};
    }
  },

  suscribirseAComentario(
    comentarioId: string,
    callback: (comentario: Comment | null) => void,
  ): () => void {
    try {
      return onSnapshot(doc(db, "comentarios", comentarioId), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const comentario: Comment = {
            id: docSnapshot.id,
            ...data,
            fechaCreacion: data.fechaCreacion.toDate(),
          } as Comment;
          callback(comentario);
        } else {
          callback(null);
        }
      });
    } catch (error) {
      console.error("Error en suscripción a comentario:", error);
      return () => {};
    }
  },

  suscribirseAContadorComentarios(
    publicacionId: string,
    callback: (count: number) => void,
  ): () => void {
    try {
      const q = query(
        collection(db, "comentarios"),
        where("publicacionId", "==", publicacionId),
        where("estado", "==", "activo"),
      );

      return onSnapshot(q, (querySnapshot) => {
        callback(querySnapshot.size);
      });
    } catch (error) {
      console.error("Error en suscripción a contador:", error);
      return () => {};
    }
  },
};
