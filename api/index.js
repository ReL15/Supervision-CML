import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    })
  : null;

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
  fechaRegistro: row.fecha_registro ? new Date(row.fecha_registro).toISOString().slice(0, 10) : '',
});

const teacherFromRow = (row) => ({
  id: row.id,
  nombre: row.nombre,
  correo: row.correo,
  telefono: row.telefono || '',
  dui: row.dui || '',
  especialidad: row.especialidad || '',
  fechaRegistro: row.fecha_registro ? new Date(row.fecha_registro).toISOString().slice(0, 10) : '',
  escuelasVinculadas: row.escuelas_vinculadas ? row.escuelas_vinculadas.split(',') : [],
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
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
});

let schemaReady = false;

async function initializeSchema() {
  if (!pool || schemaReady) return;
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
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
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
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS docente_escuelas (
      docente_correo VARCHAR(150) NOT NULL,
      codigo_escuela VARCHAR(10) NOT NULL,
      asignado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (docente_correo, codigo_escuela),
      FOREIGN KEY (docente_correo) REFERENCES docentes(correo) ON DELETE CASCADE,
      FOREIGN KEY (codigo_escuela) REFERENCES centros_escolares(codigo) ON DELETE CASCADE
    )
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
    )
  `);

  await pool.query(
    "ALTER TABLE supervisiones_aula ADD COLUMN IF NOT EXISTS seccion VARCHAR(100) NOT NULL DEFAULT ''",
  );

  schemaReady = true;
}

async function readBody(req) {
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    if (!chunks.length) return {};
    const rawBody = Buffer.concat(chunks).toString('utf8');
    if (!rawBody.trim()) return {};
    return JSON.parse(rawBody);
  } catch {
    return {};
  }
}

async function requireDatabase(res) {
  if (!databaseUrl || !pool) {
    res.status(503).json({ error: 'Falta DATABASE_URL en Vercel. Añádela en Variables de entorno.' });
    return false;
  }
  await initializeSchema();
  return true;
}

async function handleApi(req, res) {
  const url = new URL(req.url || '/', 'https://example.com');
  const method = req.method || 'GET';
  const queryPath = url.searchParams.get('path') || req.query?.path;
  let pathname = url.pathname;

  if ((pathname === '/api/index' || pathname === '/api' || pathname === '/') && queryPath) {
    const pathSegments = Array.isArray(queryPath) ? queryPath : [queryPath];
    const apiPath = pathSegments.join('/').replace(/^\/+|\/+$/g, '');
    pathname = `/api/${apiPath}`;
  } else if (!pathname.startsWith('/api/')) {
    pathname = `/api${pathname === '/' ? '' : pathname}`;
  }
  pathname = pathname.replace(/\/+$/, '') || '/api';

  if (pathname === '/api/ping' && method === 'GET') {
    if (!(await requireDatabase(res))) return;
    await pool.query('SELECT 1');
    return res.status(200).json({ ok: true, database: new URL(databaseUrl).pathname.slice(1) || 'neon' });
  }

  if (pathname === '/api/schools' && method === 'GET') {
    if (!(await requireDatabase(res))) return;
    const { rows } = await pool.query('SELECT * FROM centros_escolares ORDER BY nombre');
    return res.status(200).json(rows.map(schoolFromRow));
  }

  if (pathname === '/api/schools' && method === 'POST') {
    if (!(await requireDatabase(res))) return;
    const school = await readBody(req);
    if (!school.codigo || !school.nombre || !school.password) {
      return res.status(400).json({ error: 'Código, nombre y contraseña son obligatorios.' });
    }
    await pool.query(
      `INSERT INTO centros_escolares
        (codigo, nombre, password_hash, perfil_completado, director_nombre, director_correo,
         director_telefono, director_dui, departamento, municipio, latitud, longitud, fecha_registro)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        school.codigo,
        school.nombre,
        school.password,
        Boolean(school.perfilCompletado),
        school.directorNombre || null,
        school.directorCorreo || null,
        school.directorTelefono || null,
        school.directorDui || null,
        school.departamento || null,
        school.municipio || null,
        school.latitud ?? null,
        school.longitud ?? null,
        school.fechaRegistro || null,
      ],
    );
    return res.status(201).json({ ok: true });
  }

  const schoolMatch = pathname.match(/^\/api\/schools\/([^/]+)$/);
  if (schoolMatch && method === 'PUT') {
    if (!(await requireDatabase(res))) return;
    const school = await readBody(req);
    const codigo = decodeURIComponent(schoolMatch[1]);
    const { rowCount } = await pool.query(
      `UPDATE centros_escolares
       SET nombre = $1, password_hash = $2, perfil_completado = $3, director_nombre = $4,
           director_correo = $5, director_telefono = $6, director_dui = $7, departamento = $8,
           municipio = $9, latitud = $10, longitud = $11, updated_at = CURRENT_TIMESTAMP
       WHERE codigo = $12`,
      [
        school.nombre,
        school.password,
        Boolean(school.perfilCompletado),
        school.directorNombre || null,
        school.directorCorreo || null,
        school.directorTelefono || null,
        school.directorDui || null,
        school.departamento || null,
        school.municipio || null,
        school.latitud ?? null,
        school.longitud ?? null,
        codigo,
      ],
    );
    if (!rowCount) return res.status(404).json({ error: 'Centro escolar no encontrado.' });
    return res.status(200).json({ ok: true });
  }

  if (schoolMatch && method === 'DELETE') {
    if (!(await requireDatabase(res))) return;
    const codigo = decodeURIComponent(schoolMatch[1]);
    const { rowCount } = await pool.query('DELETE FROM centros_escolares WHERE codigo = $1', [codigo]);
    if (!rowCount) return res.status(404).json({ error: 'Centro escolar no encontrado.' });
    return res.status(200).json({ ok: true });
  }

  if (pathname === '/api/teachers' && method === 'GET') {
    if (!(await requireDatabase(res))) return;
    const { rows } = await pool.query(`
      SELECT d.*, STRING_AGG(de.codigo_escuela, ',' ORDER BY de.codigo_escuela) AS escuelas_vinculadas
      FROM docentes d
      LEFT JOIN docente_escuelas de ON de.docente_correo = d.correo
      GROUP BY d.id
      ORDER BY d.nombre
    `);
    return res.status(200).json(rows.map(teacherFromRow));
  }

  if (pathname === '/api/teachers' && method === 'POST') {
    if (!(await requireDatabase(res))) return;
    const teacher = await readBody(req);
    if (!teacher.correo || !teacher.nombre) {
      return res.status(400).json({ error: 'Correo y nombre del docente son obligatorios.' });
    }
    const connection = await pool.connect();
    try {
      await connection.query('BEGIN');
      await connection.query(
        `INSERT INTO docentes (id, nombre, correo, telefono, dui, especialidad, fecha_registro)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (correo) DO UPDATE SET nombre = EXCLUDED.nombre, telefono = EXCLUDED.telefono,
           dui = EXCLUDED.dui, especialidad = EXCLUDED.especialidad`,
        [
          teacher.id || `tch-${Date.now()}`,
          teacher.nombre,
          teacher.correo,
          teacher.telefono || null,
          teacher.dui || null,
          teacher.especialidad || null,
          teacher.fechaRegistro || null,
        ],
      );
      for (const schoolCode of teacher.escuelasVinculadas || []) {
        await connection.query(
          'INSERT INTO docente_escuelas (docente_correo, codigo_escuela) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [teacher.correo, schoolCode],
        );
      }
      await connection.query('COMMIT');
      return res.status(201).json({ ok: true });
    } catch (error) {
      await connection.query('ROLLBACK');
      throw error;
    } finally {
      connection.release();
    }
  }

  if (pathname === '/api/supervisions' && method === 'GET') {
    if (!(await requireDatabase(res))) return;
    const { rows } = await pool.query(`
      SELECT s.*, e.nombre AS nombre_escuela
      FROM supervisiones_aula s
      LEFT JOIN centros_escolares e ON e.codigo = s.codigo_escuela
      ORDER BY s.fecha_supervision DESC, s.hora_inicio DESC
    `);
    return res.status(200).json(rows.map(supervisionFromRow));
  }

  if (pathname === '/api/supervisions' && method === 'POST') {
    if (!(await requireDatabase(res))) return;
    const s = await readBody(req);
    if (!s.id || !s.codigoEscuela || !s.grado || !s.fecha || !s.horaInicio || !s.horaFin) {
      return res.status(400).json({ error: 'Faltan campos obligatorios de la supervisión.' });
    }
    await pool.query(
      `INSERT INTO supervisiones_aula
        (id, codigo_escuela, grado, seccion, grado_otro_detalle, docente_correo,
         docente_nombre, docente_telefono, docente_dui, fecha_supervision, hora_inicio, hora_fin,
         duracion_minutos, matricula_siges, estudiantes_asistieron, estudiantes_no_asistieron,
         porcentaje_asistencia, telefonos_utilizados, laptops_computadoras, dispositivos_apoyo,
         total_dispositivos, f4_completados, f1_completado, observaciones, creado_por, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27)
       ON CONFLICT (id) DO UPDATE SET
        codigo_escuela = EXCLUDED.codigo_escuela, grado = EXCLUDED.grado,
        seccion = EXCLUDED.seccion,
        grado_otro_detalle = EXCLUDED.grado_otro_detalle,
        docente_correo = EXCLUDED.docente_correo, docente_nombre = EXCLUDED.docente_nombre,
        docente_telefono = EXCLUDED.docente_telefono, docente_dui = EXCLUDED.docente_dui,
        fecha_supervision = EXCLUDED.fecha_supervision, hora_inicio = EXCLUDED.hora_inicio,
        hora_fin = EXCLUDED.hora_fin, duracion_minutos = EXCLUDED.duracion_minutos,
        matricula_siges = EXCLUDED.matricula_siges, estudiantes_asistieron = EXCLUDED.estudiantes_asistieron,
        estudiantes_no_asistieron = EXCLUDED.estudiantes_no_asistieron,
        porcentaje_asistencia = EXCLUDED.porcentaje_asistencia,
        telefonos_utilizados = EXCLUDED.telefonos_utilizados,
        laptops_computadoras = EXCLUDED.laptops_computadoras, dispositivos_apoyo = EXCLUDED.dispositivos_apoyo,
        total_dispositivos = EXCLUDED.total_dispositivos, f4_completados = EXCLUDED.f4_completados,
        f1_completado = EXCLUDED.f1_completado, observaciones = EXCLUDED.observaciones,
        creado_por = EXCLUDED.creado_por, updated_at = CURRENT_TIMESTAMP`,
      [
        s.id,
        s.codigoEscuela,
        s.grado,
        s.seccion || '',
        s.gradoOtroDetalle || null,
        s.docenteCorreo || '',
        s.docenteNombre,
        s.docenteTelefono || null,
        s.docenteDui || null,
        s.fecha,
        s.horaInicio,
        s.horaFin,
        s.duracionMinutos || 0,
        s.matriculaSiges || 0,
        s.estudiantesAsistieron || 0,
        s.estudiantesNoAsistieron || 0,
        s.porcentajeAsistencia || 0,
        s.telefonosUtilizados || 0,
        s.laptopsComputadoras || 0,
        s.dispositivosApoyoPedagogico || 0,
        s.totalDispositivos || 0,
        s.f4Completados || 0,
        s.f1Completado || 'No',
        s.observaciones || null,
        s.creadoPor || null,
        s.createdAt ? new Date(s.createdAt) : new Date(),
        s.updatedAt ? new Date(s.updatedAt) : new Date(),
      ],
    );
    return res.status(201).json({ ok: true });
  }

  const supervisionMatch = pathname.match(/^\/api\/supervisions\/([^/]+)$/);
  if (supervisionMatch && method === 'DELETE') {
    if (!(await requireDatabase(res))) return;
    const { rowCount } = await pool.query('DELETE FROM supervisiones_aula WHERE id = $1', [decodeURIComponent(supervisionMatch[1])]);
    if (!rowCount) return res.status(404).json({ error: 'Supervisión no encontrada.' });
    return res.status(200).json({ ok: true });
  }

  return res.status(404).json({ error: 'Ruta no encontrada.' });
}

export default async function handler(req, res) {
  try {
    await handleApi(req, res);
  } catch (error) {
    console.error('Vercel API error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Error interno de API. Revise los registros de funciones en Vercel.' });
    }
  }
}
