import React, { useState, useEffect } from 'react';
import { School } from '../types';
import { DEPARTAMENTOS_EL_SALVADOR } from '../data/departmentsData';
import { updateSchool } from '../services/storageService';
import { Lock, MapPin, Building2, User, Mail, Phone, FileText, CheckCircle, Navigation } from 'lucide-react';

interface SchoolOnboardingModalProps {
  school: School;
  isOpen: boolean;
  onCompleted: (updatedSchool: School) => void;
}

export const SchoolOnboardingModal: React.FC<SchoolOnboardingModalProps> = ({
  school,
  isOpen,
  onCompleted,
}) => {
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

  // Departamentos y municipios dinámicos
  const deptData = DEPARTAMENTOS_EL_SALVADOR.find((d) => d.nombre === departamento) || DEPARTAMENTOS_EL_SALVADOR[0];

  useEffect(() => {
    if (deptData && !deptData.municipios.includes(municipio)) {
      setMunicipio(deptData.municipios[0] || '');
    }
  }, [departamento, deptData, municipio]);

  if (!isOpen) return null;

  // Formatter for El Salvador Phone (0000-0000)
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 8);
    if (raw.length > 4) {
      setDirectorTelefono(`${raw.slice(0, 4)}-${raw.slice(4)}`);
    } else {
      setDirectorTelefono(raw);
    }
  };

  // Formatter for El Salvador DUI (00000000-0)
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

  // Detect GPS
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setErrorMsg('La geolocalización no está soportada por su navegador.');
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
        setErrorMsg('No se pudo obtener la ubicación GPS actual. Puede usar las coordenadas de referencia del municipio.');
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validations
    if (!directorNombre.trim()) {
      setErrorMsg('El nombre completo del director es obligatorio.');
      return;
    }

    if (!directorCorreo.trim() || !directorCorreo.toLowerCase().endsWith('@clases.edu.sv')) {
      setErrorMsg('El correo institucional debe ser válido y pertenecer al dominio oficial "@clases.edu.sv".');
      return;
    }

    if (!directorTelefono.trim() || directorTelefono.replace(/\D/g, '').length < 8) {
      setErrorMsg('Ingrese un número telefónico salvadoreño válido (ej. 2234-5678).');
      return;
    }

    if (!directorDui.trim() || directorDui.replace(/\D/g, '').length < 9) {
      setErrorMsg('Ingrese un DUI salvadoreño válido con formato 00000000-0.');
      return;
    }

    const updated: School = {
      ...school,
      perfilCompletado: true,
      directorNombre: directorNombre.trim(),
      directorCorreo: directorCorreo.trim().toLowerCase(),
      directorTelefono,
      directorDui,
      departamento,
      municipio,
      latitud,
      longitud,
    };

    try {
      await updateSchool(updated);
      onCompleted(updated);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'No se pudo guardar el perfil del centro escolar.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-200">
        {/* Banner institucional MINED */}
        <div className="bg-[#0f2d59] text-white p-6 relative">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-block bg-amber-400 text-slate-900 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wide mb-2">
                Registro Institucional Obligatorio
              </span>
              <h2 className="text-xl font-bold tracking-tight">Primer Ingreso al Sistema</h2>
              <p className="text-blue-100 text-xs mt-1">
                Complete el perfil oficial del centro escolar para habilitar las supervisiones de aula.
              </p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-amber-300">
              <Building2 className="w-7 h-7" />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 leading-relaxed font-medium">
              {errorMsg}
            </div>
          )}

          {/* Sección 1: Datos institucionales precargados y bloqueados */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
              <Lock className="w-4 h-4 text-slate-500" />
              <span>Datos Institucionales Autorizados (Solo Lectura)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Código de Centro
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={school.codigo}
                    readOnly
                    className="w-full bg-slate-100 text-slate-800 font-semibold px-3 py-2 text-base border border-slate-300 rounded-lg cursor-not-allowed select-none"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Nombre Oficial del Centro Escolar
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={school.nombre}
                    readOnly
                    className="w-full bg-slate-100 text-slate-800 font-semibold px-3 py-2 text-base border border-slate-300 rounded-lg cursor-not-allowed select-none truncate"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Sección 2: Datos del Director o Directora */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#0f2d59] flex items-center gap-2">
              <User className="w-4 h-4 text-[#1b4985]" />
              Datos del Director(a) Responsable
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nombre Completo del Director(a) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={directorNombre}
                  onChange={(e) => setDirectorNombre(e.target.value)}
                  placeholder="Ej. Licda. Karla Elizabeth Morales"
                  className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Correo Institucional (@clases.edu.sv) <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={directorCorreo}
                  onChange={(e) => setDirectorCorreo(e.target.value)}
                  placeholder="director.ejemplo@clases.edu.sv"
                  className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Teléfono de Contacto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={directorTelefono}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="2200-0000"
                  className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Documento Único de Identidad (DUI) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={directorDui}
                  onChange={(e) => handleDuiChange(e.target.value)}
                  placeholder="00000000-0"
                  className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Ubicación y Georreferenciación GPS */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#0f2d59] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#1b4985]" />
              Ubicación Geográfica y Coordenadas GPS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Departamento <span className="text-red-500">*</span>
                </label>
                <select
                  value={departamento}
                  onChange={(e) => handleDeptSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white"
                >
                  {DEPARTAMENTOS_EL_SALVADOR.map((d) => (
                    <option key={d.nombre} value={d.nombre}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Municipio <span className="text-red-500">*</span>
                </label>
                <select
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden bg-white"
                >
                  {deptData.municipios.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Latitud GPS
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitud}
                  onChange={(e) => setLatitud(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Longitud GPS
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitud}
                  onChange={(e) => setLongitud(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={geoLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
              >
                <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
                {geoLoading ? 'Obteniendo GPS...' : 'Detectar GPS del Dispositivo'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLatitud(deptData.lat);
                  setLongitud(deptData.lng);
                }}
                className="text-xs text-[#1b4985] hover:underline px-2 py-1 font-medium"
              >
                Restablecer a centro de {departamento}
              </button>
            </div>
          </div>

          {/* Botón de Guardado Final Obligatorio */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-[#0f2d59] hover:bg-[#1b4985] text-white font-semibold rounded-xl text-base shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle className="w-5 h-5 text-amber-400" />
              Completar Perfil y Acceder al Sistema
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
