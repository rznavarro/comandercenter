import React from 'react';
import {
  X,
  Phone,
  Clock,
  Calendar,
  Send,
  AlertCircle,
  FileText,
  User,
  CheckCircle,
} from 'lucide-react';
import { LeadRecord } from '../types';
import { STAGE_CONFIG } from '../utils/airtableParser';

interface LeadDetailModalProps {
  lead: LeadRecord | null;
  onClose: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose }) => {
  if (!lead) return null;

  const stageConfig = STAGE_CONFIG[lead.etapa] || STAGE_CONFIG.contactado;
  const cleanPhone = lead.whatsappNumero.replace(/[^0-9]/g, '');
  const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#13151f] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {lead.nombreCliente}
              </h3>
              <span className="text-xs text-zinc-400">Detalle de Prospección</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Stage Status */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0e1017] border border-white/5">
            <span className="text-zinc-400 font-medium">Etapa Actual</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${stageConfig.bg} ${stageConfig.text} border ${stageConfig.border}`}>
              {stageConfig.label}
            </span>
          </div>

          {/* Follow-up alert if needed */}
          {lead.requiereReenganche && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Regla de Reenganche Vortexia (3 Días)</strong>
                <p className="text-[11px] text-rose-200/80 mt-0.5">
                  Han transcurrido {lead.diasSinSeguimiento} días desde el último contacto sin respuesta. Es prioritario enviar un mensaje de seguimiento breve.
                </p>
              </div>
            </div>
          )}

          {/* Contact and timing details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-[#0e1017] border border-white/5 space-y-1">
              <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
                <Phone className="w-3.5 h-3.5 text-blue-400" /> WhatsApp
              </span>
              <span className="text-white font-mono text-sm block">
                {lead.whatsappNumero || 'No registrado'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0e1017] border border-white/5 space-y-1">
              <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> Hora de envío
              </span>
              <span className="text-white font-mono text-sm block">
                {lead.horaEnvio || '--:--'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0e1017] border border-white/5 space-y-1">
              <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-400" /> Fecha original
              </span>
              <span className="text-white font-medium block">
                {lead.rawDia || lead.dia || 'No especificada'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#0e1017] border border-white/5 space-y-1">
              <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Formato normalizado
              </span>
              <span className="text-white font-mono block">
                {lead.dia || 'YYYY-MM-DD'}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="p-3.5 rounded-xl bg-[#0e1017] border border-white/5 space-y-1.5">
            <span className="text-zinc-500 flex items-center gap-1.5 font-medium">
              <FileText className="w-3.5 h-3.5 text-amber-400" /> Notas de contexto
            </span>
            <p className="text-zinc-300 leading-relaxed text-xs">
              {lead.notas || 'Sin notas registradas para este prospecto.'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#0e1017] border-t border-white/10 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cerrar
          </button>
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Abrir en WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
