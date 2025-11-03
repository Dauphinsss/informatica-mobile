import { db } from '@/firebase';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  query,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';

export const likesService = {
  async darLike(autorUid: string, publicacionId?: string, comentarioId?: string): Promise<boolean> {
    try {
      let field, value;
      
      if (publicacionId) {
        field = 'publicacionId';
        value = publicacionId;
      } else if (comentarioId) {
        field = 'comentarioId';
        value = comentarioId;
      } else {
        throw new Error('Se debe proporcionar publicacionId o comentarioId');
      }

      // Verificar si ya existe el like
      const q = query(
        collection(db, 'likes'),
        where('autorUid', '==', autorUid),
        where(field, '==', value)
      );
      
      const existingLikes = await getDocs(q);
      
      if (!existingLikes.empty) {
        await this.quitarLike(autorUid, publicacionId, comentarioId);
        return false;
      }
      
      // Crear nuevo like
      const likeData: any = {
        autorUid,
        fechaCreacion: Timestamp.now()
      };
      
      if (publicacionId) {
        likeData.publicacionId = publicacionId;
      } else {
        likeData.comentarioId = comentarioId;
      }

      await addDoc(collection(db, 'likes'), likeData);
      
      // Actualizar contador
      if (publicacionId) {
        await updateDoc(doc(db, 'publicaciones', publicacionId), {
          totalCalificaciones: increment(1)
        });
      } else if (comentarioId) {
        await updateDoc(doc(db, 'comentarios', comentarioId), {
          likes: increment(1)
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error dando like:', error);
      throw error;
    }
  },

  async quitarLike(autorUid: string, publicacionId?: string, comentarioId?: string): Promise<void> {
    try {
      let field, value;
      
      if (publicacionId) {
        field = 'publicacionId';
        value = publicacionId;
      } else if (comentarioId) {
        field = 'comentarioId';
        value = comentarioId;
      } else {
        throw new Error('Se debe proporcionar publicacionId o comentarioId');
      }

      const q = query(
        collection(db, 'likes'),
        where('autorUid', '==', autorUid),
        where(field, '==', value)
      );
      
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(docSnapshot => 
        deleteDoc(doc(db, 'likes', docSnapshot.id))
      );
      
      await Promise.all(deletePromises);
      
      if (publicacionId) {
        await updateDoc(doc(db, 'publicaciones', publicacionId), {
          totalCalificaciones: increment(-1)
        });
      } else if (comentarioId) {
        await updateDoc(doc(db, 'comentarios', comentarioId), {
          likes: increment(-1)
        });
      }
    } catch (error) {
      console.error('Error quitando like:', error);
      throw error;
    }
  },

  async verificarLikeUsuario(autorUid: string, publicacionId?: string, comentarioId?: string): Promise<boolean> {
    try {
      let field, value;
      
      if (publicacionId) {
        field = 'publicacionId';
        value = publicacionId;
      } else if (comentarioId) {
        field = 'comentarioId';
        value = comentarioId;
      } else {
        return false;
      }

      const q = query(
        collection(db, 'likes'),
        where('autorUid', '==', autorUid),
        where(field, '==', value)
      );
      
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error verificando like:', error);
      return false;
    }
  },

  async obtenerCantidadLikes(publicacionId?: string, comentarioId?: string): Promise<number> {
    try {
      let field, value;
      
      if (publicacionId) {
        field = 'publicacionId';
        value = publicacionId;
      } else if (comentarioId) {
        field = 'comentarioId';
        value = comentarioId;
      } else {
        return 0;
      }

      const q = query(
        collection(db, 'likes'),
        where(field, '==', value)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error obteniendo likes:', error);
      return 0;
    }
  }
};