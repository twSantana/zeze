import React, { useState, useEffect } from 'react';
import { 
  ChevronUp, ChevronDown, SlidersHorizontal, Plus, Moon, Sun, 
  Users, Building, Info 
} from 'lucide-react';
import PropertyCard from './PropertyCard';
import UserManagementTab from './UserManagementTab';
import { useAuth } from '../context/AuthContext';

export default function BottomSheet({
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
  const [isOpen, setIsOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { user, logout, isCorretor, isMaster } = useAuth();
  
  // Abas do Painel: 'properties' | 'team'
  const [activeTab, setActiveTab] = useState('properties');

  useEffect(() => {
    const updateMobile = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

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

  const formatPrice = (value) => {
    if (value === 3000000) return 'Qualquer valor';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 shadow-2xl z-[9999] transition-all duration-300 flex flex-col overflow-hidden ${
        isOpen ? 'h-[60vh]' : 'h-[64px]'
      } w-full`}
      style={{
        minHeight: '64px',
        maxHeight: isOpen ? '60vh' : '64px'
      }}
    >
      {/* Alça e Cabeçalho do Bottom Sheet */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="h-[64px] shrink-0 flex flex-col items-center justify-center cursor-pointer border-b border-slate-100 dark:border-slate-800 px-4 select-none"
      >
        {/* Barra de Arrastar */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mb-1"></div>
        
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOpen ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronUp size={18} className="text-slate-500" />}
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {activeTab === 'team' ? 'Gerenciamento de Equipe' : `${properties.length} ${properties.length === 1 ? 'imóvel filtrado' : 'imóveis filtrados'}`}
            </span>
          </div>

          {/* Controles de Ação Rápida */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {/* Dark Mode */}
            <button
              onClick={onThemeToggle}
              className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
              title="Alternar Tema"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>

            {/* Novo Imóvel */}
            {isCorretor && activeTab === 'properties' && (
              <button
                onClick={onAddClick}
                className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/40 transition"
              >
                <Plus size={14} />
              </button>
            )}
            
            {/* Toggle Filtros */}
            {activeTab === 'properties' && (
              <button
                onClick={() => {
                  setIsOpen(true);
                  setShowMobileFilters(!showMobileFilters);
                }}
                className={`p-2 rounded-xl border transition ${
                  showMobileFilters 
                    ? 'bg-emerald-500 text-white border-emerald-500' 
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-755'
                }`}
              >
                <SlidersHorizontal size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conteúdo Interno do Painel */}
      {isOpen && (
        <div className="flex-grow overflow-hidden flex flex-col text-slate-800 dark:text-slate-200">
          
          {/* Tabs de Controle Mobile */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/25 flex gap-2">
            <button
              onClick={() => { setActiveTab('properties'); setShowMobileFilters(false); }}
              className={`flex-grow py-2 text-[9px] font-extrabold uppercase rounded-xl transition flex items-center justify-center gap-1.5 border ${
                activeTab === 'properties'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-850 border-transparent'
              }`}
            >
              <Building size={11} />
              <span>Imóveis</span>
            </button>

            {isMaster && (
              <button
                onClick={() => { setActiveTab('team'); setShowMobileFilters(false); }}
                className={`flex-grow py-2 text-[9px] font-extrabold uppercase rounded-xl transition flex items-center justify-center gap-1.5 border ${
                  activeTab === 'team'
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-850 border-transparent'
                }`}
              >
                <Users size={11} />
                <span>Equipe</span>
              </button>
            )}
          </div>

          {/* Sessão de Filtros Mobile */}
          {activeTab === 'properties' && showMobileFilters && (
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto animate-fadeIn">
              
              {/* Pesquisa Livre de Texto */}
              <div className="col-span-2 flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Busca Livre</label>
                <input
                  type="text"
                  value={filters.buscaTextual}
                  onChange={(e) => onFilterChange('buscaTextual', e.target.value)}
                  placeholder="Pesquise por título, bairro..."
                  className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900"
                />
              </div>

              {/* Tipo */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Tipo</label>
                <select
                  value={filters.tipo}
                  onChange={(e) => onFilterChange('tipo', e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="Todos">Todos</option>
                  <option value="Apartamento">Apartamento</option>
              <option value="Casa">Casa</option>
                  <option value="Terreno">Terreno</option>
                </select>
              </div>

              {/* Cidade */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Cidade</label>
                <select
                  value={filters.cidade}
                  onChange={(e) => onFilterChange('cidade', e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  {citiesList.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Vagas */}
              <div className="flex flex-col gap-0.5">
                <label className="text-[9px] font-bold text-slate-500 uppercase">Vagas Mínimas</label>
                <select
                  value={filters.vagasMin}
                  onChange={(e) => onFilterChange('vagasMin', e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-350 focus:outline-none"
                >
                  <option value="Todos">Qualquer vaga</option>
                  <option value="0">Sem vaga</option>
                  <option value="1">1+ Vagas</option>
                  <option value="2">2+ Vagas</option>
                  <option value="3">3+ Vagas</option>
                </select>
              </div>

              {/* Área Mínima */}
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Área Mínima</label>
                  <span className="text-[10px] font-bold text-emerald-600">{filters.areaMin > 30 ? `${filters.areaMin}m²` : 'Sem mín.'}</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="400"
                  step="10"
                  value={filters.areaMin}
                  onChange={(e) => onFilterChange('areaMin', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer mt-2"
                />
              </div>

              {/* Preço Máximo */}
              <div className="col-span-2 flex flex-col gap-0.5">
                <div className="flex justify-between items-baseline">
                  <label className="text-[9px] font-bold text-slate-500 uppercase">Preço Máximo</label>
                  <span className="text-xs font-bold text-emerald-600">{formatPrice(filters.precoMax)}</span>
                </div>
                <input
                  type="range"
                  min="200000"
                  max="3000000"
                  step="50000"
                  value={filters.precoMax}
                  onChange={(e) => onFilterChange('precoMax', parseInt(e.target.value))}
                  className="w-full accent-emerald-500 h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Área de Listagem (Dinâmica por Aba) */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/30 dark:bg-slate-950/10">
            
            {/* ABA IMÓVEIS */}
            {activeTab === 'properties' && (
              <>
                {properties.map(property => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    isActive={hoveredPropertyId === property.id}
                    onMouseEnter={onHoverProperty}
                    onMouseLeave={onHoverProperty}
                    onClick={(prop) => {
                      onPropertyClick(prop);
                      setIsOpen(false); // Fecha para ver o mapa
                    }}
                    onEdit={onEditClick}
                    onDelete={onDeleteClick}
                    onContactClick={onContactClick}
                  />
                ))}

                {properties.length === 0 && (
                  <div className="text-center py-16 text-slate-400">
                    <Info size={30} className="mb-2 mx-auto stroke-1" />
                    <p className="text-xs">Nenhum imóvel encontrado.</p>
                  </div>
                )}
              </>
            )}

            {/* ABA EQUIPE */}
            {activeTab === 'team' && isMaster && (
              <UserManagementTab />
            )}

          </div>

          {/* Rodapé de Informações do Usuário no Mobile */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
            {user && (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-150 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs">
                    {user.nome.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[150px]">{user.nome}</p>
                    <span className="text-[8px] uppercase font-bold text-emerald-600 dark:text-emerald-400 leading-none">{user.role}</span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white text-xs font-bold transition"
                >
                  <span>Sair</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
