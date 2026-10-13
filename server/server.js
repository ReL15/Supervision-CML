import express from 'express';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.SERVER_PORT || 4000;

async function getPool() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mined_supervision_db',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',
  });
  return pool;
}

app.get('/api/ping', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Schools
app.get('/api/schools', async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM centros_escolares');
    res.json(rows);
    await pool.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error fetching schools' });
  }
});

app.post('/api/schools', async (req, res) => {
  try {
    const payload = req.body;
    const pool = await getPool();
    await pool.execute(
      `INSERT INTO centros_escolares (codigo, nombre, password_hash, perfil_completado, director_nombre, director_correo, director_telefono, director_dui, departamento, municipio, latitud, longitud, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.codigo,
        payload.nombre,
        payload.password_hash || '',
        payload.perfil_completado ? 1 : 0,
        payload.director_nombre || null,
        payload.director_correo || null,
        payload.director_telefono || null,
        payload.director_dui || null,
        payload.departamento || null,
        payload.municipio || null,
        payload.latitud || null,
        payload.longitud || null,
        payload.fecha_registro || null,
      ]
    );
    await pool.end();
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error creating school' });
  }
});

// Teachers
app.get('/api/teachers', async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM docentes');
    res.json(rows);
    await pool.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error fetching teachers' });
  }
});

app.post('/api/teachers', async (req, res) => {
  try {
    const t = req.body;
    const pool = await getPool();
    await pool.execute(
      `INSERT INTO docentes (id, nombre, correo, telefono, dui, especialidad, fecha_registro)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), telefono=VALUES(telefono), dui=VALUES(dui), especialidad=VALUES(especialidad)`,
      [t.id, t.nombre, t.correo, t.telefono || null, t.dui || null, t.especialidad || null, t.fecha_registro || null]
    );
    await pool.end();
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error creating teacher' });
  }
});

// Supervisions
app.get('/api/supervisions', async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query('SELECT * FROM supervisiones_aula');
    res.json(rows);
    await pool.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error fetching supervisions' });
  }
});

app.post('/api/supervisions', async (req, res) => {
  try {
    const s = req.body;
    const pool = await getPool();
    await pool.execute(
      `INSERT INTO supervisiones_aula (id, codigo_escuela, grado, grado_otro_detalle, docente_correo, docente_nombre, docente_telefono, docente_dui, fecha_supervision, hora_inicio, hora_fin, duracion_minutos, matricula_siges, estudiantes_asistieron, estudiantes_no_asistieron, porcentaje_asistencia, telefonos_utilizados, laptops_computadoras, dispositivos_apoyo_pedagogico, total_dispositivos, f4_completados, f1_completado, observaciones, creado_por, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE updated_at=VALUES(updated_at)`,
      [
        s.id,
        s.codigoEscuela,
        s.grado,
        s.gradoOtroDetalle || null,
        s.docenteCorreo || null,
        s.docenteNombre || null,
        s.docenteTelefono || null,
        s.docenteDui || null,
        s.fecha || null,
        s.horaInicio || null,
        s.horaFin || null,
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
        s.createdAt || new Date().toISOString(),
        s.updatedAt || new Date().toISOString(),
      ]
    );
    await pool.end();
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'error creating supervision' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
