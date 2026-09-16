import React, { useState, useEffect } from 'react';
import { 
  Search, SlidersHorizontal, Plus, LogOut, Moon, Sun, 
  Users, Building, MapPin, Phone, Trash2, Mail, Info,
  User, Camera, Check, Briefcase, Sparkles, Filter, ChevronDown
} from 'lucide-react';
import { uploadAvatar } from '../services/propertyService';
import PropertyCard from './PropertyCard';
import UserManagementTab from './UserManagementTab';
import ConstrutorasTab from './ConstrutorasTab';
import MyPropertiesTab from './MyPropertiesTab';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { useToast } from './ui/Toast';

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
  onThemeToggle,
  onPropertyUpdate
}) {
  const { user, logout, isCorretor, isGerente, isMaster, updateProfile } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('properties');
  const [editingPhone, setEditingPhone] = useState(user?.telefone || '');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setEditingPhone(user.telefone || '');
    }
  }, [user]);

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
    <div className="w-full h-full min-h-0 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-xl z-20 transition-colors duration-300">
      
      {/* Header com Logo, Perfil e Dark Mode Toggle */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-950 text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-slate-950 shrink-0 shadow-lg shadow-emerald-500/20">
            <Building className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              Sell<span className="text-emerald-400 font-bold text-xs uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">Maps</span>
            </h1>
            <span className="text-[11px] text-slate-400 font-medium">Curitiba & Região Metropolitana</span>
          </div>
        </div>

        {/* Controles de Perfil e Tema */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors border border-slate-800"
            title="Alternar Tema"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user && (
            <button 
              onClick={logout}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-rose-400 hover:bg-slate-800 transition-colors border border-slate-800"
              title="Desconectar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs de Controle Superior */}
      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 shrink-0 flex items-center gap-1 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('properties')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border whitespace-nowrap ${
            activeTab === 'properties'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Imóveis</span>
        </button>

        <button
          onClick={() => setActiveTab('my-properties')}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border whitespace-nowrap ${
            activeTab === 'my-properties'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Meus Imóveis</span>
        </button>

        {isMaster && (
          <>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border whitespace-nowrap ${
                activeTab === 'team'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Equipe</span>
            </button>

            <button
              onClick={() => setActiveTab('construtoras')}
              className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border whitespace-nowrap ${
                activeTab === 'construtoras'
                  ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-400 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Parceiros</span>
            </button>
          </>
        )}

        <button
          onClick={() => setActiveTab('profile')}
          className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border shrink-0 ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-400 shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border-transparent'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Perfil</span>
        </button>
      </div>

      {/* Conteúdo Principal da Aba Imóveis */}
      {activeTab === 'properties' && (
        <div className="flex-1 overflow-y-auto flex flex-col">
          
          {/* Painel de Filtros Avançados */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/20 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
                <Filter className="w-4 h-4 text-emerald-500" />
                <span>Busca & Filtros</span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {properties.length} encontrados
              </span>
            </div>

            {/* Barra de Pesquisa */}
            <Input
              icon={Search}
              placeholder="Buscar título, bairro ou cidade..."
              value={filters.buscaTextual}
              onChange={(e) => onFilterChange('buscaTextual', e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2.5">
              <Select
                label="Tipo"
                value={filters.tipo}
                onChange={(e) => onFilterChange('tipo', e.target.value)}
              >
                <option value="Todos">Todos os tipos</option>
                <option value="Apartamento">Apartamento</option>
                <option value="Casa">Casa</option>
                <option value="Sobrado">Sobrado</option>
                <option value="Terreno">Terreno</option>
              </Select>

              <Select
                label="Cidade"
                value={filters.cidade}
                onChange={(e) => onFilterChange('cidade', e.target.value)}
              >
                {citiesList.map(city => (
                  <option key={city} value={city}>
                    {city === 'Todas' ? 'Todas as cidades' : city}
                  </option>
                ))}
              </Select>
            </div>

            <Select
              label="Faixa de Financiamento"
              value={filters.faixa || 'Todos'}
              onChange={(e) => onFilterChange('faixa', e.target.value)}
            >
              <option value="Todos">Todas as faixas</option>
              <option value="Faixa 2">Faixa 2 (Renda até 5k / até 275k)</option>
              <option value="Faixa 3">Faixa 3 (Renda até 9k / até 400k)</option>
              <option value="Faixa 4">Faixa 4 (Renda até 13k / até 600k)</option>
              <option value="SBPE">SBPE (Acima de 600k)</option>
            </Select>

            {/* Preço Máximo */}
            <div className="flex flex-col gap-1 pt-1">
              <div className="flex justify-between items-baseline">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Preço Máximo</label>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(filters.precoMax)}</span>
              </div>
              <input
                type="range"
                min="200000"
                max="3000000"
                step="50000"
                value={filters.precoMax}
                onChange={(e) => onFilterChange('precoMax', parseInt(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Filtro de Destaques */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <label htmlFor="apenas-destaques-cb" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none flex items-center gap-1.5">
                <span className="text-amber-500">⭐</span>
                <span>Apenas Destaques</span>
              </label>
              <input
                id="apenas-destaques-cb"
                type="checkbox"
                checked={filters.apenasDestaques || false}
                onChange={(e) => onFilterChange('apenasDestaques', e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Cabeçalho de Resultados e Ação Novo Imóvel */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Imóveis no Mapa ({properties.length})
              </span>
            </div>

            {isCorretor && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={onAddClick}
              >
                Novo Imóvel
              </Button>
            )}
          </div>

          {/* Listagem de Cartões */}
          <div className="p-4 space-y-4 flex-1">
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
              <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
                <Building className="w-10 h-10 stroke-[1.5]" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">Nenhum imóvel nesta região do mapa</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px]">
                  Arraste o mapa para navegar ou ajuste os filtros acima.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Outras Abas */}
      {activeTab === 'my-properties' && user && (
        <div className="flex-1 overflow-y-auto p-4">
          <MyPropertiesTab 
            onPropertyUpdate={onPropertyUpdate} 
            onPropertyClick={onPropertyClick} 
          />
        </div>
      )}

      {activeTab === 'team' && isMaster && (
        <div className="flex-1 overflow-y-auto p-4">
          <UserManagementTab />
        </div>
      )}

      {activeTab === 'construtoras' && isMaster && (
        <div className="flex-1 overflow-y-auto p-4">
          <ConstrutorasTab />
        </div>
      )}

      {activeTab === 'profile' && user && (
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 animate-fadeIn">
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500/30 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-xl">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.nome} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>

              <label className="absolute bottom-0 right-0 p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full cursor-pointer shadow-lg transition-transform hover:scale-110 border border-white/20">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploadingAvatar(true);
                      const url = await uploadAvatar(file, user.id);
                      if (url) {
                        await updateProfile(user.id, { avatar_url: url });
                        toast.success('Foto de perfil atualizada!');
                      }
                    } catch (err) {
                      toast.error('Erro ao enviar foto.');
                    } finally {
                      setUploadingAvatar(false);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="text-center">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{user.nome}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
              <div className="mt-1.5">
                <Badge variant="primary" size="sm">
                  {user.role}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Configurações de Contato
            </h3>

            <Input
              label="Número de WhatsApp (Com DDD)"
              placeholder="Ex: 41999998888"
              value={editingPhone}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, '');
                setEditingPhone(raw);
              }}
              icon={Phone}
            />

            <Button
              variant="primary"
              size="md"
              className="w-full"
              icon={Check}
              onClick={async () => {
                if (!editingPhone || editingPhone.length < 10) {
                  toast.error('Insira um número de WhatsApp válido.');
                  return;
                }
                try {
                  await updateProfile(user.id, { 
                    telefone: editingPhone,
                    whatsapp_configured: true
                  });
                  toast.success('WhatsApp atualizado com sucesso!');
                } catch (err) {
                  toast.error('Erro ao atualizar perfil.');
                }
              }}
            >
              Salvar Alterações
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
