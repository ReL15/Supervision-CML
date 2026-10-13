import React, { useState, useEffect } from 'react';
import {
  initStorage,
  getUserSession,
  setUserSession,
  getSchools,
  getTeachers,
  getSupervisions,
} from './services/storageService';
import { UserSession, ActiveTab, Supervision, School, Teacher } from './types';
import { LoginView } from './components/LoginView';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { StatisticsCards } from './components/StatisticsCards';
import { SupervisionForm } from './components/SupervisionForm';
import { SupervisionList } from './components/SupervisionList';
import { SchoolsMapView } from './components/SchoolsMapView';
import { TeacherDirectoryModal } from './components/TeacherDirectoryModal';
import { MasterSchoolManagerModal } from './components/MasterSchoolManagerModal';
import { OfficialReportModal } from './components/OfficialReportModal';
import { SchoolOnboardingModal } from './components/SchoolOnboardingModal';
import { EditSchoolModal } from './components/EditSchoolModal';
import {
  PlusCircle,
  FileCheck2,
  Calendar,
  Building2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export default function App() {
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    initStorage().then(
      () => {
        if (!cancelled) setStorageReady(true);
      },
      (error: unknown) => {
        if (!cancelled) {
          setStorageError(error instanceof Error ? error.message : 'No se pudieron cargar los datos de MySQL.');
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const [session, setSession] = useState<UserSession | null>(() => getUserSession());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Datos en memoria reactivos
  const [schools, setSchools] = useState<School[]>(() => getSchools());
  const [teachers, setTeachers] = useState<Teacher[]>(() => getTeachers());
  const [supervisions, setSupervisions] = useState<Supervision[]>(() => getSupervisions());

  // Estado de escuela seleccionada (para Master puede ser 'all' o un código)
  const [selectedSchoolCode, setSelectedSchoolCode] = useState<string>(() => {
    const cur = getUserSession();
    if (cur?.role === 'school' && cur.schoolCode) {
      return cur.schoolCode;
    }
    return 'all';
  });

  // Supervisión en edición
  const [editingSupervision, setEditingSupervision] = useState<Supervision | null>(null);

  // Modales
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showMasterManager, setShowMasterManager] = useState(false);
  const [viewingFicha, setViewingFicha] = useState<Supervision | null>(null);
  const [editingOwnSchool, setEditingOwnSchool] = useState(false);

  // Recargar datos
  const refreshData = () => {
    setSchools(getSchools());
    setTeachers(getTeachers());
    setSupervisions(getSupervisions());
  };

  const handleLoginSuccess = (newSession: UserSession) => {
    setSession(newSession);
    refreshData();
    if (newSession.role === 'school' && newSession.schoolCode) {
      setSelectedSchoolCode(newSession.schoolCode);
    } else {
      setSelectedSchoolCode('all');
    }
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUserSession(null);
    setSession(null);
  };

  // Manejar guardado de supervisión
  const handleSupervisionSaved = () => {
    refreshData();
    setEditingSupervision(null);
    setActiveTab('list');
  };

  if (!storageReady) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-lg rounded-2xl bg-white p-6 text-center shadow-sm">
          {storageError ? (
            <>
              <h1 className="text-lg font-bold text-red-700">No se pudo conectar con MySQL</h1>
              <p className="mt-2 text-sm text-slate-600">{storageError}</p>
              <p className="mt-3 text-xs text-slate-500">
                Inicie MySQL en Laragon y ejecute <code>npm run server</code>. Luego recargue la página.
              </p>
            </>
          ) : (
            <p className="text-sm font-medium text-slate-600">Conectando con la base de datos MySQL…</p>
          )}
        </div>
      </main>
    );
  }

  // Manejar edición desde el listado
  const handleEditFromList = (sup: Supervision) => {
    setEditingSupervision(sup);
    setActiveTab('form');
  };

  // Manejar supervisión en una escuela específica desde el mapa
  const handleNewSupervisionInSchool = (schoolCode: string) => {
    setSelectedSchoolCode(schoolCode);
    setEditingSupervision(null);
    setActiveTab('form');
  };

  // Si no hay sesión iniciada, mostrar vista de login institucional
  if (!session) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // Verificar si la escuela activa requiere onboarding de primer ingreso
  const currentSchoolObj =
    session.role === 'school'
      ? schools.find((s) => s.codigo === session.schoolCode)
      : null;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Barra superior de navegación */}
      <Navbar
        currentSession={session}
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'form' && editingSupervision) {
            setEditingSupervision(null);
          }
          setActiveTab(tab);
        }}
        onOpenTeacherDirectory={() => setShowTeacherModal(true)}
        onOpenMasterManager={() => setShowMasterManager(true)}
        onOpenSchoolProfile={() => setEditingOwnSchool(true)}
        onLogout={handleLogout}
      />

      {/* Contenido Principal con espaciado móvil holgado (pb-28) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 pb-28">
        {/* TAB 1: DASHBOARD Y MÉTRICAS */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Banner de Bienvenida y Acceso Rápido */}
            <div className="bg-gradient-to-r from-[#0f2d59] to-[#1b4985] text-white rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-xl">
                <span className="inline-block bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {session.role === 'master' ? 'Consolidado Nacional' : 'Gestión de Centro Escolar'}
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  {session.role === 'master'
                    ? 'Monitoreo y Acompañamiento Pedagógico Nacional'
                    : `Centro Escolar ${session.schoolName}`}
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                  Supervisión de prácticas de aula, registro de asistencia SIGES, dispositivos
                  tecnológicos y formularios oficiales F1/F4.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingSupervision(null);
                    setActiveTab('form');
                  }}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Nueva Supervisión</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('schools')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-blue-200" />
                  <span>Mapa de Escuelas</span>
                </button>
              </div>
            </div>

            {/* Tarjetas de Estadísticas e Indicadores */}
            <StatisticsCards
              supervisions={supervisions}
              schools={schools}
              currentSession={session}
              selectedSchoolCode={selectedSchoolCode}
              onSelectSchool={setSelectedSchoolCode}
            />

            {/* Accesos rápidos e historial reciente */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Resumen de Últimas Visitas */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-[#0f2d59]" />
                    <h3 className="text-sm font-bold text-slate-900">
                      Supervisiones Recientes
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="text-xs text-[#1b4985] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Ver todas ({supervisions.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {supervisions.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 border border-dashed border-slate-200 rounded-xl">
                      <p className="text-xs font-semibold text-slate-700">Sin visitas registradas</p>
                      <p className="text-[11px] text-slate-400 mt-1 mb-3">
                        Aún no se han efectuado visitas de supervisión de aula en el sistema.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingSupervision(null);
                          setActiveTab('form');
                        }}
                        className="px-3 py-1.5 bg-[#0f2d59] hover:bg-[#1b4985] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Registrar Primera Supervisión
                      </button>
                    </div>
                  ) : (
                    supervisions.slice(0, 4).map((sup) => (
                      <div
                        key={sup.id}
                        className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-bold text-slate-800">{sup.docenteNombre}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-blue-900 font-medium">
                              {[sup.grado === 'Otro' ? sup.gradoOtroDetalle : sup.grado, sup.seccion]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {sup.fecha} · Cód. {sup.codigoEscuela} · {sup.estudiantesAsistieron}/{sup.matriculaSiges} asistieron ({sup.porcentajeAsistencia}%)
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setViewingFicha(sup)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold shrink-0 cursor-pointer"
                        >
                          Ficha
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Guía Rápida de Formularios MINED */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
                <h3 className="text-sm font-bold text-[#0f2d59] flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1b4985]" />
                  Normativa de Acompañamiento
                </h3>

                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                    <p className="font-bold text-[#0f2d59] mb-0.5">Formulario F1:</p>
                    <p className="text-[11px]">
                      Verificación de la planificación didáctica oficial y libro de texto entregado por
                      el MINED.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                    <p className="font-bold text-emerald-800 mb-0.5">Formulario F4:</p>
                    <p className="text-[11px]">
                      Instrumento de observación directa del clima de aula y estrategias activas de
                      aprendizaje.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                    <p className="font-bold text-amber-900 mb-0.5">Aislamiento Seguro:</p>
                    <p className="text-[11px]">
                      Los centros escolares solo acceden a sus registros y docentes vinculados.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FORMULARIO DE SUPERVISIÓN */}
        {activeTab === 'form' && (
          <SupervisionForm
            currentSession={session}
            activeSchoolCode={
              session.role === 'school' && session.schoolCode
                ? session.schoolCode
                : selectedSchoolCode !== 'all'
                ? selectedSchoolCode
                : schools[0]?.codigo || ''
            }
            editingSupervision={editingSupervision}
            onSaved={handleSupervisionSaved}
            onCancelEdit={() => {
              setEditingSupervision(null);
              setActiveTab('list');
            }}
          />
        )}

        {/* TAB 3: HISTORIAL DE REGISTROS */}
        {activeTab === 'list' && (
          <SupervisionList
            supervisions={supervisions}
            currentSession={session}
            activeSchoolCode={selectedSchoolCode}
            onEdit={handleEditFromList}
            onDeleted={refreshData}
          />
        )}

        {/* TAB 4: MAPA Y DIRECTORIO DE ESCUELAS */}
        {activeTab === 'schools' && (
          <SchoolsMapView
            schools={schools}
            supervisions={supervisions}
            currentSession={session}
            onNewSupervisionInSchool={handleNewSupervisionInSchool}
            onViewSupervisionFicha={(sup) => setViewingFicha(sup)}
            onSchoolUpdated={refreshData}
          />
        )}
      </main>

      {/* Barra de Navegación Móvil fija */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          if (tab === 'form' && editingSupervision) {
            setEditingSupervision(null);
          }
          setActiveTab(tab);
        }}
        onOpenTeacherDirectory={() => setShowTeacherModal(true)}
      />

      {/* Modal de Directorio Docente */}
      <TeacherDirectoryModal
        teachers={teachers}
        schools={schools}
        currentSession={session}
        activeSchoolCode={
          session.role === 'school' && session.schoolCode
            ? session.schoolCode
            : selectedSchoolCode !== 'all'
            ? selectedSchoolCode
            : schools[0]?.codigo || ''
        }
        isOpen={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        onUpdated={refreshData}
      />

      {/* Modal de Gestión de Escuelas para el Master */}
      {session.role === 'master' && (
        <MasterSchoolManagerModal
          schools={schools}
          isOpen={showMasterManager}
          onClose={() => setShowMasterManager(false)}
          onSchoolsUpdated={refreshData}
        />
      )}

      {/* Modal de Ficha Oficial de Supervisión (Imprimible PDF) */}
      {viewingFicha && (
        <OfficialReportModal
          supervision={viewingFicha}
          school={schools.find((s) => s.codigo === viewingFicha.codigoEscuela)}
          isOpen={true}
          onClose={() => setViewingFicha(null)}
        />
      )}

      {/* Modal Obligatorio de Primer Ingreso si el perfil está incompleto */}
      {currentSchoolObj && !currentSchoolObj.perfilCompletado && (
        <SchoolOnboardingModal
          school={currentSchoolObj}
          isOpen={true}
          onCompleted={(updated) => {
            refreshData();
            if (session) {
              setSession({
                ...session,
                schoolName: updated.nombre,
              });
            }
          }}
        />
      )}

      {/* Modal para Editar Perfil de la Escuela Activa */}
      {editingOwnSchool && currentSchoolObj && (
        <EditSchoolModal
          school={currentSchoolObj}
          isOpen={true}
          readOnlyIdentity
          onClose={() => setEditingOwnSchool(false)}
          onSaved={(updated) => {
            refreshData();
            if (session) {
              setSession({
                ...session,
                schoolName: updated.nombre,
              });
            }
          }}
        />
      )}
    </div>
  );
}
