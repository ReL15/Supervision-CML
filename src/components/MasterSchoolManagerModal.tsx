import React, { useState } from 'react';
import { School } from '../types';
import { saveSchool, generateSecurePassword } from '../services/storageService';
import {
  X,
  Shield,
  Building2,
  KeyRound,
  Copy,
  Check,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface MasterSchoolManagerModalProps {
  schools: School[];
  isOpen: boolean;
  onClose: () => void;
  onSchoolsUpdated: () => void;
}

export const MasterSchoolManagerModal: React.FC<MasterSchoolManagerModalProps> = ({
  schools,
  isOpen,
  onClose,
  onSchoolsUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Formulario de nueva escuela
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState(generateSecurePassword(''));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    setPassword(generateSecurePassword(codigo.trim() || undefined));
  };

  const handleCopyCredentials = (school: School) => {
    const text = `Credenciales de Acceso - Sistema de Supervisión MINED\nCentro Escolar: ${school.nombre}\nCódigo de Centro: ${school.codigo}\nContraseña Asignada: ${school.password}\nPortal: Acceso por Centro Escolar`;
    navigator.clipboard.writeText(text);
    setCopiedCode(school.codigo);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleRegisterSchool = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedCode = codigo.trim();
    const trimmedName = nombre.trim();

    if (!trimmedCode) {
      setErrorMsg('El Código de Centro Escolar es obligatorio.');
      return;
    }

    if (!trimmedName) {
      setErrorMsg('El Nombre del Centro Escolar es obligatorio.');
      return;
    }

    const newSchool: School = {
      codigo: trimmedCode,
      nombre: trimmedName,
      password: password.trim(),
      perfilCompletado: false, // Forzar flujo de onboarding en primer ingreso
      directorNombre: '',
      directorCorreo: '',
      directorTelefono: '',
      directorDui: '',
      departamento: 'San Salvador',
      municipio: 'San Salvador',
      latitud: 13.6929,
      longitud: -89.2182,
      fechaRegistro: new Date().toISOString().split('T')[0],
    };

    const ok = saveSchool(newSchool);
    if (!ok) {
      setErrorMsg(`Ya existe una escuela registrada con el código ${trimmedCode}.`);
      return;
    }

    setSuccessMsg(`Centro escolar ${trimmedCode} registrado con éxito.`);
    setCodigo('');
    setNombre('');
    setPassword(generateSecurePassword(''));
    onSchoolsUpdated();
  };

  const filtered = schools.filter(
    (s) =>
      s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-[#0f2d59] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Consola Master de Gestión de Escuelas</h3>
              <p className="text-xs text-blue-200">
                Alta institucional de centros educativos y generación de claves de acceso
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

        {/* Notificaciones */}
        {successMsg && (
          <div className="m-4 mb-0 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="m-4 mb-0 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario de Registro de Nueva Escuela */}
        <form
          onSubmit={handleRegisterSchool}
          className="p-5 bg-slate-50 border-b border-slate-200 space-y-3"
        >
          <div className="flex items-center gap-2 mb-1">
            <Plus className="w-4 h-4 text-blue-900" />
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Registrar Nuevo Centro Escolar
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Código MINED *
              </label>
              <input
                type="text"
                required
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej. 15890"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre del Centro Escolar *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Centro Escolar General Manuel José Arce"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>Contraseña Segura Generada</span>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="text-[11px] text-[#1b4985] hover:underline flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Regenerar
                </button>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white font-mono font-bold text-slate-800"
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#0f2d59] hover:bg-[#1b4985] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Registrar Escuela</span>
              </button>
            </div>
          </div>
        </form>

        {/* Buscador de escuelas existentes */}
        <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código o nombre..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {schools.length} centros en el sistema
          </span>
        </div>

        {/* Lista de escuelas y credenciales */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl my-4">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">Sin centros escolares registrados</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                Ingrese el código y nombre del centro escolar en el formulario superior para generar su contraseña institucional de acceso.
              </p>
            </div>
          ) : (
            filtered.map((school) => {
            const isCopied = copiedCode === school.codigo;

            return (
              <div
                key={school.codigo}
                className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-blue-100 text-[#0f2d59] px-2 py-0.5 rounded">
                      Cód. {school.codigo}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{school.nombre}</h4>
                    {school.perfilCompletado ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                        Perfil Completado
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                        Pendiente 1er Ingreso
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    {school.departamento ? `${school.departamento}, ${school.municipio}` : 'Sin ubicación'} · Director: {school.directorNombre || 'Pendiente'}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">Contraseña:</span>
                    <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                      {school.password}
                    </span>
                  </div>
                </div>

                {/* Botón para copiar credenciales completas */}
                <button
                  type="button"
                  onClick={() => handleCopyCredentials(school)}
                  className={`px-3 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    isCopied
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copiar Credenciales</span>
                    </>
                  )}
                </button>
              </div>
            );
            })
          )}
        </div>
      </div>
    </div>
  );
};
