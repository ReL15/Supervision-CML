import React, { useState, useEffect } from 'react';
import { School } from '../types';
import { DEPARTAMENTOS_EL_SALVADOR } from '../data/departmentsData';
import { updateSchool, generateSecurePassword } from '../services/storageService';
import {
  X,
  Building2,
  Lock,
  User,
  Mail,
  Phone,
  FileText,
  MapPin,
  Navigation,
  KeyRound,
  RefreshCw,
  Save,
  CheckCircle,
} from 'lucide-react';

interface EditSchoolModalProps {
  school: School;
  isOpen: boolean;
  readOnlyIdentity?: boolean;
  onClose: () => void;
  onSaved: (updatedSchool: School) => void;
}

export const EditSchoolModal: React.FC<EditSchoolModalProps> = ({
  school,
  isOpen,
  readOnlyIdentity = false,
  onClose,
  onSaved,
}) => {
  const [nombre, setNombre] = useState(school.nombre);
  const [password, setPassword] = useState(school.password);
  const [directorNombre, setDirectorNombre] = useState(school.directorNombre || '');
  const [directorCorreo, setDirectorCorreo] = useState(school.directorCorreo || '');
  const [directorTelefono, setDirectorTelefono] = useState(school.directorTelefono || '');
  const [directorDui, setDirectorDui] = useState(school.directorDui || '');
  const [departamento, setDepartamento] = useState(school.departamento || 'San Salvador');
  const [municipio, setMunicipio] = useState(school.municipio || 'San Salvador');
  const [latitud, setLatitud] = useState<number>(school.latitud || 13.6929);
  const [longitud, setLongitud] = useState<number>(school.longitud || -89.2182);

  const [geoLoading, setGeoLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setNombre(school.nombre);
    setPassword(school.password);
    setDirectorNombre(school.directorNombre || '');
    setDirectorCorreo(school.directorCorreo || '');
    setDirectorTelefono(school.directorTelefono || '');
    setDirectorDui(school.directorDui || '');
    setDepartamento(school.departamento || 'San Salvador');
    setMunicipio(school.municipio || 'San Salvador');
    setLatitud(school.latitud || 13.6929);
    setLongitud(school.longitud || -89.2182);
    setErrorMsg(null);
  }, [school]);

  const deptData =
    DEPARTAMENTOS_EL_SALVADOR.find((d) => d.nombre === departamento) ||
    DEPARTAMENTOS_EL_SALVADOR[0];

  useEffect(() => {
    if (deptData && !deptData.municipios.includes(municipio)) {
      setMunicipio(deptData.municipios[0] || '');
    }
  }, [departamento, deptData, municipio]);

  if (!isOpen) return null;

  // Formatters
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    if (raw.length > 4) {
      setDirectorTelefono(`${raw.slice(0, 4)}-${raw.slice(4)}`);
    } else {
      setDirectorTelefono(raw);
    }
  };

  const handleDuiChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 9);
    if (raw.length > 8) {
      setDirectorDui(`${raw.slice(0, 8)}-${raw.slice(8)}`);
    } else {
      setDirectorDui(raw);
    }
  };

  const handleDeptSelect = (deptName: string) => {
    setDepartamento(deptName);
    const found = DEPARTAMENTOS_EL_SALVADOR.find((d) => d.nombre === deptName);
    if (found) {
      setMunicipio(found.municipios[0]);
      setLatitud(found.lat);
      setLongitud(found.lng);
    }
  };

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg('La geolocalización no está soportada en su dispositivo.');
      return;
    }
    setGeoLoading(true);
    setErrorMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitud(Number(pos.coords.latitude.toFixed(6)));
        setLongitud(Number(pos.coords.longitude.toFixed(6)));
        setGeoLoading(false);
      },
      () => {
        setErrorMsg('No se pudo obtener la señal GPS actual. Verifique permisos.');
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) {
      setErrorMsg('El nombre oficial del centro escolar es obligatorio.');
      return;
    }

    if (!password.trim()) {
      setErrorMsg('La contraseña de acceso institucional no puede estar vacía.');
      return;
    }

    if (directorCorreo.trim() && !directorCorreo.toLowerCase().endsWith('@clases.edu.sv')) {
      setErrorMsg('El correo institucional debe pertenecer al dominio oficial "@clases.edu.sv".');
      return;
    }

    const updated: School = {
      ...school,
      nombre: nombre.trim(),
      password: password.trim(),
      directorNombre: directorNombre.trim(),
      directorCorreo: directorCorreo.trim().toLowerCase(),
      directorTelefono,
      directorDui,
      departamento,
      municipio,
      latitud,
      longitud,
      perfilCompletado: Boolean(directorNombre.trim() && departamento.trim()),
    };

    try {
      await updateSchool(updated);
      onSaved(updated);
      onClose();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'No se pudo actualizar el centro escolar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="p-5 bg-[#0f2d59] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">Editar Centro Escolar</h3>
              <p className="text-xs text-blue-200">
                Código: <strong className="font-mono text-white">{school.codigo}</strong> · Modificación de datos institucionales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Bloque 1: Identificación y Acceso */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#0f2d59] uppercase tracking-wider">
              Identificación y Acceso Institucional
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Código MINED (Invariable)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={school.codigo}
                    readOnly
                    className="w-full bg-slate-100 text-slate-800 font-bold px-3 py-2 text-sm border border-slate-300 rounded-xl cursor-not-allowed select-none font-mono"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Oficial del Centro Escolar
                </label>
                {readOnlyIdentity ? (
                  <p className="w-full bg-slate-100 text-slate-700 px-3 py-2 text-sm border border-slate-200 rounded-xl">
                    {school.nombre}
                  </p>
                ) : (
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden"
                  />
                )}
              </div>

              {!readOnlyIdentity && (
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Contraseña Asignada</span>
                    <button
                      type="button"
                      onClick={() => setPassword(generateSecurePassword(school.codigo))}
                      className="text-[11px] text-[#1b4985] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerar Contraseña
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono font-bold text-slate-800"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bloque 2: Datos de Dirección */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-[#0f2d59] uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#1b4985]" />
              Dirección del Centro Escolar
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Nombre del Director(a)
                </label>
                <input
                  type="text"
                  value={directorNombre}
                  onChange={(e) => setDirectorNombre(e.target.value)}
                  placeholder="Ej. Licda. Karla Elizabeth Morales"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Correo (@clases.edu.sv)
                </label>
                <input
                  type="email"
                  value={directorCorreo}
                  onChange={(e) => setDirectorCorreo(e.target.value)}
                  placeholder="director@clases.edu.sv"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Teléfono (0000-0000)
                </label>
                <input
                  type="text"
                  value={directorTelefono}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="2200-0000"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  DUI del Director (00000000-0)
                </label>
                <input
                  type="text"
                  value={directorDui}
                  onChange={(e) => handleDuiChange(e.target.value)}
                  placeholder="00000000-0"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
                />
              </div>
            </div>
          </div>

          {/* Bloque 3: Ubicación y GPS */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-[#0f2d59] uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#1b4985]" />
              Ubicación y Georreferenciación
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Departamento</label>
                <select
                  value={departamento}
                  onChange={(e) => handleDeptSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white"
                >
                  {DEPARTAMENTOS_EL_SALVADOR.map((d) => (
                    <option key={d.nombre} value={d.nombre}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Municipio</label>
                <select
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white"
                >
                  {deptData.municipios.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Latitud GPS</label>
                <input
                  type="number"
                  step="any"
                  value={latitud}
                  onChange={(e) => setLatitud(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Longitud GPS</label>
                <input
                  type="number"
                  step="any"
                  value={longitud}
                  onChange={(e) => setLongitud(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={geoLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
                {geoLoading ? 'Detectando GPS...' : 'Detectar GPS del Dispositivo'}
              </button>
            </div>
          </div>

          {/* Botones de acción del modal */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0f2d59] hover:bg-[#1b4985] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
