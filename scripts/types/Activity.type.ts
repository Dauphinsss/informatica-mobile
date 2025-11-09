import { Timestamp } from "firebase/firestore";

export type ActivityType = 
  | 'usuario_registrado'
  | 'publicacion_creada'
  | 'materia_creada'
  | 'publicacion_reportada'
  | 'publicacion_eliminada'
  | 'publicacion_aprobada'
  | 'usuario_baneado'
  | 'usuario_desbaneado';

export interface ActivityLog {
  id: string;
  tipo: ActivityType;
  titulo: string;
  descripcion: string;
  timestamp: Timestamp;
  actorUid?: string;
  actorNombre?: string;
  relacionadoUid?: string;
  metadata?: {
    [key: string]: any;
  };
}

export interface ActivityIcon {
  name: string;
  color: string;
  backgroundColor: string;
}