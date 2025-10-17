export interface Publicacion {
  id: string;
  materiaId: string;
  autorUid: string;
  autorNombre: string;
  titulo: string;
  descripcion: string;
  fechaPublicacion: Date;
  vistas: number;
  totalCalificaciones: number;
  totalComentarios: number;
  estado: "activo" | "eliminado";
}

export interface ArchivoPublicacion {
  id: string;
  publicacionId: string;
  tipoArchivoId: string;
  titulo: string;
  descripcion?: string;
  webUrl: string;
  filepath: string;
  tamanoBytes: number;
  fechaSubida: Date;
  activo: boolean;
  tipoNombre?: string;
  extension?: string;
}