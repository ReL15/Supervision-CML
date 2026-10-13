import { School, Teacher, Supervision, UserSession } from '../types';
import { INITIAL_SCHOOLS, INITIAL_TEACHERS, INITIAL_SUPERVISIONS, MASTER_CREDENTIALS } from '../data/initialData';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const toApiUrl = (path: string) => {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path}`;
};

const STORAGE_KEYS = {
  SCHOOLS: 'mined_supervision_schools_prod_v2',
  TEACHERS: 'mined_supervision_teachers_prod_v2',
  SUPERVISIONS: 'mined_supervision_records_prod_v2',
  SESSION: 'mined_supervision_session_prod_v2',
  MASTER_PASSWORD: 'mined_supervision_master_password_prod_v2',
};
const PREVIOUS_MASTER_DEFAULT = 'Master#MINED2026';

const saveCache = <T,>(key: string, value: T[]) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const request = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  let response: Response;
  const resolvedUrl = toApiUrl(url);
  try {
    response = await fetch(resolvedUrl, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new Error('No se pudo conectar con la API. Verifique que VITE_API_BASE_URL o la API backend estén configurados.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `La API respondió con el estado ${response.status}.`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

export const initStorage = async (): Promise<void> => {
  const [schools, teachers, supervisions] = await Promise.all([
    request<School[]>('/api/schools'),
    request<Teacher[]>('/api/teachers'),
    request<Supervision[]>('/api/supervisions'),
  ]);
  saveCache(STORAGE_KEYS.SCHOOLS, schools);
  saveCache(STORAGE_KEYS.TEACHERS, teachers);
  saveCache(STORAGE_KEYS.SUPERVISIONS, supervisions);

  const savedMasterPassword = localStorage.getItem(STORAGE_KEYS.MASTER_PASSWORD);
  if (!savedMasterPassword || savedMasterPassword === PREVIOUS_MASTER_DEFAULT) {
    localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD, MASTER_CREDENTIALS.defaultPassword);
  }
};

// Master Password
export const getMasterPassword = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.MASTER_PASSWORD) || MASTER_CREDENTIALS.defaultPassword;
  } catch {
    return MASTER_CREDENTIALS.defaultPassword;
  }
};

export const setMasterPassword = (newPassword: string) => {
  localStorage.setItem(STORAGE_KEYS.MASTER_PASSWORD, newPassword);
};

export const validateMasterLogin = (email: string, passwordInput: string): boolean => {
  const normalizedEmail = email.trim().toLowerCase();
  const currentPassword = getMasterPassword();
  return (
    normalizedEmail === MASTER_CREDENTIALS.email.toLowerCase() &&
    passwordInput === currentPassword
  );
};

// Schools
export const getSchools = (): School[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHOOLS);
    return raw ? JSON.parse(raw) : INITIAL_SCHOOLS;
  } catch {
    return INITIAL_SCHOOLS;
  }
};

export const getSchoolByCode = (code: string): School | undefined => {
  const schools = getSchools();
  return schools.find((s) => s.codigo.trim() === code.trim());
};

export const saveSchool = async (newSchool: School): Promise<boolean> => {
  const schools = getSchools();
  const exists = schools.some((s) => s.codigo.trim() === newSchool.codigo.trim());
  if (exists) return false;
  await request('/api/schools', {
    method: 'POST',
    body: JSON.stringify(newSchool),
  });
  schools.push(newSchool);
  saveCache(STORAGE_KEYS.SCHOOLS, schools);
  return true;
};

export const updateSchool = async (updated: School): Promise<void> => {
  await request(`/api/schools/${encodeURIComponent(updated.codigo)}`, {
    method: 'PUT',
    body: JSON.stringify(updated),
  });
  const schools = getSchools();
  const index = schools.findIndex((s) => s.codigo.trim() === updated.codigo.trim());
  if (index !== -1) {
    schools[index] = updated;
    saveCache(STORAGE_KEYS.SCHOOLS, schools);
  }
};

export const deleteSchool = async (code: string): Promise<boolean> => {
  await request(`/api/schools/${encodeURIComponent(code)}`, { method: 'DELETE' });
  const schools = getSchools();
  const filtered = schools.filter((s) => s.codigo.trim() !== code.trim());
  saveCache(STORAGE_KEYS.SCHOOLS, filtered);
  saveCache(
    STORAGE_KEYS.TEACHERS,
    getTeachers().map((teacher) => ({
      ...teacher,
      escuelasVinculadas: teacher.escuelasVinculadas.filter((schoolCode) => schoolCode !== code),
    }))
  );
  saveCache(
    STORAGE_KEYS.SUPERVISIONS,
    getSupervisions().filter((supervision) => supervision.codigoEscuela !== code)
  );
  return true;
};

// Teachers
export const getTeachers = (): Teacher[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    return raw ? JSON.parse(raw) : INITIAL_TEACHERS;
  } catch {
    return INITIAL_TEACHERS;
  }
};

export const findTeacherByEmail = (email: string): Teacher | undefined => {
  const teachers = getTeachers();
  return teachers.find((t) => t.correo.trim().toLowerCase() === email.trim().toLowerCase());
};

export const saveOrUpdateTeacher = async (
  teacherData: Partial<Teacher> & { correo: string }
): Promise<Teacher> => {
  const teachers = getTeachers();
  const index = teachers.findIndex(
    (t) => t.correo.trim().toLowerCase() === teacherData.correo.trim().toLowerCase()
  );

  if (index !== -1) {
    const existing = teachers[index];
    const updatedSchools = Array.from(
      new Set([...(existing.escuelasVinculadas || []), ...(teacherData.escuelasVinculadas || [])])
    );
    const updated: Teacher = {
      ...existing,
      ...teacherData,
      escuelasVinculadas: updatedSchools,
    };
    await request('/api/teachers', { method: 'POST', body: JSON.stringify(updated) });
    teachers[index] = updated;
    saveCache(STORAGE_KEYS.TEACHERS, teachers);
    return updated;
  } else {
    const newTeacher: Teacher = {
      id: `tch-${Date.now()}`,
      nombre: teacherData.nombre || 'Docente sin nombre',
      correo: teacherData.correo.trim().toLowerCase(),
      telefono: teacherData.telefono || '',
      dui: teacherData.dui || '',
      escuelasVinculadas: teacherData.escuelasVinculadas || [],
      especialidad: teacherData.especialidad || 'Docente de Aula',
      fechaRegistro: new Date().toISOString().split('T')[0],
    };
    await request('/api/teachers', { method: 'POST', body: JSON.stringify(newTeacher) });
    teachers.push(newTeacher);
    saveCache(STORAGE_KEYS.TEACHERS, teachers);
    return newTeacher;
  }
};

export const linkTeacherToSchool = async (teacherEmail: string, schoolCode: string): Promise<boolean> => {
  const teachers = getTeachers();
  const teacher = teachers.find(
    (t) => t.correo.trim().toLowerCase() === teacherEmail.trim().toLowerCase()
  );
  if (!teacher) return false;
  if (!teacher.escuelasVinculadas.includes(schoolCode)) {
    await saveOrUpdateTeacher({
      ...teacher,
      escuelasVinculadas: [...teacher.escuelasVinculadas, schoolCode],
    });
  }
  return true;
};

// Supervisions
export const getSupervisions = (): Supervision[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPERVISIONS);
    return raw ? JSON.parse(raw) : INITIAL_SUPERVISIONS;
  } catch {
    return INITIAL_SUPERVISIONS;
  }
};

export const saveSupervision = async (sup: Supervision): Promise<void> => {
  if (sup.docenteCorreo) {
    await saveOrUpdateTeacher({
      correo: sup.docenteCorreo,
      nombre: sup.docenteNombre,
      telefono: sup.docenteTelefono,
      dui: sup.docenteDui,
      escuelasVinculadas: [sup.codigoEscuela],
    });
  }
  await request('/api/supervisions', { method: 'POST', body: JSON.stringify(sup) });
  const list = getSupervisions();
  const index = list.findIndex((item) => item.id === sup.id);
  if (index !== -1) {
    list[index] = { ...sup, updatedAt: new Date().toISOString() };
  } else {
    list.unshift({ ...sup, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  saveCache(STORAGE_KEYS.SUPERVISIONS, list);
};

export const deleteSupervision = async (id: string): Promise<boolean> => {
  await request(`/api/supervisions/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const list = getSupervisions();
  const filtered = list.filter((item) => item.id !== id);
  saveCache(STORAGE_KEYS.SUPERVISIONS, filtered);
  return true;
};

// User Session
export const getUserSession = (): UserSession | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setUserSession = (session: UserSession | null) => {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  }
};

// Password generator
export const generateSecurePassword = (code?: string): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789!#*';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Mined#${code || 'SV'}-${randomPart}`;
};

const sqlLiteral = (value: unknown): string => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${String(value).replace(/'/g, "''")}'`;
};

// PostgreSQL DDL & SQL Generator
export const generatePostgresDump = (): string => {
  const schools = getSchools();
  const teachers = getTeachers();
  const supervisions = getSupervisions();

  return `-- ====================================================================
-- SISTEMA DE SUPERVISIÓN DE AULA Y SEGUIMIENTO PEDAGÓGICO
-- MINISTERIO DE EDUCACIÓN DE EL SALVADOR (MINED)
-- Esquema de Base de Datos Relacional PostgreSQL (Neon)
-- Exportado el: ${new Date().toISOString()}
-- ====================================================================

-- --------------------------------------------------------
-- 1. Tabla: centros_escolares
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS centros_escolares (
    codigo VARCHAR(10) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    perfil_completado BOOLEAN DEFAULT FALSE,
    director_nombre VARCHAR(150),
    director_correo VARCHAR(150),
    director_telefono VARCHAR(20),
    director_dui VARCHAR(15),
    departamento VARCHAR(80),
    municipio VARCHAR(100),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    fecha_registro DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------
-- 2. Tabla: docentes
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS docentes (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    dui VARCHAR(15),
    especialidad VARCHAR(150),
    fecha_registro DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_correo_clases CHECK (correo LIKE '%@clases.edu.sv')
);

-- --------------------------------------------------------
-- 3. Tabla: docente_escuelas (Relación Muchos a Muchos)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS docente_escuelas (
    docente_correo VARCHAR(150) NOT NULL,
    codigo_escuela VARCHAR(10) NOT NULL,
    asignado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (docente_correo, codigo_escuela),
    FOREIGN KEY (codigo_escuela) REFERENCES centros_escolares(codigo) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 4. Tabla: supervisiones_aula
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS supervisiones_aula (
    id VARCHAR(50) PRIMARY KEY,
    codigo_escuela VARCHAR(10) NOT NULL,
    grado VARCHAR(60) NOT NULL,
    seccion VARCHAR(100) NOT NULL DEFAULT '',
    grado_otro_detalle VARCHAR(100),
    docente_correo VARCHAR(150) NOT NULL,
    docente_nombre VARCHAR(150) NOT NULL,
    docente_telefono VARCHAR(20),
    docente_dui VARCHAR(15),
    fecha_supervision DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion_minutos INTEGER NOT NULL CHECK (duracion_minutos >= 0),
    matricula_siges INTEGER NOT NULL CHECK (matricula_siges >= 0),
    estudiantes_asistieron INTEGER NOT NULL CHECK (estudiantes_asistieron >= 0),
    estudiantes_no_asistieron INTEGER NOT NULL CHECK (estudiantes_no_asistieron >= 0),
    porcentaje_asistencia DECIMAL(5,2),
    telefonos_utilizados INTEGER DEFAULT 0 CHECK (telefonos_utilizados >= 0),
    laptops_computadoras INTEGER DEFAULT 0 CHECK (laptops_computadoras >= 0),
    dispositivos_apoyo INTEGER DEFAULT 0 CHECK (dispositivos_apoyo >= 0),
    total_dispositivos INTEGER DEFAULT 0 CHECK (total_dispositivos >= 0),
    f4_completados INTEGER DEFAULT 0 CHECK (f4_completados >= 0),
    f1_completado VARCHAR(3) DEFAULT 'No' CHECK (f1_completado IN ('Sí', 'No')),
    observaciones TEXT,
    creado_por VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (codigo_escuela) REFERENCES centros_escolares(codigo) ON DELETE CASCADE
);

${schools.length > 0 ? `
-- Inserciones de Centros Escolares
${schools
  .map(
    (s) =>
      `INSERT INTO centros_escolares (codigo, nombre, password_hash, perfil_completado, director_nombre, director_correo, director_telefono, director_dui, departamento, municipio, latitud, longitud, fecha_registro) VALUES (${[
        s.codigo, s.nombre, s.password, s.perfilCompletado, s.directorNombre, s.directorCorreo,
        s.directorTelefono, s.directorDui, s.departamento, s.municipio, s.latitud, s.longitud,
        s.fechaRegistro || '2026-01-01',
      ].map(sqlLiteral).join(', ')});`
  )
  .join('\n')}
` : '-- (Sin registros de centros escolares aún)\n'}

${teachers.length > 0 ? `
-- Inserciones de Docentes
${teachers
  .map(
    (t) =>
      `INSERT INTO docentes (id, nombre, correo, telefono, dui, especialidad, fecha_registro) VALUES (${[
        t.id, t.nombre, t.correo, t.telefono, t.dui, t.especialidad, t.fechaRegistro || '2026-01-01',
      ].map(sqlLiteral).join(', ')});`
  )
  .join('\n')}
` : '-- (Sin registros de docentes aún)\n'}

${supervisions.length > 0 ? `
-- Inserciones de Supervisiones
${supervisions
  .map(
    (sup) =>
      `INSERT INTO supervisiones_aula (id, codigo_escuela, grado, seccion, docente_correo, docente_nombre, docente_telefono, docente_dui, fecha_supervision, hora_inicio, hora_fin, duracion_minutos, matricula_siges, estudiantes_asistieron, estudiantes_no_asistieron, porcentaje_asistencia, telefonos_utilizados, laptops_computadoras, dispositivos_apoyo, total_dispositivos, f4_completados, f1_completado, observaciones, creado_por) VALUES (${[
        sup.id, sup.codigoEscuela, sup.grado, sup.seccion, sup.docenteCorreo, sup.docenteNombre,
        sup.docenteTelefono, sup.docenteDui, sup.fecha, `${sup.horaInicio}:00`, `${sup.horaFin}:00`,
        sup.duracionMinutos, sup.matriculaSiges, sup.estudiantesAsistieron, sup.estudiantesNoAsistieron,
        sup.porcentajeAsistencia, sup.telefonosUtilizados, sup.laptopsComputadoras,
        sup.dispositivosApoyoPedagogico, sup.totalDispositivos, sup.f4Completados,
        sup.f1Completado, sup.observaciones, sup.creadoPor,
      ].map(sqlLiteral).join(', ')});`
  )
  .join('\n')}
` : '-- (Sin registros de supervisiones aún)\n'}

`;
};
