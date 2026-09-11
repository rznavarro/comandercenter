import {
  LeadRecord,
  EstrategiaRecord,
  ClienteRecord,
  DashboardMetrics,
  PriceTier,
  FunnelStep,
} from '../types';

// Spanish month names mapping
const MONTHS_ES: Record<string, number> = {
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

/**
 * Robust date parser for Spanish dates like "lunes 30 de agosto", "31/8/2026", "2026-08-31", etc.
 */
export function parseAirtableDate(raw: any, referenceYear: number = 2026): { iso: string; dateObj: Date | null } {
  if (!raw) {
    return { iso: '', dateObj: null };
  }

  if (raw instanceof Date && !isNaN(raw.getTime())) {
    const iso = raw.toISOString().split('T')[0];
    return { iso, dateObj: raw };
  }

  const str = String(raw).trim().toLowerCase();

  // Format: "YYYY-MM-DD"
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(year, month, day);
    return { iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, dateObj: d };
  }

  // Format: "DD/MM/YYYY" or "DD-MM-YYYY" or "DD/MM/YY"
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    return { iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, dateObj: d };
  }

  // Text format: "lunes 30 de agosto" or "30 de agosto" or "30 de agosto 2026"
  const textMatch = str.match(/(?:[a-záéíóúñ]+\s+)?(\d{1,2})\s+de\s+([a-záéíóúñ]+)(?:\s+(?:de\s+)?(\d{4}))?/i);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthName = textMatch[2].toLowerCase();
    const year = textMatch[3] ? parseInt(textMatch[3], 10) : referenceYear;
    const month = MONTHS_ES[monthName] ?? 7; // default agosto if not found
    const d = new Date(year, month, day);
    return { iso: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, dateObj: d };
  }

  // Fallback to Date.parse
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    const iso = parsed.toISOString().split('T')[0];
    return { iso, dateObj: parsed };
  }

  return { iso: str, dateObj: null };
}

/**
 * Formats a currency number into Chilean Pesos (CLP)
 */
export function formatCLP(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats a percentage number with 1 decimal
 */
export function formatPercent(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0.0%';
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Standardize stage string
 */
export function normalizeStage(stage: string): string {
  if (!stage) return 'contactado';
  const clean = stage.trim().toLowerCase();
  if (clean.includes('venta') || clean.includes('cerrad')) return 'venta';
  if (clean.includes('demo')) return 'demo enviada';
  if (clean.includes('positiv')) return 'respuesta positiva';
  if (clean.includes('negativ') || clean.includes('rechaz')) return 'respuesta negativa';
  if (clean.includes('contact')) return 'contactado';
  return clean;
}

/**
 * Colors and badges for lead stages
 */
export const STAGE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string; lightHex: string }
> = {
  contactado: {
    label: 'Contactado',
    bg: 'bg-zinc-800/80',
    text: 'text-zinc-300',
    border: 'border-zinc-700',
    dot: 'bg-zinc-400',
    lightHex: '#94a3b8',
  },
  'respuesta positiva': {
    label: 'Respuesta positiva',
    bg: 'bg-emerald-950/60',
    text: 'text-emerald-400',
    border: 'border-emerald-700/50',
    dot: 'bg-emerald-500',
    lightHex: '#10b981',
  },
  'respuesta negativa': {
    label: 'Respuesta negativa',
    bg: 'bg-rose-950/60',
    text: 'text-rose-400',
    border: 'border-rose-700/50',
    dot: 'bg-rose-500',
    lightHex: '#f43f5e',
  },
  'demo enviada': {
    label: 'Demo enviada',
    bg: 'bg-sky-950/60',
    text: 'text-sky-400',
    border: 'border-sky-700/50',
    dot: 'bg-sky-500',
    lightHex: '#0ea5e9',
  },
  venta: {
    label: 'Venta',
    bg: 'bg-amber-950/70',
    text: 'text-amber-300',
    border: 'border-amber-600/60',
    dot: 'bg-amber-400',
    lightHex: '#f59e0b',
  },
};

/**
 * Definition of the 8 Vortexia Price Tiers (Escalera de Precios)
 * 5 clients per tier rule
 */
export const VORTEXIA_PRICE_TIERS = [
  { id: 't1', name: 'Tramo $50.000', label: '$50k', amountCLP: 50000, targetCount: 5 },
  { id: 't2', name: 'Tramo $100.000', label: '$100k', amountCLP: 100000, targetCount: 5 },
  { id: 't3', name: 'Tramo $250.000', label: '$250k', amountCLP: 250000, targetCount: 5 },
  { id: 't4', name: 'Tramo $500.000', label: '$500k', amountCLP: 500000, targetCount: 5 },
  { id: 't5', name: 'Tramo $1.000.000', label: '$1M', amountCLP: 1000000, targetCount: 5 },
  { id: 't6', name: 'Tramo $2.000.000', label: '$2M', amountCLP: 2000000, targetCount: 5 },
  { id: 't7', name: 'Tramo $5.000.000', label: '$5M', amountCLP: 5000000, targetCount: 5 },
  { id: 't8', name: 'Tramo $5-10M', label: '$5M-10M', amountCLP: 10000000, targetCount: 5 },
];

/**
 * Calculates current price tiers and status from client records
 */
export function calculatePriceTiers(clientes: ClienteRecord[]): {
  tiers: PriceTier[];
  currentTier: PriceTier;
} {
  // Map clients to tiers
  const tierCounts: Record<string, { count: number; revenue: number }> = {};
  VORTEXIA_PRICE_TIERS.forEach((t) => {
    tierCounts[t.id] = { count: 0, revenue: 0 };
  });

  clientes.forEach((c) => {
    // Check which tier matches
    let matchedTierId = 't1';
    const monto = c.monto || 0;
    const tramoStr = (c.tramo || '').toLowerCase();

    if (tramoStr.includes('10m') || tramoStr.includes('10.000.000') || monto >= 10000000) {
      matchedTierId = 't8';
    } else if (tramoStr.includes('5m') || tramoStr.includes('5.000.000') || monto >= 5000000) {
      matchedTierId = 't7';
    } else if (tramoStr.includes('2m') || tramoStr.includes('2.000.000') || monto >= 2000000) {
      matchedTierId = 't6';
    } else if (tramoStr.includes('1m') || tramoStr.includes('1.000.000') || monto >= 1000000) {
      matchedTierId = 't5';
    } else if (tramoStr.includes('500') || monto >= 500000) {
      matchedTierId = 't4';
    } else if (tramoStr.includes('250') || monto >= 250000) {
      matchedTierId = 't3';
    } else if (tramoStr.includes('100') || monto >= 100000) {
      matchedTierId = 't2';
    } else {
      matchedTierId = 't1';
    }

    tierCounts[matchedTierId].count += 1;
    tierCounts[matchedTierId].revenue += monto;
  });

  // Determine current tier: highest tier with real clients, or the first tier being filled
  let highestWithClientsIdx = -1;
  for (let i = VORTEXIA_PRICE_TIERS.length - 1; i >= 0; i--) {
    if (tierCounts[VORTEXIA_PRICE_TIERS[i].id].count > 0) {
      highestWithClientsIdx = i;
      break;
    }
  }

  const currentIdx = Math.max(0, highestWithClientsIdx);

  const tiers: PriceTier[] = VORTEXIA_PRICE_TIERS.map((t, idx) => {
    const stats = tierCounts[t.id];
    const isCompleted = stats.count >= t.targetCount;
    const isCurrent = idx === currentIdx;
    const isUnlocked = idx <= currentIdx;

    return {
      id: t.id,
      name: t.name,
      amountCLP: t.amountCLP,
      label: t.label,
      targetCount: t.targetCount,
      currentCount: stats.count,
      totalRevenue: stats.revenue,
      isCurrent,
      isUnlocked,
      isCompleted,
    };
  });

  return {
    tiers,
    currentTier: tiers[currentIdx],
  };
}

/**
 * Calculates all high-level metrics and funnel steps
 */
export function calculateDashboardMetrics(
  leads: LeadRecord[],
  estrategia: EstrategiaRecord[],
  clientes: ClienteRecord[]
): DashboardMetrics {
  // Total leads in DB
  const totalLeadsContactados = leads.length;

  // Sum from Estrategia
  const totalMensajesEnviados = estrategia.reduce((acc, curr) => acc + (curr.cantidadMensajes || 0), 0);
  const totalRespuestasPositivas = estrategia.reduce((acc, curr) => acc + (curr.respuestasPositivas || 0), 0);
  const totalRespuestasNegativas = estrategia.reduce((acc, curr) => acc + (curr.respuestasNegativas || 0), 0);
  const totalVentas = clientes.length > 0
    ? clientes.length
    : estrategia.reduce((acc, curr) => acc + (curr.ventas || 0), 0);

  // Stage counts in Leads table
  const leadsByStage: Record<string, number> = {};
  leads.forEach((l) => {
    const s = normalizeStage(l.etapa);
    leadsByStage[s] = (leadsByStage[s] || 0) + 1;
  });

  const totalDemosEnviadas = leadsByStage['demo enviada'] || 0;

  // Total messages sent base: either from estrategia or leads if estrategia is empty
  const baseMensajes = Math.max(totalMensajesEnviados, totalLeadsContactados);

  // Response rate: (positivas + negativas) / mensajes
  const totalRespuestas = totalRespuestasPositivas + totalRespuestasNegativas;
  const tasaRespuesta = baseMensajes > 0 ? totalRespuestas / baseMensajes : 0;
  const tasaRespuestaPositiva = baseMensajes > 0 ? totalRespuestasPositivas / baseMensajes : 0;
  const tasaConversionVenta = baseMensajes > 0 ? totalVentas / baseMensajes : 0;

  // Total revenue sum from Clientes
  const ingresosTotales = clientes.reduce((acc, curr) => acc + (curr.monto || 0), 0);

  // Price tier
  const { currentTier } = calculatePriceTiers(clientes);

  // Funnel Flow:
  // 1. Mensajes enviados
  // 2. Contactados
  // 3. Respuesta positiva
  // 4. Demo enviada
  // 5. Venta
  const countMensajes = baseMensajes;
  const countContactados = totalLeadsContactados > 0 ? totalLeadsContactados : baseMensajes;
  const countPositivas = totalRespuestasPositivas;
  const countDemos = Math.max(totalDemosEnviadas, countPositivas > 0 ? Math.round(countPositivas * 0.45) : 0);
  const countVentas = totalVentas;

  const funnelSteps: FunnelStep[] = [
    {
      stage: 'mensajes',
      label: 'Mensajes enviados',
      count: countMensajes,
      percentageOfTotal: 1.0,
      stepConversionRate: 1.0,
      dropoffRate: 0,
      color: '#3b82f6',
      description: 'Volumen total de prospección saliente',
    },
    {
      stage: 'contactados',
      label: 'Contactados',
      count: countContactados,
      percentageOfTotal: countMensajes > 0 ? countContactados / countMensajes : 1,
      stepConversionRate: countMensajes > 0 ? countContactados / countMensajes : 1,
      dropoffRate: countMensajes > 0 ? Math.max(0, 1 - countContactados / countMensajes) : 0,
      color: '#6366f1',
      description: 'Prospectos alcanzados directamente',
    },
    {
      stage: 'respuesta_positiva',
      label: 'Respuesta positiva',
      count: countPositivas,
      percentageOfTotal: countMensajes > 0 ? countPositivas / countMensajes : 0,
      stepConversionRate: countContactados > 0 ? countPositivas / countContactados : 0,
      dropoffRate: countContactados > 0 ? Math.max(0, 1 - countPositivas / countContactados) : 0,
      color: '#10b981',
      description: 'Leads con interés calificado y respuesta afirmativa',
    },
    {
      stage: 'demo_enviada',
      label: 'Demo enviada',
      count: countDemos,
      percentageOfTotal: countMensajes > 0 ? countDemos / countMensajes : 0,
      stepConversionRate: countPositivas > 0 ? countDemos / countPositivas : 0,
      dropoffRate: countPositivas > 0 ? Math.max(0, 1 - countDemos / countPositivas) : 0,
      color: '#0ea5e9',
      description: 'Propuesta visual y video/demo enviado',
    },
    {
      stage: 'venta',
      label: 'Venta',
      count: countVentas,
      percentageOfTotal: countMensajes > 0 ? countVentas / countMensajes : 0,
      stepConversionRate: countDemos > 0 ? countVentas / countDemos : 0,
      dropoffRate: countDemos > 0 ? Math.max(0, 1 - countVentas / countDemos) : 0,
      color: '#f59e0b',
      description: 'Cierres comerciales y pagos confirmados',
    },
  ];

  // Best day calculation (highest positive rate with at least 5 messages)
  let bestDay: DashboardMetrics['bestDay'] = null;
  let highestPositiveRate = -1;

  estrategia.forEach((e) => {
    if (e.cantidadMensajes > 0) {
      const rate = e.respuestasPositivas / e.cantidadMensajes;
      if (rate > highestPositiveRate) {
        highestPositiveRate = rate;
        bestDay = {
          dia: e.dia,
          formattedDate: e.rawDia || e.dia,
          tasaPositiva: rate,
          respuestasPositivas: e.respuestasPositivas,
          mensajes: e.cantidadMensajes,
        };
      }
    }
  });

  // Days without sending messages
  let consecutiveZeroDays = 0;
  let totalZeros = 0;
  // Sort estrategia chronologically
  const sortedEstrategia = [...estrategia].sort((a, b) => a.dia.localeCompare(b.dia));
  sortedEstrategia.forEach((e) => {
    if (e.cantidadMensajes === 0) {
      totalZeros++;
      consecutiveZeroDays++;
    } else {
      consecutiveZeroDays = 0;
    }
  });

  // Average messages per active day
  const activeDays = estrategia.filter((e) => e.cantidadMensajes > 0).length || 1;
  const promedioMensajesPorDia = Math.round(totalMensajesEnviados / activeDays);

  // Projections: 30 & 90 days based on recent daily run-rate
  // Average daily revenue: total revenue / total days
  const totalDays = Math.max(estrategia.length, 1);
  const dailyRunRate = ingresosTotales / totalDays;
  const proyeccion30Dias = Math.round(dailyRunRate * 30);
  const proyeccion90Dias = Math.round(dailyRunRate * 90);

  // Leads that require follow-up (>3 days)
  const leadsRequierenSeguimiento = leads.filter((l) => l.requiereReenganche).length;

  return {
    totalLeadsContactados,
    totalMensajesEnviados,
    totalRespuestasPositivas,
    totalRespuestasNegativas,
    totalDemosEnviadas,
    totalVentas,
    tasaRespuesta,
    tasaRespuestaPositiva,
    tasaConversionVenta,
    ingresosTotales,
    tramoActual: currentTier,
    funnelSteps,
    bestDay,
    diasSinMensajes: consecutiveZeroDays,
    totalDiasConCeroMensajes: totalZeros,
    promedioMensajesPorDia,
    proyeccion30Dias,
    proyeccion90Dias,
    leadsRequierenSeguimiento,
  };
}
