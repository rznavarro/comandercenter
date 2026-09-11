import React, { useState } from 'react';
import {
  X,
  Database,
  Key,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Code2,
  ShieldCheck,
} from 'lucide-react';

interface AirtableConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConnected: boolean;
  isDemoData: boolean;
  onRefresh: (options?: { forceRefresh?: boolean; forceDemo?: boolean }) => void;
}

export const AirtableConfigModal: React.FC<AirtableConfigModalProps> = ({
  isOpen,
  onClose,
  isConnected,
  isDemoData,
  onRefresh,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseIdInput, setBaseIdInput] = useState('');
  const [tableLeads, setTableLeads] = useState('Leads');
  const [tableEstrategia, setTableEstrategia] = useState('Estrategia');
  const [tableClientes, setTableClientes] = useState('Clientes');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/airtable/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: apiKeyInput,
          baseId: baseIdInput,
          tableLeads,
          tableEstrategia,
          tableClientes,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Conexión verificada con éxito con tu base de Airtable.',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'No se pudo conectar con Airtable. Verifica tu Base ID y API Token.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Error de red: ${err.message}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#13151f] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#0e1017]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Conexión con Airtable
              </h3>
              <p className="text-xs text-zinc-400">
                Base "Vortexia Progress" — Leads, Estrategia y Clientes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Current Status Pill */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isConnected
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
          }`}>
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="font-semibold block text-sm">
                {isConnected
                  ? 'Airtable Conectado en Tiempo Real'
                  : 'Modo Demostración Activo'}
              </strong>
              <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                {isConnected
                  ? 'El dashboard está sincronizando datos con revalidación y caché de 60s desde tu base de Airtable.'
                  : 'Se están visualizando datos realistas de prueba para Vortexia con las 3 tablas (Leads, Estrategia y Clientes con sus 8 tramos de precios).'}
              </p>
            </div>
          </div>

          {/* Quick Demo Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-[#0e1017] rounded-xl border border-white/5">
            <div>
              <span className="text-white font-semibold block">Alternar Modo</span>
              <span className="text-zinc-400 text-[11px]">
                {isDemoData ? 'Actualmente usando datos demo de Vortexia' : 'Actualmente usando Airtable en vivo'}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onRefresh({ forceDemo: true })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isDemoData
                    ? 'bg-amber-500 text-black font-semibold'
                    : 'bg-white/5 text-zinc-300 hover:text-white'
                }`}
              >
                Modo Demo
              </button>
              <button
                onClick={() => onRefresh({ forceRefresh: true })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !isDemoData && isConnected
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-white/5 text-zinc-300 hover:text-white'
                }`}
              >
                Sincronizar Live
              </button>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="p-4 bg-[#0e1017] rounded-xl border border-white/5 space-y-3">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-400" />
              ¿Cómo conectar tu Base de Airtable en Producción / Vercel?
            </h4>
            <p className="text-zinc-400 leading-relaxed">
              Para desplegar en Vercel o en tu entorno de producción sin exponer tus credenciales, añade estas variables en tu archivo <code className="text-blue-400 bg-white/5 px-1 py-0.5 rounded font-mono">.env</code> o panel de Vercel:
            </p>

            <div className="bg-[#08090d] p-3 rounded-lg border border-white/10 font-mono text-[11px] text-zinc-300 space-y-1 overflow-x-auto">
              <div><span className="text-blue-400">AIRTABLE_API_KEY</span>="patxxxxxxxxxxxx"</div>
              <div><span className="text-blue-400">AIRTABLE_BASE_ID</span>="appxxxxxxxxxxxx"</div>
              <div><span className="text-zinc-500"># Opcional (por defecto se usan estos nombres):</span></div>
              <div><span className="text-blue-400">AIRTABLE_TABLE_LEADS</span>="Leads"</div>
              <div><span className="text-blue-400">AIRTABLE_TABLE_ESTRATEGIA</span>="Estrategia"</div>
              <div><span className="text-blue-400">AIRTABLE_TABLE_CLIENTES</span>="Clientes"</div>
            </div>

            <div className="space-y-1.5 text-[11px] text-zinc-400 pt-1">
              <p>• <strong>API Token (PAT):</strong> Créalo en <a href="https://airtable.com/create/tokens" target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-0.5">airtable.com/create/tokens <ExternalLink className="w-2.5 h-2.5" /></a> con alcance <code className="text-zinc-300">data.records:read</code>.</p>
              <p>• <strong>Base ID:</strong> Abre tu base en el navegador, la URL es <code className="text-zinc-300">airtable.com/appXXXXXXXX/...</code> (copia la parte <code className="text-zinc-300">app...</code>).</p>
            </div>
          </div>

          {/* Test Live Connection Test Form */}
          <div className="p-4 bg-[#0e1017] rounded-xl border border-white/5 space-y-3">
            <h4 className="text-white font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Probar Credenciales en Vivo
            </h4>

            <div className="space-y-2">
              <div>
                <label className="block text-zinc-400 text-[11px] mb-1">Airtable Personal Access Token (PAT):</label>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="pat.xxxxxxxxxxxxxxxxxxxxxxxx..."
                  className="w-full bg-[#13151f] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-600 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-400 text-[11px] mb-1">Base ID:</label>
                <input
                  type="text"
                  value={baseIdInput}
                  onChange={(e) => setBaseIdInput(e.target.value)}
                  placeholder="appxxxxxxxxxxxxxx"
                  className="w-full bg-[#13151f] border border-white/10 rounded-lg px-3 py-2 text-white placeholder-zinc-600 font-mono text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <label className="block text-zinc-500 text-[10px] mb-0.5">Tabla Leads:</label>
                  <input
                    type="text"
                    value={tableLeads}
                    onChange={(e) => setTableLeads(e.target.value)}
                    className="w-full bg-[#13151f] border border-white/10 rounded-md px-2 py-1.5 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[10px] mb-0.5">Tabla Estrategia:</label>
                  <input
                    type="text"
                    value={tableEstrategia}
                    onChange={(e) => setTableEstrategia(e.target.value)}
                    className="w-full bg-[#13151f] border border-white/10 rounded-md px-2 py-1.5 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-500 text-[10px] mb-0.5">Tabla Clientes:</label>
                  <input
                    type="text"
                    value={tableClientes}
                    onChange={(e) => setTableClientes(e.target.value)}
                    className="w-full bg-[#13151f] border border-white/10 rounded-md px-2 py-1.5 text-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-medium text-xs flex items-center gap-2 transition-all shadow-md shadow-blue-600/30"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Comprobando conexión...' : 'Testear Conexión'}
              </button>

              <span className="text-[11px] text-zinc-500">
                Respaldo con caché segura de 60s
              </span>
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0e1017] border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
