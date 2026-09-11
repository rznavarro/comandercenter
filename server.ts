import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache for Airtable requests (60 seconds duration as requested)
interface CacheEntry {
  data: any;
  timestamp: number;
}
let airtableCache: CacheEntry | null = null;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Helper to fetch all records from an Airtable table
async function fetchAirtableTable(baseId: string, tableIdOrName: string, apiKey: string) {
  const url = `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/${encodeURIComponent(tableIdOrName)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Airtable API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.records || [];
}

// Check configuration status
app.get('/api/airtable/status', (req, res) => {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableLeads = process.env.AIRTABLE_TABLE_LEADS || 'Leads';
  const tableEstrategia = process.env.AIRTABLE_TABLE_ESTRATEGIA || 'Estrategia';
  const tableClientes = process.env.AIRTABLE_TABLE_CLIENTES || 'Clientes';

  const isConfigured = Boolean(apiKey && apiKey.trim() !== '' && baseId && baseId.trim() !== '');

  res.json({
    configured: isConfigured,
    baseId: isConfigured ? baseId : null,
    tables: {
      leads: tableLeads,
      estrategia: tableEstrategia,
      clientes: tableClientes,
    },
    cacheActive: Boolean(airtableCache && Date.now() - airtableCache.timestamp < CACHE_TTL_MS),
  });
});

// Force refresh cache
app.post('/api/airtable/refresh', (req, res) => {
  airtableCache = null;
  res.json({ message: 'Cache cleared successfully' });
});

// Main data endpoint
app.get('/api/airtable/data', async (req, res) => {
  const forceRefresh = req.query.refresh === 'true';
  const forceDemo = req.query.demo === 'true';

  // Return cached data if available and fresh
  if (!forceRefresh && !forceDemo && airtableCache && Date.now() - airtableCache.timestamp < CACHE_TTL_MS) {
    return res.json({
      ...airtableCache.data,
      fromCache: true,
      cacheAgeSeconds: Math.round((Date.now() - airtableCache.timestamp) / 1000),
    });
  }

  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableLeads = process.env.AIRTABLE_TABLE_LEADS || 'Leads';
  const tableEstrategia = process.env.AIRTABLE_TABLE_ESTRATEGIA || 'Estrategia';
  const tableClientes = process.env.AIRTABLE_TABLE_CLIENTES || 'Clientes';

  // If credentials are not configured or demo mode is forced, return indicator so client uses rich demo dataset
  if (forceDemo || !apiKey || !baseId || apiKey.trim() === '' || baseId.trim() === '') {
    const demoResponse = {
      connected: false,
      isDemoData: true,
      message: 'Modo Demo Activo (Credenciales de Airtable no detectadas en .env)',
      lastUpdated: new Date().toISOString(),
      rawRecords: null,
    };
    return res.json(demoResponse);
  }

  try {
    // Fetch all 3 tables in parallel
    const [leadsRecords, estrategiaRecords, clientesRecords] = await Promise.all([
      fetchAirtableTable(baseId, tableLeads, apiKey),
      fetchAirtableTable(baseId, tableEstrategia, apiKey),
      fetchAirtableTable(baseId, tableClientes, apiKey),
    ]);

    const result = {
      connected: true,
      isDemoData: false,
      baseId,
      lastUpdated: new Date().toISOString(),
      rawRecords: {
        leads: leadsRecords,
        estrategia: estrategiaRecords,
        clientes: clientesRecords,
      },
    };

    // Cache the result
    airtableCache = {
      data: result,
      timestamp: Date.now(),
    };

    res.json(result);
  } catch (error: any) {
    console.error('Error fetching from Airtable:', error.message);
    res.status(200).json({
      connected: false,
      isDemoData: true,
      error: `Error de conexión con Airtable: ${error.message}. Mostrando datos de demostración de Vortexia.`,
      lastUpdated: new Date().toISOString(),
      rawRecords: null,
    });
  }
});

// Test connection endpoint
app.post('/api/airtable/test-connection', async (req, res) => {
  const { apiKey, baseId, tableLeads, tableEstrategia, tableClientes } = req.body;
  const key = apiKey || process.env.AIRTABLE_API_KEY;
  const base = baseId || process.env.AIRTABLE_BASE_ID;
  const leadTab = tableLeads || process.env.AIRTABLE_TABLE_LEADS || 'Leads';

  if (!key || !base) {
    return res.status(400).json({ success: false, error: 'API Key y Base ID son obligatorios' });
  }

  try {
    const records = await fetchAirtableTable(base, leadTab, key);
    res.json({
      success: true,
      message: `Conexión exitosa. Se encontraron ${records.length} registros en la tabla "${leadTab}".`,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vortexia Command Center running on http://localhost:${PORT}`);
  });
}

startServer();
