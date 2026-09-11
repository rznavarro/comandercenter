export type LeadStage =
  | 'contactado'
  | 'respuesta positiva'
  | 'respuesta negativa'
  | 'demo enviada'
  | 'venta'
  | string;

export interface LeadRecord {
  id: string;
  nombreCliente: string;
  whatsappNumero: string;
  etapa: LeadStage;
  horaEnvio: string; // ej. "1:39 pm"
  dia: string; // ISO format: YYYY-MM-DD
  rawDia: string; // original text: ej. "lunes 30 de agosto"
  fechaObj: Date | null;
  diasSinSeguimiento: number;
  requiereReenganche: boolean; // >3 días sin avance
  notas?: string;
}

export interface EstrategiaRecord {
  id: string;
  dia: string; // ISO format: YYYY-MM-DD
  rawDia: string;
  fechaObj: Date | null;
  cantidadMensajes: number;
  respuestasPositivas: number;
  respuestasNegativas: number;
  ventas: number;
  // Computed rates
  tasaRespuesta: number; // (pos + neg) / mensajes
  tasaPositiva: number; // pos / mensajes
  tasaNegativa: number; // neg / mensajes
  tasaConversion: number; // ventas / mensajes
}

export type TipoPago =
  | 'pago unico'
  | 'pago unico primera parte'
  | 'suscripcion'
  | string;

export interface ClienteRecord {
  id: string;
  name: string;
  monto: number; // In CLP (e.g. 50000)
  tipoPago: TipoPago;
  tramo: string; // ej. "tramo 50.000", "tramo 100.000", etc.
  whatsappUrl?: string;
  pantallazoUrl?: string;
  pantallazoNombre?: string;
  notas?: string;
  urlWeb?: string;
  repositorioGithub?: string;
  fechaPago: string; // ISO format: YYYY-MM-DD
  rawFechaPago: string;
}

export interface PriceTier {
  id: string;
  name: string;
  amountCLP: number;
  label: string;
  targetCount: number; // Standard 5 clients per tier
  currentCount: number;
  totalRevenue: number;
  isCurrent: boolean;
  isUnlocked: boolean;
  isCompleted: boolean;
}

export interface FunnelStep {
  stage: string;
  label: string;
  count: number;
  percentageOfTotal: number; // vs initial messages
  stepConversionRate: number; // vs previous step
  dropoffRate: number; // dropped from previous step
  color: string;
  description: string;
}

export interface DashboardMetrics {
  totalLeadsContactados: number;
  totalMensajesEnviados: number;
  totalRespuestasPositivas: number;
  totalRespuestasNegativas: number;
  totalDemosEnviadas: number;
  totalVentas: number;
  tasaRespuesta: number;
  tasaRespuestaPositiva: number;
  tasaConversionVenta: number;
  ingresosTotales: number;
  tramoActual: PriceTier;
  funnelSteps: FunnelStep[];
  bestDay: {
    dia: string;
    formattedDate: string;
    tasaPositiva: number;
    respuestasPositivas: number;
    mensajes: number;
  } | null;
  diasSinMensajes: number; // consecutive or recent zero-message days
  totalDiasConCeroMensajes: number;
  promedioMensajesPorDia: number;
  proyeccion30Dias: number;
  proyeccion90Dias: number;
  leadsRequierenSeguimiento: number;
}

export interface AirtableApiResponse {
  connected: boolean;
  isDemoData: boolean;
  baseId?: string;
  lastUpdated: string;
  error?: string;
  leads: LeadRecord[];
  estrategia: EstrategiaRecord[];
  clientes: ClienteRecord[];
}
