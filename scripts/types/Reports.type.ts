export type ReportStatus = 'pendiente' | 'completado';
export type FilterType = 'pendientes' | 'completados' | 'todos';

export interface Report {
  id: string;
  publicacionId: string;
  titulo: string;
  autor: string;
  autorUid: string;
  totalReportes: number;
  ultimoMotivo: string;
  ultimoReportadoPor: string;
  ultimaFecha: string;
  contenido: string;
  estado: ReportStatus;
  ultimaFechaTimestamp?: number;
  reportadores: Array<{
    usuario: string;
    motivo: string;
    fecha: string;
    fechaTimestamp?: number;
  }>;
  strikesAutor: number;
  decision?: string;
  fechaDecision?: string;
}