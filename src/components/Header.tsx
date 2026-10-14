import React, { useState } from 'react';
import { DataSourceState, PageView } from '../types';
import { 
  MapPin, 
  RefreshCw, 
  Map as MapIcon,
  ListFilter,
  BarChart3,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  dataSource: DataSourceState;
  onRefresh: () => void;
  filteredCount: number;
  totalCount: number;
  activePage: PageView;
  onNavigate: (page: PageView) => void;
}

export const Header: React.FC<HeaderProps> = ({
  dataSource,
  onRefresh,
  filteredCount,
  totalCount,
  activePage,
  onNavigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: PageView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'map', label: 'Interactive Map', icon: MapIcon },
    { id: 'directory', label: 'Directory', icon: ListFilter },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
  ];

  const handleNavClick = (page: PageView) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs flex-shrink-0">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* App Branding */}
        <div className="flex items-center gap-3">
          <a 
            href="#map"
            onClick={(e) => { e.preventDefault(); handleNavClick('map'); }}
            className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white p-2.5 rounded-xl shadow-xs flex items-center justify-center cursor-pointer hover:opacity-95 transition-opacity"
            title="Go to Interactive Map"
          >
            <MapPin className="w-5 h-5" />
          </a>
          <a 
            href="#map"
            onClick={(e) => { e.preventDefault(); handleNavClick('map'); }}
            className="cursor-pointer group block"
          >
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                ACM LAC Regional Signal Mining
              </h1>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Conferences, Schools & CS Societies</span>
            </div>
          </a>
        </div>

        {/* Center Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80" aria-label="Main Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* Right Action & Initiatives Count */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Refresh Button - Reloads latest spreadsheet data silently */}
          <button
            onClick={onRefresh}
            disabled={dataSource.status === 'loading'}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition-all disabled:opacity-60 cursor-pointer"
            title="Refresh data from live sheet"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${dataSource.status === 'loading' ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Total Initiatives Badge */}
          <div className="flex items-center gap-1 bg-slate-900 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
            <span>{filteredCount}</span>
            {filteredCount !== totalCount && (
              <span className="text-slate-400 text-[10px]">/{totalCount}</span>
            )}
            <span className="text-[11px] font-normal text-slate-300">items</span>
          </div>

          {/* Mobile Navigation Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.id);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </div>
      )}
    </header>
  );
};
