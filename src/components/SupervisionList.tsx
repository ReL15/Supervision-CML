import React, { useState, useMemo } from 'react';
import { Supervision, School, UserSession } from '../types';
import { deleteSupervision, getSchools } from '../services/storageService';
import { OfficialReportModal } from './OfficialReportModal';
import {
  Search,
  X,
  Calendar,
  Clock,
  User,
  GraduationCap,
  Building2,
  Laptop,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  MessageCircle,
  Edit3,
  Trash2,
  AlertTriangle,
  Send,
} from 'lucide-react';

interface SupervisionListProps {
  supervisions: Supervision[];
  currentSession: UserSession;
  activeSchoolCode?: string;
  onEdit: (sup: Supervision) => void;
  onDeleted: () => void;
}

type DateFilter = 'Todos' | 'Hoy' | 'Anteriores';

export const SupervisionList: React.FC<SupervisionListProps> = ({
  supervisions,
  currentSession,
  activeSchoolCode,
  onEdit,
  onDeleted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('Todos');

  // Modal para ver boleta oficial de supervisión (Ficha)
  const [selectedForFicha, setSelectedForFicha] = useState<Supervision | null>(null);

  // Modal de confirmación para eliminar
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const allSchools = getSchools();

  // Filtrado de las supervisiones
  const filteredSupervisions = useMemo(() => {
    return supervisions.filter((sup) => {
      // Si la sesión es de escuela, aislar estrictamente a su código de centro
      if (currentSession.role === 'school' && currentSession.schoolCode) {
        if (sup.codigoEscuela !== currentSession.schoolCode) {
          return false;
        }
      } else if (currentSession.role === 'master' && activeSchoolCode && activeSchoolCode !== 'all') {
        if (sup.codigoEscuela !== activeSchoolCode) {
          return false;
        }
      }

      // Filtro de fecha
      if (dateFilter === 'Hoy') {
        if (sup.fecha !== todayStr) return false;
      } else if (dateFilter === 'Anteriores') {
        if (sup.fecha >= todayStr) return false;
      }

      // Buscador
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesDocente = sup.docenteNombre.toLowerCase().includes(query);
        const matchesEscuela =
          sup.nombreEscuela.toLowerCase().includes(query) || sup.codigoEscuela.toLowerCase().includes(query);
        const matchesGrado =
          sup.grado.toLowerCase().includes(query) ||
          (sup.gradoOtroDetalle && sup.gradoOtroDetalle.toLowerCase().includes(query));
        const matchesCorreo = sup.docenteCorreo.toLowerCase().includes(query);

        if (!matchesDocente && !matchesEscuela && !matchesGrado && !matchesCorreo) {
          return false;
        }
      }

      return true;
    });
  }, [supervisions, currentSession, activeSchoolCode, dateFilter, searchTerm, todayStr]);

  // Generador de enlace de WhatsApp formal y estructurado
  const handleOpenWhatsApp = (sup: Supervision) => {
    const rawPhone = sup.docenteTelefono.replace(/\D/g, '');
    const phoneWithCountry = rawPhone.length === 8 ? `503${rawPhone}` : rawPhone;

    const gradoNombre = sup.grado === 'Otro' ? sup.gradoOtroDetalle : sup.grado;
    const duracionStr = `${Math.floor(sup.duracionMinutos / 60)}h ${sup.duracionMinutos % 60}m`;

    const mensaje = `🇸🇻 *MINISTERIO DE EDUCACIÓN DE EL SALVADOR (MINED)*
*Resumen Oficial de Supervisión y Acompañamiento Pedagógico*

Estimado/a *${sup.docenteNombre}*:
Reciba un cordial saludo institucional. Le compartimos la constancia de la visita pedagógica efectuada en su aula:

🏫 *Sede:* ${sup.nombreEscuela} (Cód. ${sup.codigoEscuela})
📚 *Grado:* ${gradoNombre}
📅 *Fecha:* ${sup.fecha}
⏱️ *Horario:* ${sup.horaInicio} - ${sup.horaFin} (${duracionStr})

📊 *Indicadores de Aula:*
• Asistencia SIGES: ${sup.estudiantesAsistieron} de ${sup.matriculaSiges} estudiantes (${sup.porcentajeAsistencia}%)
• Inasistencias: ${sup.estudiantesNoAsistieron}
• Dispositivos en uso: ${sup.totalDispositivos} (Laptops MINED: ${sup.laptopsComputadoras}, Teléfonos: ${sup.telefonosUtilizados})
• Formulario F1: ${sup.f1Completado} | Formularios F4: ${sup.f4Completados}

📝 *Observaciones y Acuerdos:*
"${sup.observaciones || 'Desarrollo pedagógico conforme a la planificación.'}"

Agradecemos su compromiso con la educación de la niñez y juventud salvadoreña.
_Dirección de Educación Básica y Media · MINED_`;

    const encoded = encodeURIComponent(mensaje);
    const url = `https://wa.me/${phoneWithCountry}?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteSupervision(deletingId);
      setDeletingId(null);
      onDeleted();
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de Búsqueda y Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Buscador dinámico con botón de limpiar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por docente, código de escuela, grado o correo..."
              className="w-full pl-10 pr-10 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro segmentado simple de fechas */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start md:self-auto">
            {(['Todos', 'Hoy', 'Anteriores'] as DateFilter[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setDateFilter(tab)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  dateFilter === tab
                    ? 'bg-white text-[#0f2d59] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Resumen de resultados */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Mostrando <strong className="text-slate-800">{filteredSupervisions.length}</strong> registro(s) de supervisión
          </span>
          {currentSession.role === 'master' && (
            <span className="text-[11px] text-blue-800 font-medium">
              Modo Master: Vista Completa
            </span>
          )}
        </div>
      </div>

      {/* Lista de Tarjetas de Supervisión */}
      {filteredSupervisions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">No se encontraron supervisiones</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            No existen registros que coincidan con la búsqueda o el filtro de fecha seleccionado.
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSupervisions.map((sup) => {
            const gradoTexto = sup.grado === 'Otro' ? sup.gradoOtroDetalle : sup.grado;
            const duracionHoras = Math.floor(sup.duracionMinutos / 60);
            const duracionMin = sup.duracionMinutos % 60;

            return (
              <div
                key={sup.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow p-5 sm:p-6"
              >
                {/* Cabecera de la tarjeta: Docente y Escuela */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="bg-blue-100 text-[#0f2d59] font-bold text-xs px-2.5 py-0.5 rounded-full">
                        {gradoTexto}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Cód. {sup.codigoEscuela}
                      </span>
                      {sup.f1Completado === 'Sí' ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          F1 OK
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-md">
                          F1 Pendiente
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-[#0f2d59] flex items-center gap-2">
                      <User className="w-4 h-4 text-[#1b4985]" />
                      <span>{sup.docenteNombre}</span>
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 mt-1">
                      <span className="font-mono">{sup.docenteCorreo}</span>
                      {sup.docenteTelefono && (
                        <span className="font-mono text-slate-500">Tel: {sup.docenteTelefono}</span>
                      )}
                      {sup.docenteDui && (
                        <span className="font-mono text-slate-500">DUI: {sup.docenteDui}</span>
                      )}
                    </div>
                  </div>

                  {/* Datos del Centro Escolar */}
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-semibold text-slate-800 flex sm:justify-end items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>{sup.nombreEscuela}</span>
                    </p>
                    <div className="flex sm:justify-end items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {sup.fecha}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {sup.horaInicio} - {sup.horaFin} ({duracionHoras}h {duracionMin}m)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Métricas destacadas del registro */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 text-center">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Asistencia SIGES
                    </p>
                    <p className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {sup.estudiantesAsistieron} / {sup.matriculaSiges}
                    </p>
                    <span
                      className={`text-[11px] font-bold ${
                        sup.porcentajeAsistencia >= 90
                          ? 'text-emerald-700'
                          : sup.porcentajeAsistencia >= 75
                          ? 'text-amber-700'
                          : 'text-red-700'
                      }`}
                    >
                      {sup.porcentajeAsistencia}% Presente
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Inasistencias
                    </p>
                    <p className="text-sm font-extrabold text-red-600 mt-0.5">
                      {sup.estudiantesNoAsistieron}
                    </p>
                    <span className="text-[11px] text-slate-500">Estudiantes ausentes</span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Tecnologías
                    </p>
                    <p className="text-sm font-extrabold text-blue-900 mt-0.5">
                      {sup.totalDispositivos} equipos
                    </p>
                    <span className="text-[11px] text-slate-500">
                      {sup.laptopsComputadoras} laptops · {sup.telefonosUtilizados} tel.
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                      Formularios
                    </p>
                    <p className="text-sm font-extrabold text-slate-800 mt-0.5">
                      {sup.f4Completados} F4
                    </p>
                    <span className="text-[11px] text-slate-500">F1: {sup.f1Completado}</span>
                  </div>
                </div>

                {/* Observaciones pedagógicas */}
                {sup.observaciones && (
                  <div className="pt-3 pb-2 text-xs text-slate-600 leading-relaxed">
                    <strong className="text-slate-700 font-semibold">Observaciones: </strong>
                    <span className="italic">{sup.observaciones}</span>
                  </div>
                )}

                {/* BOTONES DE ACCIÓN POR REGISTRO (Ficha, WhatsApp, Editar, Eliminar) */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
                  {/* Ficha oficial lista para imprimir en PDF */}
                  <button
                    type="button"
                    onClick={() => setSelectedForFicha(sup)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-[#0f2d59] hover:bg-[#1b4985] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-300" />
                    <span>Ficha (PDF)</span>
                  </button>

                  {/* WhatsApp con mensaje formal estructurado */}
                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(sup)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  {/* Editar registro */}
                  <button
                    type="button"
                    onClick={() => onEdit(sup)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Editar</span>
                  </button>

                  {/* Eliminar registro */}
                  <button
                    type="button"
                    onClick={() => setDeletingId(sup.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Ficha Oficial Imprimible */}
      {selectedForFicha && (
        <OfficialReportModal
          supervision={selectedForFicha}
          school={allSchools.find((s) => s.codigo === selectedForFicha.codigoEscuela)}
          isOpen={true}
          onClose={() => setSelectedForFicha(null)}
        />
      )}

      {/* Modal de confirmación para eliminar */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              ¿Eliminar supervisión de aula?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Esta acción eliminará de forma permanente el registro pedagógico seleccionado.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
