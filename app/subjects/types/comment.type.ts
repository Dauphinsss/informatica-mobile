export interface Comment {
  id: string;
  publicacionId: string;
  autorUid: string;
  autorNombre: string;
  autorFoto?: string | null;
  autorRol?: string;
  contenido: string;
  fechaCreacion: Date;
  estado: "activo" | "eliminado";
  likes: number;
  respuestas?: Comment[];
  comentarioPadreId?: string | null;
  nivel: number;
}

export interface Like {
  id: string;
  publicacionId?: string;
  comentarioId?: string;
  autorUid: string;
  fechaCreacion: Date;
}
