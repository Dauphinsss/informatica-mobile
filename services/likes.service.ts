import { db } from "@/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export const likesService = {
  async actualizarEstadisticasUsuario(
    usuarioUid: string,
    cambios: Record<string, number>
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
      console.error("Error actualizando estadisticasUsuario:", error);
    }
  },

  async darLike(
    autorUid: string,
    publicacionId?: string,
    comentarioId?: string
  ): Promise<boolean> {
    try {
      let field: "publicacionId" | "comentarioId";
      let value: string;

      if (publicacionId) {
        field = "publicacionId";
        value = publicacionId;
      } else if (comentarioId) {
        field = "comentarioId";
        value = comentarioId;
      } else {
        throw new Error("Se debe proporcionar publicacionId o comentarioId");
      }

      const q = query(
        collection(db, "likes"),
        where("autorUid", "==", autorUid),
        where(field, "==", value)
      );

      const existingLikes = await getDocs(q);

      if (!existingLikes.empty) {
        await this.quitarLike(autorUid, publicacionId, comentarioId);
        return false;
      }

      const likeData: any = {
        autorUid,
        fechaCreacion: Timestamp.now(),
      };

      if (publicacionId) {
        likeData.publicacionId = publicacionId;
      } else {
        likeData.comentarioId = comentarioId;
      }

      await addDoc(collection(db, "likes"), likeData);

      if (publicacionId) {
        await updateDoc(doc(db, "publicaciones", publicacionId), {
          totalCalificaciones: increment(1),
        });
        await this.actualizarEstadisticasUsuario(autorUid, {
          likesEnPublicaciones: 1,
        });
      } else if (comentarioId) {
        await updateDoc(doc(db, "comentarios", comentarioId), {
          likes: increment(1),
        });
        await this.actualizarEstadisticasUsuario(autorUid, {
          likesEnComentarios: 1,
        });
      }

      return true;
    } catch (error) {
      console.error("Error dando like:", error);
      throw error;
    }
  },

  async quitarLike(
    autorUid: string,
    publicacionId?: string,
    comentarioId?: string
  ): Promise<void> {
    try {
      let field: "publicacionId" | "comentarioId";
      let value: string;

      if (publicacionId) {
        field = "publicacionId";
        value = publicacionId;
      } else if (comentarioId) {
        field = "comentarioId";
        value = comentarioId;
      } else {
        throw new Error("Se debe proporcionar publicacionId o comentarioId");
      }

      const q = query(
        collection(db, "likes"),
        where("autorUid", "==", autorUid),
        where(field, "==", value)
      );

      const querySnapshot = await getDocs(q);

      const deletePromises = querySnapshot.docs.map((docSnapshot) =>
        deleteDoc(doc(db, "likes", docSnapshot.id))
      );

      await Promise.all(deletePromises);

      if (publicacionId) {
        await updateDoc(doc(db, "publicaciones", publicacionId), {
          totalCalificaciones: increment(-1),
        });
        await this.actualizarEstadisticasUsuario(autorUid, {
          likesEnPublicaciones: -1,
        });
      } else if (comentarioId) {
        await updateDoc(doc(db, "comentarios", comentarioId), {
          likes: increment(-1),
        });
        await this.actualizarEstadisticasUsuario(autorUid, {
          likesEnComentarios: -1,
        });
      }
    } catch (error) {
      console.error("Error quitando like:", error);
      throw error;
    }
  },

  async verificarLikeUsuario(
    autorUid: string,
    publicacionId?: string,
    comentarioId?: string
  ): Promise<boolean> {
    try {
      let field: "publicacionId" | "comentarioId";
      let value: string;

      if (publicacionId) {
        field = "publicacionId";
        value = publicacionId;
      } else if (comentarioId) {
        field = "comentarioId";
        value = comentarioId;
      } else {
        return false;
      }

      const q = query(
        collection(db, "likes"),
        where("autorUid", "==", autorUid),
        where(field, "==", value)
      );

      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error verificando like:", error);
      return false;
    }
  },

  async obtenerCantidadLikes(
    publicacionId?: string,
    comentarioId?: string
  ): Promise<number> {
    try {
      let field: "publicacionId" | "comentarioId";
      let value: string;

      if (publicacionId) {
        field = "publicacionId";
        value = publicacionId;
      } else if (comentarioId) {
        field = "comentarioId";
        value = comentarioId;
      } else {
        return 0;
      }

      const q = query(collection(db, "likes"), where(field, "==", value));

      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error("Error obteniendo likes:", error);
      return 0;
    }
  },
};
