import React, { useState, useEffect } from 'react';
import { 
  Search, SlidersHorizontal, Plus, LogOut, Moon, Sun, 
  Users, Building, MapPin, Phone, Trash2, Mail, Info,
  User, Camera, Check
} from 'lucide-react';
import { uploadAvatar } from '../services/propertyService';
import PropertyCard from './PropertyCard';
import UserManagementTab from './UserManagementTab';
import { useAuth } from '../context/AuthContext';

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
  const { user, logout, isCorretor, isGerente, isMaster, updateProfile } = useAuth();
  
  // Abas do Panel: 'properties' (Imóveis), 'team' (Equipe) ou 'profile' (Meu Perfil)
  const [activeTab, setActiveTab] = useState('properties');

  // Estados para edição do próprio perfil
  const [editingPhone, setEditingPhone] = useState(user?.telefone || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setEditingPhone(user.telefone || '');
    }
  }, [user]);

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
    <div className="w-full h-full min-h-0 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shadow-sm z-20 transition-colors duration-300">
      
      {/* Header com Logo, Perfil e Dark Mode Toggle */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-500 text-slate-950 shrink-0">
            <Building size={20} />
          </div>
          <div>
            <h1 className="font-sans font-extrabold text-sm tracking-wide uppercase leading-none text-emerald-400">Mapa Zelony</h1>
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
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
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

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-grow py-2 text-[10px] font-bold uppercase rounded-xl transition flex items-center justify-center gap-1.5 border ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 border-transparent'
          }`}
        >
          <User size={12} />
          <span>Perfil</span>
        </button>
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
                  className="w-full text-xs bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-400 focus:outline-none"
                >
                  <option value="Todos">Todos os tipos</option>
                  <option value="Apartamento">Apartamento</option>
                  <option value="Casa">Casa</option>
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
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-400 focus:outline-none"
                >
                  {citiesList.map(city => (
                    <option key={city} value={city}>
                      {city === 'Todas' ? 'Todas as cidades' : city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Novo Filtro: Programa / Faixa de Financiamento */}
            <div className="flex flex-col gap-1 mt-3">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Faixa de Financiamento / Programa</label>
              <select
                value={filters.faixa || 'Todos'}
                onChange={(e) => onFilterChange('faixa', e.target.value)}
                className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-slate-705 dark:text-slate-400 focus:outline-none font-medium"
              >
                <option value="Todos">Todos os programas / faixas</option>
                <option value="Faixa 2">Faixa 2 (Renda até 5k / Imóvel até 275k)</option>
                <option value="Faixa 3">Faixa 3 (Renda até 9k / Imóvel até 400k)</option>
                <option value="Faixa 4">Faixa 4 (Renda até 13k / Imóvel até 600k)</option>
                <option value="SBPE">SBPE (Imóvel acima de 600k)</option>
              </select>
            </div>

            {/* Vagas e Área Mínima em Grade */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              {/* Vagas */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Vagas Garagem</label>
                <select
                  value={filters.vagasMin}
                  onChange={(e) => onFilterChange('vagasMin', e.target.value)}
                  className="w-full text-xs bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-2 text-slate-700 dark:text-slate-400 focus:outline-none"
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
              <div className="grid grid-cols-5 gap-1 bg-slate-105 dark:bg-slate-950 p-0.5 rounded-xl border border-transparent dark:border-slate-800">
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

            {/* Filtro: Apenas Destaques */}
            <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 pt-3">
              <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase tracking-wide cursor-pointer select-none flex items-center gap-1.5" htmlFor="apenas-destaques-cb">
                <span className="text-amber-500 text-xs">⭐</span>
                <span>Apenas Destaques / Prioridades</span>
              </label>
              <input
                id="apenas-destaques-cb"
                type="checkbox"
                checked={filters.apenasDestaques || false}
                onChange={(e) => onFilterChange('apenasDestaques', e.target.checked)}
                className="w-4 h-4 rounded border-slate-200 dark:border-slate-800 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
              />
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
                <Info size={36} className="stroke-1 mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-xs font-semibold text-slate-500">Nenhum imóvel nesta região</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">
                  Tente arrastar o mapa ou flexibilizar os filtros de busca.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Aba de Controle da Equipe (Apenas Admin/Master) */}
      {activeTab === 'team' && isMaster && (
        <div className="flex-grow overflow-y-auto p-4 bg-slate-50/10 dark:bg-slate-950/10 flex flex-col">
          <UserManagementTab />
        </div>
      )}

      {/* Aba de Controle de Perfil (Disponível para todos logados) */}
      {activeTab === 'profile' && user && (
        <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-4 bg-white dark:bg-slate-900 animate-fadeIn">
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            {/* Foto de Perfil / Avatar */}
            <div className="relative group/avatar">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500/30 bg-slate-150 dark:bg-slate-800 flex items-center justify-center relative shadow-lg">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.nome} className="w-full h-full object-cover" />
                ) : (
                  <User size={40} className="text-slate-400 dark:text-slate-500" />
                )}

                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-slate-950/75 flex items-center justify-center text-[10px] text-white font-bold">
                    Carregando...
                  </div>
                )}
              </div>

              {/* Botão de Upload */}
              <label className="absolute bottom-0 right-0 p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full cursor-pointer shadow-md transition border border-white/20">
                <Camera size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploadingAvatar(true);
                      setProfileErrorMsg('');
                      const url = await uploadAvatar(file, user.id);
                      if (url) {
                        await updateProfile(user.id, { avatar_url: url });
                        setProfileSuccessMsg('Foto de perfil atualizada com sucesso!');
                        setTimeout(() => setProfileSuccessMsg(''), 3000);
                      }
                    } catch (err) {
                      setProfileErrorMsg('Erro ao enviar foto.');
                    } finally {
                      setUploadingAvatar(false);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="text-center">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">{user.nome}</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5">{user.email}</p>
              <span className="inline-block mt-1 text-[8px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wide border border-emerald-500/30">
                {user.role}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-wider">Configurar WhatsApp</span>
            
            {profileSuccessMsg && (
              <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
                {profileSuccessMsg}
              </div>
            )}
            {profileErrorMsg && (
              <div className="p-3 text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold border border-red-100 dark:border-red-900/40 rounded-xl">
                {profileErrorMsg}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Seu Número de WhatsApp (Com DDD)</label>
              <input
                type="text"
                value={editingPhone}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '');
                  setEditingPhone(raw);
                }}
                placeholder="Ex: 41999998888"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
              <p className="text-[9px] text-slate-400 dark:text-slate-500 leading-normal">
                Insira apenas números (ex: 41999998888). Este número será usado para os botões "Falar com Consultor" nos seus imóveis.
              </p>
            </div>

            <button
              onClick={async () => {
                if (!editingPhone || editingPhone.length < 10) {
                  setProfileErrorMsg('Insira um número de WhatsApp válido.');
                  return;
                }
                try {
                  setProfileErrorMsg('');
                  setProfileSuccessMsg('');
                  await updateProfile(user.id, { 
                    telefone: editingPhone,
                    whatsapp_configured: true
                  });
                  setProfileSuccessMsg('Dados do perfil salvos com sucesso!');
                  setTimeout(() => setProfileSuccessMsg(''), 4000);
                } catch (err) {
                  setProfileErrorMsg('Erro ao atualizar perfil.');
                }
              }}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 transition"
            >
              <Check size={14} />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
