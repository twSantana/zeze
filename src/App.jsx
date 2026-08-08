import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import MapView from './components/MapView';
import Sidebar from './components/Sidebar';
import BottomSheet from './components/BottomSheet';
import LoginScreen from './components/LoginScreen';
import AdminModal from './components/AdminModal';
import LeadModal from './components/LeadModal';
import PropertyDetailModal from './components/PropertyDetailModal';
import { getPropertiesBbox, addProperty, updateProperty, deleteProperty, uploadPropertyImages } from './services/propertyService';
import { Building, Plus } from 'lucide-react';

function AppContent({ theme, onThemeToggle }) {
  const { user, loading, isGerente, isMaster, isCorretor, supabaseError, profiles, updateProfile } = useAuth();
  
  // Estados de dados e mapa
  const [rawProperties, setRawProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [hoveredPropertyId, setHoveredPropertyId] = useState(null);
  const [focusLocation, setFocusLocation] = useState(null);
  const [bbox, setBbox] = useState(null);

  // Primeiro Acesso WhatsApp
  const [forcePhone, setForcePhone] = useState('');
  const [forcePhoneError, setForcePhoneError] = useState('');
  const [savingForcePhone, setSavingForcePhone] = useState(false);

  // Estados dos Modais
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [propertyToEdit, setPropertyToEdit] = useState(null);
  
  // Leads
  const [isLeadOpen, setIsLeadOpen] = useState(false);
  const [selectedPropertyForLead, setSelectedPropertyForLead] = useState(null);

  // Detalhes do Imóvel
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedPropertyForDetails, setSelectedPropertyForDetails] = useState(null);

  // Filtros ativos (Completo)
  const [filters, setFilters] = useState({
    buscaTextual: '',
    tipo: 'Todos',
    cidade: 'Todas',
    precoMax: 3000000,
    quartos: 'Todos',
    vagasMin: 'Todos',
    areaMin: 30,
    apenasDestaques: false
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

    // Filtro de Apenas Destaques
    if (filters.apenasDestaques) {
      result = result.filter(p => p.prioridade);
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

  // Foca no imóvel selecionado (voando para suas coordenadas e abrindo detalhes)
  const handlePropertyFocus = (property) => {
    setFocusLocation({
      lat: property.lat,
      lng: property.lng,
      zoom: 16,
      timestamp: Date.now()
    });
    setHoveredPropertyId(property.id);
    setSelectedPropertyForDetails(property);
    setIsDetailsOpen(true);
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
        const updatedWithCoords = { ...updated, lat: formData.lat, lng: formData.lng };
        setRawProperties(prev => 
          prev.map(p => p.id === propertyToEdit.id ? updatedWithCoords : p)
        );

        // Handle uploaded images when editing
        if (formData.images && formData.images.length > 0) {
          const uploaded = await uploadPropertyImages(formData.images, propertyToEdit.id);
          if (uploaded && uploaded.length > 0) {
            const first = uploaded[0];
            const updatedWithCover = await updateProperty(propertyToEdit.id, { ...formData, imagem_url: first.url });
            const updatedWithCoverCoords = { ...updatedWithCover, lat: formData.lat, lng: formData.lng };
            setRawProperties(prev => prev.map(p => p.id === propertyToEdit.id ? updatedWithCoverCoords : p));
            handlePropertyFocus(updatedWithCoverCoords);
          } else {
            handlePropertyFocus(updatedWithCoords);
          }
        } else {
          handlePropertyFocus(updatedWithCoords);
        }
      } else {
        const created = await addProperty(formData, user);
        const createdWithCoords = { ...created, lat: formData.lat, lng: formData.lng };
        setRawProperties(prev => [createdWithCoords, ...prev]);
        // If there are images selected, upload them and set cover
        if (formData.images && formData.images.length > 0) {
          const uploaded = await uploadPropertyImages(formData.images, created.id);
          if (uploaded && uploaded.length > 0) {
            const first = uploaded[0];
            const updatedWithCover = await updateProperty(created.id, { ...formData, imagem_url: first.url });
            const updatedWithCoverCoords = { ...updatedWithCover, lat: formData.lat, lng: formData.lng };
            setRawProperties(prev => prev.map(p => p.id === created.id ? updatedWithCoverCoords : p));
            handlePropertyFocus(updatedWithCoverCoords);
          } else {
            handlePropertyFocus(createdWithCoords);
          }
        } else {
          handlePropertyFocus(createdWithCoords);
        }
      }
      setIsAdminOpen(false);
      setPropertyToEdit(null);
    } catch (err) {
      console.error('Erro ao salvar empreendimento:', err);
      alert(`Erro ao salvar empreendimento: ${err?.message || 'Verifique os dados e tente novamente.'}`);
    }
  };

  // Contato com Consultor Responsável via WhatsApp
  const handleContactClick = (property) => {
    const rawAverb = property.averbacao || '';
    let targetBrokerProfile = null;
    
    if (rawAverb.startsWith('Corretor: ')) {
      const brokerName = rawAverb.replace('Corretor: ', '');
      targetBrokerProfile = profiles?.find(p => p.nome === brokerName && p.ativo);
    }
    
    // Fallback: se não achar pelo corretor da averbação, tenta achar pelo criador (created_by)
    if (!targetBrokerProfile && property.created_by) {
      targetBrokerProfile = profiles?.find(p => p.id === property.created_by && p.ativo);
    }
    
    if (targetBrokerProfile && targetBrokerProfile.telefone) {
      const cleanPhone = targetBrokerProfile.telefone.replace(/\D/g, '');
      const messageText = `Olá! Gostaria de mais informações sobre o imóvel "${property.titulo}" (${property.tipo} em ${property.bairro}, ${property.cidade}).`;
      const phonePrefix = cleanPhone.startsWith('55') ? '' : '55';
      
      window.open(`https://api.whatsapp.com/send?phone=${phonePrefix}${cleanPhone}&text=${encodeURIComponent(messageText)}`, '_blank');
    } else {
      // Se não achar o WhatsApp do corretor, abre o modal de lead padrão como fallback
      setSelectedPropertyForLead(property);
      setIsLeadOpen(true);
    }
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
                <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-none">Mapa Zelony</h2>
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

      <PropertyDetailModal
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedPropertyForDetails(null);
        }}
        property={selectedPropertyForDetails}
        onContactClick={handleContactClick}
      />

      {/* Modal de Primeiro Acesso - Cadastro Obrigatório de WhatsApp */}
      {user && !user.whatsapp_configured && (
        <div className="fixed inset-0 z-[999999] bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-fadeIn">
            <div className="text-center mb-5">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 animate-pulse text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Primeiro Acesso: WhatsApp</h2>
              <p className="text-xs text-slate-550 dark:text-slate-400 mt-1.5 leading-normal">
                Para prosseguir e acessar o painel do <strong>Mapa Zelony</strong>, é obrigatório cadastrar o seu número de WhatsApp de trabalho.
              </p>
            </div>

            {forcePhoneError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold">
                {forcePhoneError}
              </div>
            )}

            <div className="flex flex-col gap-1 mb-4">
              <label className="text-[10px] font-bold text-slate-555 dark:text-slate-400 uppercase">Seu WhatsApp (com DDD)</label>
              <input
                type="text"
                value={forcePhone}
                onChange={(e) => setForcePhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Ex: 41999998888"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                required
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('force-submit-btn')?.click();
                  }
                }}
              />
              <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                Este número será associado a todas as suas captações para permitir contato direto dos interessados.
              </span>
            </div>

            <button
              id="force-submit-btn"
              onClick={async () => {
                if (!forcePhone || forcePhone.length < 10) {
                  setForcePhoneError('Por favor, informe um número de telefone com DDD válido.');
                  return;
                }
                setSavingForcePhone(true);
                setForcePhoneError('');
                try {
                  await updateProfile(user.id, {
                    telefone: forcePhone,
                    whatsapp_configured: true
                  });
                } catch (err) {
                  setForcePhoneError('Ocorreu um erro ao salvar seu número no banco. Tente novamente.');
                } finally {
                  setSavingForcePhone(false);
                }
              }}
              disabled={savingForcePhone}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/55 text-slate-950 font-bold text-xs transition shadow-md"
            >
              {savingForcePhone ? 'Gravando número...' : 'Acessar o Sistema'}
            </button>
          </div>
        </div>
      )}

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
