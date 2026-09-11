import React from 'react';
import {
  Search,
  Calendar,
  Bell,
  RefreshCw,
  Database,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateRange: '7d' | '14d' | '30d' | 'all';
  onDateRangeChange: (range: '7d' | '14d' | '30d' | 'all') => void;
  onRefresh: () => void;
  isSyncing: boolean;
  onOpenConfig: () => void;
  isDemoData: boolean;
  isConnected: boolean;
  lastUpdated: string;
  followUpCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  onRefresh,
  isSyncing,
  onOpenConfig,
  isDemoData,
  isConnected,
  lastUpdated,
  followUpCount,
}) => {
  // Current date formatted in Spanish
  const todayFormatted = 'Martes, 8 de septiembre 2026';

  const dateLabels = {
    '7d': 'Últimos 7 días',
    '14d': 'Últimos 14 días',
    '30d': 'Este mes (30d)',
    all: 'Histórico completo',
  };

  return (
    <header className="bg-[#0b0d13]/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30 px-4 md:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Search and Date Pill */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            id="global-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por lead, empresa, número o etapa..."
            className="w-full bg-[#13151f] border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs md:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
          />
        </div>

        {/* Date pill as shown in reference design */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#13151f] border border-white/5 text-xs text-zinc-400 shrink-0 font-medium">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {/* Right side controls: Period filter, Sync, Airtable tag, Profile */}
      <div className="flex items-center gap-2.5 shrink-0 justify-between md:justify-end">
        {/* Date Range Selector dropdown */}
        <div className="relative">
          <select
            id="period-select"
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value as any)}
            className="appearance-none bg-[#13151f] hover:bg-[#191c29] border border-white/10 rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-zinc-200 cursor-pointer focus:outline-none focus:border-blue-500 transition-colors"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="14d">Últimos 14 días</option>
            <option value="30d">Este mes (30 días)</option>
            <option value="all">Todo el histórico</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Sync Button with last update indicator */}
        <button
          onClick={onRefresh}
          disabled={isSyncing}
          id="header-refresh-btn"
          title={`Última sincronización: ${new Date(lastUpdated).toLocaleTimeString()}`}
          className="p-2 rounded-xl bg-[#13151f] hover:bg-[#1a1d2c] border border-white/5 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
          <span className="hidden xl:inline text-[11px] font-medium text-zinc-400">
            {isSyncing ? 'Sincronizando...' : 'Refrescar'}
          </span>
        </button>

        {/* Airtable Connection Pill */}
        <button
          onClick={onOpenConfig}
          id="header-airtable-status-badge"
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all ${
            isConnected
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/15'
              : 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/15'
          }`}
          title="Ver o modificar configuración de Airtable"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>{isConnected ? 'Airtable Live' : 'Demo Data'}</span>
        </button>

        {/* Notifications / Followup reminder */}
        <div className="relative">
          <button
            title={
              followUpCount > 0
                ? `${followUpCount} prospectos requieren reenganche de 3 días`
                : 'Sin alertas pendientes'
            }
            className="p-2 rounded-xl bg-[#13151f] hover:bg-[#1a1d2c] border border-white/5 text-zinc-400 hover:text-white transition-all relative"
          >
            <Bell className="w-4 h-4" />
            {followUpCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center ring-2 ring-[#0b0d13]">
                {followUpCount}
              </span>
            )}
          </button>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2 pl-1 border-l border-white/10">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold ring-1 ring-white/10 shadow-sm">
            VX
          </div>
        </div>
      </div>
    </header>
  );
};
