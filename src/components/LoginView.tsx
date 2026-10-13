import React, { useState } from 'react';
import { getSchoolByCode, setUserSession, validateMasterLogin } from '../services/storageService';
import { School, UserSession } from '../types';
import { SchoolOnboardingModal } from './SchoolOnboardingModal';
import { Building2, ShieldCheck, KeyRound, AlertCircle, ArrowRight, BookOpen, Mail, Lock } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Estado para login Master (Email + Contraseña)
  const [masterEmail, setMasterEmail] = useState('tch.rivlue15@outlook.com');
  const [masterPassword, setMasterPassword] = useState('');
  const [masterError, setMasterError] = useState<string | null>(null);

  // Estado para login escolar
  const [codigoCentro, setCodigoCentro] = useState('');
  const [schoolPassword, setSchoolPassword] = useState('');
  const [schoolError, setSchoolError] = useState<string | null>(null);

  // Estado para modal de onboarding de primer ingreso de escuelas
  const [onboardingSchool, setOnboardingSchool] = useState<School | null>(null);

  // Manejador de Login Master
  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setMasterError(null);

    const emailTrimmed = masterEmail.trim().toLowerCase();
    if (emailTrimmed !== 'tch.rivlue15@outlook.com') {
      setMasterError(
        'Acceso denegado: Solo la cuenta oficial "tch.rivlue15@outlook.com" posee privilegios de Administrador Master.'
      );
      return;
    }

    const isValid = validateMasterLogin(emailTrimmed, masterPassword);
    if (!isValid) {
      setMasterError('Contraseña de Administrador Master incorrecta. Verifique sus credenciales.');
      return;
    }

    const session: UserSession = {
      role: 'master',
      email: 'tch.rivlue15@outlook.com',
      userName: 'Administrador Master MINED',
    };
    setUserSession(session);
    onLoginSuccess(session);
  };

  // Manejador de Login por Centro Escolar
  const handleSchoolLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolError(null);

    const trimmedCode = codigoCentro.trim();
    if (!trimmedCode) {
      setSchoolError('Ingrese el Código de Centro Escolar asignado por el MINED.');
      return;
    }

    const school = getSchoolByCode(trimmedCode);
    if (!school) {
      setSchoolError(
        `El centro escolar con código "${trimmedCode}" no se encuentra registrado en el sistema. Solicite sus credenciales a la Dirección de Seguimiento Pedagógico.`
      );
      return;
    }

    if (school.password !== schoolPassword) {
      setSchoolError('La contraseña ingresada es incorrecta. Verifique sus credenciales institucionales.');
      return;
    }

    // Verificar si es primer ingreso (perfil incompleto)
    if (!school.perfilCompletado) {
      setOnboardingSchool(school);
      return;
    }

    // Si ya completó perfil, ingresa directamente
    const session: UserSession = {
      role: 'school',
      schoolCode: school.codigo,
      schoolName: school.nombre,
      userName: school.nombre,
    };
    setUserSession(session);
    onLoginSuccess(session);
  };

  // Al completar el onboarding de la escuela
  const handleOnboardingCompleted = (updatedSchool: School) => {
    setOnboardingSchool(null);
    const session: UserSession = {
      role: 'school',
      schoolCode: updatedSchool.codigo,
      schoolName: updatedSchool.nombre,
      userName: updatedSchool.nombre,
    };
    setUserSession(session);
    onLoginSuccess(session);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Header institucional */}
      <header className="bg-[#0f2d59] text-white border-b-4 border-amber-400 py-4 px-6 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
              <BookOpen className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">
                República de El Salvador · Ministerio de Educación, Ciencia y Tecnología
              </p>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Sistema de Supervisión de Aula y Seguimiento Pedagógico
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-100 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Portal Oficial MINED</span>
          </div>
        </div>
      </header>

      {/* Main Body - Vista Integrada Única sin demostraciones */}
      <main className="max-w-5xl mx-auto px-4 py-8 w-full flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0f2d59] tracking-tight">
            Acceso al Sistema Pedagógico
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
            Seleccione su modalidad de ingreso institucional. La plataforma valida automáticamente
            sus privilegios de acuerdo a su perfil institucional.
          </p>
        </div>

        {/* Cuadrícula integrada de las dos modalidades de acceso */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* MÓDULO 1: ACCESO MASTER */}
          <div className="bg-white rounded-2xl border-2 border-blue-900/10 shadow-lg p-6 sm:p-8 flex flex-col justify-between hover:border-[#0f2d59]/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="bg-blue-100 text-[#0f2d59] text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Acceso Exclusivo Master
                </span>
                <span className="text-xs text-slate-500 font-mono">Credenciales MINED</span>
              </div>

              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0f2d59] flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Dirección Nacional de Supervisión
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Acceso para consolidado nacional de centros escolares, creación de escuelas,
                generación de contraseñas de directores y auditoría pedagógica en los 14 departamentos.
              </p>

              {masterError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{masterError}</span>
                </div>
              )}

              <form onSubmit={handleMasterLogin} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Cuenta de Correo Master</span>
                    <span className="text-[10px] text-slate-400">tch.rivlue15@outlook.com</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={masterEmail}
                      onChange={(e) => setMasterEmail(e.target.value)}
                      placeholder="tch.rivlue15@outlook.com"
                      className="w-full pl-9 pr-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contraseña de Administrador Master
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden font-mono"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 px-4 py-3 bg-[#0f2d59] hover:bg-[#1b4985] text-white font-semibold rounded-xl text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Ingresar como Administrador Master</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                Acceso restringido a la Dirección de Educación Básica y Media.
              </p>
            </div>
          </div>

          {/* MÓDULO 2: ACCESO POR CENTRO ESCOLAR */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6 sm:p-8 flex flex-col justify-between hover:border-blue-400 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Acceso Institucional
                </span>
                <span className="text-xs text-slate-500 font-mono">Código SIGES / MINED</span>
              </div>

              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Building2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-slate-900">
                Acceso por Centro Escolar
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Inicie sesión con el Código del Centro Escolar y la clave institucional asignada por el
                Master. Toda su información y directorio docente se mantienen aislados y seguros.
              </p>

              {schoolError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{schoolError}</span>
                </div>
              )}

              <form onSubmit={handleSchoolLogin} className="mt-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Código de Centro Escolar
                  </label>
                  <input
                    type="text"
                    required
                    value={codigoCentro}
                    onChange={(e) => setCodigoCentro(e.target.value)}
                    placeholder="Ingrese código de escuela (ej. 10245)"
                    className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Contraseña Asignada</span>
                    <span className="text-[10px] text-slate-400">Proporcionada por Master</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      value={schoolPassword}
                      onChange={(e) => setSchoolPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 text-base border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f2d59] focus:outline-hidden"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 px-4 py-3 bg-[#0f2d59] hover:bg-[#1b4985] text-white font-semibold rounded-xl text-base shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Ingresar a Centro Escolar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                Si aún no posee contraseña de acceso, comuníquese con el supervisor ministerial.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-200/80 border-t border-slate-300 py-4 px-6 text-center text-xs text-slate-600">
        <p>
          Dirección de Educación Básica y Educación Media · Ministerio de Educación, Ciencia y Tecnología
          (MINED) · Gobierno de El Salvador.
        </p>
      </footer>

      {/* Modal Obligatorio de Primer Ingreso */}
      {onboardingSchool && (
        <SchoolOnboardingModal
          school={onboardingSchool}
          isOpen={true}
          onCompleted={handleOnboardingCompleted}
        />
      )}
    </div>
  );
};
