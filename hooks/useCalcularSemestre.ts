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
          await updateDoc(userRef, { 
            semestre: 0,
            semestres: []
          });
          return;
        }

        const materiasRef = collection(db, 'materias');
        const q = query(
          materiasRef,
          where('__name__', 'in', materiasInscritas)
        );
        
        const snapshot = await getDocs(q);
        
        const semestresSet = new Set<number>();
        let semestreMaximo = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          const semestre = Number(data.semestre) || 0;
          
          if (semestre > 0 && semestre < 10) {
            semestresSet.add(semestre);
            if (semestre > semestreMaximo) {
              semestreMaximo = semestre;
            }
          }
        });

        const semestresArray = Array.from(semestresSet).sort((a, b) => a - b);

        const userRef = doc(db, 'usuarios', userId);
        await updateDoc(userRef, { 
          semestre: semestreMaximo,
          semestres: semestresArray
        });
        
      } catch (error) {
        console.error('Error al calcular semestre:', error);
      }
    };

    calcularYActualizarSemestre();
  }, [userId, JSON.stringify(materiasInscritas)]);
};
