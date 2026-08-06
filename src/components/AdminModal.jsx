import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Search, Sparkles, AlertCircle, Save } from 'lucide-react';
import { geocodeCep } from '../services/geocoding';

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
    lng: -49.2700
  });

  const [loadingCep, setLoadingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);

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
        lng: propertyToEdit.lng || -49.2700
      });
      setCepFeedback('Coordenadas originais carregadas.');
    } else {
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
        lng: -49.2700
      });
      setCepFeedback('');
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
        setErrorMsg(result.error || 'CEP não geolocalizado.');
      }
    } catch (err) {
      setCepFeedback('Erro ao conectar com serviço de CEP.');
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

    // Pass selectedFiles to parent for upload handling
    onSave({ ...formData, images: selectedFiles });
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
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] text-slate-800 dark:text-slate-200">
          
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

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Título *</label>
              <input
                type="text"
                value={formData.titulo}
                onChange={(e) => handleInputChange('titulo', e.target.value)}
                placeholder="Ex: Vitra Batel Residence"
                className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
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

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Preço (R$) *</label>
                <input
                  type="number"
                  value={formData.preco}
                  onChange={(e) => handleInputChange('preco', e.target.value)}
                  placeholder="Ex: 450000"
                  className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Área Privativa (m²) *</label>
                <input
                  type="number"
                  value={formData.area_m2}
                  onChange={(e) => handleInputChange('area_m2', e.target.value)}
                  placeholder="Ex: 85"
                  className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Dormitórios</label>
                <input
                  type="number"
                  min="0"
                  value={formData.quartos}
                  onChange={(e) => handleInputChange('quartos', e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-955 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Vagas</label>
                <input
                  type="number"
                  min="0"
                  value={formData.vagas}
                  onChange={(e) => handleInputChange('vagas', e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-955 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">URL Imagem Capa</label>
              <input
                type="url"
                value={formData.imagem_url}
                onChange={(e) => handleInputChange('imagem_url', e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-105 bg-white dark:bg-slate-950/50 focus:outline-none"
                required
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
                className="w-full text-xs border border-slate-200 dark:border-slate-850 rounded-xl px-3 py-2.5 text-slate-850 dark:text-slate-100 bg-white dark:bg-slate-955 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
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
                <input
                  type="text"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Bairro *</label>
                <input
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-855 rounded-xl px-3 py-2 bg-white dark:bg-slate-955 text-slate-850 dark:text-slate-100"
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
