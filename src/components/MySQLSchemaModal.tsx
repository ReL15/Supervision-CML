import React, { useState } from 'react';
import { generateMySqlDump } from '../services/storageService';
import { X, Database, Copy, Check, Download, Table, Key, ShieldCheck } from 'lucide-react';

interface MySQLSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MySQLSchemaModal: React.FC<MySQLSchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const sqlContent = generateMySqlDump();

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([sqlContent], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mined_supervision_schema_mysql.sql');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="p-5 bg-[#0f2d59] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Esquema Relacional MySQL · MINED El Salvador</h3>
              <p className="text-xs text-blue-200">
                Estructura DDL normalizada (centros_escolares, docentes, supervisiones_aula)
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

        {/* Resumen de Tablas Relacionales */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Table className="w-3.5 h-3.5 text-blue-700" />
              centros_escolares
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">PK: codigo (VARCHAR)</p>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Table className="w-3.5 h-3.5 text-blue-700" />
              docentes
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">PK: id, UNIQUE correo</p>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Table className="w-3.5 h-3.5 text-blue-700" />
              docente_escuelas
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">M:N (correo, codigo)</p>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Table className="w-3.5 h-3.5 text-blue-700" />
              supervisiones_aula
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">FK: codigo_escuela</p>
          </div>
        </div>

        {/* Código SQL DDL */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-900 text-slate-200 font-mono text-xs">
          <pre className="whitespace-pre-wrap leading-relaxed">{sqlContent}</pre>
        </div>

        {/* Barra Inferior de Acciones */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Compatible con MySQL 8.0+, MariaDB 10.6+ y Google Cloud SQL.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>¡SQL Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copiar SQL</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="px-4 py-2 bg-[#0f2d59] hover:bg-[#1b4985] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>Descargar .sql</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
