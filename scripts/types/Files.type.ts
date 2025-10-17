export interface TipoArchivo {
  id: string;
  nombre: string;
  extensiones: string[];
  mimetype: string[];
  activo: boolean;
}

export interface Archivo {
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
}