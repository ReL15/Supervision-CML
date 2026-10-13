import React from 'react';
import { UserSession, ActiveTab } from '../types';
import {
  BookOpen,
  LayoutDashboard,
  FilePlus,
  ListFilter,
  MapPin,
  Users,
  Shield,
  Database,
  LogOut,
  Building2,
} from 'lucide-react';

interface NavbarProps {
  currentSession: UserSession;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenTeacherDirectory: () => void;
  onOpenMasterManager?: () => void;
  onOpenMySQLModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSession,
  activeTab,
  onTabChange,
  onOpenTeacherDirectory,
  onOpenMasterManager,
  onOpenMySQLModal,
  onLogout,
}) => {
  const isMaster = currentSession.role === 'master';

  return (
    <header className="bg-[#0f2d59] text-white border-b-4 border-amber-400 shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo y Nombre Institucional */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200">
                  MINED · El Salvador
                </span>
                {isMaster ? (
                  <span className="bg-amber-400 text-slate-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Master Nacional
                  </span>
                ) : (
                  <span className="bg-blue-800 text-blue-100 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wide">
                    Cód. {currentSession.schoolCode}
                  </span>
                )}
              </div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white truncate max-w-xs sm:max-w-md">
                {isMaster
                  ? 'Supervisión de Aula y Seguimiento Pedagógico'
                  : currentSession.schoolName || 'Centro Escolar'}
              </h1>
            </div>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-amber-300" />
              <span>Panel</span>
            </button>

            <button
              onClick={() => onTabChange('form')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <FilePlus className="w-4 h-4 text-amber-300" />
              <span>Nueva Supervisión</span>
            </button>

            <button
              onClick={() => onTabChange('list')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <ListFilter className="w-4 h-4 text-amber-300" />
              <span>Historial</span>
            </button>

            <button
              onClick={() => onTabChange('schools')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'schools'
                  ? 'bg-white/20 text-white'
                  : 'text-blue-100 hover:bg-white/10'
              }`}
            >
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>Mapa de Escuelas</span>
            </button>
          </nav>

          {/* Botones de acción institucional */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenTeacherDirectory}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl border border-white/15 transition-colors cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-blue-200" />
              <span>Docentes</span>
            </button>

            {isMaster && onOpenMasterManager && (
              <button
                type="button"
                onClick={onOpenMasterManager}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Gestión Escuelas</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenMySQLModal}
              title="Ver esquema SQL / MySQL"
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/15 transition-colors cursor-pointer"
            >
              <Database className="w-4 h-4 text-amber-300" />
            </button>

            <button
              type="button"
              onClick={onLogout}
              title="Cerrar sesión institucional"
              className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
