import React, { useState, useEffect } from 'react';
import { 
  X, MapPin, BedDouble, Car, Maximize, 
  ExternalLink, ShieldCheck, FileText, Star, Landmark, Award,
  ChevronLeft, ChevronRight, FolderOpen, Edit3, Trash2
} from 'lucide-react';
import { getPropertyImages } from '../services/propertyService';
import { useAuth } from '../context/AuthContext';

export default function PropertyDetailModal({ isOpen, onClose, property, onContactClick, onEdit, onDelete }) {
  const { user, isGerente, isMaster } = useAuth();
  const [images, setImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const canEdit = property && (property.created_by === user?.id || isGerente || isMaster);
  const canDelete = isMaster;

  useEffect(() => {
    if (isOpen && property?.id) {
      getPropertyImages(property.id)
        .then((data) => {
          setImages(data || []);
          setActiveImageIndex(0);
        })
        .catch((err) => {
          console.error('Erro ao buscar imagens adicionais:', err);
          setImages([]);
        });
    } else {
      setImages([]);
    }
  }, [isOpen, property]);

  if (!isOpen || !property) return null;

  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatQuartos = () => {
    if (property.quartos_max && property.quartos_max > property.quartos) {
      return `${property.quartos} a ${property.quartos_max} Quartos`;
    }
    return `${property.quartos} ${property.quartos === 1 ? 'Quarto' : 'Quartos'}`;
  };

  const formatVagas = () => {
    if (property.vagas_max && property.vagas_max > property.vagas) {
      return `${property.vagas} a ${property.vagas_max} Vagas`;
    }
    return `${property.vagas} ${property.vagas === 1 ? 'Vaga' : 'Vagas'}`;
  };

  const formatArea = () => {
    const areaMin = Math.round(property.area_m2);
    const areaMax = property.area_max_m2 ? Math.round(property.area_max_m2) : 0;
    if (areaMax && areaMax > areaMin) {
      return `${areaMin} a ${areaMax} m²`;
    }
    return `${areaMin} m²`;
  };

  const renderAverbacaoSection = () => {
    const raw = property.averbacao || '';
    if (!raw) {
      return (
        <div className="p-3 bg-blue-50/30 dark:bg-blue-950/10 rounded-2xl border border-blue-100/30 dark:border-blue-900/20">
          <div className="flex items-center gap-2 mb-1">
            <Landmark size={14} className="text-blue-500" />
            <h4 className="text-[10px] font-extrabold text-blue-600 dark:text-blue-450 uppercase tracking-wider">Averbação / Responsabilidade</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
            Informação de averbação não cadastrada.
          </p>
        </div>
      );
    }

    if (raw.startsWith('Corretor: ')) {
      const name = raw.replace('Corretor: ', '');
      return (
        <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100/30 dark:border-emerald-900/20">
          <div className="flex items-center gap-2 mb-1">
            <Award size={14} className="text-emerald-500" />
            <h4 className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-450 uppercase tracking-wider">Corretor Responsável</h4>
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
            {name}
          </p>
        </div>
      );
    }

    if (raw.startsWith('Construtora: ')) {
      const name = raw.replace('Construtora: ', '');
      return (
        <div className="p-3 bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl border border-amber-100/30 dark:border-amber-900/20">
          <div className="flex items-center gap-2 mb-1">
            <Landmark size={14} className="text-amber-500" />
            <h4 className="text-[10px] font-extrabold text-amber-600 dark:text-amber-450 uppercase tracking-wider">Construtora Parceira</h4>
          </div>
          <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
            {name}
          </p>
        </div>
      );
    }

    return (
      <div className="p-3 bg-blue-50/30 dark:bg-blue-950/10 rounded-2xl border border-blue-100/30 dark:border-blue-900/20">
        <div className="flex items-center gap-2 mb-1">
          <Landmark size={14} className="text-blue-500" />
          <h4 className="text-[10px] font-extrabold text-blue-600 dark:text-blue-450 uppercase tracking-wider">Averbação de Imóvel</h4>
        </div>
        <p className="text-xs text-slate-700 dark:text-slate-350 font-semibold leading-relaxed">
          {raw}
        </p>
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Lançamento':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40';
      case 'Em Obras':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40';
      case 'Pronto':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700';
    }
  };

  // Determinar imagens disponíveis
  const allImages = images.length > 0 ? images : [{ url: property.imagem_url }];
  const currentImageUrl = allImages[activeImageIndex]?.url || property.imagem_url;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 overflow-y-auto animate-fadeIn pointer-events-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[90vh] md:max-h-[85vh] shadow-2xl border border-slate-100 dark:border-slate-800/80 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row relative transition-colors duration-300">
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-[9999] p-2 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition"
          title="Fechar Detalhes"
        >
          <X size={18} />
        </button>

        {/* Lado Esquerdo: Imagem Principal e Galeria */}
        <div className="w-full md:w-1/2 relative bg-slate-900 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/60 shrink-0 aspect-video md:aspect-auto md:h-full overflow-hidden">
          <div className="w-full h-full relative group/img">
            {currentImageUrl ? (
              <img 
                src={currentImageUrl} 
                alt={property.titulo} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                Sem imagem disponível
              </div>
            )}

            {/* Botões de Navegação do Carrossel */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 text-white hover:bg-slate-950/90 hover:scale-105 transition z-10 border border-white/10"
                  title="Anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 text-white hover:bg-slate-950/90 hover:scale-105 transition z-10 border border-white/10"
                  title="Próxima"
                >
                  <ChevronRight size={20} />
                </button>

                {/* Indicador de posição do carrossel */}
                <div className="absolute top-3 right-12 px-2.5 py-1 rounded-full bg-slate-950/70 text-white text-[9px] font-black tracking-wider z-10 select-none border border-white/10">
                  {activeImageIndex + 1} / {allImages.length}
                </div>
              </>
            )}

            {/* Tag Prioridade Flutuante na Imagem */}
            {property.prioridade && (
              <div className="absolute top-3 left-3 bg-amber-500 text-slate-950 px-3 py-1.5 text-[10px] font-black rounded-full shadow-lg border border-amber-300 flex items-center gap-1 z-10 select-none">
                <Star size={11} className="fill-slate-950 stroke-none" />
                <span>DESTAQUE</span>
              </div>
            )}

            {/* Galeria de Miniaturas Flutuante na Base da Imagem */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[90%] px-3 py-2 rounded-2xl bg-slate-950/65 backdrop-blur-md border border-white/10 flex gap-2 overflow-x-auto scrollbar-none z-15">
                {allImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-11 h-11 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                      activeImageIndex === idx 
                        ? 'border-emerald-500 scale-95 shadow-sm shadow-emerald-500/30' 
                        : 'border-transparent opacity-65 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Detalhes Técnicos */}
        <div className="w-full md:w-1/2 p-5 md:p-6 flex flex-col justify-between overflow-y-auto h-auto md:h-full">
          
          <div className="space-y-4">
            
            {/* Badges Principais */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`px-3 py-0.8 text-[9px] font-black uppercase rounded-full ${getStatusColor(property.status)}`}>
                {property.status}
              </span>
              <span className="px-3 py-0.8 text-[9px] font-bold uppercase rounded-full bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 border border-slate-200/40 dark:border-slate-800/80">
                {property.tipo}
              </span>
              {property.faixa && (
                <span className="px-3 py-0.8 text-[9px] font-extrabold uppercase rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 border border-emerald-250 dark:border-emerald-900/40">
                  {property.faixa === 'SBPE' ? 'SBPE' : `${property.faixa} (MCMV)`}
                </span>
              )}
            </div>

            {/* Título e Localidade */}
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {property.titulo}
              </h2>
              
              <div className="mt-2 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <MapPin size={13} className="text-slate-450 dark:text-slate-500 shrink-0" />
                <span>{property.endereco ? `${property.endereco}, ` : ''}{property.bairro} — {property.cidade}</span>
              </div>
            </div>

            {/* Preço */}
            <div className="py-3 border-y border-slate-100 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                  {property.area_max_m2 && property.area_max_m2 > property.area_m2 ? 'Preço Inicial' : 'Preço de Venda'}
                </span>
                <span className={`text-2xl font-black ${property.prioridade ? 'text-amber-500' : 'text-emerald-500 dark:text-emerald-450'}`}>
                  {formatPrice(property.preco)}
                  {property.area_max_m2 && property.area_max_m2 > property.area_m2 ? ' *' : ''}
                </span>
              </div>
              
              {property.cep && (
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">CEP</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {property.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}
                  </span>
                </div>
              )}
            </div>

            {/* Grade de Especificações */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-2xl border border-slate-100/50 dark:border-slate-850">
              <div className="flex flex-col items-center text-center p-1.5">
                <BedDouble size={18} className="text-slate-400 dark:text-slate-550 mb-1" />
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase">Dormitórios</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white mt-0.5">{formatQuartos()}</span>
              </div>

              <div className="flex flex-col items-center text-center p-1.5 border-x border-slate-100 dark:border-slate-850">
                <Car size={18} className="text-slate-400 dark:text-slate-550 mb-1" />
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase">Vagas</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white mt-0.5">{formatVagas()}</span>
              </div>

              <div className="flex flex-col items-center text-center p-1.5">
                <Maximize size={18} className="text-slate-400 dark:text-slate-550 mb-1" />
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-550 uppercase">Privativa</span>
                <span className="text-xs font-extrabold text-slate-800 dark:text-white mt-0.5">{formatArea()}</span>
              </div>
            </div>

            {/* Averbação */}
            {renderAverbacaoSection()}

            {/* Observações */}
            {property.observacoes && (
              <div className="p-3 bg-slate-50 dark:bg-slate-950/30 rounded-2xl border border-slate-150 dark:border-slate-850">
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={14} className="text-slate-450 dark:text-slate-500" />
                  <h4 className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Observações / Notas Internas</h4>
                </div>
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed italic whitespace-pre-line font-medium">
                  {property.observacoes}
                </p>
              </div>
            )}

            {/* Responsável pelo Cadastro */}
            {property.created_by_name && (
              <div className="flex items-center gap-2 text-[10px] text-slate-450 dark:text-slate-500 pt-2 font-medium">
                <ShieldCheck size={13} className="text-emerald-500" />
                <span>Responsável: <strong>{property.created_by_name}</strong> ({property.created_by_role})</span>
              </div>
            )}

          </div>

          {/* Botões de Ação */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex flex-col gap-2.5 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              {property.conteudo_url && (
                <a
                  href={property.conteudo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-grow py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 text-xs font-black flex items-center justify-center gap-1.5 border border-slate-200/40 dark:border-slate-800/80 transition"
                >
                  <ExternalLink size={14} />
                  <span>Ver Página de Conteúdo</span>
                </a>
              )}

              {property.drive_url && (
                <a
                  href={property.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-grow py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-955/20 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-black flex items-center justify-center gap-1.5 border border-amber-200/40 dark:border-amber-900/20 transition"
                >
                  <FolderOpen size={14} className="text-amber-500 dark:text-amber-450" />
                  <span>Google Drive / Anexos</span>
                </a>
              )}
            </div>

            {!property.averbacao?.startsWith('Construtora: ') && (
              <button
                onClick={() => {
                  onContactClick(property);
                }}
                className="w-full py-3 px-5 bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-505 text-slate-950 dark:text-white text-xs font-black rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-500/10"
              >
                <span>Falar com Consultor</span>
              </button>
            )}

            {/* Ações Administrativas (Editar/Excluir) */}
            {(canEdit || canDelete) && (
              <div className="flex gap-3 w-full mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                {canEdit && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(property);
                    }}
                    className="flex-grow py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200/40 dark:border-slate-850 transition"
                  >
                    <Edit3 size={13} />
                    <span>Editar</span>
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => {
                      onClose();
                      onDelete(property.id);
                    }}
                    className="flex-grow py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-955/20 dark:hover:bg-red-900/30 text-red-650 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-red-200/40 dark:border-red-900/20 transition"
                  >
                    <Trash2 size={13} />
                    <span>Excluir</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
