import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Search, Sparkles, AlertCircle, Save, Building2, Award, Check } from 'lucide-react';
import { geocodeCep, geocodeAddress } from '../services/geocoding';
import { useAuth } from '../context/AuthContext';
import { getConstrutoras, addConstrutora } from '../services/propertyService';

function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

function MapCenterSync({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords[0] && coords[1]) {
      map.setView(coords, 14);
    }
  }, [coords, map]);
  return null;
}

function MapThemeSync({ theme }) {
  const map = useMap();
  useEffect(() => {
    const tileUrl = theme === 'dark' 
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
      
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        layer.setUrl(tileUrl);
      }
    });
  }, [theme, map]);
  return null;
}

export default function AdminModal({ isOpen, onClose, propertyToEdit, onSave, theme }) {
  const [formData, setFormData] = useState({
    titulo: '',
    tipo: 'Apartamento',
    status: 'Lançamento',
    preco: '',
    quartos: 0,
    vagas: 0,
    area_m2: '',
    imagem_url: '',
    cep: '',
    endereco: '',
    bairro: '',
    cidade: 'Curitiba',
    conteudo_url: '',
    lat: -25.4372,
    lng: -49.2700,
    prioridade: false,
    observacoes: '',
    averbacao: '',
    quartos_max: '',
    vagas_max: '',
    area_max_m2: '',
    drive_url: ''
  });

  const { profiles, user } = useAuth();

  const [loadingCep, setLoadingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Estados de Averbação / Construtoras
  const [respType, setRespType] = useState('corretor-self'); // 'corretor-self' | 'corretor-other' | 'construtora' | 'manual'
  const [selectedBroker, setSelectedBroker] = useState('');
  const [selectedConstrutora, setSelectedConstrutora] = useState('');
  const [construtoras, setConstrutoras] = useState([]);
  const [showNewConstrutoraInput, setShowNewConstrutoraInput] = useState(false);
  const [newConstrutoraName, setNewConstrutoraName] = useState('');

  useEffect(() => {
    if (isOpen) {
      getConstrutoras()
        .then(data => setConstrutoras(data || []))
        .catch(err => console.error('Erro ao carregar construtoras:', err));
    }
  }, [isOpen]);

  const resetToDefault = () => {
    setFormData({
      titulo: '',
      tipo: 'Apartamento',
      status: 'Lançamento',
      preco: '',
      quartos: 2,
      vagas: 1,
      area_m2: '',
      imagem_url: '',
      cep: '',
      endereco: '',
      bairro: '',
      cidade: 'Curitiba',
      conteudo_url: '',
      lat: -25.4372,
      lng: -49.2700,
      prioridade: false,
      observacoes: '',
      averbacao: '',
      quartos_max: '',
      vagas_max: '',
      area_max_m2: '',
      drive_url: ''
    });
    setCepFeedback('');
    setRespType('corretor-self');
    setSelectedBroker('');
    setSelectedConstrutora('');
  };

  // Carrega ou inicializa o formulário (recuperando rascunhos para novos cadastros)
  useEffect(() => {
    if (propertyToEdit) {
      setFormData({
        titulo: propertyToEdit.titulo || '',
        tipo: propertyToEdit.tipo || 'Apartamento',
        status: propertyToEdit.status || 'Lançamento',
        preco: propertyToEdit.preco || '',
        quartos: propertyToEdit.quartos ?? 0,
        vagas: propertyToEdit.vagas ?? 0,
        area_m2: propertyToEdit.area_m2 || '',
        imagem_url: propertyToEdit.imagem_url || '',
        cep: propertyToEdit.cep || '',
        endereco: propertyToEdit.endereco || '',
        bairro: propertyToEdit.bairro || '',
        cidade: propertyToEdit.cidade || 'Curitiba',
        conteudo_url: propertyToEdit.conteudo_url || '',
        lat: propertyToEdit.lat || -25.4372,
        lng: propertyToEdit.lng || -49.2700,
        prioridade: propertyToEdit.prioridade || false,
        observacoes: propertyToEdit.observacoes || '',
        averbacao: propertyToEdit.averbacao || '',
        quartos_max: propertyToEdit.quartos_max ?? '',
        vagas_max: propertyToEdit.vagas_max ?? '',
        area_max_m2: propertyToEdit.area_max_m2 || '',
        drive_url: propertyToEdit.drive_url || ''
      });
      setCepFeedback('Coordenadas originais carregadas.');

      const rawAverb = propertyToEdit.averbacao || '';
      if (rawAverb.startsWith('Corretor: ')) {
        const brokerVal = rawAverb.replace('Corretor: ', '');
        if (user && brokerVal === user.nome) {
          setRespType('corretor-self');
        } else {
          setRespType('corretor-other');
          setSelectedBroker(brokerVal);
        }
      } else if (rawAverb.startsWith('Construtora: ')) {
        setRespType('construtora');
        setSelectedConstrutora(rawAverb.replace('Construtora: ', ''));
      } else if (rawAverb) {
        setRespType('manual');
      } else {
        setRespType('corretor-self');
      }
    } else {
      // Tenta recuperar rascunho anterior de novo imóvel do localStorage
      const saved = localStorage.getItem('property_draft');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.formData) {
            setFormData(parsed.formData);
            setRespType(parsed.respType || 'corretor-self');
            setSelectedBroker(parsed.selectedBroker || '');
            setSelectedConstrutora(parsed.selectedConstrutora || '');
            setCepFeedback('Rascunho recuperado automaticamente.');
          } else {
            resetToDefault();
          }
        } catch (e) {
          console.error('Erro ao ler rascunho do localStorage:', e);
          resetToDefault();
        }
      } else {
        resetToDefault();
      }
    }
    setErrorMsg('');
  }, [propertyToEdit, isOpen, user]);

  // Salva o rascunho em localStorage quando o usuário altera os campos de um novo imóvel
  useEffect(() => {
    if (isOpen && !propertyToEdit) {
      const draft = {
        formData,
        respType,
        selectedBroker,
        selectedConstrutora
      };
      localStorage.setItem('property_draft', JSON.stringify(draft));
    }
  }, [formData, respType, selectedBroker, selectedConstrutora, isOpen, propertyToEdit]);

  if (!isOpen) return null;

  const handleCepSearch = async (targetCep) => {
    const cleanCep = (targetCep || formData.cep).replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCepFeedback('Digite os 8 dígitos do CEP.');
      return;
    }

    setLoadingCep(true);
    setCepFeedback('Buscando CEP e coordenadas...');
    setErrorMsg('');

    try {
      const result = await geocodeCep(cleanCep);
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          cep: result.cep,
          endereco: result.street || prev.endereco,
          bairro: result.neighborhood || prev.bairro,
          cidade: result.city || prev.cidade,
          lat: result.lat,
          lng: result.lng
        }));
        setCepFeedback(`✓ Encontrado via ${result.source}! Coordenadas carregadas.`);
      } else {
        setCepFeedback('⚠️ CEP encontrado, mas ajuste as coordenadas no mapa.');
        setErrorMsg(result.error || 'CEP não geolocalizado.');
      }
    } catch (err) {
      setCepFeedback('Erro ao conectar com serviço de CEP.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleAddressSearch = async () => {
    if (!formData.endereco) return;
    setLoadingCep(true);
    setCepFeedback('Buscando coordenadas pelo endereço...');
    setErrorMsg('');
    try {
      const result = await geocodeAddress(formData.endereco, formData.bairro, formData.cidade);
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          lat: result.lat,
          lng: result.lng,
          // Autopreenchimento inteligente do bairro e da cidade se obtidos no geocoding
          bairro: result.neighborhood || prev.bairro,
          cidade: result.city || prev.cidade
        }));
        setCepFeedback('✓ Localização e endereço sincronizados!');
      } else {
        setCepFeedback('⚠️ Coordenadas não encontradas automaticamente.');
      }
    } catch (err) {
      setCepFeedback('Erro ao conectar com geocodificador.');
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, cep: val }));
    const clean = val.replace(/\D/g, '');
    if (clean.length === 8) {
      handleCepSearch(clean);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMapClick = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6))
    }));
    setCepFeedback('Coordenadas ajustadas manualmente clicando no mapa.');
  };

  const handleAddNewConstrutora = async () => {
    if (!newConstrutoraName.trim()) return;
    try {
      setErrorMsg('');
      const added = await addConstrutora(newConstrutoraName.trim());
      if (added) {
        setConstrutoras(prev => [...prev, added].sort((a, b) => a.nome.localeCompare(b.nome)));
        setSelectedConstrutora(added.nome);
        setNewConstrutoraName('');
        setShowNewConstrutoraInput(false);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao cadastrar construtora.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const missingFields = [];
    if (!formData.titulo) missingFields.push('Título');
    if (!formData.preco) missingFields.push('Preço');
    if (!formData.area_m2) missingFields.push('Área');
    if (!formData.bairro) missingFields.push('Bairro');
    if (!formData.endereco) missingFields.push('Endereço');
    if (!formData.imagem_url && selectedFiles.length === 0) missingFields.push('Imagem de capa (URL ou upload)');

    if (missingFields.length > 0) {
      setErrorMsg(`Preencha os campos obrigatórios: ${missingFields.join(', ')}.`);
      return;
    }

    if (respType === 'corretor-other' && !selectedBroker) {
      setErrorMsg('Por favor, selecione o corretor responsável.');
      return;
    }

    if (respType === 'construtora' && !selectedConstrutora) {
      setErrorMsg('Por favor, selecione a construtora parceira.');
      return;
    }

    let computedAverbacao = '';
    if (respType === 'corretor-self') {
      computedAverbacao = `Corretor: ${user?.nome || 'Desconhecido'}`;
    } else if (respType === 'corretor-other') {
      computedAverbacao = `Corretor: ${selectedBroker}`;
    } else if (respType === 'construtora') {
      computedAverbacao = `Construtora: ${selectedConstrutora}`;
    } else if (respType === 'manual') {
      computedAverbacao = formData.averbacao;
    }

    // Pass selectedFiles to parent for upload handling
    onSave({ ...formData, averbacao: computedAverbacao, images: selectedFiles });

    // Limpa o rascunho de novo cadastro
    if (!propertyToEdit) {
      localStorage.removeItem('property_draft');
    }
  };

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    // Limit to 10 images to avoid abuse
    const combined = [...selectedFiles, ...files].slice(0, 10);
    setSelectedFiles(combined);
  };

  const removeSelected = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto animate-fadeIn pointer-events-auto">
      <div className="bg-white dark:bg-slate-900 rounded-none md:rounded-3xl w-full max-w-full md:max-w-5xl h-full md:h-auto max-h-[calc(100vh-2rem)] shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-hidden flex flex-col my-0 md:my-8 transition-colors duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div>
            <h3 className="font-sans font-bold text-sm">
              {propertyToEdit ? 'Editar Empreendimento' : 'Cadastrar Novo Empreendimento'}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Ficha técnica e geolocalização da RMC</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-h-[65vh] md:max-h-[70vh] text-slate-800 dark:text-slate-200">
          
          {/* Ficha Técnica */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-wider">
              1. Ficha Técnica
            </h4>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-2 py-2.5 bg-amber-50 dark:bg-amber-955/20 px-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40">
              <input
                type="checkbox"
                id="prioridade"
                checked={formData.prioridade}
                onChange={(e) => handleInputChange('prioridade', e.target.checked)}
                className="accent-amber-500 w-4 h-4 cursor-pointer"
              />
              <label htmlFor="prioridade" className="text-xs font-black text-amber-700 dark:text-amber-400 cursor-pointer uppercase select-none flex items-center gap-1">
                ⭐ Destaque / Imóvel Prioritário
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Título *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                placeholder="Ex: Vitra Batel Residence"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => handleInputChange('tipo', e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-950/50 focus:outline-none"
                >
                  <option value="Apartamento">Apartamento</option>
                  <option value="Sobrado">Sobrado</option>
                  <option value="Terreno">Terreno</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl px-2 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-950/50 focus:outline-none"
                >
                  <option value="Lançamento">Lançamento</option>
                  <option value="Em Obras">Em Obras</option>
                  <option value="Pronto">Pronto</option>
                </select>
              </div>
            </div>

            {/* Linha Preço e Área */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Preço Inicial (R$) *</label>
                <input
                  type="number"
                  value={formData.preco}
                  onChange={(e) => handleInputChange('preco', e.target.value)}
                  placeholder="Ex: 450000"
                  className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Área Mín (m²) *</label>
                  <input
                    type="number"
                    value={formData.area_m2}
                    onChange={(e) => handleInputChange('area_m2', e.target.value)}
                    placeholder="Min"
                    className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-955 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Área Máx (m²)</label>
                  <input
                    type="number"
                    value={formData.area_max_m2}
                    onChange={(e) => handleInputChange('area_max_m2', e.target.value)}
                    placeholder="Máx (Op.)"
                    className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-955 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Linha Quartos e Vagas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Quartos Mín</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quartos}
                    onChange={(e) => handleInputChange('quartos', e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-955 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Quartos Máx</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quartos_max}
                    onChange={(e) => handleInputChange('quartos_max', e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-955 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Vagas Mín</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.vagas}
                    onChange={(e) => handleInputChange('vagas', e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-955 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">Vagas Máx</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.vagas_max}
                    onChange={(e) => handleInputChange('vagas_max', e.target.value)}
                    className="w-full text-xs border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-955 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">URL Imagem Capa (Opcional se houver upload)</label>
              <input
                type="url"
                value={formData.imagem_url}
                onChange={(e) => handleInputChange('imagem_url', e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-950/50 focus:outline-none"
              />
            </div>

            {/* Upload de múltiplas imagens */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Fotos do Empreendimento (upload)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesSelected}
                className="text-xs"
              />

              {selectedFiles.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {selectedFiles.map((f, idx) => (
                    <div key={idx} className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 relative">
                      <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeSelected(idx)} className="absolute top-1 right-1 p-1 bg-white/80 rounded-full text-red-600">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Novo Campo: Link para o Conteúdo */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Link para o Conteúdo (YouTube, Tour Virtual, Página)</label>
              <input
                type="url"
                value={formData.conteudo_url}
                onChange={(e) => handleInputChange('conteudo_url', e.target.value)}
                placeholder="https://exemplo.com/tour-virtual-vitra"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Novo Campo: Link do Google Drive */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Link do Google Drive (Tabelas, Anexos, PDFs)</label>
              <input
                type="url"
                value={formData.drive_url}
                onChange={(e) => handleInputChange('drive_url', e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Novo Campo: Averbação / Responsável */}
            <div className="flex flex-col gap-2 p-3.5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850/60 rounded-2xl">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Responsável pela Averbação / Captação</label>
              
              {/* Chips de seleção de tipo */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'corretor-self', label: 'Eu mesmo' },
                  { id: 'corretor-other', label: 'Outro Corretor' },
                  { id: 'construtora', label: 'Construtora' },
                  { id: 'manual', label: 'Notas / Manual' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setRespType(opt.id);
                      setErrorMsg('');
                    }}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-extrabold border transition text-center ${
                      respType === opt.id
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Sub-inputs condicionais */}
              {respType === 'corretor-self' && user && (
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-600 dark:text-slate-450 font-semibold bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 p-2.5 rounded-xl">
                  <Award size={14} className="text-emerald-500" />
                  <span>Cadastrado sob sua responsabilidade: <strong className="text-slate-850 dark:text-slate-200">{user.nome}</strong> ({user.role})</span>
                </div>
              )}

              {respType === 'corretor-other' && (
                <div className="mt-1">
                  <select
                    value={selectedBroker}
                    onChange={(e) => {
                      setSelectedBroker(e.target.value);
                      setErrorMsg('');
                    }}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/50 focus:outline-none"
                  >
                    <option value="">-- Selecione o Consultor --</option>
                    {profiles && profiles
                      .filter(p => p.ativo)
                      .map(p => (
                        <option key={p.id} value={p.nome}>
                          {p.nome} ({p.role})
                        </option>
                      ))
                    }
                  </select>
                </div>
              )}

              {respType === 'construtora' && (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex gap-2">
                    <select
                      value={selectedConstrutora}
                      onChange={(e) => {
                        setSelectedConstrutora(e.target.value);
                        setErrorMsg('');
                      }}
                      className="flex-grow text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/50 focus:outline-none"
                    >
                      <option value="">-- Selecione a Construtora --</option>
                      {construtoras.map(c => (
                        <option key={c.id} value={c.nome}>
                          {c.nome}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setShowNewConstrutoraInput(!showNewConstrutoraInput)}
                      className="py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1 border border-slate-200/40 dark:border-slate-800/80 transition shadow-sm"
                      title="Cadastrar Nova Construtora"
                    >
                      <Building2 size={13} />
                      <span>Cadastrar</span>
                    </button>
                  </div>

                  {showNewConstrutoraInput && (
                    <div className="flex gap-2 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl animate-fadeIn">
                      <input
                        type="text"
                        value={newConstrutoraName}
                        onChange={(e) => setNewConstrutoraName(e.target.value)}
                        placeholder="Nome da construtora"
                        className="flex-grow text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewConstrutora();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddNewConstrutora}
                        className="p-2 bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 transition"
                        title="Confirmar"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewConstrutoraName('');
                          setShowNewConstrutoraInput(false);
                        }}
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {respType === 'manual' && (
                <div className="mt-1">
                  <input
                    type="text"
                    value={formData.averbacao}
                    onChange={(e) => handleInputChange('averbacao', e.target.value)}
                    placeholder="Ex: Averbado, sob matrícula 12345..."
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/50 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Novo Campo: Observações */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Observações Internas (Exclusivo Corretores)</label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Detalhes adicionais, pendências, observações internas..."
                rows="3"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
              />
            </div>

          </div>

          {/* Geolocalização */}
          <div className="flex flex-col h-full space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-wider">
              2. Endereço e Coordenadas
            </h4>

            {/* CEP */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">CEP</label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.cep}
                  onChange={handleCepChange}
                  placeholder="80000-000"
                  maxLength="9"
                  className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl pl-3 pr-10 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleCepSearch()}
                  disabled={loadingCep}
                  className="absolute right-2 top-2 p-1 rounded-lg text-slate-400 hover:text-slate-855 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                >
                  <Search size={14} />
                </button>
              </div>
            </div>

            {cepFeedback && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1.5 animate-fadeIn">
                <Sparkles size={12} className="text-emerald-500 shrink-0" />
                <span>{cepFeedback}</span>
              </span>
            )}

            {/* Endereço / Bairro */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Logradouro / Endereço</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.endereco}
                    onChange={(e) => handleInputChange('endereco', e.target.value)}
                    onBlur={handleAddressSearch}
                    className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950/50 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    className="absolute right-2 top-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-705 hover:bg-slate-100 dark:hover:bg-slate-900 transition"
                    title="Buscar Coordenadas pelo Endereço"
                  >
                    <Search size={14} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Bairro *</label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  onBlur={handleAddressSearch}
                  className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-955 text-slate-800 dark:text-slate-100"
                  required
                />
              </div>
            </div>

            {/* Cidade, Lat e Lng */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Cidade *</label>
                <input
                  type="text"
                  value={formData.cidade}
                  onChange={(e) => handleInputChange('cidade', e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 bg-white dark:bg-slate-955 text-slate-855 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Latitude</label>
                <input
                  type="number"
                  value={formData.lat}
                  className="w-full text-xs border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500"
                  readOnly
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Longitude</label>
                <input
                  type="number"
                  value={formData.lng}
                  className="w-full text-xs border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500"
                  readOnly
                />
              </div>
            </div>

            {/* Mini Mapa de Ajuste Fino */}
            <div className="flex-grow flex flex-col gap-1 min-h-[160px]">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                Ajuste Fino no Mapa (Clique para selecionar)
              </label>

              <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative">
                <MapContainer
                  center={[formData.lat, formData.lng]}
                  zoom={14}
                  zoomControl={false}
                  className="w-full h-full"
                >
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  />
                  <Marker position={[formData.lat, formData.lng]} />
                  <MapClickHandler onLocationSelect={handleMapClick} />
                  <MapCenterSync coords={[formData.lat, formData.lng]} />
                  <MapThemeSync theme={theme} />
                </MapContainer>
              </div>
            </div>

          </div>

          {/* Footer de Controles */}
          <div className="col-span-1 md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4 flex gap-3 justify-end shrink-0">
            {!propertyToEdit && localStorage.getItem('property_draft') && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Deseja realmente limpar todos os campos digitados?')) {
                    localStorage.removeItem('property_draft');
                    resetToDefault();
                  }
                }}
                className="mr-auto px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-955/20 text-red-600 dark:text-red-400 text-xs font-bold transition"
              >
                Limpar Campos
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400 text-xs font-bold transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-slate-950 dark:text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Save size={14} />
              <span>{propertyToEdit ? 'Salvar Alterações' : 'Cadastrar Empreendimento'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
