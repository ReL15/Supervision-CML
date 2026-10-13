import dotenv from 'dotenv';
import express from 'express';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
const port = Number(process.env.SERVER_PORT || 4000);
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mined_supervision_db',
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
});

app.use(express.json({ limit: '1mb' }));

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const schoolFromRow = (row) => ({
  codigo: row.codigo,
  nombre: row.nombre,
  password: row.password_hash,
  perfilCompletado: Boolean(row.perfil_completado),
  directorNombre: row.director_nombre || '',
  directorCorreo: row.director_correo || '',
  directorTelefono: row.director_telefono || '',
  directorDui: row.director_dui || '',
  departamento: row.departamento || '',
  municipio: row.municipio || '',
  latitud: Number(row.latitud || 0),
  longitud: Number(row.longitud || 0),
  fechaRegistro: row.fecha_registro
    ? new Date(row.fecha_registro).toISOString().slice(0, 10)
    : '',
});

const teacherFromRow = (row) => ({
  id: row.id,
  nombre: row.nombre,
  correo: row.correo,
  telefono: row.telefono || '',
  dui: row.dui || '',
  especialidad: row.especialidad || '',
  fechaRegistro: row.fecha_registro
    ? new Date(row.fecha_registro).toISOString().slice(0, 10)
    : '',
  escuelasVinculadas: row.escuelas_vinculadas
    ? row.escuelas_vinculadas.split(',')
    : [],
});

const supervisionFromRow = (row) => ({
  id: row.id,
  codigoEscuela: row.codigo_escuela,
  nombreEscuela: row.nombre_escuela || '',
  grado: row.grado,
  gradoOtroDetalle: row.grado_otro_detalle || '',
  seccion: row.seccion || '',
  docenteNombre: row.docente_nombre,
  docenteCorreo: row.docente_correo || '',
  docenteTelefono: row.docente_telefono || '',
  docenteDui: row.docente_dui || '',
  fecha: new Date(row.fecha_supervision).toISOString().slice(0, 10),
  horaInicio: String(row.hora_inicio).slice(0, 5),
  horaFin: String(row.hora_fin).slice(0, 5),
  duracionMinutos: Number(row.duracion_minutos),
  matriculaSiges: Number(row.matricula_siges),
  estudiantesAsistieron: Number(row.estudiantes_asistieron),
  estudiantesNoAsistieron: Number(row.estudiantes_no_asistieron),
  porcentajeAsistencia: Number(row.porcentaje_asistencia || 0),
  telefonosUtilizados: Number(row.telefonos_utilizados || 0),
  laptopsComputadoras: Number(row.laptops_computadoras || 0),
  dispositivosApoyoPedagogico: Number(row.dispositivos_apoyo || 0),
  totalDispositivos: Number(row.total_dispositivos || 0),
  f4Completados: Number(row.f4_completados || 0),
  f1Completado: row.f1_completado,
  observaciones: row.observaciones || '',
  creadoPor: row.creado_por || '',
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

async function initializeSchema() {
  await pool.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS docentes (
      id VARCHAR(50) PRIMARY KEY,
      nombre VARCHAR(150) NOT NULL,
      correo VARCHAR(150) NOT NULL UNIQUE,
      telefono VARCHAR(20),
      dui VARCHAR(15),
      especialidad VARCHAR(150),
      fecha_registro DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS docente_escuelas (
      docente_correo VARCHAR(150) NOT NULL,
      codigo_escuela VARCHAR(10) NOT NULL,
      asignado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (docente_correo, codigo_escuela),
      FOREIGN KEY (docente_correo) REFERENCES docentes(correo) ON DELETE CASCADE,
      FOREIGN KEY (codigo_escuela) REFERENCES centros_escolares(codigo) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS supervisiones_aula (
      id VARCHAR(50) PRIMARY KEY,
      codigo_escuela VARCHAR(10) NOT NULL,
      grado VARCHAR(60) NOT NULL,
      grado_otro_detalle VARCHAR(100),
      docente_correo VARCHAR(150),
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [sectionColumns] = await pool.execute(
    `SELECT COUNT(*) AS column_count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'supervisiones_aula'
       AND COLUMN_NAME = 'seccion'`,
  );
  if (Number(sectionColumns[0].column_count) === 0) {
    await pool.query(
      "ALTER TABLE supervisiones_aula ADD COLUMN seccion VARCHAR(100) NOT NULL DEFAULT '' AFTER grado",
    );
  }
}

app.get('/api/ping', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true, database: process.env.DB_NAME || 'mined_supervision_db' });
}));

app.get('/api/schools', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM centros_escolares ORDER BY nombre');
  res.json(rows.map(schoolFromRow));
}));

app.post('/api/schools', asyncRoute(async (req, res) => {
  const school = req.body;
  if (!school.codigo || !school.nombre || !school.password) {
    return res.status(400).json({ error: 'Código, nombre y contraseña son obligatorios.' });
  }
  await pool.execute(
    `INSERT INTO centros_escolares
      (codigo, nombre, password_hash, perfil_completado, director_nombre, director_correo,
       director_telefono, director_dui, departamento, municipio, latitud, longitud, fecha_registro)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      school.codigo, school.nombre, school.password, Boolean(school.perfilCompletado),
      school.directorNombre || null, school.directorCorreo || null,
      school.directorTelefono || null, school.directorDui || null,
      school.departamento || null, school.municipio || null,
      school.latitud ?? null, school.longitud ?? null, school.fechaRegistro || null,
    ],
  );
  res.status(201).json({ ok: true });
}));

app.put('/api/schools/:codigo', asyncRoute(async (req, res) => {
  const school = req.body;
  await pool.execute(
    `UPDATE centros_escolares
     SET nombre = ?, password_hash = ?, perfil_completado = ?, director_nombre = ?,
         director_correo = ?, director_telefono = ?, director_dui = ?, departamento = ?,
         municipio = ?, latitud = ?, longitud = ?
     WHERE codigo = ?`,
    [
      school.nombre, school.password, Boolean(school.perfilCompletado),
      school.directorNombre || null, school.directorCorreo || null,
      school.directorTelefono || null, school.directorDui || null,
      school.departamento || null, school.municipio || null,
      school.latitud ?? null, school.longitud ?? null, req.params.codigo,
    ],
  );
  const [rows] = await pool.execute(
    'SELECT codigo FROM centros_escolares WHERE codigo = ?',
    [req.params.codigo],
  );
  if (!rows.length) return res.status(404).json({ error: 'Centro escolar no encontrado.' });
  res.json({ ok: true });
}));

app.delete('/api/schools/:codigo', asyncRoute(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM centros_escolares WHERE codigo = ?', [req.params.codigo]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Centro escolar no encontrado.' });
  res.json({ ok: true });
}));

app.get('/api/teachers', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT d.*, GROUP_CONCAT(de.codigo_escuela ORDER BY de.codigo_escuela SEPARATOR ',') AS escuelas_vinculadas
    FROM docentes d
    LEFT JOIN docente_escuelas de ON de.docente_correo = d.correo
    GROUP BY d.id
    ORDER BY d.nombre
  `);
  res.json(rows.map(teacherFromRow));
}));

app.post('/api/teachers', asyncRoute(async (req, res) => {
  const teacher = req.body;
  if (!teacher.correo || !teacher.nombre) {
    return res.status(400).json({ error: 'Correo y nombre del docente son obligatorios.' });
  }
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO docentes (id, nombre, correo, telefono, dui, especialidad, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), telefono = VALUES(telefono),
         dui = VALUES(dui), especialidad = VALUES(especialidad)`,
      [
        teacher.id || `tch-${Date.now()}`, teacher.nombre, teacher.correo,
        teacher.telefono || null, teacher.dui || null, teacher.especialidad || null,
        teacher.fechaRegistro || null,
      ],
    );
    for (const schoolCode of teacher.escuelasVinculadas || []) {
      await connection.execute(
        'INSERT IGNORE INTO docente_escuelas (docente_correo, codigo_escuela) VALUES (?, ?)',
        [teacher.correo, schoolCode],
      );
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  res.status(201).json({ ok: true });
}));

app.get('/api/supervisions', asyncRoute(async (_req, res) => {
  const [rows] = await pool.query(`
    SELECT s.*, e.nombre AS nombre_escuela
    FROM supervisiones_aula s
    LEFT JOIN centros_escolares e ON e.codigo = s.codigo_escuela
    ORDER BY s.fecha_supervision DESC, s.hora_inicio DESC
  `);
  res.json(rows.map(supervisionFromRow));
}));

app.post('/api/supervisions', asyncRoute(async (req, res) => {
  const s = req.body;
  if (!s.id || !s.codigoEscuela || !s.grado || !s.fecha || !s.horaInicio || !s.horaFin) {
    return res.status(400).json({ error: 'Faltan campos obligatorios de la supervisión.' });
  }
  await pool.execute(
    `INSERT INTO supervisiones_aula
      (id, codigo_escuela, grado, seccion, grado_otro_detalle, docente_correo,
       docente_nombre, docente_telefono, docente_dui, fecha_supervision, hora_inicio, hora_fin,
       duracion_minutos, matricula_siges, estudiantes_asistieron, estudiantes_no_asistieron,
       porcentaje_asistencia, telefonos_utilizados, laptops_computadoras, dispositivos_apoyo,
       total_dispositivos, f4_completados, f1_completado, observaciones, creado_por, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       codigo_escuela = VALUES(codigo_escuela), grado = VALUES(grado),
       seccion = VALUES(seccion),
       grado_otro_detalle = VALUES(grado_otro_detalle),
       docente_correo = VALUES(docente_correo), docente_nombre = VALUES(docente_nombre),
       docente_telefono = VALUES(docente_telefono), docente_dui = VALUES(docente_dui),
       fecha_supervision = VALUES(fecha_supervision), hora_inicio = VALUES(hora_inicio),
       hora_fin = VALUES(hora_fin), duracion_minutos = VALUES(duracion_minutos),
       matricula_siges = VALUES(matricula_siges), estudiantes_asistieron = VALUES(estudiantes_asistieron),
       estudiantes_no_asistieron = VALUES(estudiantes_no_asistieron),
       porcentaje_asistencia = VALUES(porcentaje_asistencia),
       telefonos_utilizados = VALUES(telefonos_utilizados),
       laptops_computadoras = VALUES(laptops_computadoras), dispositivos_apoyo = VALUES(dispositivos_apoyo),
       total_dispositivos = VALUES(total_dispositivos), f4_completados = VALUES(f4_completados),
       f1_completado = VALUES(f1_completado), observaciones = VALUES(observaciones),
       creado_por = VALUES(creado_por), updated_at = CURRENT_TIMESTAMP`,
    [
      s.id, s.codigoEscuela, s.grado, s.seccion || '', s.gradoOtroDetalle || null,
      s.docenteCorreo || '', s.docenteNombre,
      s.docenteTelefono || null, s.docenteDui || null, s.fecha,
      s.horaInicio, s.horaFin, s.duracionMinutos || 0, s.matriculaSiges || 0,
      s.estudiantesAsistieron || 0, s.estudiantesNoAsistieron || 0,
      s.porcentajeAsistencia || 0, s.telefonosUtilizados || 0,
      s.laptopsComputadoras || 0, s.dispositivosApoyoPedagogico || 0,
      s.totalDispositivos || 0, s.f4Completados || 0, s.f1Completado || 'No',
      s.observaciones || null, s.creadoPor || null,
      s.createdAt ? new Date(s.createdAt) : new Date(),
      s.updatedAt ? new Date(s.updatedAt) : new Date(),
    ],
  );
  res.status(201).json({ ok: true });
}));

app.delete('/api/supervisions/:id', asyncRoute(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM supervisiones_aula WHERE id = ?', [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Supervisión no encontrada.' });
  res.json({ ok: true });
}));

app.use((error, _req, res, _next) => {
  console.error('API error:', error);
  res.status(500).json({ error: 'Error del servidor. Revise la consola de npm run server.' });
});

async function start() {
  await initializeSchema();
  app.listen(port, '127.0.0.1', () => {
    console.log(`API MySQL disponible en http://127.0.0.1:${port}`);
  });
}

start().catch((error) => {
  console.error(`No se pudo conectar a MySQL (${process.env.DB_NAME || 'mined_supervision_db'}):`, error.message);
  process.exitCode = 1;
});
