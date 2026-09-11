import React from 'react';
import {
  Users,
  MessageSquare,
  ThumbsUp,
  Percent,
  CircleDollarSign,
  Award,
  ArrowUpRight,
  TrendingDown,
  AlertTriangle,
  Send,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { DashboardMetrics, LeadRecord, ClienteRecord } from '../types';
import { formatCLP, formatPercent, STAGE_CONFIG } from '../utils/airtableParser';

interface OverviewViewProps {
  metrics: DashboardMetrics;
  leads: LeadRecord[];
  clientes: ClienteRecord[];
  onNavigateToLeads: (filter?: string) => void;
  onNavigateToStrategy: () => void;
  onNavigateToClients: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  leads,
  clientes,
  onNavigateToLeads,
  onNavigateToStrategy,
  onNavigateToClients,
}) => {
  // Distribution for Donut Chart (similar to "Sales by Category" in reference image)
  const stageCounts: Record<string, number> = {};
  leads.forEach((l) => {
    stageCounts[l.etapa] = (stageCounts[l.etapa] || 0) + 1;
  });

  const donutData = Object.entries(STAGE_CONFIG).map(([stageKey, cfg]) => {
    const count = stageCounts[stageKey] || 0;
    return {
      name: cfg.label,
      value: count,
      color: cfg.lightHex,
      stageKey,
    };
  }).filter(d => d.value > 0);

  // Leads that require follow up (urgent >3 days)
  const urgentFollowUps = leads
    .filter((l) => l.requiereReenganche)
    .slice(0, 4);

  // Diagnostic bottleneck calculation
  let highestDropoffStep = metrics.funnelSteps[1];
  let maxDropoff = -1;
  for (let i = 1; i < metrics.funnelSteps.length; i++) {
    const step = metrics.funnelSteps[i];
    if (step.dropoffRate > maxDropoff) {
      maxDropoff = step.dropoffRate;
      highestDropoffStep = step;
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-[#131724] via-[#11131c] to-[#141620] p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            ¡Hola, Equipo Vortexia! <span className="animate-bounce inline-block">👋</span>
          </h1>
          <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
            Este es el pulso en tiempo real de tu prospección. Detecta qué días rinden mejor, dónde estás perdiendo prospectos en el embudo y el avance hacia el próximo tramo de precios.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 z-10">
          <button
            onClick={onNavigateToStrategy}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ver Análisis Detallado
          </button>
        </div>
        {/* Subtle background glow */}
        <div className="absolute -right-16 -top-16 w-56 h-56 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 6 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* 1. Ingresos Totales (Highlighted Primary Card like $99.560 in reference design) */}
        <div
          onClick={onNavigateToClients}
          className="bg-[#141724] hover:bg-[#181c2c] border border-blue-500/30 rounded-2xl p-4.5 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-500/10 group relative"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-zinc-400">Ingresos Totales</span>
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/40 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {formatCLP(metrics.ingresosTotales)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                +14.2%
              </span>
              <span className="text-[10px] text-zinc-500">facturado acumulado</span>
            </div>
          </div>
        </div>

        {/* 2. Total Leads Contactados */}
        <div
          onClick={() => onNavigateToLeads()}
          className="bg-[#13151f] hover:bg-[#181a26] border border-white/5 rounded-2xl p-4.5 cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Leads</span>
            <div className="w-7 h-7 rounded-full bg-white/5 text-zinc-400 flex items-center justify-center group-hover:text-white group-hover:bg-white/10 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {metrics.totalLeadsContactados}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                {metrics.totalMensajesEnviados} msjs
              </span>
              <span className="text-[10px] text-zinc-500">prospección activa</span>
            </div>
          </div>
        </div>

        {/* 3. Tasa de Respuesta */}
        <div
          onClick={onNavigateToStrategy}
          className="bg-[#13151f] hover:bg-[#181a26] border border-white/5 rounded-2xl p-4.5 cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-zinc-400">Tasa de Respuesta</span>
            <div className="w-7 h-7 rounded-full bg-white/5 text-zinc-400 flex items-center justify-center group-hover:text-white group-hover:bg-white/10 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-white">
              {formatPercent(metrics.tasaRespuesta)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                {metrics.totalRespuestasPositivas + metrics.totalRespuestasNegativas} rtas
              </span>
              <span className="text-[10px] text-zinc-500">pos + neg</span>
            </div>
          </div>
        </div>

        {/* 4. Tasa de Respuesta Positiva */}
        <div
          onClick={onNavigateToStrategy}
          className="bg-[#13151f] hover:bg-[#181a26] border border-white/5 rounded-2xl p-4.5 cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-zinc-400">Tasa Positiva</span>
            <div className="w-7 h-7 rounded-full bg-white/5 text-zinc-400 flex items-center justify-center group-hover:text-white group-hover:bg-white/10 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-emerald-400">
              {formatPercent(metrics.tasaRespuestaPositiva)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                {metrics.totalRespuestasPositivas} positivas
              </span>
              <span className="text-[10px] text-zinc-500">calificadas</span>
            </div>
          </div>
        </div>

        {/* 5. Tasa de Conversión a Venta */}
        <div
          onClick={onNavigateToStrategy}
          className="bg-[#13151f] hover:bg-[#181a26] border border-white/5 rounded-2xl p-4.5 cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-zinc-400">Conversión a Venta</span>
            <div className="w-7 h-7 rounded-full bg-white/5 text-zinc-400 flex items-center justify-center group-hover:text-white group-hover:bg-white/10 transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-amber-300">
              {formatPercent(metrics.tasaConversionVenta)}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                {metrics.totalVentas} clientes
              </span>
              <span className="text-[10px] text-zinc-500">ventas / msjs</span>
            </div>
          </div>
        </div>

        {/* 6. Tramo Actual en Escalera de Precios */}
        <div
          onClick={onNavigateToClients}
          className="bg-[#13151f] hover:bg-[#181a26] border border-white/5 rounded-2xl p-4.5 cursor-pointer transition-all hover:scale-[1.01] group"
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-zinc-400">Tramo Actual</span>
            <div className="w-7 h-7 rounded-full bg-white/5 text-zinc-400 flex items-center justify-center group-hover:text-white group-hover:bg-white/10 transition-colors">
              <Award className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold tracking-tight text-amber-400">
              {metrics.tramoActual.name}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                {metrics.tramoActual.currentCount}/5 clientes
              </span>
              <span className="text-[10px] text-zinc-500">en este tramo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Funnel Chart Section: Embudo Real de Prospección */}
      <div className="bg-[#13151f] border border-white/5 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Embudo Real de Conversión (Funnel)
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Leads × Estrategia
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Flujo paso a paso: Mensajes enviados → Contactados → Respuesta positiva → Demo enviada → Venta
            </p>
          </div>

          {/* Diagnostic Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              Mayor fuga detectada: <strong>{highestDropoffStep.label}</strong> (pierdes {formatPercent(highestDropoffStep.dropoffRate)})
            </span>
          </div>
        </div>

        {/* Funnel Visual Bars */}
        <div className="space-y-4">
          {metrics.funnelSteps.map((step, idx) => {
            const isFirst = idx === 0;
            const prevStep = idx > 0 ? metrics.funnelSteps[idx - 1] : null;
            const barWidthPercent = Math.max(12, Math.round(step.percentageOfTotal * 100));

            return (
              <div key={step.stage} className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300 flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-white text-sm">
                      {step.label}
                    </span>
                    <span className="text-zinc-500 text-xs hidden md:inline">
                      • {step.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono">
                    <span className="text-sm font-bold text-white">
                      {step.count.toLocaleString()}
                    </span>
                    {!isFirst && prevStep && (
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-zinc-300">
                        {formatPercent(step.stepConversionRate)} de paso previo
                      </span>
                    )}
                    <span className="text-[11px] text-zinc-400 min-w-[50px] text-right">
                      {formatPercent(step.percentageOfTotal)} del total
                    </span>
                  </div>
                </div>

                {/* Bar representation */}
                <div className="h-4 bg-[#0e1017] rounded-full overflow-hidden p-0.5 border border-white/5">
                  <div
                    className="h-full rounded-full transition-all duration-700 relative group"
                    style={{
                      width: `${barWidthPercent}%`,
                      backgroundColor: step.color,
                    }}
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-full" />
                  </div>
                </div>

                {/* Drop-off connector info */}
                {!isFirst && step.dropoffRate > 0 && (
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 pl-7 mt-1">
                    <TrendingDown className="w-3 h-3 text-rose-400" />
                    <span>
                      Fuga de prospectos en este paso:{' '}
                      <strong className="text-rose-400 font-semibold">
                        -{formatPercent(step.dropoffRate)}
                      </strong>{' '}
                      ({(prevStep ? prevStep.count - step.count : 0).toLocaleString()} no continuaron)
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Funnel Takeaway / Action Recommendation */}
        <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-[#0e1017] rounded-xl border border-white/5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-blue-400 block mb-1">
              1. Calificación Inicial
            </span>
            <p className="text-zinc-400 leading-relaxed">
              De cada 100 mensajes enviados, logras respuesta positiva de{' '}
              <strong className="text-white">
                {(metrics.tasaRespuestaPositiva * 100).toFixed(1)} prospectos
              </strong>. Optimiza el hook de apertura en los primeros 5 segundos.
            </p>
          </div>

          <div className="p-3 bg-[#0e1017] rounded-xl border border-white/5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-emerald-400 block mb-1">
              2. Envío de Demo
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Las demos tienen alta efectividad. Asegúrate de enviar la demo en menos de 2 horas tras recibir la respuesta positiva para no enfriar el lead.
            </p>
          </div>

          <div className="p-3 bg-[#0e1017] rounded-xl border border-white/5">
            <span className="text-[11px] uppercase font-bold tracking-wider text-amber-400 block mb-1">
              3. Regla de Reenganche (3 días)
            </span>
            <p className="text-zinc-400 leading-relaxed">
              Tienes{' '}
              <strong className="text-amber-300 font-semibold">
                {metrics.leadsRequierenSeguimiento} prospectos
              </strong>{' '}
              sin interacción hace más de 3 días. Realiza un touchpoint breve hoy.
            </p>
          </div>
        </div>
      </div>

      {/* Two Supporting Blocks: Donut Distribution & Urgent Follow-up Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart: Sales / Leads by Category (inspired by reference image) */}
        <div className="bg-[#13151f] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Distribución de Leads por Etapa
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Estado actual de la cartera de prospectos
              </p>
            </div>
            <button
              onClick={() => onNavigateToLeads()}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
            {/* Pie Chart */}
            <div className="w-44 h-44 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0];
                        return (
                          <div className="bg-[#0e1017] border border-white/10 rounded-xl p-2.5 shadow-xl text-xs">
                            <span className="font-semibold text-white block">{d.name}</span>
                            <span className="text-zinc-400">{d.value} prospectos ({((d.value as number) / leads.length * 100).toFixed(1)}%)</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="#13151f" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-white">{leads.length}</span>
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider">Leads</span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="flex-1 space-y-2 w-full">
              {donutData.map((d) => (
                <div
                  key={d.name}
                  onClick={() => onNavigateToLeads(d.stageKey)}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                    />
                    <span className="text-zinc-300 font-medium">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-white">{d.value}</span>
                    <span className="text-[10px] text-zinc-500 min-w-[32px] text-right">
                      {Math.round((d.value / (leads.length || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Urgent 3-day Follow-up Quick Action Card */}
        <div className="bg-[#13151f] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  Regla de Reenganche Vortexia (3 Días)
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {metrics.leadsRequierenSeguimiento} urgentes
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Prospectos contactados o con respuesta sin interacción hace más de 72 hrs.
              </p>
            </div>
            <button
              onClick={() => onNavigateToLeads('reenganche')}
              className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 my-2">
            {urgentFollowUps.length === 0 ? (
              <div className="p-8 text-center bg-[#0e1017] rounded-xl border border-white/5">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">¡Al día con el seguimiento!</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">No hay prospectos estancados hace más de 3 días.</p>
              </div>
            ) : (
              urgentFollowUps.map((lead) => {
                const stageConfig = STAGE_CONFIG[lead.etapa] || STAGE_CONFIG.contactado;
                const cleanPhone = lead.whatsappNumero.replace(/[^0-9]/g, '');
                const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '';

                return (
                  <div
                    key={lead.id}
                    className="p-3 bg-[#0e1017] hover:bg-[#11131c] rounded-xl border border-white/5 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {lead.nombreCliente}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${stageConfig.bg} ${stageConfig.text} border ${stageConfig.border}`}>
                          {stageConfig.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
                        <span className="text-rose-400 font-medium">
                          Hace {lead.diasSinSeguimiento} días
                        </span>
                        <span>•</span>
                        <span className="truncate">{lead.whatsappNumero || 'Sin número'}</span>
                      </div>
                    </div>

                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        Reenganchar
                      </a>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
            <span>¿Sabías qué? El 60% de las ventas en agencias se cierran en el 2do y 3er follow-up.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
