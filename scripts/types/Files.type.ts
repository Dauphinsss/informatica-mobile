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
  descripcion: string | null;
  webUrl: string;
  filepath: string | null;
  tamanoBytes: number;
  fechaSubida: Date;
  activo: boolean;
  esEnlaceExterno?: boolean;
}