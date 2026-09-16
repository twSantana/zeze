import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Search, Sparkles, AlertCircle, Save, Building2, Trash2, Calendar, Upload, Plus, Star, MapPin } from 'lucide-react';
import { geocodeCep, geocodeAddress } from '../services/geocoding';
import { useAuth } from '../context/AuthContext';
import { getConstrutoras, addConstrutora, getPropertyImages, deletePropertyImage } from '../services/propertyService';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { useToast } from './ui/Toast';
import { SafeImage } from './ui/SafeImage';

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
    const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    let tileUrl;
    
    if (mapboxToken) {
      const styleId = theme === 'dark' ? 'dark-v11' : 'streets-v12';
      tileUrl = `https://api.mapbox.com/styles/v1/mapbox/${styleId}/tiles/512/{z}/{x}/{y}@2x?access_token=${mapboxToken}`;
    } else {
      tileUrl = theme === 'dark' 
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
    }
      
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        layer.setUrl(tileUrl);
      }
    });
  }, [theme, map]);
  return null;
}

export default function AdminModal({ isOpen, onClose, propertyToEdit, onSave, theme }) {
  const toast = useToast();
  const { profiles, user } = useAuth();

  const [formData, setFormData] = useState({
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
    drive_url: '',
    previsao_entrega: ''
  });

  const [loadingCep, setLoadingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [existingImages, setExistingImages] = useState([]);

  // Estados de Averbação / Construtoras
  const [respType, setRespType] = useState('corretor-self');
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

  useEffect(() => {
    if (isOpen && propertyToEdit && propertyToEdit.id) {
      getPropertyImages(propertyToEdit.id)
        .then(data => setExistingImages(data || []))
        .catch(err => console.error('Erro ao carregar imagens existentes:', err));
    } else {
      setExistingImages([]);
    }
  }, [propertyToEdit, isOpen]);

  const handleDeleteExistingImage = async (imgId, bucket, path) => {
    try {
      await deletePropertyImage(imgId, bucket, path);
      setExistingImages(prev => prev.filter(img => img.id !== imgId));
      toast.success('Foto excluída com sucesso do empreendimento!');
    } catch (err) {
      console.error('Erro ao deletar imagem:', err);
      toast.error('Erro ao excluir a imagem.');
    }
  };

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
      drive_url: '',
      previsao_entrega: ''
    });
    setCepFeedback('');
    setRespType('corretor-self');
    setSelectedBroker('');
    setSelectedConstrutora('');
    setSelectedFiles([]);
    setSubmitting(false);
  };

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
        quartos_max: propertyToEdit.quartos_max || '',
        vagas_max: propertyToEdit.vagas_max || '',
        area_max_m2: propertyToEdit.area_max_m2 || '',
        drive_url: propertyToEdit.drive_url || '',
        previsao_entrega: propertyToEdit.previsao_entrega || ''
      });
      setSelectedFiles([]);
    } else {
      resetToDefault();
    }
    setErrorMsg('');
  }, [propertyToEdit, isOpen]);

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
          bairro: result.neighborhood || prev.bairro,
          cidade: result.city || prev.cidade
        }));
        setCepFeedback('✓ Localização e endereço sincronizados!');
      } else {
        setCepFeedback('⚠️ Coordenadas não encontradas automaticamente.');
      }
    } catch (err) {
      setCepFeedback('Erro ao conectar com geocodificador.');
    } fontally: {
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
        toast.success(`Construtora "${added.nome}" adicionada!`);
      }
    } catch (err) {
      toast.error(err.message || 'Erro ao cadastrar construtora.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const missingFields = [];
    if (!formData.titulo) missingFields.push('Título');
    if (!formData.preco) missingFields.push('Preço');
    if (!formData.area_m2) missingFields.push('Área');
    if (!formData.bairro) missingFields.push('Bairro');
    if (!formData.endereco) missingFields.push('Endereço');
    if (!formData.imagem_url && selectedFiles.length === 0 && existingImages.length === 0) {
      missingFields.push('Foto de Capa ou Upload de Imagens');
    }

    if (missingFields.length > 0) {
      const msg = `Preencha os campos obrigatórios: ${missingFields.join(', ')}.`;
      setErrorMsg(msg);
      toast.error(msg);
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

    setSubmitting(true);
    try {
      await onSave({ ...formData, averbacao: computedAverbacao, images: selectedFiles });
      toast.success(propertyToEdit ? 'Empreendimento atualizado com sucesso!' : 'Empreendimento cadastrado com sucesso!');
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Erro ao salvar o empreendimento. Tente novamente.');
      toast.error(err?.message || 'Erro ao salvar o empreendimento.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const combined = [...selectedFiles, ...files].slice(0, 10);
    setSelectedFiles(combined);
  };

  const removeSelected = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col relative transition-colors duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {propertyToEdit ? 'Editar Empreendimento' : 'Cadastrar Novo Empreendimento'}
              </h3>
              <p className="text-xs text-slate-400">Preencha as informações técnicas e localização geográfica</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário Grid de 2 Colunas */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-800 dark:text-slate-200">
          
          {/* Coluna 1: Ficha Técnica */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-wider">
              1. Ficha Técnica & Informações
            </h4>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center gap-2 py-2.5 bg-amber-500/10 px-3.5 rounded-xl border border-amber-500/20">
              <input
                type="checkbox"
                id="prioridade"
                checked={formData.prioridade}
                onChange={(e) => handleInputChange('prioridade', e.target.checked)}
                className="accent-amber-500 w-4 h-4 cursor-pointer rounded"
              />
              <label htmlFor="prioridade" className="text-xs font-bold text-amber-700 dark:text-amber-300 cursor-pointer uppercase select-none flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-500 stroke-none" />
                Destaque / Imóvel Prioritário
              </label>
            </div>

            <Input
              label="Nome do Empreendimento / Título *"
              placeholder="Ex: Residencial Vitra Batel"
              value={formData.titulo}
              onChange={(e) => handleInputChange('titulo', e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Tipo de Imóvel *"
                value={formData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
              >
                <option value="Apartamento">Apartamento</option>
                <option value="Sobrado">Sobrado</option>
                <option value="Casa">Casa</option>
                <option value="Terreno">Terreno</option>
              </Select>

              <Select
                label="Status da Obra *"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                <option value="Lançamento">Lançamento</option>
                <option value="Em Obras">Em Obras</option>
                <option value="Pronto">Pronto</option>
              </Select>
            </div>

            {(formData.status === 'Lançamento' || formData.status === 'Em Obras') && (
              <Input
                label="Previsão de Entrega *"
                placeholder="Ex: 2º Semestre/2026 ou Dez/2025"
                value={formData.previsao_entrega || ''}
                onChange={(e) => handleInputChange('previsao_entrega', e.target.value)}
                icon={Calendar}
                required
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Preço Inicial (R$) *"
                type="number"
                placeholder="Ex: 450000"
                value={formData.preco}
                onChange={(e) => handleInputChange('preco', e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Área Mín (m²) *"
                  type="number"
                  placeholder="Min"
                  value={formData.area_m2}
                  onChange={(e) => handleInputChange('area_m2', e.target.value)}
                  required
                />
                <Input
                  label="Área Máx (m²)"
                  type="number"
                  placeholder="Máx (Op.)"
                  value={formData.area_max_m2}
                  onChange={(e) => handleInputChange('area_max_m2', e.target.value)}
                />
              </div>
            </div>

            {/* Linha Quartos e Vagas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Quartos Mín"
                  type="number"
                  min="0"
                  value={formData.quartos}
                  onChange={(e) => handleInputChange('quartos', e.target.value)}
                />
                <Input
                  label="Quartos Máx"
                  type="number"
                  min="0"
                  value={formData.quartos_max}
                  onChange={(e) => handleInputChange('quartos_max', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Vagas Mín"
                  type="number"
                  min="0"
                  value={formData.vagas}
                  onChange={(e) => handleInputChange('vagas', e.target.value)}
                />
                <Input
                  label="Vagas Máx"
                  type="number"
                  min="0"
                  value={formData.vagas_max}
                  onChange={(e) => handleInputChange('vagas_max', e.target.value)}
                />
              </div>
            </div>

            <Input
              label="URL da Imagem de Capa (Opcional)"
              type="url"
              placeholder="https://exemplo.com/foto.jpg"
              value={formData.imagem_url}
              onChange={(e) => handleInputChange('imagem_url', e.target.value)}
            />

            {/* Fotos Atuais no Banco (Visualização & Deleção) */}
            {propertyToEdit && existingImages.length > 0 && (
              <div className="flex flex-col gap-2 p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 rounded-2xl">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  Galeria do Empreendimento ({existingImages.length} fotos)
                </span>
                <div className="flex gap-2.5 overflow-x-auto py-1 scrollbar-thin">
                  {existingImages.map((img) => (
                    <div key={img.id} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative shrink-0 group">
                      <SafeImage src={img.url} alt="Galeria" className="w-full h-full object-cover" showIcon={false} />
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingImage(img.id, img.bucket, img.path)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition shadow-md flex items-center justify-center"
                        title="Excluir Imagem"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload de Novas Imagens */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Upload de Novas Fotos
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFilesSelected}
                className="text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 transition-colors"
              />

              {selectedFiles.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto py-1">
                  {selectedFiles.map((f, idx) => (
                    <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative shrink-0">
                      <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeSelected(idx)} className="absolute top-1 right-1 p-1 bg-slate-900/80 text-white rounded-full text-xs">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Input
              label="Link de Conteúdo Externo (Tour Virtual, Vídeo)"
              type="url"
              placeholder="https://exemplo.com/tour"
              value={formData.conteudo_url}
              onChange={(e) => handleInputChange('conteudo_url', e.target.value)}
            />

            <Input
              label="Link do Google Drive (Pastas/PDFs)"
              type="url"
              placeholder="https://drive.google.com/..."
              value={formData.drive_url}
              onChange={(e) => handleInputChange('drive_url', e.target.value)}
            />

            {/* Observações Internas */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Observações Internas (Visível para equipe)
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Detalhes internos, condições especiais..."
                rows="3"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* Coluna 2: Geolocalização e Mapa */}
          <div className="flex flex-col space-y-4">
            <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 uppercase tracking-wider">
              2. Endereço e Coordenadas no Mapa
            </h4>

            {/* CEP com Busca Automática */}
            <div className="relative">
              <Input
                label="CEP *"
                placeholder="80000-000"
                maxLength="9"
                value={formData.cep}
                onChange={handleCepChange}
                icon={MapPin}
              />
              <button
                type="button"
                onClick={() => handleCepSearch()}
                disabled={loadingCep}
                className="absolute right-2 top-8 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {cepFeedback && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 flex items-center gap-1.5 animate-fadeIn">
                <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{cepFeedback}</span>
              </span>
            )}

            {/* Endereço / Bairro */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Input
                  label="Logradouro / Endereço *"
                  placeholder="Rua / Av..."
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  onBlur={handleAddressSearch}
                  required
                />
              </div>

              <div>
                <Input
                  label="Bairro *"
                  placeholder="Ex: Batel"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  onBlur={handleAddressSearch}
                  required
                />
              </div>
            </div>

            {/* Cidade, Lat e Lng */}
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Cidade *"
                value={formData.cidade}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
                required
              />

              <Input
                label="Latitude"
                value={formData.lat}
                readOnly
                className="bg-slate-100 dark:bg-slate-800 text-slate-500"
              />

              <Input
                label="Longitude"
                value={formData.lng}
                readOnly
                className="bg-slate-100 dark:bg-slate-800 text-slate-500"
              />
            </div>

            {/* Mini Mapa Interativo */}
            <div className="flex-1 flex flex-col gap-1.5 min-h-[220px]">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Ajuste Fino de Localização (Clique para reposicionar o pino)
              </label>

              <div className="h-52 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative shadow-inner">
                <MapContainer
                  center={[formData.lat, formData.lng]}
                  zoom={14}
                  zoomControl={false}
                  className="w-full h-full"
                >
                  <TileLayer
                    url={
                      import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
                        ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`
                        : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    }
                    attribution={
                      import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
                        ? '© Mapbox'
                        : '© OpenStreetMap'
                    }
                    tileSize={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? 512 : 256}
                    zoomOffset={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ? -1 : 0}
                  />
                  <Marker position={[formData.lat, formData.lng]} />
                  <MapClickHandler onLocationSelect={handleMapClick} />
                  <MapCenterSync coords={[formData.lat, formData.lng]} />
                  <MapThemeSync theme={theme} />
                </MapContainer>
              </div>
            </div>

          </div>

          {/* Footer de Ações */}
          <div className="col-span-1 md:col-span-2 border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center justify-between shrink-0">
            <div>
              {!propertyToEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    resetToDefault();
                    toast.info('Campos resetados.');
                  }}
                >
                  Limpar Formulário
                </Button>
              )}
            </div>

            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              
              <Button
                type="submit"
                variant="primary"
                isLoading={submitting}
                icon={Save}
              >
                {propertyToEdit ? 'Salvar Alterações' : 'Cadastrar Empreendimento'}
              </Button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
