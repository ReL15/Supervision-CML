import React, { useState, useEffect } from 'react';
import { Supervision, School, UserSession, GradoOficial } from '../types';
import {
  findTeacherByEmail,
  saveSupervision,
  getSchools,
} from '../services/storageService';
import {
  Save,
  RotateCcw,
  Building2,
  GraduationCap,
  Clock,
  Laptop,
  FileCheck2,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface SupervisionFormProps {
  currentSession: UserSession;
  activeSchoolCode: string;
  editingSupervision?: Supervision | null;
  onSaved: (saved: Supervision) => void;
  onCancelEdit?: () => void;
}

const GRADOS_OFICIALES: GradoOficial[] = [
  'Parvularia',
  '1° Grado',
  '2° Grado',
  '3° Grado',
  '4° Grado',
  '5° Grado',
  '6° Grado',
  '7° Grado',
  '8° Grado',
  '9° Grado',
  '1° Año de Bachillerato',
  '2° Año de Bachillerato',
  'Educación Especial',
  'Otro',
];

export const SupervisionForm: React.FC<SupervisionFormProps> = ({
  currentSession,
  activeSchoolCode,
  editingSupervision,
  onSaved,
  onCancelEdit,
}) => {
  const allSchools = getSchools();
  const isMaster = currentSession.role === 'master';

  // Section 1: Centro Escolar y Grado
  const [selectedSchoolCode, setSelectedSchoolCode] = useState(
    editingSupervision?.codigoEscuela || activeSchoolCode || (allSchools[0]?.codigo ?? '')
  );
  const [grado, setGrado] = useState<GradoOficial>(editingSupervision?.grado || '1° Grado');
  const [gradoOtro, setGradoOtro] = useState(editingSupervision?.gradoOtroDetalle || '');
  const [seccion, setSeccion] = useState(editingSupervision?.seccion || '');

  // Section 2: Datos del Docente
  const [docenteCorreo, setDocenteCorreo] = useState(
    editingSupervision?.docenteCorreo || ''
  );
  const [docenteNombre, setDocenteNombre] = useState(
    editingSupervision?.docenteNombre || ''
  );
  const [docenteTelefono, setDocenteTelefono] = useState(
    editingSupervision?.docenteTelefono || ''
  );
  const [docenteDui, setDocenteDui] = useState(
    editingSupervision?.docenteDui || ''
  );
  const [docenteAutocompletado, setDocenteAutocompletado] = useState(false);

  // Section 3: Horario y Asistencia
  const [fecha, setFecha] = useState(
    editingSupervision?.fecha || new Date().toISOString().split('T')[0]
  );
  const [horaInicio, setHoraInicio] = useState(editingSupervision?.horaInicio || '08:00');
  const [horaFin, setHoraFin] = useState(editingSupervision?.horaFin || '09:30');
  const [matriculaSiges, setMatriculaSiges] = useState<number>(
    editingSupervision?.matriculaSiges ?? 0
  );
  const [estudiantesAsistieron, setEstudiantesAsistieron] = useState<number>(
    editingSupervision?.estudiantesAsistieron ?? 0
  );

  // Section 4: Recursos Tecnológicos
  const [telefonos, setTelefonos] = useState<number>(
    editingSupervision?.telefonosUtilizados ?? 0
  );
  const [laptops, setLaptops] = useState<number>(
    editingSupervision?.laptopsComputadoras ?? 0
  );
  const [apoyoPedagogico, setApoyoPedagogico] = useState<number>(
    editingSupervision?.dispositivosApoyoPedagogico ?? 0
  );

  // Section 5: Formatos y Observaciones
  const [f4Cantidad, setF4Cantidad] = useState<number>(editingSupervision?.f4Completados ?? 0);
  const [f1Completado, setF1Completado] = useState<'Sí' | 'No'>(
    editingSupervision?.f1Completado ?? 'No'
  );
  const [observaciones, setObservaciones] = useState(
    editingSupervision?.observaciones || ''
  );

  // Feedback states
  const [formError, setFormError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);

  // Sync when editingSupervision changes
  useEffect(() => {
    if (editingSupervision) {
      setSelectedSchoolCode(editingSupervision.codigoEscuela);
      setGrado(editingSupervision.grado);
      setGradoOtro(editingSupervision.gradoOtroDetalle || '');
      setSeccion(editingSupervision.seccion || '');
      setDocenteCorreo(editingSupervision.docenteCorreo);
      setDocenteNombre(editingSupervision.docenteNombre);
      setDocenteTelefono(editingSupervision.docenteTelefono);
      setDocenteDui(editingSupervision.docenteDui);
      setFecha(editingSupervision.fecha);
      setHoraInicio(editingSupervision.horaInicio);
      setHoraFin(editingSupervision.horaFin);
      setMatriculaSiges(editingSupervision.matriculaSiges);
      setEstudiantesAsistieron(editingSupervision.estudiantesAsistieron);
      setTelefonos(editingSupervision.telefonosUtilizados);
      setLaptops(editingSupervision.laptopsComputadoras);
      setApoyoPedagogico(editingSupervision.dispositivosApoyoPedagogico);
      setF4Cantidad(editingSupervision.f4Completados);
      setF1Completado(editingSupervision.f1Completado);
      setObservaciones(editingSupervision.observaciones);
    }
  }, [editingSupervision]);

  // Si no es master, mantener fijado el código de escuela de la sesión
  useEffect(() => {
    if (!isMaster && currentSession.schoolCode) {
      setSelectedSchoolCode(currentSession.schoolCode);
    }
  }, [isMaster, currentSession.schoolCode]);

  // Información del centro escolar seleccionado
  const currentSchool = allSchools.find((s) => s.codigo === selectedSchoolCode);

  // Autocompletado del docente según correo (@clases.edu.sv)
  const handleEmailChange = (emailInput: string) => {
    setDocenteCorreo(emailInput);
    const trimmed = emailInput.trim().toLowerCase();
    if (trimmed.endsWith('@clases.edu.sv')) {
      const foundTeacher = findTeacherByEmail(trimmed);
      if (foundTeacher) {
        setDocenteNombre(foundTeacher.nombre);
        setDocenteTelefono(foundTeacher.telefono);
        setDocenteDui(foundTeacher.dui);
        setDocenteAutocompletado(true);
      } else {
        setDocenteAutocompletado(false);
      }
    } else {
      setDocenteAutocompletado(false);
    }
  };

  // Formateadores automáticos de teléfono y DUI
  const handlePhoneInput = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    if (raw.length > 4) {
      setDocenteTelefono(`${raw.slice(0, 4)}-${raw.slice(4)}`);
    } else {
      setDocenteTelefono(raw);
    }
  };

  const handleDuiInput = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 9);
    if (raw.length > 8) {
      setDocenteDui(`${raw.slice(0, 8)}-${raw.slice(8)}`);
    } else {
      setDocenteDui(raw);
    }
  };

  // Cálculo automático de duración
  const calculateDurationMinutes = (start: string, end: string): number => {
    try {
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      const total1 = h1 * 60 + m1;
      const total2 = h2 * 60 + m2;
      return total2 > total1 ? total2 - total1 : 0;
    } catch {
      return 0;
    }
  };

  const duracionMinutos = calculateDurationMinutes(horaInicio, horaFin);
  const duracionTexto = `${Math.floor(duracionMinutos / 60)}h ${duracionMinutos % 60}m`;

  // Cálculo automático y transparente de inasistencias y % de asistencia
  const estudiantesNoAsistieron = Math.max(0, matriculaSiges - estudiantesAsistieron);
  const porcentajeAsistencia =
    matriculaSiges > 0 ? Number(((estudiantesAsistieron / matriculaSiges) * 100).toFixed(1)) : 0;

  // Total de dispositivos tecnológicos
  const totalDispositivos = (telefonos || 0) + (laptops || 0) + (apoyoPedagogico || 0);

  // Limpiar formulario
  const handleReset = () => {
    setDocenteCorreo('');
    setDocenteNombre('');
    setDocenteTelefono('');
    setDocenteDui('');
    setMatriculaSiges(0);
    setEstudiantesAsistieron(0);
    setTelefonos(0);
    setLaptops(0);
    setApoyoPedagogico(0);
    setF4Cantidad(0);
    setF1Completado('No');
    setObservaciones('');
    setGrado('1° Grado');
    setGradoOtro('');
    setSeccion('');
    setFormError(null);
    if (onCancelEdit) onCancelEdit();
  };

  // Guardar supervisión
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validaciones oficiales MINED
    if (!selectedSchoolCode.trim()) {
      setFormError('Debe seleccionar o registrar un Centro Escolar antes de guardar la supervisión.');
      return;
    }

    if (!docenteCorreo.trim() || !docenteCorreo.toLowerCase().endsWith('@clases.edu.sv')) {
      setFormError(
        'El correo del docente es obligatorio y debe tener la extensión institucional oficial "@clases.edu.sv".'
      );
      return;
    }

    if (!docenteNombre.trim()) {
      setFormError('El nombre completo del docente de aula es requerido.');
      return;
    }

    if (matriculaSiges <= 0) {
      setFormError('La matrícula registrada en SIGES debe ser mayor a 0.');
      return;
    }

    if (estudiantesAsistieron > matriculaSiges) {
      setFormError('La cantidad de estudiantes que asistieron no puede superar la matrícula según SIGES.');
      return;
    }

    if (grado === 'Otro' && !gradoOtro.trim()) {
      setFormError('Ha seleccionado "Otro". Especifique el nombre del grado.');
      return;
    }

    if (!seccion.trim()) {
      setFormError('Indique la sección y jornada (por ejemplo, A Vespertino).');
      return;
    }

    if (duracionMinutos <= 0) {
      setFormError('La hora de finalización de la visita debe ser posterior a la hora de inicio.');
      return;
    }

    const schoolObj = allSchools.find((s) => s.codigo === selectedSchoolCode);

    const supervisionRecord: Supervision = {
      id: editingSupervision?.id || `sup-${Date.now()}`,
      codigoEscuela: selectedSchoolCode,
      nombreEscuela: schoolObj?.nombre || `Centro Escolar ${selectedSchoolCode}`,
      grado,
      gradoOtroDetalle: grado === 'Otro' ? gradoOtro.trim() : undefined,
      seccion: seccion.trim(),
      docenteNombre: docenteNombre.trim(),
      docenteCorreo: docenteCorreo.trim().toLowerCase(),
      docenteTelefono: docenteTelefono.trim(),
      docenteDui: docenteDui.trim(),
      fecha,
      horaInicio,
      horaFin,
      duracionMinutos,
      matriculaSiges,
      estudiantesAsistieron,
      estudiantesNoAsistieron,
      porcentajeAsistencia,
      telefonosUtilizados: telefonos || 0,
      laptopsComputadoras: laptops || 0,
      dispositivosApoyoPedagogico: apoyoPedagogico || 0,
      totalDispositivos,
      f4Completados: f4Cantidad || 0,
      f1Completado,
      observaciones: observaciones.trim(),
      creadoPor: isMaster ? 'master' : selectedSchoolCode,
      createdAt: editingSupervision?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await saveSupervision(supervisionRecord);
      setSuccessNotice(true);
      setTimeout(() => setSuccessNotice(false), 3000);
      onSaved(supervisionRecord);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'No se pudo guardar la supervisión.');
      return;
    }

    if (!editingSupervision) {
      // Limpiar parcialmente para siguiente registro rápido
      setDocenteNombre('');
      setDocenteCorreo('');
      setDocenteTelefono('');
      setDocenteDui('');
      setObservaciones('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Encabezado del Formulario */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-blue-100 text-[#0f2d59] text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                MINED El Salvador
              </span>
              <span className="text-xs text-slate-500">
                Formulario Oficial de Acompañamiento
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f2d59] tracking-tight">
              {editingSupervision ? 'Editar Registro de Supervisión' : 'Nueva Supervisión de Aula'}
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Complete los 5 bloques requeridos. El sistema vincula al docente automáticamente con el
              centro escolar activo.
            </p>
          </div>

          {editingSupervision && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Cancelar Edición
            </button>
          )}
        </div>

        {/* Notificación de éxito */}
        {successNotice && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Supervisión guardada exitosamente y docente vinculado en el directorio.</span>
          </div>
        )}

        {/* Mensaje de error */}
        {formError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs font-semibold text-red-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============================================================ */}
        {/* SECCIÓN 1: CENTRO ESCOLAR Y GRADO */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f2d59] flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f2d59]">Centro Escolar y Grado</h3>
              <p className="text-[11px] text-slate-500">
                Identificación de la sede educativa y sección de clase
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código de Centro Escolar */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Código de Centro Escolar</span>
                {isMaster ? (
                  <span className="text-[10px] text-blue-700 font-normal">
                    (Editable: Modo Master)
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-normal">
                    (Bloqueado: Sede Activa)
                  </span>
                )}
              </label>

              {isMaster ? (
                <div className="relative">
                  <select
                    value={selectedSchoolCode}
                    onChange={(e) => setSelectedSchoolCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white"
                  >
                    {allSchools.length === 0 ? (
                      <option value="">(No hay escuelas registradas aún)</option>
                    ) : (
                      allSchools.map((s) => (
                        <option key={s.codigo} value={s.codigo}>
                          {s.codigo} - {s.nombre}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={selectedSchoolCode}
                    readOnly
                    className="w-full bg-slate-100 text-slate-800 font-semibold px-3.5 py-2.5 text-base border border-slate-300 rounded-xl cursor-not-allowed select-none"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                </div>
              )}

              {/* Nombre de la escuela activa */}
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                <span className="font-medium text-[#1b4985]">
                  {currentSchool?.nombre || (selectedSchoolCode ? `Centro Escolar ${selectedSchoolCode}` : 'Sin escuela registrada')}
                </span>
                {currentSchool?.departamento && (
                  <span className="text-slate-400 text-[11px]">
                    · {currentSchool.departamento}
                  </span>
                )}
              </div>
            </div>

            {/* Grado y sección */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Grado Oficial <span className="text-red-500">*</span>
              </label>
              <select
                value={grado}
                onChange={(e) => setGrado(e.target.value as GradoOficial)}
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white"
              >
                {GRADOS_OFICIALES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>

              {/* Si elige "Otro", despliega campo de texto libre */}
              {grado === 'Otro' && (
                <div className="mt-2.5 animate-in fade-in duration-150">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Especifique el grado:
                  </label>
                  <input
                    type="text"
                    value={gradoOtro}
                    onChange={(e) => setGradoOtro(e.target.value)}
                    placeholder="Ej. Nivel Inicial 3 o Bachillerato Técnico Vocacional"
                    className="w-full px-3.5 py-2 text-base border border-amber-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-amber-50/40"
                  />
                </div>
              )}
              <div className="mt-2.5">
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Sección y jornada <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={seccion}
                  onChange={(e) => setSeccion(e.target.value)}
                  placeholder="Ej. A Vespertino"
                  className="w-full px-3.5 py-2 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN 2: DATOS DEL DOCENTE */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f2d59] flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0f2d59]">Datos del Docente</h3>
                <p className="text-[11px] text-slate-500">
                  Validación institucional y autocompletado por correo @clases.edu.sv
                </p>
              </div>
            </div>

            {docenteAutocompletado && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Docente Reconocido en Directorio
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Correo Institucional Oficial */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>
                  Correo Institucional (@clases.edu.sv) <span className="text-red-500">*</span>
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Escriba el correo para autocompletar datos del docente
                </span>
              </label>
              <input
                type="email"
                required
                value={docenteCorreo}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="nombre.apellido@clases.edu.sv"
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
              />
            </div>

            {/* Nombre Completo */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nombre Completo del Profesor(a) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={docenteNombre}
                onChange={(e) => setDocenteNombre(e.target.value)}
                placeholder="Ej. Prof. Jorge Rivera Lué"
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden"
              />
            </div>

            {/* Teléfono Salvadoreño */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Teléfono de Contacto (0000-0000)
              </label>
              <input
                type="text"
                value={docenteTelefono}
                onChange={(e) => handlePhoneInput(e.target.value)}
                placeholder="7845-1234"
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
              />
            </div>

            {/* DUI Salvadoreño */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                DUI (00000000-0)
              </label>
              <input
                type="text"
                value={docenteDui}
                onChange={(e) => handleDuiInput(e.target.value)}
                placeholder="02345678-9"
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
              />
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN 3: HORARIO Y ASISTENCIA */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f2d59] flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0f2d59]">Horario y Asistencia (SIGES)</h3>
                <p className="text-[11px] text-slate-500">
                  Cálculo automático de duración y balance de inasistencias
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg font-mono">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Duración: {duracionTexto}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Fecha */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Fecha de Supervisión <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white font-mono"
              />
            </div>

            {/* Hora Inicio */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hora de Inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white font-mono"
              />
            </div>

            {/* Hora Fin */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Hora de Finalización <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white font-mono"
              />
            </div>
          </div>

          {/* Bloque de Matrícula y Asistencia SIGES */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Matrícula según SIGES <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={matriculaSiges}
                onChange={(e) => setMatriculaSiges(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Estudiantes que Asistieron <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                max={matriculaSiges}
                required
                value={estudiantesAsistieron}
                onChange={(e) =>
                  setEstudiantesAsistieron(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono font-bold"
              />
            </div>

            {/* Cálculo automático y transparente de inasistencias */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>No Asistieron</span>
                <span className="text-[10px] text-slate-400 font-normal">Calculado (SIGES - Asistieron)</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={estudiantesNoAsistieron}
                  readOnly
                  className="w-full bg-slate-100 text-slate-800 font-bold px-3.5 py-2.5 text-base border border-slate-300 rounded-xl cursor-not-allowed select-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Tarjeta de porcentaje de asistencia en vivo */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Índice de Asistencia de la Jornada:</span>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono font-bold text-sm px-2.5 py-0.5 rounded-md ${
                  porcentajeAsistencia >= 90
                    ? 'bg-emerald-100 text-emerald-800'
                    : porcentajeAsistencia >= 75
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {porcentajeAsistencia}%
              </span>
              <span className="text-[11px] text-slate-500">
                ({estudiantesAsistieron} de {matriculaSiges} presentes)
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN 4: RECURSOS TECNOLÓGICOS UTILIZADOS */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f2d59] flex items-center justify-center font-bold text-sm">
                4
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#0f2d59]">Recursos Tecnológicos Utilizados</h3>
                <p className="text-[11px] text-slate-500">
                  Inventario de dispositivos en aula durante la sesión pedagógica
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0f2d59] bg-blue-50 px-3 py-1 rounded-lg">
              <Laptop className="w-3.5 h-3.5 text-[#1b4985]" />
              <span>Total Dispositivos: {totalDispositivos}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Teléfonos Celulares
              </label>
              <input
                type="number"
                min="0"
                value={telefonos}
                onChange={(e) => setTelefonos(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Teléfonos usados con fin educativo</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Laptops y Computadoras / Tablets
              </label>
              <input
                type="number"
                min="0"
                value={laptops}
                onChange={(e) => setLaptops(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Equipos portátiles o de escritorio</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Dispositivos de Apoyo Pedagógico
              </label>
              <input
                type="number"
                min="0"
                value={apoyoPedagogico}
                onChange={(e) => setApoyoPedagogico(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">Proyectores, kits robótica, pantallas</p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECCIÓN 5: FORMATOS Y OBSERVACIONES */}
        {/* ============================================================ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0f2d59] flex items-center justify-center font-bold text-sm">
              5
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f2d59]">Formatos y Observaciones</h3>
              <p className="text-[11px] text-slate-500">
                Instrumentos normativos del MINED y acuerdos pedagógicos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Cantidad de Formularios F4 Completados
              </label>
              <input
                type="number"
                min="0"
                value={f4Cantidad}
                onChange={(e) => setF4Cantidad(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Formulario F1 Completado <span className="text-red-500">*</span>
              </label>
              <select
                value={f1Completado}
                onChange={(e) => setF1Completado(e.target.value as 'Sí' | 'No')}
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white"
              >
                <option value="Sí">Sí - Formulario F1 Completado</option>
                <option value="No">No - Pendiente de Entrega</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Observaciones Pedagógicas Generales
              </label>
              <textarea
                rows={3}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Describa el desarrollo de la clase, metodologías aplicadas, uso de libros MINED o compromisos acordados..."
                className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Botones de acción principales */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-5 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Limpiar</span>
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-7 py-3 bg-[#0f2d59] hover:bg-[#1b4985] text-white font-semibold rounded-xl text-base shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Save className="w-5 h-5 text-amber-400" />
            <span>{editingSupervision ? 'Actualizar Supervisión' : 'Guardar Supervisión'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
