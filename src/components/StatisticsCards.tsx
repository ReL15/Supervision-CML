import React from 'react';
import { Supervision, School, UserSession } from '../types';
import {
  FileCheck,
  Users,
  Percent,
  Laptop,
  CheckCircle,
  Building2,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';

interface StatisticsCardsProps {
  supervisions: Supervision[];
  schools: School[];
  currentSession: UserSession;
  selectedSchoolCode: string;
  onSelectSchool: (code: string) => void;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  supervisions,
  schools,
  currentSession,
  selectedSchoolCode,
  onSelectSchool,
}) => {
  const isMaster = currentSession.role === 'master';

  // Filtrar según el selector (si es master puede ser 'all' o un código; si es escuela está fijado a su código)
  const filtered = supervisions.filter((s) => {
    if (currentSession.role === 'school') {
      return s.codigoEscuela === currentSession.schoolCode;
    }
    if (selectedSchoolCode === 'all') {
      return true;
    }
    return s.codigoEscuela === selectedSchoolCode;
  });

  // Métricas calculadas
  const totalSupervisiones = filtered.length;

  const totalEstudiantesAtendidos = filtered.reduce(
    (acc, curr) => acc + (curr.estudiantesAsistieron || 0),
    0
  );

  const promedioAsistencia =
    totalSupervisiones > 0
      ? Number(
          (
            filtered.reduce((acc, curr) => acc + (curr.porcentajeAsistencia || 0), 0) /
            totalSupervisiones
          ).toFixed(1)
        )
      : 0;

  const totalDispositivos = filtered.reduce(
    (acc, curr) => acc + (curr.totalDispositivos || 0),
    0
  );

  const totalLaptops = filtered.reduce(
    (acc, curr) => acc + (curr.laptopsComputadoras || 0),
    0
  );

  const totalTelefonos = filtered.reduce(
    (acc, curr) => acc + (curr.telefonosUtilizados || 0),
    0
  );

  const conF1Completado = filtered.filter((s) => s.f1Completado === 'Sí').length;
  const porcentajeF1 =
    totalSupervisiones > 0
      ? Number(((conF1Completado / totalSupervisiones) * 100).toFixed(1))
      : 0;

  const totalHorasMinutos = filtered.reduce(
    (acc, curr) => acc + (curr.duracionMinutos || 0),
    0
  );
  const totalHoras = (totalHorasMinutos / 60).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Selector de Escuela para el rol Master */}
      {isMaster && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#0f2d59]" />
            <div>
              <h3 className="text-sm font-bold text-[#0f2d59]">Filtro de Alcance de Métricas</h3>
              <p className="text-[11px] text-slate-500">
                Seleccione el ámbito para el cálculo de estadísticas
              </p>
            </div>
          </div>

          <div className="w-full sm:w-80">
            <select
              value={selectedSchoolCode}
              onChange={(e) => onSelectSchool(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-semibold border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white text-slate-800"
            >
              <option value="all">🇸🇻 Consolidado General Nacional (Todos los Centros)</option>
              {schools.map((school) => (
                <option key={school.codigo} value={school.codigo}>
                  {school.codigo} - {school.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Grid de Tarjetas de Indicadores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Tarjeta 1: Total Supervisiones */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Supervisiones
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f2d59] flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#0f2d59] tracking-tight">
            {totalSupervisiones}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            {totalHoras} horas en aula
          </p>
        </div>

        {/* Tarjeta 2: Promedio de Asistencia */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Asistencia Media
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-800 tracking-tight">
            {promedioAsistencia}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            Verificado con SIGES
          </p>
        </div>

        {/* Tarjeta 3: Estudiantes Atendidos */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-indigo-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Estudiantes
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {totalEstudiantesAtendidos.toLocaleString('es-SV')}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Presentes en jornada</p>
        </div>

        {/* Tarjeta 4: Tecnologías Utilizadas */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Dispositivos
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {totalDispositivos}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalLaptops} laptops · {totalTelefonos} tel.
          </p>
        </div>

        {/* Tarjeta 5: Cumplimiento F1 */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:border-teal-400 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Formulario F1
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-[#0f2d59] tracking-tight">
            {porcentajeF1}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {conF1Completado} de {totalSupervisiones} con F1
          </p>
        </div>
      </div>
    </div>
  );
};
