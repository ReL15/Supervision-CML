import React from 'react';
import { ActiveTab } from '../types';
import { LayoutDashboard, FilePlus, ListFilter, MapPin, Users } from 'lucide-react';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onOpenTeacherDirectory: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenTeacherDirectory,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 pb-[env(safe-area-inset-bottom,8px)] no-print">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {/* Tab 1: Panel */}
        <button
          type="button"
          onClick={() => onTabChange('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] px-2 py-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'dashboard' ? 'text-[#0f2d59]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard
            className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[#0f2d59] stroke-[2.5]' : ''}`}
          />
          <span
            className={`text-[10px] mt-1 ${
              activeTab === 'dashboard' ? 'font-bold text-[#0f2d59]' : 'font-medium'
            }`}
          >
            Panel
          </span>
        </button>

        {/* Tab 2: Nueva Supervisión */}
        <button
          type="button"
          onClick={() => onTabChange('form')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] px-2 py-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'form' ? 'text-[#0f2d59]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FilePlus
            className={`w-5 h-5 ${activeTab === 'form' ? 'text-[#0f2d59] stroke-[2.5]' : ''}`}
          />
          <span
            className={`text-[10px] mt-1 ${
              activeTab === 'form' ? 'font-bold text-[#0f2d59]' : 'font-medium'
            }`}
          >
            Registrar
          </span>
        </button>

        {/* Tab 3: Historial */}
        <button
          type="button"
          onClick={() => onTabChange('list')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] px-2 py-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'list' ? 'text-[#0f2d59]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ListFilter
            className={`w-5 h-5 ${activeTab === 'list' ? 'text-[#0f2d59] stroke-[2.5]' : ''}`}
          />
          <span
            className={`text-[10px] mt-1 ${
              activeTab === 'list' ? 'font-bold text-[#0f2d59]' : 'font-medium'
            }`}
          >
            Historial
          </span>
        </button>

        {/* Tab 4: Mapa */}
        <button
          type="button"
          onClick={() => onTabChange('schools')}
          className={`flex flex-col items-center justify-center min-h-[44px] min-w-[48px] px-2 py-1 rounded-xl transition-colors cursor-pointer ${
            activeTab === 'schools' ? 'text-[#0f2d59]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin
            className={`w-5 h-5 ${activeTab === 'schools' ? 'text-[#0f2d59] stroke-[2.5]' : ''}`}
          />
          <span
            className={`text-[10px] mt-1 ${
              activeTab === 'schools' ? 'font-bold text-[#0f2d59]' : 'font-medium'
            }`}
          >
            Escuelas
          </span>
        </button>

        {/* Tab 5: Docentes */}
        <button
          type="button"
          onClick={onOpenTeacherDirectory}
          className="flex flex-col items-center justify-center min-h-[44px] min-w-[48px] px-2 py-1 rounded-xl text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Docentes</span>
        </button>
      </div>
    </nav>
  );
};
