import { Comment } from "@/app/subjects/types/comment.type";
import { db } from "@/firebase";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export const comentariosService = {
  // Obtener comentarios de una publicación
  async obtenerComentariosPorPublicacion(
    publicacionId: string
  ): Promise<Comment[]> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        console.error("Usuario no autenticado");
        throw new Error("Usuario no autenticado");
      }

      const q = query(
        collection(db, "comentarios"),
        where("publicacionId", "==", publicacionId),
        where("estado", "==", "activo"),
        orderBy("fechaCreacion", "asc")
      );

      const querySnapshot = await getDocs(q);

      const comentarios: Comment[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        comentarios.push({
          id: doc.id,
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

  // Organizar comentarios en estructura jerárquica
  organizarComentarios(comentarios: Comment[]): Comment[] {
    const comentariosMap = new Map<string, Comment>();
    const comentariosPrincipales: Comment[] = [];

    // Primero, mapear todos los comentarios
    comentarios.forEach((comment) => {
      comentariosMap.set(comment.id, { ...comment, respuestas: [] });
    });

    // Luego, organizar la jerarquía
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

  // Crear nuevo comentario
  async crearComentario(
    comentario: Omit<Comment, "id" | "fechaCreacion">
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "comentarios"), {
        ...comentario,
        fechaCreacion: Timestamp.now(),
        estado: "activo",
        likes: 0,
      });

      // Actualizar contador de comentarios en la publicación
      await updateDoc(doc(db, "publicaciones", comentario.publicacionId), {
        totalComentarios: increment(1),
      });

      return docRef.id;
    } catch (error) {
      console.error("Error creando comentario:", error);
      throw error;
    }
  },

  // Eliminar comentario (soft delete)
  async eliminarComentario(
    comentarioId: string,
    publicacionId: string
  ): Promise<void> {
    try {
      await updateDoc(doc(db, "comentarios", comentarioId), {
        estado: "eliminado",
      });

      // Actualizar contador de comentarios
      await updateDoc(doc(db, "publicaciones", publicacionId), {
        totalComentarios: increment(-1),
      });
    } catch (error) {
      console.error("Error eliminando comentario:", error);
      throw error;
    }
  },

  async darLikeComentario(
    commentId: string,
    usuarioUid: string
  ): Promise<void> {
    const likeRef = collection(db, "commentLikes");
    const q = query(
      likeRef,
      where("commentId", "==", commentId),
      where("usuarioUid", "==", usuarioUid)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      await addDoc(likeRef, {
        commentId,
        usuarioUid,
        fecha: new Date(),
      });
    }
  },

  // Quitar like de un comentario
  async quitarLikeComentario(
    commentId: string,
    usuarioUid: string
  ): Promise<void> {
    const likeRef = collection(db, "commentLikes");
    const q = query(
      likeRef,
      where("commentId", "==", commentId),
      where("usuarioUid", "==", usuarioUid)
    );

    const snapshot = await getDocs(q);
    snapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  },

  // Obtener likes en tiempo real
  suscribirseALikesComentario(
    commentId: string,
    callback: (likes: number, userLiked: boolean) => void
  ) {
    const usuarioUid = getAuth().currentUser?.uid;
    const likesQuery = query(
      collection(db, "commentLikes"),
      where("commentId", "==", commentId)
    );

    return onSnapshot(likesQuery, (snapshot) => {
      const likesCount = snapshot.size;
      const userLiked = usuarioUid
        ? snapshot.docs.some((doc) => doc.data().usuarioUid === usuarioUid)
        : false;

      callback(likesCount, userLiked);
    });
  },
};
