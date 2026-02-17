export interface Publicacion {
  id: string;
  materiaId: string;
  autorUid: string;
  autorNombre: string;
  autorFoto?: string | null;
  autorRol?: string;
  titulo: string;
  descripcion: string;
  fechaPublicacion: Date;
  vistas: number;
  totalCalificaciones: number;
  totalComentarios: number;
  estado: "activo" | "pendiente" | "eliminado";
}

export interface ArchivoPublicacion {
  id: string;
  publicacionId: string;
  tipoArchivoId: string;
  titulo: string;
  descripcion: string | null;
  webUrl: string;
  filepath: string | null;
  tamanoBytes: number;
  orden?: number;
  fechaSubida: Date;
  activo: boolean;
  tipoNombre: string;
  extension: string | null;
  esEnlaceExterno?: boolean;
}
