import React from 'react';
import { FileText, Printer, RotateCcw, FolderOpen } from 'lucide-react';

export type AppView = 'analyzer' | 'history' | 'validation' | 'privacy';

interface NavbarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  onReset: () => void;
  onOpenSamples: () => void;
  hasAnalysis: boolean;
  onPrint: () => void;
}

const NAV_ITEMS: Array<{ id: AppView; label: string }> = [
  { id: 'analyzer', label: 'Analyzer' },
  { id: 'history', label: 'Audit History' },
  { id: 'validation', label: 'Validation Lab' },
  { id: 'privacy', label: 'Privacy & Docs' },
];

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onSelectView,
  onReset,
  onOpenSamples,
  hasAnalysis,
  onPrint,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => {
            onSelectView('analyzer');
            onReset();
          }}
          className="flex items-center gap-2.5 text-left group whitespace-nowrap shrink-0 cursor-pointer focus:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-500 transition-colors">
            <FileText className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            CareerPulse
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-slate-400 overflow-x-auto"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  isActive
                    ? 'text-white border-indigo-500 font-semibold'
                    : 'text-slate-400 border-transparent hover:text-slate-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action Control */}
        <div className="flex items-center gap-2 shrink-0">
          {activeView === 'analyzer' && hasAnalysis ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onPrint}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export PDF</span>
              </button>
              <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Scan</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenSamples}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Explore Samples</span>
              <span className="sm:hidden">Samples</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
