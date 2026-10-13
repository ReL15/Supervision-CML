import React from 'react';
import { Supervision, School } from '../types';
import { Printer, X, CheckCircle, ShieldCheck, Download } from 'lucide-react';

interface OfficialReportModalProps {
  supervision: Supervision;
  school?: School;
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialReportModal: React.FC<OfficialReportModalProps> = ({
  supervision,
  school,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Barra superior de acciones */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span className="font-semibold text-sm">Boleta Oficial de Supervisión (Ficha)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTENIDO IMPRIMIBLE DE LA BOLETA */}
        <div className="p-8 text-slate-900 bg-white print-page text-sm select-text">
          {/* Membrete Institucional Oficial MINED */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold tracking-widest uppercase text-slate-700">
                  GOBIERNO DE EL SALVADOR
                </p>
                <h1 className="text-base font-extrabold uppercase text-[#0f2d59] tracking-tight">
                  Ministerio de Educación, Ciencia y Tecnología
                </h1>
                <p className="text-xs font-semibold text-slate-800">
                  Dirección de Educación Básica y Media · Seguimiento Pedagógico
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block border-2 border-slate-900 px-3 py-1 text-xs font-black uppercase tracking-wider bg-slate-50">
                  BOLETA F-MINED
                </span>
                <p className="text-[10px] font-mono text-slate-600 mt-1">
                  ID: {supervision.id}
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-center text-sm font-black uppercase tracking-wider bg-slate-100 py-1.5 border border-slate-300 rounded mb-4">
            Ficha Oficial de Supervisión de Aula y Acompañamiento Pedagógico
          </h2>

          {/* Bloque 1: Centro Escolar y Grado */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 text-xs">
            <div>
              <span className="font-bold text-slate-700">Centro Escolar:</span>{' '}
              <span className="font-semibold text-slate-900">{supervision.nombreEscuela}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Código MINED:</span>{' '}
              <span className="font-mono font-bold text-slate-900">{supervision.codigoEscuela}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Departamento / Municipio:</span>{' '}
              <span>{school ? `${school.departamento}, ${school.municipio}` : 'El Salvador'}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Grado o Sección:</span>{' '}
              <span className="font-bold text-blue-900">
                {supervision.grado === 'Otro' ? supervision.gradoOtroDetalle : supervision.grado}
              </span>
            </div>
          </div>

          {/* Bloque 2: Datos del Docente */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 mb-4 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
              I. Datos del Docente de Aula
            </h3>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-4">
              <div>
                <span className="text-slate-600">Nombre del Profesor(a):</span>{' '}
                <strong className="text-slate-900">{supervision.docenteNombre}</strong>
              </div>
              <div>
                <span className="text-slate-600">Correo Institucional:</span>{' '}
                <span className="font-mono text-slate-900">{supervision.docenteCorreo}</span>
              </div>
              <div>
                <span className="text-slate-600">Teléfono de Contacto:</span>{' '}
                <span className="font-mono text-slate-900">{supervision.docenteTelefono}</span>
              </div>
              <div>
                <span className="text-slate-600">DUI:</span>{' '}
                <span className="font-mono text-slate-900">{supervision.docenteDui}</span>
              </div>
            </div>
          </div>

          {/* Bloque 3: Horario y Asistencia (SIGES) */}
          <div className="bg-slate-50 border border-slate-300 rounded-lg p-3 mb-4 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
              II. Jornada Pedagógica y Asistencia (SIGES)
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white p-2 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Fecha y Horario</span>
                <span className="font-bold text-slate-900">{supervision.fecha}</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  {supervision.horaInicio} - {supervision.horaFin} ({supervision.duracionMinutos} min)
                </p>
              </div>

              <div className="bg-white p-2 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Asistencia Efectiva</span>
                <span className="font-bold text-slate-900">
                  {supervision.estudiantesAsistieron} / {supervision.matriculaSiges}
                </span>
                <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                  {supervision.porcentajeAsistencia}% Asistencia
                </p>
              </div>

              <div className="bg-white p-2 border border-slate-200 rounded">
                <span className="text-[10px] text-slate-500 uppercase block font-medium">Inasistencias</span>
                <span className="font-bold text-red-600">{supervision.estudiantesNoAsistieron}</span>
                <p className="text-[10px] text-slate-500 mt-0.5">Calculado SIGES</p>
              </div>
            </div>
          </div>

          {/* Bloque 4: Tecnologías y Formatos */}
          <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
              <h3 className="font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
                III. Recursos Tecnológicos
              </h3>
              <ul className="space-y-1">
                <li className="flex justify-between">
                  <span className="text-slate-600">Laptops y Tablets MINED:</span>
                  <strong className="font-mono">{supervision.laptopsComputadoras}</strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Teléfonos en clase:</span>
                  <strong className="font-mono">{supervision.telefonosUtilizados}</strong>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-600">Dispositivos pedagógicos:</span>
                  <strong className="font-mono">{supervision.dispositivosApoyoPedagogico}</strong>
                </li>
                <li className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                  <span>Total dispositivos:</span>
                  <span className="font-mono">{supervision.totalDispositivos}</span>
                </li>
              </ul>
            </div>

            <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
              <h3 className="font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-200 pb-1">
                IV. Cumplimiento de Formatos
              </h3>
              <ul className="space-y-1.5">
                <li className="flex justify-between items-center">
                  <span className="text-slate-600">Formulario F1 completado:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      supervision.f1Completado === 'Sí'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {supervision.f1Completado}
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-600">Formularios F4 completados:</span>
                  <strong className="font-mono text-slate-900">{supervision.f4Completados}</strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Bloque 5: Observaciones Pedagógicas */}
          <div className="border border-slate-300 rounded-lg p-3 mb-8 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-700 mb-1 border-b border-slate-200 pb-1">
              V. Observaciones y Acuerdos Pedagógicos
            </h3>
            <p className="text-slate-800 leading-relaxed whitespace-pre-line mt-2">
              {supervision.observaciones || 'Sin observaciones registradas durante la visita.'}
            </p>
          </div>

          {/* Bloque 6: Firmas Institucionales */}
          <div className="grid grid-cols-2 gap-12 pt-8 border-t border-slate-400 text-center text-xs">
            <div>
              <div className="w-48 mx-auto border-b border-slate-800 mb-2"></div>
              <p className="font-bold text-slate-900">{supervision.docenteNombre}</p>
              <p className="text-slate-600">Docente Supervisado</p>
              <p className="font-mono text-[10px] text-slate-500">DUI: {supervision.docenteDui}</p>
            </div>

            <div>
              <div className="w-48 mx-auto border-b border-slate-800 mb-2"></div>
              <p className="font-bold text-slate-900">Supervisor(a) / Dirección</p>
              <p className="text-slate-600">Sello Institucional MINED</p>
              <p className="text-[10px] text-slate-500">Código Centro: {supervision.codigoEscuela}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
