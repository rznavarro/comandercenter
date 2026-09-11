import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  AlertOctagon,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  Flame,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { EstrategiaRecord, DashboardMetrics } from '../types';
import { formatPercent } from '../utils/airtableParser';

interface StrategyViewProps {
  estrategia: EstrategiaRecord[];
  metrics: DashboardMetrics;
  dateRange: '7d' | '14d' | '30d' | 'all';
  onDateRangeChange: (range: '7d' | '14d' | '30d' | 'all') => void;
}

export const StrategyView: React.FC<StrategyViewProps> = ({
  estrategia,
  metrics,
  dateRange,
  onDateRangeChange,
}) => {
  // Filter records according to dateRange
  const filteredRecords = React.useMemo(() => {
    const sorted = [...estrategia].sort((a, b) => a.dia.localeCompare(b.dia));
    if (dateRange === '7d') return sorted.slice(-7);
    if (dateRange === '14d') return sorted.slice(-14);
    if (dateRange === '30d') return sorted.slice(-30);
    return sorted;
  }, [estrategia, dateRange]);

  // Transform data for charts
  const chartData = filteredRecords.map((item) => {
    // Format display date: "24 Ago", "31 Ago", "1 Sep", etc.
    let label = item.dia;
    if (item.dia.includes('-')) {
      const parts = item.dia.split('-');
      if (parts.length === 3) {
        const d = parseInt(parts[2], 10);
        const m = parseInt(parts[1], 10);
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        label = `${d} ${monthNames[m - 1] || ''}`;
      }
    }

    const totalResp = item.respuestasPositivas + item.respuestasNegativas;
    const posQualityRate = totalResp > 0 ? (item.respuestasPositivas / totalResp) * 100 : 0;

    return {
      date: item.dia,
      label,
      rawDia: item.rawDia,
      mensajes: item.cantidadMensajes,
      positivas: item.respuestasPositivas,
      negativas: item.respuestasNegativas,
      ventas: item.ventas,
      posQualityRate: Math.round(posQualityRate),
      tasaPositiva: Math.round(item.tasaPositiva * 100),
    };
  });

  // Calculate day-of-week averages to tell the user which days work best
  const dayStats: Record<string, { count: number; totalPos: number; totalMsj: number }> = {
    Lunes: { count: 0, totalPos: 0, totalMsj: 0 },
    Martes: { count: 0, totalPos: 0, totalMsj: 0 },
    Miércoles: { count: 0, totalPos: 0, totalMsj: 0 },
    Jueves: { count: 0, totalPos: 0, totalMsj: 0 },
    Viernes: { count: 0, totalPos: 0, totalMsj: 0 },
    FinDeSemana: { count: 0, totalPos: 0, totalMsj: 0 },
  };

  estrategia.forEach((rec) => {
    if (rec.fechaObj) {
      const dayIndex = rec.fechaObj.getDay(); // 0 is Sunday, 1 is Monday...
      let key = 'Lunes';
      if (dayIndex === 1) key = 'Lunes';
      else if (dayIndex === 2) key = 'Martes';
      else if (dayIndex === 3) key = 'Miércoles';
      else if (dayIndex === 4) key = 'Jueves';
      else if (dayIndex === 5) key = 'Viernes';
      else key = 'FinDeSemana';

      dayStats[key].count++;
      dayStats[key].totalPos += rec.respuestasPositivas;
      dayStats[key].totalMsj += rec.cantidadMensajes;
    }
  });

  let bestDayOfWeek = 'Lunes';
  let bestDayRate = -1;
  Object.entries(dayStats).forEach(([dayName, data]) => {
    if (data.totalMsj > 0) {
      const rate = data.totalPos / data.totalMsj;
      if (rate > bestDayRate) {
        bestDayRate = rate;
        bestDayOfWeek = dayName;
      }
    }
  });

  return (
    <div className="space-y-6">
      {/* View Header with Date Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#13151f] p-5 rounded-2xl border border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Estrategia & Analytics de Prospección
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              El corazón del Command Center
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Analiza la evolución día a día de tus mensajes salientes, tasa de respuesta y calidad de leads.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0b0d13] rounded-xl border border-white/5 shrink-0 self-start sm:self-auto">
          <button
            onClick={() => onDateRangeChange('7d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              dateRange === '7d'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            7 Días
          </button>
          <button
            onClick={() => onDateRangeChange('14d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              dateRange === '14d'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            14 Días
          </button>
          <button
            onClick={() => onDateRangeChange('30d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              dateRange === '30d'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            30 Días
          </button>
          <button
            onClick={() => onDateRangeChange('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              dateRange === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Todo
          </button>
        </div>
      </div>

      {/* 4 Automated Insights Cards (Requested in the metaprompt) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Insight 1: Mejor día */}
        <div className="bg-[#13151f] border border-white/5 rounded-2xl p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Mejor Día Histórico</span>
            <div className="w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold tracking-tight text-white truncate">
              {metrics.bestDay ? metrics.bestDay.formattedDate : 'Sin data'}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                {metrics.bestDay ? formatPercent(metrics.bestDay.tasaPositiva) : '0%'} pos.
              </span>
              <span className="text-[10px] text-zinc-400">
                {metrics.bestDay?.respuestasPositivas} de {metrics.bestDay?.mensajes} msjs
              </span>
            </div>
          </div>
        </div>

        {/* Insight 2: Días sin enviar mensajes (Detección de días en cero) */}
        <div className={`border rounded-2xl p-4.5 relative overflow-hidden ${
          metrics.diasSinMensajes > 0
            ? 'bg-rose-950/20 border-rose-500/30'
            : 'bg-[#13151f] border-white/5'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Consistencia Saliente</span>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
              metrics.diasSinMensajes > 0
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            }`}>
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold tracking-tight text-white">
              {metrics.diasSinMensajes > 0
                ? `${metrics.diasSinMensajes} días sin mensajes`
                : 'Activo hoy'}
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold ${
                metrics.totalDiasConCeroMensajes > 3
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  : 'bg-zinc-800 text-zinc-300'
              }`}>
                {metrics.totalDiasConCeroMensajes} días en 0
              </span>
              <span className="text-[10px] text-zinc-400">en el período total</span>
            </div>
          </div>
        </div>

        {/* Insight 3: Promedio de mensajes / día */}
        <div className="bg-[#13151f] border border-white/5 rounded-2xl p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Ritmo Diario</span>
            <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold tracking-tight text-white">
              {metrics.promedioMensajesPorDia} msjs / día activo
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20">
                Meta: 50/día
              </span>
              <span className="text-[10px] text-zinc-400">para llenar 1 tramo/mes</span>
            </div>
          </div>
        </div>

        {/* Insight 4: Día de la semana más eficiente */}
        <div className="bg-[#13151f] border border-white/5 rounded-2xl p-4.5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Día Más Receptivo</span>
            <div className="w-7 h-7 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-bold tracking-tight text-amber-300">
              {bestDayOfWeek} ({formatPercent(bestDayRate)})
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-zinc-400">
                Los {bestDayOfWeek} generan mayor ratio de interés comercial.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart 1: Área / Línea con 4 Series (Mensajes, Positivas, Negativas, Ventas) */}
      <div className="bg-[#13151f] border border-white/5 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Evolución Temporal de Prospección (4 Series)
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Comparativa de volumen de mensajes enviados vs respuestas y ventas cerradas día a día.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-500" />
              <span className="text-zinc-300">Mensajes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-zinc-300">Positivas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-zinc-300">Negativas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-400" />
              <span className="text-zinc-300">Ventas</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientMensajes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientPositivas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientNegativas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#0e1017] border border-white/10 rounded-xl p-3 shadow-2xl text-xs space-y-1 min-w-[170px]">
                        <span className="font-bold text-white block mb-1.5 border-b border-white/10 pb-1">
                          {data.rawDia || label}
                        </span>
                        <div className="flex justify-between items-center text-blue-400">
                          <span>Mensajes enviados:</span>
                          <span className="font-bold">{data.mensajes}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-400">
                          <span>Respuestas positivas:</span>
                          <span className="font-bold">{data.positivas}</span>
                        </div>
                        <div className="flex justify-between items-center text-rose-400">
                          <span>Respuestas negativas:</span>
                          <span className="font-bold">{data.negativas}</span>
                        </div>
                        <div className="flex justify-between items-center text-amber-400 font-bold pt-1 border-t border-white/10">
                          <span>Ventas cerradas:</span>
                          <span>{data.ventas}</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="mensajes"
                name="Mensajes"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradientMensajes)"
              />
              <Area
                type="monotone"
                dataKey="positivas"
                name="Positivas"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradientPositivas)"
              />
              <Area
                type="monotone"
                dataKey="negativas"
                name="Negativas"
                stroke="#f43f5e"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#gradientNegativas)"
              />
              <Area
                type="monotone"
                dataKey="ventas"
                name="Ventas"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradientVentas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Chart 2: Gráfico de Barras Apiladas (Calidad de Mensajes: Positivas vs Negativas) */}
      <div className="bg-[#13151f] border border-white/5 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Calidad de Mensajes: Respuestas Positivas vs. Negativas por Día
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Barras Apiladas
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Mide la recepción cualitativa de tus mensajes y detecta si tus mensajes están convirtiendo o generando rechazo.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              <span className="text-zinc-300">Positivas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500" />
              <span className="text-zinc-300">Negativas</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const total = data.positivas + data.negativas;
                    const ratio = total > 0 ? Math.round((data.positivas / total) * 100) : 0;
                    return (
                      <div className="bg-[#0e1017] border border-white/10 rounded-xl p-3 shadow-2xl text-xs space-y-1 min-w-[180px]">
                        <span className="font-bold text-white block mb-1">
                          {data.rawDia || label}
                        </span>
                        <div className="flex justify-between text-emerald-400">
                          <span>Positivas:</span>
                          <span className="font-bold">{data.positivas}</span>
                        </div>
                        <div className="flex justify-between text-rose-400">
                          <span>Negativas:</span>
                          <span className="font-bold">{data.negativas}</span>
                        </div>
                        <div className="flex justify-between text-zinc-300 pt-1 border-t border-white/10 font-medium">
                          <span>Ratio de Calidad:</span>
                          <span className={ratio >= 60 ? 'text-emerald-400' : 'text-amber-400'}>
                            {ratio}% positivo
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="positivas" name="Positivas" stackId="calidad" fill="#10b981" radius={[0, 0, 4, 4]} />
              <Bar dataKey="negativas" name="Negativas" stackId="calidad" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
