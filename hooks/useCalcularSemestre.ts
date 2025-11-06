import { db } from '@/firebase';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect } from 'react';

export const useCalcularSemestre = (
  userId: string | undefined,
  materiasInscritas: string[]
) => {
  useEffect(() => {
    if (!userId) return;

    const calcularYActualizarSemestre = async () => {
      try {
        // Si no tiene materias inscritas, semestre = 0
        if (!materiasInscritas || materiasInscritas.length === 0) {
          const userRef = doc(db, 'usuarios', userId);
          await updateDoc(userRef, { semestre: 0 });
          return;
        }

        const materiasRef = collection(db, 'materias');
        const q = query(
          materiasRef,
          where('__name__', 'in', materiasInscritas)
        );
        
        const snapshot = await getDocs(q);
        
        let semestreMaximo = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          const semestre = Number(data.semestre) || 0;
          
          if (semestre > 0 && semestre < 10 && semestre > semestreMaximo) {
            semestreMaximo = semestre;
          }
        });

        // Actualizar el semestre del usuario en Firestore
        const userRef = doc(db, 'usuarios', userId);
        await updateDoc(userRef, { semestre: semestreMaximo });
        
      } catch (error) {
        console.error('Error al calcular semestre:', error);
      }
    };

    calcularYActualizarSemestre();
  }, [userId, materiasInscritas.length]);
};
