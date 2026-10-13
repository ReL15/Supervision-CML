import React, { useState } from 'react';
import { Teacher, School, UserSession } from '../types';
import { linkTeacherToSchool, saveOrUpdateTeacher } from '../services/storageService';
import {
  X,
  Search,
  UserCheck,
  Building2,
  Phone,
  Mail,
  FileText,
  Link,
  Plus,
  CheckCircle,
  GraduationCap,
} from 'lucide-react';

interface TeacherDirectoryModalProps {
  teachers: Teacher[];
  schools: School[];
  currentSession: UserSession;
  activeSchoolCode: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const TeacherDirectoryModal: React.FC<TeacherDirectoryModalProps> = ({
  teachers,
  schools,
  currentSession,
  activeSchoolCode,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [search, setSearch] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Formulario para registrar nuevo docente
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newCorreo, setNewCorreo] = useState('');
  const [newTelefono, setNewTelefono] = useState('');
  const [newDui, setNewDui] = useState('');
  const [newEspecialidad, setNewEspecialidad] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filtrar docentes visibles según la búsqueda y rol
  const filteredTeachers = teachers.filter((t) => {
    // Si es escuela, puede buscar en todos los docentes para vincularlos, o ver los propios
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        t.nombre.toLowerCase().includes(q) ||
        t.correo.toLowerCase().includes(q) ||
        t.dui.includes(q) ||
        t.telefono.includes(q)
      );
    }
    return true;
  });

  const handleLinkToActiveSchool = (teacherEmail: string) => {
    linkTeacherToSchool(teacherEmail, activeSchoolCode);
    setSuccessMsg(`Docente vinculado con éxito al centro escolar ${activeSchoolCode}`);
    setTimeout(() => setSuccessMsg(null), 3000);
    onUpdated();
  };

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!newCorreo.trim() || !newCorreo.toLowerCase().endsWith('@clases.edu.sv')) {
      setAddError('El correo debe pertenecer al dominio institucional "@clases.edu.sv".');
      return;
    }

    if (!newNombre.trim()) {
      setAddError('Ingrese el nombre completo del profesor.');
      return;
    }

    saveOrUpdateTeacher({
      nombre: newNombre.trim(),
      correo: newCorreo.trim().toLowerCase(),
      telefono: newTelefono.trim(),
      dui: newDui.trim(),
      especialidad: newEspecialidad.trim() || 'Docente de Aula',
      escuelasVinculadas: [activeSchoolCode],
    });

    setSuccessMsg(`Profesor registrado y vinculado exitosamente.`);
    setTimeout(() => setSuccessMsg(null), 3000);
    setShowAddForm(false);
    setNewNombre('');
    setNewCorreo('');
    setNewTelefono('');
    setNewDui('');
    setNewEspecialidad('');
    onUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="p-5 bg-[#0f2d59] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Directorio Docente Institucional</h3>
              <p className="text-xs text-blue-200">
                Cuentas @clases.edu.sv y vinculación multisitio de centros escolares
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notificación de éxito */}
        {successMsg && (
          <div className="m-4 mb-0 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Barra de Búsqueda y Botón de Añadir */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, correo, DUI..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto px-4 py-2 bg-[#0f2d59] hover:bg-[#1b4985] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>{showAddForm ? 'Ocultar Formulario' : 'Nuevo Docente'}</span>
          </button>
        </div>

        {/* Formulario desplegable para registrar nuevo profesor */}
        {showAddForm && (
          <form
            onSubmit={handleCreateTeacher}
            className="p-5 bg-blue-50/50 border-b border-blue-200 space-y-4 animate-in slide-in-from-top-3"
          >
            <h4 className="text-xs font-bold text-[#0f2d59] uppercase tracking-wider">
              Registrar Nuevo Docente en el Directorio
            </h4>

            {addError && (
              <p className="p-2 bg-red-100 text-red-700 text-xs rounded-lg">{addError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Prof. Juan Antonio Pérez"
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Correo Institucional (@clases.edu.sv) *
                </label>
                <input
                  type="email"
                  required
                  value={newCorreo}
                  onChange={(e) => setNewCorreo(e.target.value)}
                  placeholder="juan.perez@clases.edu.sv"
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono (0000-0000)</label>
                <input
                  type="text"
                  value={newTelefono}
                  onChange={(e) => setNewTelefono(e.target.value)}
                  placeholder="7000-0000"
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">DUI (00000000-0)</label>
                <input
                  type="text"
                  value={newDui}
                  onChange={(e) => setNewDui(e.target.value)}
                  placeholder="00000000-0"
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Especialidad / Área</label>
                <input
                  type="text"
                  value={newEspecialidad}
                  onChange={(e) => setNewEspecialidad(e.target.value)}
                  placeholder="Ciencias Naturales, Matemáticas, Básica..."
                  className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#0f2d59] text-white text-xs font-semibold rounded-lg hover:bg-[#1b4985]"
              >
                Guardar y Vincular
              </button>
            </div>
          </form>
        )}

        {/* Listado de Docentes */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {filteredTeachers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl my-4">
              <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Sin docentes en el directorio</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
                Los docentes con correo @clases.edu.sv se registran y vinculan automáticamente al guardar
                las supervisiones de aula, o puede agregarlos directamente con el botón "+ Nuevo Docente".
              </p>
            </div>
          ) : (
            filteredTeachers.map((teacher) => {
            const isLinkedToActive = teacher.escuelasVinculadas.includes(activeSchoolCode);

            return (
              <div
                key={teacher.id}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm text-[#0f2d59]">{teacher.nombre}</h4>
                    {teacher.especialidad && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                        {teacher.especialidad}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="font-mono flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {teacher.correo}
                    </span>
                    {teacher.telefono && (
                      <span className="font-mono flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {teacher.telefono}
                      </span>
                    )}
                    {teacher.dui && (
                      <span className="font-mono flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        {teacher.dui}
                      </span>
                    )}
                  </div>

                  {/* Centros escolares vinculados */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">
                      Centros Vinculados:
                    </span>
                    {teacher.escuelasVinculadas.map((code) => {
                      const sc = schools.find((s) => s.codigo === code);
                      return (
                        <span
                          key={code}
                          className="text-[10px] bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded font-mono font-medium"
                          title={sc?.nombre || code}
                        >
                          {code}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Botón de vinculación con un solo clic */}
                <div className="shrink-0">
                  {isLinkedToActive ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      Vinculado a {activeSchoolCode}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleLinkToActiveSchool(teacher.correo)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1b4985] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      <Link className="w-3.5 h-3.5 text-amber-300" />
                      <span>Vincular a esta Escuela</span>
                    </button>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>
    </div>
  );
};
