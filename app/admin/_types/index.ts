export interface Subject {
  id: string;
  nombre: string;
  descripcion: string;
  semestre: number | 'Electiva';
  estado: 'active' | 'inactive';
  createdAt: Date;
  imagenUrl?: string;
  updatedAt?: Date;
  createdBy?: string;
}

export type AdminStackParamList = {
  Admin: undefined;
  ManageUsers: undefined;
  Reports: undefined;
  ManageSubjects: undefined;
  CreateSubject: undefined;
  EditSubject: { subject: Subject };
};

export type SemestreOption = number | 'Electiva';

export default {};