export interface Comment {
  id: string;
  publicacionId: string;
  autorUid: string;
  autorNombre: string;
  autorFoto?: string | null;
  contenido: string;
  fechaCreacion: Date;
  estado: "activo" | "eliminado";
  likes: number;
  respuestas?: Comment[];
  comentarioPadreId?: string; // Para comentarios anidados
  nivel: number; // 0: comentario principal, 1: respuesta, etc.
}

export interface Like {
  id: string;
  publicacionId?: string;
  comentarioId?: string;
  autorUid: string;
  fechaCreacion: Date;
}
