import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Wallet,
  Settings,
  RefreshCw,
  Database,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface SidebarProps {
  currentTab: 'overview' | 'strategy' | 'leads' | 'clients';
  onTabChange: (tab: 'overview' | 'strategy' | 'leads' | 'clients') => void;
  onOpenConfig: () => void;
  isDemoData: boolean;
  isConnected: boolean;
  isSyncing: boolean;
  onRefresh: () => void;
  leadsRequierenSeguimiento: number;
  clientsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  onOpenConfig,
  isDemoData,
  isConnected,
  isSyncing,
  onRefresh,
  leadsRequierenSeguimiento,
  clientsCount,
}) => {
  const navItems: Array<{
    id: 'overview' | 'strategy' | 'leads' | 'clients';
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | null;
  }> = [
    {
      id: 'overview',
      label: 'Dashboard Principal',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'strategy',
      label: 'Estrategia & Analytics',
      shortLabel: 'Estrategia',
      icon: TrendingUp,
    },
    {
      id: 'leads',
      label: 'Gestión de Leads',
      shortLabel: 'Leads',
      icon: Users,
      badge: leadsRequierenSeguimiento > 0 ? leadsRequierenSeguimiento : null,
    },
    {
      id: 'clients',
      label: 'Clientes & Facturación',
      shortLabel: 'Clientes',
      icon: Wallet,
      badge: clientsCount && clientsCount > 0 ? clientsCount : null,
    },
  ];

  return (
    <aside className="w-20 md:w-64 bg-[#0e1017] border-r border-white/5 flex flex-col justify-between py-5 shrink-0 transition-all duration-300">
      {/* Brand / Logo */}
      <div className="px-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div className="hidden md:block">
            <span className="font-bold text-lg tracking-tight text-white block">
              VORTEXIA
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-blue-400">
              Command Center
            </span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="mt-8 space-y-1.5">
          <div className="hidden md:block px-2 text-[11px] font-semibold tracking-wider uppercase text-zinc-500 mb-2">
            Prospección
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                }`}
                title={item.label}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'
                    }`}
                  />
                  <span className="hidden md:inline font-medium tracking-tight">
                    {item.shortLabel}
                  </span>
                </div>
                {item.badge && (
                  <span
                    className={`hidden md:flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                    title="Leads sin seguimiento hace >3 días"
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom controls / Airtable sync status */}
      <div className="px-3 md:px-5 space-y-3">
        {/* Status card */}
        <div className="hidden md:block p-3 rounded-xl bg-[#141722] border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-xs font-semibold text-zinc-300">
                {isConnected ? 'Airtable Conectado' : 'Modo Demostración'}
              </span>
            </div>
            <button
              onClick={onRefresh}
              disabled={isSyncing}
              title="Sincronizar datos ahora"
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            </button>
          </div>
          <p className="text-[11px] text-zinc-400 leading-snug">
            {isConnected
              ? 'Base "Vortexia Progress" sincronizada en vivo.'
              : 'Mostrando datos de prueba de prospección Vortexia.'}
          </p>
          <button
            onClick={onOpenConfig}
            className="mt-2.5 w-full py-1.5 px-2 text-[11px] font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/15 rounded-lg border border-blue-500/20 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Database className="w-3 h-3" />
            Configurar Airtable
          </button>
        </div>

        {/* Small screen icons */}
        <div className="md:hidden flex flex-col items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            className="p-2.5 rounded-xl bg-[#141722] text-zinc-400 hover:text-white"
            title="Sincronizar"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
          <button
            onClick={onOpenConfig}
            className="p-2.5 rounded-xl bg-[#141722] text-zinc-400 hover:text-white"
            title="Airtable"
          >
            <Database className="w-4 h-4 text-blue-400" />
          </button>
        </div>

        {/* Settings button */}
        <button
          onClick={onOpenConfig}
          id="sidebar-config-btn"
          className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 rounded-xl text-xs font-medium transition-colors"
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="hidden md:inline">Ajustes de Conexión</span>
        </button>
      </div>
    </aside>
  );
};
