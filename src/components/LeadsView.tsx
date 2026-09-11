import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Phone,
  Send,
  Calendar,
  Clock,
  AlertTriangle,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  Eye,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { LeadRecord, LeadStage } from '../types';
import { STAGE_CONFIG } from '../utils/airtableParser';
import { LeadDetailModal } from './LeadDetailModal';

interface LeadsViewProps {
  leads: LeadRecord[];
  initialStageFilter?: string;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  initialStageFilter = 'all',
}) => {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>(initialStageFilter);
  const [onlyFollowUpNeeded, setOnlyFollowUpNeeded] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'stage'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);

  // Stage summary counts for the top cards (matching screen 2 of reference design)
  const stageStats = useMemo(() => {
    const counts = {
      contactado: 0,
      'respuesta positiva': 0,
      'demo enviada': 0,
      venta: 0,
      'respuesta negativa': 0,
    };
    leads.forEach((l) => {
      if (counts[l.etapa as keyof typeof counts] !== undefined) {
        counts[l.etapa as keyof typeof counts]++;
      }
    });
    return counts;
  }, [leads]);

  // Urgent follow-up count
  const followUpCount = useMemo(() => {
    return leads.filter((l) => l.requiereReenganche).length;
  }, [leads]);

  // Filtered and sorted leads
  const filteredLeads = useMemo(() => {
    return leads
      .filter((lead) => {
        // Text search
        const q = search.toLowerCase().trim();
        const matchesSearch =
          !q ||
          lead.nombreCliente.toLowerCase().includes(q) ||
          lead.whatsappNumero.includes(q) ||
          lead.etapa.toLowerCase().includes(q) ||
          (lead.notas && lead.notas.toLowerCase().includes(q));

        // Stage filter
        const matchesStage =
          stageFilter === 'all' ||
          lead.etapa === stageFilter ||
          (stageFilter === 'reenganche' && lead.requiereReenganche);

        // Follow-up toggle
        const matchesFollowUp = !onlyFollowUpNeeded || lead.requiereReenganche;

        return matchesSearch && matchesStage && matchesFollowUp;
      })
      .sort((a, b) => {
        if (sortBy === 'date') {
          const comparison = (a.dia || '').localeCompare(b.dia || '');
          return sortOrder === 'asc' ? comparison : -comparison;
        }
        if (sortBy === 'name') {
          const comparison = a.nombreCliente.localeCompare(b.nombreCliente);
          return sortOrder === 'asc' ? comparison : -comparison;
        }
        if (sortBy === 'stage') {
          const comparison = a.etapa.localeCompare(b.etapa);
          return sortOrder === 'asc' ? comparison : -comparison;
        }
        return 0;
      });
  }, [leads, search, stageFilter, onlyFollowUpNeeded, sortBy, sortOrder]);

  const toggleSort = (column: 'date' | 'name' | 'stage') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            Gestión de Leads & Pipeline
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Revisa cada prospecto, su última interacción y aplica la regla de reenganche a los 3 días.
          </p>
        </div>

        {/* Quick Follow-up Alert Toggle */}
        <button
          onClick={() => {
            setOnlyFollowUpNeeded(!onlyFollowUpNeeded);
            if (!onlyFollowUpNeeded) setStageFilter('all');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
            onlyFollowUpNeeded
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-lg shadow-rose-500/10'
              : 'bg-[#13151f] text-zinc-300 border-white/5 hover:bg-white/5'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${onlyFollowUpNeeded ? 'text-rose-400' : 'text-amber-400'}`} />
          <span>Filtro Reenganche ({followUpCount})</span>
        </button>
      </div>

      {/* Top 4 Stage Stat Cards (Inspired by the second screen in the reference image) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Contactados */}
        <div
          onClick={() => {
            setStageFilter(stageFilter === 'contactado' ? 'all' : 'contactado');
            setOnlyFollowUpNeeded(false);
          }}
          className={`p-4 rounded-2xl cursor-pointer border transition-all relative overflow-hidden group ${
            stageFilter === 'contactado'
              ? 'bg-[#161a28] border-blue-500 ring-1 ring-blue-500/30'
              : 'bg-[#13151f] border-white/5 hover:bg-[#171a27]'
          }`}
        >
          <div className="h-1.5 w-full bg-blue-500 absolute top-0 left-0" />
          <span className="text-xs font-medium text-zinc-400 block mb-1">
            Contactados
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stageStats.contactado}
            </span>
            <span className="text-[11px] font-semibold text-blue-400">
              etapa 1
            </span>
          </div>
        </div>

        {/* Respuestas Positivas */}
        <div
          onClick={() => {
            setStageFilter(stageFilter === 'respuesta positiva' ? 'all' : 'respuesta positiva');
            setOnlyFollowUpNeeded(false);
          }}
          className={`p-4 rounded-2xl cursor-pointer border transition-all relative overflow-hidden group ${
            stageFilter === 'respuesta positiva'
              ? 'bg-[#12201b] border-emerald-500 ring-1 ring-emerald-500/30'
              : 'bg-[#13151f] border-white/5 hover:bg-[#161f1c]'
          }`}
        >
          <div className="h-1.5 w-full bg-emerald-500 absolute top-0 left-0" />
          <span className="text-xs font-medium text-zinc-400 block mb-1">
            Respuestas Positivas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-400 tracking-tight">
              {stageStats['respuesta positiva']}
            </span>
            <span className="text-[11px] font-semibold text-emerald-400">
              interés alto
            </span>
          </div>
        </div>

        {/* Demos Enviadas */}
        <div
          onClick={() => {
            setStageFilter(stageFilter === 'demo enviada' ? 'all' : 'demo enviada');
            setOnlyFollowUpNeeded(false);
          }}
          className={`p-4 rounded-2xl cursor-pointer border transition-all relative overflow-hidden group ${
            stageFilter === 'demo enviada'
              ? 'bg-[#101e28] border-sky-500 ring-1 ring-sky-500/30'
              : 'bg-[#13151f] border-white/5 hover:bg-[#15212b]'
          }`}
        >
          <div className="h-1.5 w-full bg-sky-500 absolute top-0 left-0" />
          <span className="text-xs font-medium text-zinc-400 block mb-1">
            Demos Enviadas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-sky-400 tracking-tight">
              {stageStats['demo enviada']}
            </span>
            <span className="text-[11px] font-semibold text-sky-400">
              en evaluación
            </span>
          </div>
        </div>

        {/* Ventas Cerradas */}
        <div
          onClick={() => {
            setStageFilter(stageFilter === 'venta' ? 'all' : 'venta');
            setOnlyFollowUpNeeded(false);
          }}
          className={`p-4 rounded-2xl cursor-pointer border transition-all relative overflow-hidden group ${
            stageFilter === 'venta'
              ? 'bg-[#221b10] border-amber-500 ring-1 ring-amber-500/30'
              : 'bg-[#13151f] border-white/5 hover:bg-[#201a13]'
          }`}
        >
          <div className="h-1.5 w-full bg-amber-500 absolute top-0 left-0" />
          <span className="text-xs font-medium text-zinc-400 block mb-1">
            Ventas Cerradas
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-300 tracking-tight">
              {stageStats.venta}
            </span>
            <span className="text-[11px] font-semibold text-amber-400">
              pagados
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#13151f] border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nombre de cliente, whatsapp o notas..."
            className="w-full bg-[#0b0d13] border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Stage filter dropdown */}
          <div className="relative">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="appearance-none bg-[#0b0d13] border border-white/5 rounded-xl px-3.5 py-2 pr-8 text-xs font-medium text-zinc-300 cursor-pointer focus:outline-none focus:border-blue-500"
            >
              <option value="all">Todas las etapas ({leads.length})</option>
              <option value="contactado">Contactado</option>
              <option value="respuesta positiva">Respuesta positiva</option>
              <option value="demo enviada">Demo enviada</option>
              <option value="venta">Venta</option>
              <option value="respuesta negativa">Respuesta negativa</option>
              <option value="reenganche">Requiere reenganche (&gt;3 días)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Clear filters button */}
          {(search || stageFilter !== 'all' || onlyFollowUpNeeded) && (
            <button
              onClick={() => {
                setSearch('');
                setStageFilter('all');
                setOnlyFollowUpNeeded(false);
              }}
              className="px-3 py-2 text-xs text-zinc-400 hover:text-white rounded-xl bg-white/5 transition-colors shrink-0"
            >
              Limpiar filtros
            </button>
          )}

          <div className="text-xs text-zinc-500 shrink-0 px-1 font-mono">
            {filteredLeads.length} leads
          </div>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="bg-[#13151f] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-[#0e1017] text-zinc-400 font-medium">
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nombre Cliente</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4">WhatsApp</th>
                <th
                  onClick={() => toggleSort('stage')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Etapa</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Hora Envío</th>
                <th
                  onClick={() => toggleSort('date')}
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Fecha / Antigüedad</span>
                    <ArrowUpDown className="w-3 h-3 text-zinc-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    No se encontraron leads con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const stageConfig = STAGE_CONFIG[lead.etapa] || STAGE_CONFIG.contactado;
                  const cleanPhone = lead.whatsappNumero.replace(/[^0-9]/g, '');
                  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '';

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Name + Reenganche badge */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="font-semibold text-white hover:text-blue-400 text-left transition-colors"
                          >
                            {lead.nombreCliente}
                          </button>
                          {lead.requiereReenganche && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              title={`Sin interacción hace ${lead.diasSinSeguimiento} días`}
                            >
                              Reenganche ({lead.diasSinSeguimiento}d)
                            </span>
                          )}
                        </div>
                        {lead.notas && (
                          <p className="text-[11px] text-zinc-500 truncate max-w-xs mt-0.5">
                            {lead.notas}
                          </p>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-zinc-300">
                        {lead.whatsappNumero || (
                          <span className="text-zinc-600 italic">Sin número</span>
                        )}
                      </td>

                      {/* Stage Tag */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${stageConfig.bg} ${stageConfig.text} ${stageConfig.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${stageConfig.dot}`} />
                          {stageConfig.label}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-4 text-zinc-400 font-mono">
                        {lead.horaEnvio || '--:--'}
                      </td>

                      {/* Date & Days elapsed */}
                      <td className="py-3.5 px-4">
                        <div className="text-zinc-300 font-medium">
                          {lead.rawDia || lead.dia}
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          hace {lead.diasSinSeguimiento} días
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            title="Ver detalles del lead"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              title="Abrir chat en WhatsApp"
                              className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal detail */}
      <LeadDetailModal lead={selectedLead} onClose={() => setSelectedLead(null)} />
    </div>
  );
};
