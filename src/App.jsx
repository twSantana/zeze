import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import BottomSheet from './components/BottomSheet';
import LoginScreen from './components/LoginScreen';
import AdminModal from './components/AdminModal';
import LeadModal from './components/LeadModal';
import { getPropertiesBbox, addProperty, updateProperty, deleteProperty } from './services/propertyService';
import { Building, Plus } from 'lucide-react';

function AppContent({ theme, onThemeToggle }) {
  const { user, loading, isGerente, isMaster, isCorretor, supabaseError } = useAuth();
  
  // Estados de dados e mapa
  const [rawProperties, setRawProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);
  const [bbox, setBbox] = useState(null);

  // Estados dos Modais
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState(null);
  
  // Leads
  const [isLeadOpen, setIsLeadOpen] = useState(false);
  const [selectedPropertyForLead, setSelectedPropertyForLead] = useState(null);

  // Filtros ativos (Completo)
  const [filters, setFilters] = useState({
    buscaTextual: '',
    tipo: 'Todos',
    cidade: 'Todas',
    precoMax: 3000000,
    quartos: 'Todos',
    vagasMin: 'Todos',
    areaMin: 30
  });

  // 1. Carrega dados do Bounding Box quando o mapa se move
  const fetchPropertiesInBbox = async (currentBbox) => {
    if (!currentBbox) return;
    try {
      const data = await getPropertiesBbox(currentBbox);
      setRawProperties(data);
    } catch (err) {
      console.error('Erro ao buscar imóveis:', err);
    }
  };

  useEffect(() => {
    if (bbox && user) {
      fetchPropertiesInBbox(bbox);
    }
  }, [bbox, user]);

  // 2. Aplica filtros locais (Preço, Tipo, Quartos, Cidade, Busca Textual, Vagas e Área)
  useEffect(() => {
    if (!user) return;
    
    let result = [...rawProperties];

    // Filtro de Busca Textual (Título, Bairro, Cidade, Endereço)
    // Filtro de Busca Textual (Título, Bairro, Cidade, Endereço)
    if (filters.buscaTextual && filters.buscaTextual.trim() !== '') {
      const query = filters.buscaTextual.toLowerCase();
      result = result.filter(p => 
        (p.titulo || '').toLowerCase().includes(query) ||
        (p.bairro || '').toLowerCase().includes(query) ||
        (p.cidade || '').toLowerCase().includes(query) ||
        (p.endereco || '').toLowerCase().includes(query)
      );
    }

    // Filtro de Tipo
    if (filters.tipo !== 'Todos') {
      result = result.filter(p => p.tipo === filters.tipo);
    }

    // Filtro de Cidade
    if (filters.cidade !== 'Todas') {
      result = result.filter(p => (p.cidade || '').toLowerCase() === filters.cidade.toLowerCase());
    }

    // Filtro de Preço Máximo
    if (filters.precoMax < 3000000) {
      result = result.filter(p => p.preco <= filters.precoMax);
    }

    // Filtro de Quartos Mínimos
    if (filters.quartos !== 'Todos') {
      const minBedrooms = parseInt(filters.quartos);
      result = result.filter(p => p.quartos >= minBedrooms);
    }

    // Filtro de Vagas Mínimas
    if (filters.vagasMin !== 'Todos') {
      const minVagas = parseInt(filters.vagasMin);
      result = result.filter(p => p.vagas >= minVagas);
    }

    // Filtro de Área Mínima
    if (filters.areaMin > 30) {
      result = result.filter(p => p.area_m2 >= filters.areaMin);
    }

    setFilteredProperties(result);
  }, [rawProperties, filters, user]);

  // Manipulador de mudança de filtros
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Escuta alteração do Viewport do Mapa
  const handleBboxChange = (newBbox) => {
    setBbox(newBbox);
  };

  // Foca no imóvel selecionado (voando para suas coordenadas)
  const handlePropertyFocus = (property) => {
    setFocusLocation({
      lat: property.lat,
      lng: property.lng,
      zoom: 16,
      timestamp: Date.now()
    });
    setHoveredPropertyId(property.id);
  };

  // Funções CRUD do Administrador
  const handleAddClick = () => {
    if (!isCorretor) {
      alert('Apenas corretores e gestores podem cadastrar imóveis.');
      return;
    }
    setPropertyToEdit(null);
    setIsAdminOpen(true);
  };

  const handleEditClick = (property) => {
    if (property.created_by !== user?.id && !isGerente && !isMaster) {
      alert('Somente o criador ou um gerente pode editar este imóvel.');
      return;
    }
    setPropertyToEdit(property);
    setIsAdminOpen(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir permanentemente este empreendimento?')) {
      try {
        await deleteProperty(id);
        setRawProperties(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        alert('Erro ao excluir imóvel.');
      }
    }
  };

  const handleSaveProperty = async (formData) => {
    try {
      if (propertyToEdit) {
        const updated = await updateProperty(propertyToEdit.id, formData);
        setRawProperties(prev => 
          prev.map(p => p.id === propertyToEdit.id ? { ...p, ...updated } : p)
        );
      } else {
        const created = await addProperty(formData, user);
        setRawProperties(prev => [created, ...prev]);
        handlePropertyFocus(created);
      }
      setIsAdminOpen(false);
      setPropertyToEdit(null);
    } catch (err) {
      console.error('Erro ao salvar empreendimento:', err);
      alert(`Erro ao salvar empreendimento: ${err?.message || 'Verifique os dados e tente novamente.'}`);
    }
  };

  // Contato com Consultor
  const handleContactClick = (property) => {
    setSelectedPropertyForLead(property);
    setIsLeadOpen(true);
  };

  // 3. Renderização de Carregamento Inicial do Sistema
  if (loading) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans gap-3">
        <div className="p-3 rounded-2xl bg-emerald-500 text-slate-950 animate-bounce">
          <Building size={32} />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Carregando RMC Mapeamento...</p>
      </div>
    );
  }

  // Mostra mensagem de erro amigável quando Supabase não está configurado corretamente
  if (supabaseError) {
    return (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-sans gap-4 p-6">
        <div className="p-4 rounded-2xl bg-red-600 text-white">
          <strong>Atenção:</strong>
        </div>
        <h2 className="text-lg font-bold">Erro na configuração do Supabase</h2>
        <p className="text-sm text-slate-300 max-w-xl text-center">{supabaseError}</p>
        <div className="text-sm text-slate-400 max-w-xl text-center mt-3">
          Verifique as variáveis de ambiente <strong>VITE_SUPABASE_URL</strong> e <strong>VITE_SUPABASE_ANON_KEY</strong> no painel do Vercel ou no arquivo <strong>.env</strong> local.
        </div>
      </div>
    );
  }

  // 4. Bloqueio Obrigatório por Login (Gated Screen)
  if (!user) {
    return <LoginScreen theme={theme} onThemeToggle={onThemeToggle} />;
  }

  return (
    <div className="h-screen min-h-screen w-screen flex flex-col md:flex-row overflow-hidden relative bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      

      {/* Interface Desktop (Sidebar na esquerda, Mapa na direita) */}
      <div className="hidden md:flex w-[400px] lg:w-[450px] shrink-0 h-full">
        <Sidebar
          properties={filteredProperties}
          filters={filters}
          onFilterChange={handleFilterChange}
          onHoverProperty={setHoveredPropertyId}
          hoveredPropertyId={hoveredPropertyId}
          onPropertyClick={handlePropertyFocus}
          onAddClick={handleAddClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          onContactClick={handleContactClick}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
      </div>

      <div className="flex-grow h-full relative">
        <MapView
          properties={filteredProperties}
          hoveredPropertyId={hoveredPropertyId}
          onBboxChange={handleBboxChange}
          onPropertyClick={handlePropertyFocus}
          focusLocation={focusLocation}
          theme={theme}
        />

        {isCorretor && (
          <button
            onClick={() => {
              setIsAdminOpen(true);
              setPropertyToEdit(null);
            }}
            className="md:hidden fixed bottom-24 right-4 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20 border border-white/40 hover:bg-emerald-400 transition"
            title="Cadastrar novo imóvel"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* Interface Mobile: Header Flutuante e Bottom Sheet */}
      <div className="md:hidden">
        {/* Header Flutuante estilo Airbnb */}
        <div className="absolute top-4 left-4 right-4 z-[999] pointer-events-none">
          <div className="w-full py-2.5 px-4 rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-800/85 shadow-lg backdrop-blur-md flex items-center justify-between pointer-events-auto transition-colors">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-emerald-500 text-slate-950 shrink-0">
                <Building size={14} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-805 dark:text-slate-100 leading-none">Mapeamento RMC</h2>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 font-medium">Painel do Consultor</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Sheet Deslizante */}
        <BottomSheet
          properties={filteredProperties}
          filters={filters}
          onFilterChange={handleFilterChange}
          onHoverProperty={setHoveredPropertyId}
          hoveredPropertyId={hoveredPropertyId}
          onPropertyClick={handlePropertyFocus}
          onAddClick={handleAddClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          onContactClick={handleContactClick}
          theme={theme}
          onThemeToggle={onThemeToggle}
        />
      </div>

      {/* Modais de Gerenciamento */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => {
          setIsAdminOpen(false);
          setPropertyToEdit(null);
        }}
        propertyToEdit={propertyToEdit}
        onSave={handleSaveProperty}
        theme={theme}
      />

      <LeadModal
        isOpen={isLeadOpen}
        onClose={() => {
          setIsLeadOpen(false);
          setSelectedPropertyForLead(null);
        }}
        property={selectedPropertyForLead}
      />

    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const handleThemeToggle = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <AuthProvider>
      <AppContent theme={theme} onThemeToggle={handleThemeToggle} />
    </AuthProvider>
  );
}
