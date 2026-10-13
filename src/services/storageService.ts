import { School, Teacher, Supervision, UserSession } from '../types';
import { INITIAL_SCHOOLS, INITIAL_TEACHERS, INITIAL_SUPERVISIONS, MASTER_CREDENTIALS } from '../data/initialData';

const STORAGE_KEYS = {
  SCHOOLS: 'mined_supervision_schools_prod_v2',
  TEACHERS: 'mined_supervision_teachers_prod_v2',
  SUPERVISIONS: 'mined_supervision_records_prod_v2',
  SESSION: 'mined_supervision_session_prod_v2',
  MASTER_PASSWORD: 'mined_supervision_master_password_prod_v2',
};

// Initialize with clean production storage
export const initStorage = () => {
  // Limpiar claves antiguas de demostración si existieran
  try {
    localStorage.removeItem('mined_supervision_schools_v1');
    localStorage.removeItem('mined_supervision_teachers_v1');
    localStorage.removeItem('mined_supervision_records_v1');
    localStorage.removeItem('mined_supervision_session_v1');
  } catch {
    // Ignore error in sandboxed environments
  }

  if (!localStorage.getItem(STORAGE_KEYS.SCHOOLS)) {
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(INITIAL_SCHOOLS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.TEACHERS)) {
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(INITIAL_TEACHERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.SUPERVISIONS)) {
    localStorage.setItem(STORAGE_KEYS.SUPERVISIONS, JSON.stringify(INITIAL_SUPERVISIONS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.MASTER_PASSWORD)) {
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

export const saveSchool = (newSchool: School): boolean => {
  const schools = getSchools();
  const exists = schools.some((s) => s.codigo.trim() === newSchool.codigo.trim());
  if (exists) return false;
  schools.push(newSchool);
  localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
  return true;
};

export const updateSchool = (updated: School) => {
  const schools = getSchools();
  const index = schools.findIndex((s) => s.codigo.trim() === updated.codigo.trim());
  if (index !== -1) {
    schools[index] = updated;
    localStorage.setItem(STORAGE_KEYS.SCHOOLS, JSON.stringify(schools));
  }
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

export const saveOrUpdateTeacher = (teacherData: Partial<Teacher> & { correo: string }): Teacher => {
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
    teachers[index] = updated;
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
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
    teachers.push(newTeacher);
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
    return newTeacher;
  }
};

export const linkTeacherToSchool = (teacherEmail: string, schoolCode: string): boolean => {
  const teachers = getTeachers();
  const teacher = teachers.find(
    (t) => t.correo.trim().toLowerCase() === teacherEmail.trim().toLowerCase()
  );
  if (!teacher) return false;
  if (!teacher.escuelasVinculadas.includes(schoolCode)) {
    teacher.escuelasVinculadas.push(schoolCode);
    localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
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

export const saveSupervision = (sup: Supervision) => {
  const list = getSupervisions();
  const index = list.findIndex((item) => item.id === sup.id);
  if (index !== -1) {
    list[index] = { ...sup, updatedAt: new Date().toISOString() };
  } else {
    list.unshift({ ...sup, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  localStorage.setItem(STORAGE_KEYS.SUPERVISIONS, JSON.stringify(list));

  // Link teacher to school
  if (sup.docenteCorreo) {
    saveOrUpdateTeacher({
      correo: sup.docenteCorreo,
      nombre: sup.docenteNombre,
      telefono: sup.docenteTelefono,
      dui: sup.docenteDui,
      escuelasVinculadas: [sup.codigoEscuela],
    });
  }
};

export const deleteSupervision = (id: string): boolean => {
  const list = getSupervisions();
  const filtered = list.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.SUPERVISIONS, JSON.stringify(filtered));
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

// MySQL DDL & SQL Generator
export const generateMySqlDump = (): string => {
  const schools = getSchools();
  const teachers = getTeachers();
  const supervisions = getSupervisions();

  return `-- ====================================================================
-- SISTEMA DE SUPERVISIÓN DE AULA Y SEGUIMIENTO PEDAGÓGICO
-- MINISTERIO DE EDUCACIÓN DE EL SALVADOR (MINED)
-- Esquema de Base de Datos Relacional MySQL 8.0+ / MariaDB
-- Exportado el: ${new Date().toISOString()}
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS mined_supervision_db;
CREATE DATABASE mined_supervision_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE mined_supervision_db;

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 3. Tabla: docente_escuelas (Relación Muchos a Muchos)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS docente_escuelas (
    docente_correo VARCHAR(150) NOT NULL,
    codigo_escuela VARCHAR(10) NOT NULL,
    asignado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (docente_correo, codigo_escuela),
    FOREIGN KEY (codigo_escuela) REFERENCES centros_escolares(codigo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- 4. Tabla: supervisiones_aula
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS supervisiones_aula (
    id VARCHAR(50) PRIMARY KEY,
    codigo_escuela VARCHAR(10) NOT NULL,
    grado VARCHAR(60) NOT NULL,
    grado_otro_detalle VARCHAR(100),
    docente_correo VARCHAR(150) NOT NULL,
    docente_nombre VARCHAR(150) NOT NULL,
    docente_telefono VARCHAR(20),
    docente_dui VARCHAR(15),
    fecha_supervision DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    duracion_minutos INT UNSIGNED NOT NULL,
    matricula_siges INT UNSIGNED NOT NULL,
    estudiantes_asistieron INT UNSIGNED NOT NULL,
    estudiantes_no_asistieron INT UNSIGNED NOT NULL,
    porcentaje_asistencia DECIMAL(5,2),
    telefonos_utilizados INT UNSIGNED DEFAULT 0,
    laptops_computadoras INT UNSIGNED DEFAULT 0,
    dispositivos_apoyo INT UNSIGNED DEFAULT 0,
    total_dispositivos INT UNSIGNED DEFAULT 0,
    f4_completados INT UNSIGNED DEFAULT 0,
    f1_completado ENUM('Sí', 'No') DEFAULT 'No',
    observaciones TEXT,
    creado_por VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (codigo_escuela) REFERENCES centros_escolares(codigo) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

${schools.length > 0 ? `
-- Inserciones de Centros Escolares
${schools
  .map(
    (s) =>
      `INSERT INTO centros_escolares (codigo, nombre, password_hash, perfil_completado, director_nombre, director_correo, director_telefono, director_dui, departamento, municipio, latitud, longitud, fecha_registro) VALUES ('${s.codigo}', '${s.nombre.replace(/'/g, "''")}', '${s.password}', ${s.perfilCompletado ? 1 : 0}, '${s.directorNombre?.replace(/'/g, "''") || ''}', '${s.directorCorreo || ''}', '${s.directorTelefono || ''}', '${s.directorDui || ''}', '${s.departamento || ''}', '${s.municipio || ''}', ${s.latitud || 0}, ${s.longitud || 0}, '${s.fechaRegistro || '2026-01-01'}');`
  )
  .join('\n')}
` : '-- (Sin registros de centros escolares aún)\n'}

${teachers.length > 0 ? `
-- Inserciones de Docentes
${teachers
  .map(
    (t) =>
      `INSERT INTO docentes (id, nombre, correo, telefono, dui, especialidad, fecha_registro) VALUES ('${t.id}', '${t.nombre.replace(/'/g, "''")}', '${t.correo}', '${t.telefono || ''}', '${t.dui || ''}', '${t.especialidad?.replace(/'/g, "''") || ''}', '${t.fechaRegistro || '2026-01-01'}');`
  )
  .join('\n')}
` : '-- (Sin registros de docentes aún)\n'}

${supervisions.length > 0 ? `
-- Inserciones de Supervisiones
${supervisions
  .map(
    (sup) =>
      `INSERT INTO supervisiones_aula (id, codigo_escuela, grado, docente_correo, docente_nombre, docente_telefono, docente_dui, fecha_supervision, hora_inicio, hora_fin, duracion_minutos, matricula_siges, estudiantes_asistieron, estudiantes_no_asistieron, porcentaje_asistencia, telefonos_utilizados, laptops_computadoras, dispositivos_apoyo, total_dispositivos, f4_completados, f1_completado, observaciones, creado_por) VALUES ('${sup.id}', '${sup.codigoEscuela}', '${sup.grado}', '${sup.docenteCorreo}', '${sup.docenteNombre.replace(/'/g, "''")}', '${sup.docenteTelefono}', '${sup.docenteDui}', '${sup.fecha}', '${sup.horaInicio}:00', '${sup.horaFin}:00', ${sup.duracionMinutos}, ${sup.matriculaSiges}, ${sup.estudiantesAsistieron}, ${sup.estudiantesNoAsistieron}, ${sup.porcentajeAsistencia}, ${sup.telefonosUtilizados}, ${sup.laptopsComputadoras}, ${sup.dispositivosApoyoPedagogico}, ${sup.totalDispositivos}, ${sup.f4Completados}, '${sup.f1Completado}', '${sup.observaciones.replace(/'/g, "''")}', '${sup.creadoPor}');`
  )
  .join('\n')}
` : '-- (Sin registros de supervisiones aún)\n'}

SET FOREIGN_KEY_CHECKS = 1;
`;
};
