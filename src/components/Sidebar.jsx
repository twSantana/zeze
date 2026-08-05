import React, { useState, useEffect } from 'react';
import { 
  Search, SlidersHorizontal, Plus, LogOut, Moon, Sun, 
  MessageSquare, Users, Building, MapPin, Phone, Trash2, Mail, Info 
} from 'lucide-react';
import PropertyCard from './PropertyCard';
import UserManagementTab from './UserManagementTab';
import { useAuth } from '../context/AuthContext';
import { getLeads, deleteLead } from '../services/leadService';

export default function Sidebar({
  properties,
  filters,
  onFilterChange,
  onHoverProperty,
  hoveredPropertyId,
  onPropertyClick,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onContactClick,
  theme,
  onThemeToggle
}) {
  const { user, logout, isCorretor, isGerente, isMaster } = useAuth();
  
  // Abas do Painel: 'properties' (Imóveis), 'leads' (Mensagens), 'team' (Equipe)
  const [activeTab, setActiveTab] = useState('properties');
  
  // Estado local para Leads
  const [leadsList, setLeadsList] = useState([]);

  // Carrega leads caso a aba de leads seja ativada ou no montamento
  const loadLeads = () => {
    setLeadsList(getLeads());
  };

  useEffect(() => {
    loadLeads();
  }, [activeTab]);

  const handleDeleteLead = (id) => {
    if (window.confirm('Excluir este lead de contato permanente?')) {
      deleteLead(id);
      loadLeads();
    }
  };

  // Formata preço em Reais
  const formatPrice = (value) => {
    if (value === 3000000) return 'Qualquer valor';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const citiesList = [
    'Todas',
    'Curitiba',
    'São José dos Pinhais',
    'Pinhais',
    'Colombo',
    'Araucária',
    'Campo Largo',
    'Fazenda Rio Grande'
  ];

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-sm z-20 transition-colors duration-300">
      
      {/* Header com Logo, Perfil e Dark Mode Toggle */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 shrink-0">
            <Building size={20} />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-sm tracking-wide uppercase leading-none text-emerald-400">RMC Mapeamento</h1>
            <span className="text-[10px] text-slate-400 font-medium">Painel do Consultor</span>
          </div>
        </div>

        {/* Controles de Perfil e Tema */}
        <div className="flex items-center gap-2">
          {/* Botão Sol/Lua */}
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
            title="Alternar Tema"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* Dados do Perfil */}
          {user && (
            <div className="flex items-center gap-2">
              <div className="text-right hidden xl:block">
                <p className="text-xs font-semibold text-slate-100 truncate max-w-[100px]">{user.nome}</p>
                <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-bold tracking-wider">
                  {user.role}
                </span>
              </div>
              <button 
                onClick={logout}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-750 transition"
                title="Desconectar"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs de Controle */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 shrink-0 flex gap-2">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-grow py-2 text-[10px] font-bold uppercase rounded-xl transition flex items-center justify-center gap-1.5 border ${
            activeTab === 'properties'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 border-transparent'
          }`}
        >
          <Building size={12} />
          <span>Imóveis</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`flex-grow py-2 text-[10px] font-bold uppercase rounded-xl transition flex items-center justify-center gap-1.5 border ${
            activeTab === 'leads'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 border-transparent'
          }`}
        >
          <MessageSquare size={12} />
          <span>Leads ({leadsList.length})</span>
        </button>

        {isMaster && (
          <button
            onClick={() => setActiveTab('team')}
            className={`flex-grow py-2 text-[10px] font-bold uppercase rounded-xl transition flex items-center justify-center gap-1.5 border ${
              activeTab === 'team'
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Users size={12} />
            <span>Equipe</span>
          </button>
        )}
      </div>

      {/* Exibição da Aba de Imóveis (Properties) */}
      {activeTab === 'properties' && (
        <>
          {/* Painel de Filtros Avançados */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 shrink-0">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider mb-3">
              <SlidersHorizontal size={14} className="text-emerald-500" />
              <span>Busca e Filtros</span>
            </div>

            {/* Barra de Pesquisa Textual Completa */}
            <div className="relative mb-3.5">
              <input
                type="text"
                value={filters.buscaTextual}
                onChange={(e) => onFilterChange('buscaTextual', e.target.value)}
                placeholder="Pesquisar por título, bairro, cidade..."
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium transition"
              />
              <Search size={14} className="absolute left-3 top-3.5 text-slate-400 dark:text-slate-600" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Tipo de Imóvel */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tipo</label>
                <select
                  value={filters.tipo}
                  onChange={(e) => onFilterChange('tipo', e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="Todos">Todos os tipos</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Sobrado">Sobrado</option>
                  <option value="Terreno">Terreno</option>
                </select>
              </div>

              {/* Cidade */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Cidade / Região</label>
                <select
                  value={filters.cidade}
                  onChange={(e) => onFilterChange('cidade', e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  {citiesList.map(city => (
                    <option key={city} value={city}>
                      {city === 'Todas' ? 'Todas as cidades' : city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Vagas e Área Mínima em Grade */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              {/* Vagas */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Vagas Garagem</label>
                <select
                  value={filters.vagasMin}
                  onChange={(e) => onFilterChange('vagasMin', e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="Todos">Qualquer vaga</option>
                  <option value="0">Sem vaga</option>
                  <option value="1">1+ Vagas</option>
                  <option value="2">2+ Vagas</option>
                  <option value="3">3+ Vagas</option>
                </select>
              </div>

              {/* Área Mínima Slider */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Área Mínima</label>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450">
                    {filters.areaMin > 30 ? `${filters.areaMin} m²` : 'Sem área mín.'}
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="400"
                  step="10"
                  value={filters.areaMin}
                  onChange={(e) => onFilterChange('areaMin', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2.5"
                />
              </div>
            </div>

            {/* Preço Máximo */}
            <div className="mt-3.5 flex flex-col gap-1">
              <div className="flex justify-between items-baseline">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Preço Máximo</label>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450">{formatPrice(filters.precoMax)}</span>
              </div>
              <input
                type="range"
                min="200000"
                max="3000000"
                step="50000"
                value={filters.precoMax}
                onChange={(e) => onFilterChange('precoMax', parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer mt-1"
              />
            </div>

            {/* Quartos Mínimos */}
            <div className="mt-3.5 flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Dormitórios</label>
              <div className="grid grid-cols-5 gap-1 bg-slate-100 dark:bg-slate-950 p-0.5 rounded-xl border border-transparent dark:border-slate-850">
                {['Todos', '1+', '2+', '3+', '4+'].map((opt) => {
                  const value = opt === 'Todos' ? 'Todos' : parseInt(opt);
                  const isSelected = filters.quartos === value;
                  return (
                    <button
                      key={opt}
                      onClick={() => onFilterChange('quartos', value)}
                      className={`py-1 text-xs font-bold rounded-lg transition-all ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Resultados e Botão Novo Imóvel */}
          <div className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {properties.length} {properties.length === 1 ? 'imóvel filtrado' : 'imóveis filtrados'}
              </span>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Na viewport atual do mapa</p>
            </div>

            {isCorretor && (
              <button
                onClick={onAddClick}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 text-xs font-bold transition shadow-sm"
              >
                <Plus size={14} />
                <span>Novo Imóvel</span>
              </button>
            )}
          </div>

          {/* Listagem */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/10">
            {properties.length > 0 ? (
              properties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  isActive={hoveredPropertyId === property.id}
                  onMouseEnter={onHoverProperty}
                  onMouseLeave={onHoverProperty}
                  onClick={onPropertyClick}
                  onEdit={onEditClick}
                  onDelete={onDeleteClick}
                  onContactClick={onContactClick}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                <Info size={36} className="stroke-1 mb-2 text-slate-350 dark:text-slate-650" />
                <p className="text-xs font-semibold text-slate-500">Nenhum imóvel nesta região</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                  Tente arrastar o mapa ou flexibilizar os filtros de busca.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Aba de Leads / Contatos */}
      {activeTab === 'leads' && (
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/10 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-emerald-500" />
            <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Histórico de Contatos</span>
          </div>

          {leadsList.length > 0 ? (
            leadsList.map(lead => (
              <div 
                key={lead.id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 shadow-sm flex flex-col gap-2.5 transition animate-fadeIn"
              >
                <div className="flex items-start justify-between gap-2 border-b border-slate-50 dark:border-slate-900 pb-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-50">{lead.clientName}</h4>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                      {new Date(lead.criado_em).toLocaleDateString('pt-BR')} às {new Date(lead.criado_em).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteLead(lead.id)}
                    className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-400 hover:text-red-500 transition"
                    title="Excluir Contato"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Mail size={10} className="text-slate-400" />
                    <span>{lead.clientEmail}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone size={10} className="text-slate-400" />
                    <span>{lead.clientPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg border border-transparent dark:border-slate-850">
                    <Building size={10} className="text-emerald-500 shrink-0" />
                    <span className="font-bold text-slate-700 dark:text-slate-350 line-clamp-1">{lead.propertyTitle}</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-750 dark:text-slate-300 italic bg-slate-50/50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850 leading-relaxed font-medium">
                  "{lead.clientMessage}"
                </p>

                {/* Botão do WhatsApp Direto */}
                <a
                  href={`https://wa.me/55${lead.clientPhone}?text=${encodeURIComponent(
                    `Olá ${lead.clientName}, sou o corretor ${user?.nome || 'Consultor'} da imobiliária. Recebi seu interesse no imóvel "${lead.propertyTitle}". Como posso te ajudar hoje?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-450 text-slate-950 text-[10px] font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Phone size={12} />
                  <span>Chamar no WhatsApp</span>
                </a>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
              <MessageSquare size={36} className="stroke-1 mb-2 text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-semibold text-slate-500">Nenhuma mensagem recebida</p>
              <p className="text-[10px] text-slate-450 mt-0.5">leads de clientes aparecerão aqui.</p>
            </div>
          )}
        </div>
      )}

      {/* Aba de Controle da Equipe (Apenas Admin/Master) */}
      {activeTab === 'team' && isMaster && (
        <div className="flex-grow overflow-y-auto p-4 bg-slate-50/10 dark:bg-slate-950/10 flex flex-col">
          <UserManagementTab />
        </div>
      )}

    </div>
  );
}
