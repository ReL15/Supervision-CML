import React, { useEffect, useRef, useState } from 'react';
import { School, Supervision, UserSession } from '../types';
import L from 'leaflet';
import {
  MapPin,
  Building2,
  Phone,
  Mail,
  User,
  Navigation,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  PlusCircle,
  FileText,
} from 'lucide-react';

interface SchoolsMapViewProps {
  schools: School[];
  supervisions: Supervision[];
  currentSession: UserSession;
  onNewSupervisionInSchool?: (schoolCode: string) => void;
  onViewSupervisionFicha?: (sup: Supervision) => void;
}

export const SchoolsMapView: React.FC<SchoolsMapViewProps> = ({
  schools,
  supervisions,
  currentSession,
  onNewSupervisionInSchool,
  onViewSupervisionFicha,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [code: string]: L.Marker }>({});

  const isSchoolUser = currentSession.role === 'school';
  const initialSelected = isSchoolUser
    ? schools.find((s) => s.codigo === currentSession.schoolCode) || schools[0]
    : schools[0];

  const [selectedSchool, setSelectedSchool] = useState<School | null>(initialSelected || null);

  // Filtrar escuelas visibles: si es usuario de escuela, muestra su escuela o las autorizadas
  const displaySchools = isSchoolUser
    ? schools.filter((s) => s.codigo === currentSession.schoolCode)
    : schools;

  // Supervisiones del centro escolar seleccionado
  const schoolSupervisions = selectedSchool
    ? supervisions.filter((sup) => sup.codigoEscuela === selectedSchool.codigo)
    : [];

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destruir mapa previo si existe
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Inicializar mapa centrado en El Salvador
    const map = L.map(mapContainerRef.current, {
      center: [13.7942, -88.8965],
      zoom: 8,
      zoomControl: true,
    });
    mapInstanceRef.current = map;

    // Añadir capa de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | MINED El Salvador',
      maxZoom: 18,
    }).addTo(map);

    // Icono institucional MINED personalizado
    const customIcon = L.divIcon({
      className: 'custom-school-pin',
      html: `
        <div style="background-color: #0f2d59; color: white; width: 32px; height: 32px; border-radius: 50%; border: 3px solid #f8fafc; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">
          🏫
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });

    // Añadir marcadores
    markersRef.current = {};
    displaySchools.forEach((school) => {
      if (school.latitud && school.longitud) {
        const marker = L.marker([school.latitud, school.longitud], { icon: customIcon }).addTo(map);

        marker.bindPopup(`
          <div style="font-family: inherit; padding: 2px;">
            <p style="font-size: 10px; color: #64748b; margin: 0; font-weight: bold; text-transform: uppercase;">Cód. ${school.codigo}</p>
            <h4 style="font-size: 13px; font-weight: bold; color: #0f2d59; margin: 2px 0 4px 0;">${school.nombre}</h4>
            <p style="font-size: 11px; color: #334155; margin: 0;">${school.departamento}, ${school.municipio}</p>
          </div>
        `);

        marker.on('click', () => {
          setSelectedSchool(school);
        });

        markersRef.current[school.codigo] = marker;
      }
    });

    // Enfocar escuela seleccionada
    if (selectedSchool && selectedSchool.latitud && selectedSchool.longitud) {
      map.setView([selectedSchool.latitud, selectedSchool.longitud], 11);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [displaySchools]);

  // Al cambiar escuela seleccionada, centrar el mapa
  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
    if (mapInstanceRef.current && school.latitud && school.longitud) {
      mapInstanceRef.current.flyTo([school.latitud, school.longitud], 12, {
        duration: 1.2,
      });
      const m = markersRef.current[school.codigo];
      if (m) m.openPopup();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-blue-100 text-[#0f2d59] font-bold text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Georreferenciación MINED
            </span>
            <span className="text-xs text-slate-500">
              {displaySchools.length} centros escolares en el directorio
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-[#0f2d59] tracking-tight">
            Directorio y Mapa Geográfico de Escuelas
          </h2>
        </div>

        {selectedSchool && onNewSupervisionInSchool && (
          <button
            type="button"
            onClick={() => onNewSupervisionInSchool(selectedSchool.codigo)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0f2d59] hover:bg-[#1b4985] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>Supervisar en este Centro</span>
          </button>
        )}
      </div>

      {/* Contenedor del Mapa y Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lado Izquierdo: Directorio de Escuelas */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs p-4 overflow-hidden flex flex-col h-[520px]">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
            Centros Escolares Registrados
          </h3>

          <div className="overflow-y-auto space-y-2 flex-1 pr-1">
            {displaySchools.length === 0 ? (
              <div className="p-6 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl my-4">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Sin escuelas registradas</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  El Administrador Master puede registrar los centros educativos desde el botón "Gestión Escuelas".
                </p>
              </div>
            ) : (
              displaySchools.map((school) => {
                const isSelected = selectedSchool?.codigo === school.codigo;
                const count = supervisions.filter((s) => s.codigoEscuela === school.codigo).length;

                return (
                  <div
                    key={school.codigo}
                    onClick={() => handleSelectSchool(school)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#0f2d59] bg-blue-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 inline-block mb-1">
                          Cód. {school.codigo}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          {school.nombre}
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {school.departamento || 'Sin departamento'}, {school.municipio}
                          </span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] bg-slate-100 font-bold px-2 py-1 rounded text-slate-700">
                          {count} sup.
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Lado Derecho: Mapa Interactivo con Leaflet */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[520px]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        </div>
      </div>

      {/* Ficha de Perfil de la Escuela Seleccionada y sus Supervisiones */}
      {selectedSchool && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0f2d59] flex items-center justify-center font-bold text-lg shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono font-bold text-blue-900 bg-blue-100 px-2 py-0.5 rounded">
                    Código {selectedSchool.codigo}
                  </span>
                  <span className="text-xs text-slate-500">
                    {selectedSchool.departamento} · {selectedSchool.municipio}
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{selectedSchool.nombre}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg self-start sm:self-auto">
              <Navigation className="w-3.5 h-3.5 text-slate-500" />
              <span>
                GPS: {selectedSchool.latitud?.toFixed(4)}, {selectedSchool.longitud?.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Información del Director y Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium block flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Director(a) Institucional
              </span>
              <strong className="text-slate-900 text-sm">
                {selectedSchool.directorNombre || 'No especificado'}
              </strong>
              {selectedSchool.directorDui && (
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  DUI: {selectedSchool.directorDui}
                </p>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium block flex items-center gap-1.5 mb-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Correo Institucional
              </span>
              <strong className="text-slate-900 font-mono">
                {selectedSchool.directorCorreo || 'Sin correo registrado'}
              </strong>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium block flex items-center gap-1.5 mb-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Teléfono de Contacto
              </span>
              <strong className="text-slate-900 font-mono">
                {selectedSchool.directorTelefono || 'Sin teléfono'}
              </strong>
            </div>
          </div>

          {/* Supervisiones Realizadas en este Centro Escolar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-[#0f2d59] flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#1b4985]" />
                Supervisiones Registradas en esta Escuela ({schoolSupervisions.length})
              </h4>
            </div>

            {schoolSupervisions.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                Aún no se han registrado visitas de supervisión de aula en este centro educativo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Grado</th>
                      <th className="p-3">Docente</th>
                      <th className="p-3">Horario</th>
                      <th className="p-3">Asistencia</th>
                      <th className="p-3">Dispositivos</th>
                      <th className="p-3">F1</th>
                      <th className="p-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {schoolSupervisions.map((sup) => (
                      <tr key={sup.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-medium">{sup.fecha}</td>
                        <td className="p-3 font-bold text-blue-900">
                          {sup.grado === 'Otro' ? sup.gradoOtroDetalle : sup.grado}
                        </td>
                        <td className="p-3 font-medium text-slate-800">{sup.docenteNombre}</td>
                        <td className="p-3 font-mono text-slate-500">
                          {sup.horaInicio} - {sup.horaFin}
                        </td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-800">
                            {sup.estudiantesAsistieron}/{sup.matriculaSiges}
                          </span>{' '}
                          <span className="text-[11px] text-emerald-700 font-bold">
                            ({sup.porcentajeAsistencia}%)
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-700">{sup.totalDispositivos}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sup.f1Completado === 'Sí'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {sup.f1Completado}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {onViewSupervisionFicha && (
                            <button
                              type="button"
                              onClick={() => onViewSupervisionFicha(sup)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold"
                            >
                              Ficha
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
