import { db } from '@/firebase';
import { getAuth } from 'firebase/auth';
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
  // Dar like a publicación o comentario
  async darLike(autorUid: string, publicacionId?: string, comentarioId?: string): Promise<boolean> {
    try {
      // Verificar si ya existe el like
      const q = query(
        collection(db, 'likes'),
        where('autorUid', '==', autorUid),
        where(publicacionId ? 'publicacionId' : 'comentarioId', '==', publicacionId || comentarioId)
      );
      
      const existingLikes = await getDocs(q);
      
      if (!existingLikes.empty) {
        // Ya existe el like, eliminarlo (toggle)
        await this.quitarLike(autorUid, publicacionId, comentarioId);
        return false; // Like removido
      }
      
      // Crear nuevo like
      await addDoc(collection(db, 'likes'), {
        autorUid,
        publicacionId: publicacionId || null,
        comentarioId: comentarioId || null,
        fechaCreacion: Timestamp.now()
      });
      
      // Actualizar contador
      if (publicacionId) {
        await updateDoc(doc(db, 'publicaciones', publicacionId), {
          totalCalificaciones: increment(1) // Usando totalCalificaciones en lugar de totalValoraciones
        });
      } else if (comentarioId) {
        await updateDoc(doc(db, 'comentarios', comentarioId), {
          likes: increment(1)
        });
      }
      
      return true; // Like agregado
    } catch (error) {
      console.error('Error dando like:', error);
      throw error;
    }
  },

  // Quitar like
  async quitarLike(autorUid: string, publicacionId?: string, comentarioId?: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'likes'),
        where('autorUid', '==', autorUid),
        where(publicacionId ? 'publicacionId' : 'comentarioId', '==', publicacionId || comentarioId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        await deleteDoc(doc(db, 'likes', querySnapshot.docs[0].id));
        
        // Actualizar contador
        if (publicacionId) {
          await updateDoc(doc(db, 'publicaciones', publicacionId), {
            totalCalificaciones: increment(-1) // Usando totalCalificaciones
          });
        } else if (comentarioId) {
          await updateDoc(doc(db, 'comentarios', comentarioId), {
            likes: increment(-1)
          });
        }
      }
    } catch (error) {
      console.error('Error quitando like:', error);
      throw error;
    }
  },

  // Verificar si el usuario actual dio like
  async verificarLikeUsuario(autorUid: string, publicacionId?: string, comentarioId?: string): Promise<boolean> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.error('Usuario no autenticado');
        return false;
      }

      
      const field = publicacionId ? 'publicacionId' : 'comentarioId';
      const value = publicacionId || comentarioId;

      if (!value) {
        console.error('No se proporcionó ID');
        return false;
      }

      const q = query(
        collection(db, 'likes'),
        where('autorUid', '==', user.uid),
        where(field, '==', value)
      );
      
      const querySnapshot = await getDocs(q);
      const exists = !querySnapshot.empty;
      
      return exists;
    } catch (error) {
      console.error('Error verificando like:', error);
      return false;
    }
  },

  // Obtener cantidad de likes
  async obtenerCantidadLikes(publicacionId?: string, comentarioId?: string): Promise<number> {
    try {
      const q = query(
        collection(db, 'likes'),
        where(publicacionId ? 'publicacionId' : 'comentarioId', '==', publicacionId || comentarioId)
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error obteniendo likes:', error);
      return 0;
    }
  }
};