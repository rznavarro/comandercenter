import {
  LeadRecord,
  EstrategiaRecord,
  ClienteRecord,
  AirtableApiResponse,
} from '../types';
import { DEMO_LEADS, DEMO_ESTRATEGIA, DEMO_CLIENTES } from '../data/demoData';
import { parseAirtableDate, normalizeStage } from '../utils/airtableParser';

// Helper to parse monetary amounts like "$50.000", "50000", "$ 100.000 CLP"
function parseMoney(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// Convert raw Airtable records to typed LeadRecord
function mapAirtableLeads(records: any[]): LeadRecord[] {
  return records.map((rec) => {
    const f = rec.fields || {};
    const nombre = f['nombre cliente'] || f['Nombre cliente'] || f['nombre'] || f['Name'] || 'Lead sin nombre';
    const whatsapp = f['whatsapp numero'] || f['Whatsapp numero'] || f['whatsapp'] || f['telefono'] || '';
    const rawEtapa = f['etapa'] || f['Etapa'] || 'contactado';
    const etapa = normalizeStage(rawEtapa);
    const horaEnvio = f['hora a la que se envio el mensaje'] || f['hora'] || f['Hora'] || '--:--';
    const rawDia = f['dia'] || f['Dia'] || f['fecha'] || '';
    const { iso, dateObj } = parseAirtableDate(rawDia);

    // Calculate days elapsed for follow-up alert
    let diasSinSeguimiento = 0;
    if (dateObj) {
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      diasSinSeguimiento = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    const requiereReenganche =
      diasSinSeguimiento >= 3 &&
      etapa !== 'venta' &&
      etapa !== 'respuesta negativa';

    return {
      id: rec.id || `lead_${Math.random()}`,
      nombreCliente: nombre,
      whatsappNumero: whatsapp,
      etapa,
      horaEnvio,
      dia: iso,
      rawDia: String(rawDia || iso),
      fechaObj: dateObj,
      diasSinSeguimiento,
      requiereReenganche,
      notas: f['notas'] || f['Notas'] || '',
    };
  });
}

// Convert raw Airtable records to typed EstrategiaRecord
function mapAirtableEstrategia(records: any[]): EstrategiaRecord[] {
  return records.map((rec) => {
    const f = rec.fields || {};
    const rawDia = f['dia'] || f['Dia'] || f['fecha'] || '';
    const { iso, dateObj } = parseAirtableDate(rawDia);
    const cantidadMensajes = Number(f['cantidad de mensajes'] || f['mensajes'] || f['Cantidad de mensajes'] || 0);
    const respuestasPositivas = Number(f['respuestas positivas'] || f['positivas'] || f['Respuestas positivas'] || 0);
    const respuestasNegativas = Number(f['respuestas negativas'] || f['negativas'] || f['Respuestas negativas'] || 0);
    const ventas = Number(f['ventas'] || f['Ventas'] || 0);

    return {
      id: rec.id || `strat_${Math.random()}`,
      dia: iso || String(rawDia),
      rawDia: String(rawDia),
      fechaObj: dateObj,
      cantidadMensajes,
      respuestasPositivas,
      respuestasNegativas,
      ventas,
      tasaRespuesta: cantidadMensajes > 0 ? (respuestasPositivas + respuestasNegativas) / cantidadMensajes : 0,
      tasaPositiva: cantidadMensajes > 0 ? respuestasPositivas / cantidadMensajes : 0,
      tasaNegativa: cantidadMensajes > 0 ? respuestasNegativas / cantidadMensajes : 0,
      tasaConversion: cantidadMensajes > 0 ? ventas / cantidadMensajes : 0,
    };
  });
}

// Convert raw Airtable records to typed ClienteRecord
function mapAirtableClientes(records: any[]): ClienteRecord[] {
  return records.map((rec) => {
    const f = rec.fields || {};
    const name = f['Name'] || f['name'] || f['nombre'] || f['Nombre'] || f['Nombre cliente'] || 'Cliente';
    
    // Support "dinero abonado", "Dinero abonado", "monto", "Monto", "abono", "dinero", etc.
    let rawMonto = f['dinero abonado'] ?? f['Dinero abonado'] ?? f['monto'] ?? f['Monto'] ?? f['dinero'] ?? f['abono'] ?? f['pago'];
    if (rawMonto === undefined) {
      const moneyKey = Object.keys(f).find((k) => {
        const lower = k.toLowerCase();
        return lower.includes('dinero') || lower.includes('abonado') || lower.includes('monto');
      });
      if (moneyKey) rawMonto = f[moneyKey];
    }
    const monto = parseMoney(rawMonto ?? 0);

    const tipoPago = f['tipo de pago'] || f['Tipo de pago'] || f['tipo'] || 'pago unico';
    const tramo = f['tramo'] || f['Tramo'] || 'tramo 50.000';
    const whatsappUrl = f['whatsapp url'] || f['Whatsapp url'] || f['whatsapp'] || f['telefono'] || '';

    // Pantallazo handling (can be Airtable attachment array or url string)
    let pantallazoUrl = '';
    let pantallazoNombre = '';
    const pantallazoKey = Object.keys(f).find((k) => {
      const lower = k.toLowerCase();
      return lower.includes('pantallazo') || lower.includes('comprobante') || lower.includes('adjunto') || lower.includes('recibo');
    });

    const attachmentField = pantallazoKey ? f[pantallazoKey] : (f['pantallazo'] || f['Pantallazo']);
    if (Array.isArray(attachmentField) && attachmentField.length > 0) {
      const firstAttachment = attachmentField[0];
      pantallazoUrl = firstAttachment.url || firstAttachment.thumbnails?.large?.url || firstAttachment.thumbnails?.full?.url || '';
      pantallazoNombre = firstAttachment.filename || 'comprobante_pago.png';
    } else if (typeof attachmentField === 'string') {
      pantallazoUrl = attachmentField;
      pantallazoNombre = 'comprobante_pago';
    }

    const notas = f['notas situacion del cliente'] || f['notas'] || f['Notas'] || f['situacion'] || '';
    const urlWeb = f['url de web'] || f['url web'] || f['url'] || f['web'] || f['sitio web'] || '';
    const repositorioGithub = f['repositorio de github'] || f['repositorio'] || f['github'] || f['repo'] || '';
    const rawFechaPago = f['fecha de pago'] || f['fecha'] || f['Fecha'] || '';
    const { iso } = parseAirtableDate(rawFechaPago);

    return {
      id: rec.id || `cli_${Math.random()}`,
      name,
      monto,
      tipoPago: String(tipoPago).toLowerCase(),
      tramo: String(tramo),
      whatsappUrl: String(whatsappUrl),
      pantallazoUrl,
      pantallazoNombre,
      notas,
      urlWeb,
      repositorioGithub,
      fechaPago: iso || String(rawFechaPago),
      rawFechaPago: String(rawFechaPago || iso),
    };
  });
}

export async function fetchProspectingData(options?: {
  forceRefresh?: boolean;
  forceDemo?: boolean;
}): Promise<AirtableApiResponse> {
  const params = new URLSearchParams();
  if (options?.forceRefresh) params.set('refresh', 'true');
  if (options?.forceDemo) params.set('demo', 'true');

  try {
    const response = await fetch(`/api/airtable/data?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const data = await response.json();

    if (data.connected && data.rawRecords) {
      const leads = mapAirtableLeads(data.rawRecords.leads || []);
      const estrategia = mapAirtableEstrategia(data.rawRecords.estrategia || []);
      const clientes = mapAirtableClientes(data.rawRecords.clientes || []);

      return {
        connected: true,
        isDemoData: false,
        baseId: data.baseId,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        leads: leads.length > 0 ? leads : DEMO_LEADS,
        estrategia: estrategia.length > 0 ? estrategia : DEMO_ESTRATEGIA,
        clientes: clientes.length > 0 ? clientes : DEMO_CLIENTES,
      };
    }

    // Default fallback to realistic demo data
    return {
      connected: false,
      isDemoData: true,
      error: data.error,
      lastUpdated: data.lastUpdated || new Date().toISOString(),
      leads: DEMO_LEADS,
      estrategia: DEMO_ESTRATEGIA,
      clientes: DEMO_CLIENTES,
    };
  } catch (err: any) {
    console.warn('Backend fetch failed, using local demo data:', err.message);
    return {
      connected: false,
      isDemoData: true,
      error: err.message,
      lastUpdated: new Date().toISOString(),
      leads: DEMO_LEADS,
      estrategia: DEMO_ESTRATEGIA,
      clientes: DEMO_CLIENTES,
    };
  }
}
