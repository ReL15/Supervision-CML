export interface School {
  codigo: string;
  nombre: string;
  password: string;
  perfilCompletado: boolean;
  directorNombre: string;
  directorCorreo: string;
  directorTelefono: string;
  directorDui: string;
  departamento: string;
  municipio: string;
  latitud: number;
  longitud: number;
  fechaRegistro: string;
}

export interface Teacher {
  id: string;
  nombre: string;
  correo: string; // Must end in @clases.edu.sv
  telefono: string; // Formato 0000-0000
  dui: string; // Formato 00000000-0
  escuelasVinculadas: string[]; // Códigos de centros escolares
  especialidad?: string;
  fechaRegistro?: string;
}

export type GradoOficial =
  | 'Parvularia'
  | '1° Grado'
  | '2° Grado'
  | '3° Grado'
  | '4° Grado'
  | '5° Grado'
  | '6° Grado'
  | '7° Grado'
  | '8° Grado'
  | '9° Grado'
  | '1° Año de Bachillerato'
  | '2° Año de Bachillerato'
  | 'Educación Especial'
  | 'Otro';

export interface Supervision {
  id: string;
  codigoEscuela: string;
  nombreEscuela: string;
  grado: GradoOficial;
  gradoOtroDetalle?: string;
  docenteId?: string;
  docenteNombre: string;
  docenteCorreo: string;
  docenteTelefono: string;
  docenteDui: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:MM
  horaFin: string; // HH:MM
  duracionMinutos: number;
  matriculaSiges: number;
  estudiantesAsistieron: number;
  estudiantesNoAsistieron: number;
  porcentajeAsistencia: number;
  telefonosUtilizados: number;
  laptopsComputadoras: number;
  dispositivosApoyoPedagogico: number;
  totalDispositivos: number;
  f4Completados: number;
  f1Completado: 'Sí' | 'No';
  observaciones: string;
  creadoPor: 'master' | string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  role: 'master' | 'school';
  email?: string;
  schoolCode?: string;
  schoolName?: string;
  userName: string;
}

export type ActiveTab = 'dashboard' | 'form' | 'list' | 'schools' | 'teachers';
