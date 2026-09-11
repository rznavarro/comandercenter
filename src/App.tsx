/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewView } from './components/OverviewView';
import { StrategyView } from './components/StrategyView';
import { LeadsView } from './components/LeadsView';
import { ClientsView } from './components/ClientsView';
import { AirtableConfigModal } from './components/AirtableConfigModal';
import { fetchProspectingData } from './services/airtableService';
import { calculateDashboardMetrics } from './utils/airtableParser';
import { LeadRecord, EstrategiaRecord, ClienteRecord, DashboardMetrics } from './types';
import { DEMO_LEADS, DEMO_ESTRATEGIA, DEMO_CLIENTES } from './data/demoData';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'overview' | 'strategy' | 'leads' | 'clients'>('overview');
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d' | 'all'>('30d');
  const [searchQuery, setSearchQuery] = useState('');
  const [leadsFilterStage, setLeadsFilterStage] = useState<string>('all');

  // Airtable data state
  const [leads, setLeads] = useState<LeadRecord[]>(DEMO_LEADS);
  const [estrategia, setEstrategia] = useState<EstrategiaRecord[]>(DEMO_ESTRATEGIA);
  const [clientes, setClientes] = useState<ClienteRecord[]>(DEMO_CLIENTES);
  const [isConnected, setIsConnected] = useState(false);
  const [isDemoData, setIsDemoData] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString());
  const [configModalOpen, setConfigModalOpen] = useState(false);

  // Load data function
  const loadData = useCallback(async (options?: { forceRefresh?: boolean; forceDemo?: boolean }) => {
    setIsSyncing(true);
    try {
      const response = await fetchProspectingData(options);
      setLeads(response.leads);
      setEstrategia(response.estrategia);
      setClientes(response.clientes);
      setIsConnected(response.connected);
      setIsDemoData(response.isDemoData);
      setLastUpdated(response.lastUpdated);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial load and periodic short revalidation (every 60s as specified in technical notes)
  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Compute live dashboard metrics
  const metrics: DashboardMetrics = useMemo(() => {
    return calculateDashboardMetrics(leads, estrategia, clientes);
  }, [leads, estrategia, clientes]);

  // Filter leads based on global search query if entered in header
  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase().trim();
    return leads.filter(
      (l) =>
        l.nombreCliente.toLowerCase().includes(q) ||
        l.whatsappNumero.includes(q) ||
        l.etapa.toLowerCase().includes(q) ||
        (l.notas && l.notas.toLowerCase().includes(q))
    );
  }, [leads, searchQuery]);

  // Handlers for cross-navigation
  const handleNavigateToLeads = (stageFilter?: string) => {
    if (stageFilter) {
      setLeadsFilterStage(stageFilter);
    } else {
      setLeadsFilterStage('all');
    }
    setCurrentTab('leads');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0d13] text-slate-100 antialiased">
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setLeadsFilterStage('all');
        }}
        onOpenConfig={() => setConfigModalOpen(true)}
        isConnected={isConnected}
        isDemoData={isDemoData}
        isSyncing={isSyncing}
        onRefresh={() => loadData({ forceRefresh: true })}
        leadsRequierenSeguimiento={metrics.leadsRequierenSeguimiento}
        clientsCount={clientes.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (q.trim() && currentTab !== 'leads') {
              setCurrentTab('leads');
            }
          }}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onRefresh={() => loadData({ forceRefresh: true })}
          isSyncing={isSyncing}
          onOpenConfig={() => setConfigModalOpen(true)}
          isConnected={isConnected}
          isDemoData={isDemoData}
          lastUpdated={lastUpdated}
          followUpCount={metrics.leadsRequierenSeguimiento}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          {currentTab === 'overview' && (
            <OverviewView
              metrics={metrics}
              leads={leads}
              clientes={clientes}
              onNavigateToLeads={handleNavigateToLeads}
              onNavigateToStrategy={() => setCurrentTab('strategy')}
              onNavigateToClients={() => setCurrentTab('clients')}
            />
          )}

          {currentTab === 'strategy' && (
            <StrategyView
              estrategia={estrategia}
              metrics={metrics}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          )}

          {currentTab === 'leads' && (
            <LeadsView
              leads={filteredLeads}
              initialStageFilter={leadsFilterStage}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsView
              clientes={clientes}
              metrics={metrics}
            />
          )}
        </main>
      </div>

      {/* Airtable configuration & diagnostic modal */}
      <AirtableConfigModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        isConnected={isConnected}
        isDemoData={isDemoData}
        onRefresh={(opts) => {
          loadData(opts);
          setConfigModalOpen(false);
        }}
      />
    </div>
  );
}
