import { db } from '@/firebase';
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { useEffect } from 'react';

const MAX_IN_VALUES = 30;

const chunkArray = <T,>(items: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
};

export const useCalcularSemestre = (
  userId: string | undefined,
  materiasInscritas: string[]
) => {
  useEffect(() => {
    if (!userId) return;

    const calcularYActualizarSemestre = async () => {
      try {
        
        if (!materiasInscritas || materiasInscritas.length === 0) {
          const userRef = doc(db, 'usuarios', userId);
          await updateDoc(userRef, { 
            semestre: 0,
            semestres: []
          });
          return;
        }

        const materiasIds = Array.from(
          new Set((materiasInscritas || []).filter((id) => typeof id === 'string' && id.trim() !== ''))
        );

        const materiasRef = collection(db, 'materias');
        const idChunks = chunkArray(materiasIds, MAX_IN_VALUES);
        const snapshots = await Promise.all(
          idChunks.map((chunk) =>
            getDocs(query(materiasRef, where('__name__', 'in', chunk)))
          )
        );
        
        const semestresSet = new Set<number>();
        let semestreMaximo = 0;
        
        snapshots.forEach((snapshot) => {
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
