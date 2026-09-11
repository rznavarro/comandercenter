import React, { useState } from 'react';
import {
  Wallet,
  TrendingUp,
  Award,
  Globe,
  Github,
  FileCheck,
  ExternalLink,
  Sparkles,
  Calendar,
  Send,
  Lock,
  CheckCircle2,
  Table as TableIcon,
  LayoutGrid,
  Search,
  Receipt,
  UserCheck,
  Eye,
  X,
  ArrowRight,
} from 'lucide-react';
import { ClienteRecord, DashboardMetrics } from '../types';
import { formatCLP, calculatePriceTiers } from '../utils/airtableParser';

interface ClientsViewProps {
  clientes: ClienteRecord[];
  metrics: DashboardMetrics;
}

export const ClientsView: React.FC<ClientsViewProps> = ({ clientes, metrics }) => {
  const { tiers, currentTier } = calculatePriceTiers(clientes);
  const [selectedTierId, setSelectedTierId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeProofModal, setActiveProofModal] = useState<ClienteRecord | null>(null);

  // Robust client tier matcher
  const getClientTierId = (c: ClienteRecord): string => {
    const tramoStr = (c.tramo || '').toLowerCase();
    const monto = c.monto || 0;
    if (tramoStr.includes('10m') || tramoStr.includes('10.000.000') || monto >= 10000000) return 't8';
    if (tramoStr.includes('5m') || tramoStr.includes('5.000.000') || monto >= 5000000) return 't7';
    if (tramoStr.includes('2m') || tramoStr.includes('2.000.000') || monto >= 2000000) return 't6';
    if (tramoStr.includes('1m') || tramoStr.includes('1.000.000') || monto >= 1000000) return 't5';
    if (tramoStr.includes('500') || monto >= 500000) return 't4';
    if (tramoStr.includes('250') || monto >= 250000) return 't3';
    if (tramoStr.includes('100') || monto >= 100000) return 't2';
    return 't1';
  };

  // Filter clients
  const filteredClients = clientes.filter((c) => {
    // Tier filter
    if (selectedTierId !== 'all') {
      const clientTierId = getClientTierId(c);
      if (clientTierId !== selectedTierId) return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchTipo = (c.tipoPago || '').toLowerCase().includes(q);
      const matchTramo = (c.tramo || '').toLowerCase().includes(q);
      const matchNotas = (c.notas || '').toLowerCase().includes(q);
      if (!matchName && !matchTipo && !matchTramo && !matchNotas) return false;
    }

    return true;
  });

  // Calculate breakdown by payment type
  const paymentBreakdown = React.useMemo(() => {
    const stats: Record<string, { count: number; total: number }> = {
      'pago unico': { count: 0, total: 0 },
      'pago unico primera parte': { count: 0, total: 0 },
      suscripcion: { count: 0, total: 0 },
      otro: { count: 0, total: 0 },
    };

    clientes.forEach((c) => {
      const type = (c.tipoPago || '').toLowerCase();
      if (type.includes('suscrip')) {
        stats.suscripcion.count++;
        stats.suscripcion.total += c.monto;
      } else if (type.includes('primera') || type.includes('anticipo') || type.includes('parte')) {
        stats['pago unico primera parte'].count++;
        stats['pago unico primera parte'].total += c.monto;
      } else if (type.includes('unico') || type.includes('único')) {
        stats['pago unico'].count++;
        stats['pago unico'].total += c.monto;
      } else {
        stats.otro.count++;
        stats.otro.total += c.monto;
      }
    });

    return stats;
  }, [clientes]);

  const totalFacturadoReal = clientes.reduce((acc, c) => acc + (c.monto || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Facturado */}
        <div className="bg-[#13151f] border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Dinero Abonado</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              {formatCLP(totalFacturadoReal)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <UserCheck className="w-3 h-3" />
                {clientes.length} clientes cerrados
              </span>
              <span className="text-[11px] text-zinc-400">registrados en Airtable</span>
            </div>
          </div>
        </div>

        {/* Proyección 30 Días */}
        <div className="bg-[#13151f] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Proyección Run-Rate (30 Días)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-emerald-400">
              {formatCLP(metrics.proyeccion30Dias > 0 ? metrics.proyeccion30Dias : Math.round(totalFacturadoReal * 3.5))}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Estimación al ritmo de prospección y cierres confirmados.
            </p>
          </div>
        </div>

        {/* Proyección 90 Días */}
        <div className="bg-[#13151f] border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Escalón de Precios Actual</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl lg:text-3xl font-bold tracking-tight text-amber-300">
              {currentTier.name}
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Progreso: <strong className="text-white">{currentTier.currentCount} de {currentTier.targetCount} clientes</strong> ({Math.round((currentTier.currentCount / currentTier.targetCount) * 100)}%).
            </p>
          </div>
        </div>
      </div>

      {/* Escalera de Precios de Vortexia (8 Tramos, 5 Clientes c/u) */}
      <div className="bg-[#13151f] border border-white/5 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Escalera de Precios Vortexia (8 Tramos)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Regla: 5 clientes para subir de escalón
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Tramo activo: <strong className="text-amber-400">{currentTier.name}</strong> ({currentTier.currentCount}/5 clientes cerrados).
            </p>
          </div>

          {selectedTierId !== 'all' && (
            <button
              onClick={() => setSelectedTierId('all')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Restablecer filtro (Ver todos)
            </button>
          )}
        </div>

        {/* Visual Stepper / Ladder Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {tiers.map((tier, idx) => {
            const isSelected = selectedTierId === tier.id;
            const progressPercent = Math.min(100, Math.round((tier.currentCount / tier.targetCount) * 100));

            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTierId(isSelected ? 'all' : tier.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-950/60 border-blue-400 shadow-lg ring-2 ring-blue-500/40'
                    : tier.isCurrent
                    ? 'bg-gradient-to-b from-[#1c2238] to-[#121624] border-amber-500/50 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : tier.isCompleted
                    ? 'bg-[#12201a] border-emerald-500/30'
                    : tier.isUnlocked
                    ? 'bg-[#141620] border-white/10'
                    : 'bg-[#0d0f14] border-white/5 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                    <span>Tramo {idx + 1}</span>
                    {tier.isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : tier.isCurrent ? (
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-zinc-600" />
                    )}
                  </div>
                  <div className="text-sm font-bold text-white tracking-tight">
                    {tier.label}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                    {tier.currentCount}/{tier.targetCount} clientes
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        tier.isCompleted
                          ? 'bg-emerald-400'
                          : tier.isCurrent
                          ? 'bg-amber-400'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-400 mt-1 block text-right font-mono">
                    {progressPercent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Ladder Next Step Motivation */}
        <div className="mt-5 p-3.5 bg-[#0e1017] rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-white font-semibold">
                Meta inmediata: Desbloquear el Tramo 2 ($100.000)
              </span>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Tienes <strong className="text-amber-300">{currentTier.currentCount} clientes</strong> cerrados en {currentTier.name}. Te faltan{' '}
                <strong className="text-emerald-400">
                  {Math.max(0, currentTier.targetCount - currentTier.currentCount)} clientes
                </strong>{' '}
                para completar los 5 y subir el precio de tus servicios.
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-mono text-zinc-400 block">Facturación acumulada en Tramo 1:</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">{formatCLP(currentTier.totalRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Payment Types Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-[#13151f] rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-zinc-400 font-medium block">Pago Único Completo</span>
            <span className="text-lg font-bold text-white mt-1 block">
              {formatCLP(paymentBreakdown['pago unico'].total)}
            </span>
          </div>
          <span className="px-2.5 py-1 bg-white/5 rounded-lg text-zinc-300 font-mono text-xs">
            {paymentBreakdown['pago unico'].count} cliente(s)
          </span>
        </div>

        <div className="p-4 bg-[#13151f] rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-zinc-400 font-medium block">Pago Único (1ra Parte / Anticipo)</span>
            <span className="text-lg font-bold text-amber-300 mt-1 block">
              {formatCLP(paymentBreakdown['pago unico primera parte'].total)}
            </span>
          </div>
          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-lg font-mono text-xs">
            {paymentBreakdown['pago unico primera parte'].count} cliente(s)
          </span>
        </div>

        <div className="p-4 bg-[#13151f] rounded-xl border border-white/5 flex items-center justify-between">
          <div>
            <span className="text-zinc-400 font-medium block">Suscripciones Recurrentes</span>
            <span className="text-lg font-bold text-emerald-400 mt-1 block">
              {formatCLP(paymentBreakdown.suscripcion.total)}
            </span>
          </div>
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-300 rounded-lg font-mono text-xs">
            {paymentBreakdown.suscripcion.count} mensualidad(es)
          </span>
        </div>
      </div>

      {/* Clientes Header & View Mode Controls */}
      <div className="bg-[#13151f] border border-white/5 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Clientes Registrados ({filteredClients.length})
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Tabla Airtable: Clientes
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Datos sincronizados directamente desde tu base &quot;Vortexia Progress&quot;.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar cliente..."
                className="bg-[#0e1017] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors w-40 sm:w-48"
              />
            </div>

            {/* View Switcher: Cards vs Table */}
            <div className="flex items-center bg-[#0e1017] p-1 rounded-xl border border-white/10 text-xs">
              <button
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Vista de Tarjetas CRM"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Vista de Tabla Airtable"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
            </div>
          </div>
        </div>

        {/* Empty State if filter yields no clients */}
        {filteredClients.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-white">No se encontraron clientes con el filtro aplicado</p>
            <p className="text-xs text-zinc-400 mt-1">Intenta restablecer el filtro de tramo o limpiar la búsqueda.</p>
            <button
              onClick={() => {
                setSelectedTierId('all');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              Ver todos los clientes
            </button>
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-4">
            {filteredClients.map((client) => {
              // WhatsApp link handling
              const waUrl = client.whatsappUrl?.startsWith('http')
                ? client.whatsappUrl
                : client.whatsappUrl
                ? `https://wa.me/${client.whatsappUrl.replace(/[^0-9]/g, '')}`
                : '';

              const isSubscription = client.tipoPago?.toLowerCase().includes('suscrip');
              const isFirstPart = client.tipoPago?.toLowerCase().includes('primera') || client.tipoPago?.toLowerCase().includes('anticipo');

              return (
                <div
                  key={client.id}
                  className="bg-[#0e1017] hover:bg-[#12151f] border border-white/5 hover:border-blue-500/30 rounded-2xl p-5 transition-all flex flex-col justify-between group shadow-lg"
                >
                  <div>
                    {/* Top line: Name & Tier pill */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h4 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                          {client.name}
                        </h4>
                        <span className="text-[11px] text-zinc-500">Cliente activo</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0 uppercase tracking-wider">
                        {client.tramo}
                      </span>
                    </div>

                    {/* Amount and Payment type */}
                    <div className="flex items-baseline justify-between mb-4 pb-3.5 border-b border-white/5">
                      <div>
                        <span className="text-[10px] text-zinc-500 block uppercase font-mono">Dinero Abonado</span>
                        <div className="text-2xl font-bold font-mono text-emerald-400">
                          {formatCLP(client.monto)}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                          isSubscription
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                            : isFirstPart
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        }`}
                      >
                        {client.tipoPago}
                      </span>
                    </div>

                    {/* Comprobante / Pantallazo Thumbnail Preview */}
                    {client.pantallazoUrl && (
                      <div className="mb-4 p-2.5 bg-[#141622] rounded-xl border border-white/5 flex items-center gap-3">
                        <div
                          onClick={() => setActiveProofModal(client)}
                          className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/10 cursor-pointer relative group/thumb"
                        >
                          <img
                            src={client.pantallazoUrl}
                            alt={`Comprobante de ${client.name}`}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                            <Eye className="w-3.5 h-3.5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-semibold text-zinc-200 block truncate">
                            {client.pantallazoNombre || 'Comprobante adjunto'}
                          </span>
                          <button
                            onClick={() => setActiveProofModal(client)}
                            className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-0.5"
                          >
                            <FileCheck className="w-3 h-3" /> Ver comprobante
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Notes / Context */}
                    {client.notas && (
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed bg-[#12141c] p-2.5 rounded-xl border border-white/5">
                        {client.notas}
                      </p>
                    )}

                    {/* Date of payment */}
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Fecha de pago: {client.rawFechaPago || client.fechaPago || 'Registrado'}</span>
                    </div>
                  </div>

                  {/* Bottom links: Web, GitHub, WhatsApp, Comprobante */}
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {client.urlWeb && (
                        <a
                          href={client.urlWeb}
                          target="_blank"
                          rel="noreferrer"
                          title="Ver sitio web entregado"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                      )}
                      {client.repositorioGithub && (
                        <a
                          href={client.repositorioGithub}
                          target="_blank"
                          rel="noreferrer"
                          title="Repositorio de GitHub"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                        >
                          <Github className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Abrir WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View replicating Airtable layout */
          <div className="pt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 font-mono uppercase text-[11px] bg-[#0e1017]">
                  <th className="py-3 px-4">Name (Cliente)</th>
                  <th className="py-3 px-4">Dinero Abonado</th>
                  <th className="py-3 px-4">Tipo de Pago</th>
                  <th className="py-3 px-4">Tramo</th>
                  <th className="py-3 px-4">WhatsApp</th>
                  <th className="py-3 px-4">Pantallazo / Comprobante</th>
                  <th className="py-3 px-4">Notas Situación</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredClients.map((client) => {
                  const waUrl = client.whatsappUrl?.startsWith('http')
                    ? client.whatsappUrl
                    : client.whatsappUrl
                    ? `https://wa.me/${client.whatsappUrl.replace(/[^0-9]/g, '')}`
                    : '';

                  return (
                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-white text-sm">
                        {client.name}
                      </td>

                      {/* Dinero Abonado */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                        {formatCLP(client.monto)}
                      </td>

                      {/* Tipo de Pago */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded-md text-[11px] font-medium bg-white/5 text-zinc-300 border border-white/10 capitalize">
                          {client.tipoPago}
                        </span>
                      </td>

                      {/* Tramo */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {client.tramo}
                        </span>
                      </td>

                      {/* WhatsApp */}
                      <td className="py-3.5 px-4">
                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-semibold"
                          >
                            <Send className="w-3 h-3" />
                            Enviar mensaje
                          </a>
                        ) : (
                          <span className="text-zinc-600">--</span>
                        )}
                      </td>

                      {/* Pantallazo Thumbnail */}
                      <td className="py-3.5 px-4">
                        {client.pantallazoUrl ? (
                          <div
                            onClick={() => setActiveProofModal(client)}
                            className="flex items-center gap-2 cursor-pointer group/thumb"
                          >
                            <div className="w-8 h-8 rounded-md overflow-hidden border border-white/10 shrink-0">
                              <img
                                src={client.pantallazoUrl}
                                alt="Comprobante"
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[11px] text-amber-400 group-hover/thumb:underline truncate max-w-[120px]">
                              {client.pantallazoNombre || 'Ver comprobante'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600">Sin archivo</span>
                        )}
                      </td>

                      {/* Notas */}
                      <td className="py-3.5 px-4 text-zinc-400 max-w-xs truncate text-[11px]">
                        {client.notas || '--'}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {client.urlWeb && (
                            <a
                              href={client.urlWeb}
                              target="_blank"
                              rel="noreferrer"
                              title="Ver sitio web"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {client.pantallazoUrl && (
                            <button
                              onClick={() => setActiveProofModal(client)}
                              title="Ver comprobante"
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-400"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Comprobante / Pantallazo */}
      {activeProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#13151f] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Comprobante de Pago Verificado</h3>
                <span className="text-xs text-zinc-400">{activeProofModal.name} &bull; {activeProofModal.tramo}</span>
              </div>
              <button
                onClick={() => setActiveProofModal(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image Preview */}
              {activeProofModal.pantallazoUrl && (
                <div className="rounded-xl overflow-hidden border border-white/10 max-h-72 bg-[#0a0c12] flex items-center justify-center">
                  <img
                    src={activeProofModal.pantallazoUrl}
                    alt={`Comprobante ${activeProofModal.name}`}
                    className="w-full h-full object-contain max-h-72"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              {/* Details card */}
              <div className="p-4 bg-[#0e1017] rounded-xl border border-white/5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Cliente / Empresa:</span>
                  <span className="font-bold text-white">{activeProofModal.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Dinero Abonado:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {formatCLP(activeProofModal.monto)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Tipo de Pago:</span>
                  <span className="capitalize text-zinc-200">{activeProofModal.tipoPago}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Tramo de Precios:</span>
                  <span className="text-blue-400 font-semibold">{activeProofModal.tramo}</span>
                </div>
                {activeProofModal.notas && (
                  <div className="pt-2 border-t border-white/5">
                    <span className="text-zinc-400 block mb-1">Notas de situación:</span>
                    <p className="text-zinc-300 leading-relaxed">{activeProofModal.notas}</p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                {activeProofModal.whatsappUrl && (
                  <a
                    href={activeProofModal.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Abrir Chat WhatsApp
                  </a>
                )}
                <button
                  onClick={() => setActiveProofModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
