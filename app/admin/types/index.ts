export interface Subject {
  id: string;
  nombre: string;
  descripcion: string;
  semestre: number;
  estado: 'active' | 'inactive';
  createdAt: Date;
}

export type AdminStackParamList = {
  Admin: undefined;
  ManageUsers: undefined;
  Reports: undefined;
  ManageSubjects: undefined;
};