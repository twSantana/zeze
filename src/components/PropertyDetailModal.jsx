import React, { useState, useEffect } from 'react';
import { 
  X, MapPin, BedDouble, Car, Maximize, 
  ExternalLink, ShieldCheck, FileText, Star, Landmark, Award,
  ChevronLeft, ChevronRight, FolderOpen, Edit3, Trash2, Calendar, Building
} from 'lucide-react';
import { getPropertyImages } from '../services/propertyService';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

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
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-4 h-4 text-slate-400" />
            <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Averbação / Responsabilidade</h4>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Informação de averbação não cadastrada.
          </p>
        </div>
      );
    }

    if (raw.startsWith('Corretor: ')) {
      const name = raw.replace('Corretor: ', '');
      return (
        <div className="p-3.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Award className="w-4 h-4 text-emerald-500" />
            <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Corretor Responsável</h4>
          </div>
          <p className="text-xs font-semibold text-slate-900 dark:text-white">
            {name}
          </p>
        </div>
      );
    }

    if (raw.startsWith('Construtora: ')) {
      const name = raw.replace('Construtora: ', '');
      return (
        <div className="p-3.5 bg-amber-500/10 rounded-xl border border-amber-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Construtora Parceira</h4>
          </div>
          <p className="text-xs font-semibold text-slate-900 dark:text-white">
            {name}
          </p>
        </div>
      );
    }

    return (
      <div className="p-3.5 bg-sky-500/10 rounded-xl border border-sky-500/20">
        <div className="flex items-center gap-2 mb-1">
          <Landmark className="w-4 h-4 text-sky-500" />
          <h4 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Averbação de Imóvel</h4>
        </div>
        <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
          {raw}
        </p>
      </div>
    );
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'Lançamento':
        return 'purple';
      case 'Em Obras':
        return 'warning';
      case 'Pronto':
        return 'primary';
      default:
        return 'default';
    }
  };

  const allImages = images.length > 0 ? images : [{ url: property.imagem_url }];
  const currentImageUrl = allImages[activeImageIndex]?.url || property.imagem_url;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-5xl max-h-[90vh] md:max-h-[85vh] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row relative">
        
        {/* Botão Fechar */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-50 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 transition-colors border border-white/10 backdrop-blur-md"
          title="Fechar Detalhes"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lado Esquerdo: Imagem Principal e Galeria */}
        <div className="w-full md:w-1/2 relative bg-slate-950 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 shrink-0 aspect-video md:aspect-auto md:h-full overflow-hidden flex flex-col justify-center">
          <div className="w-full h-full relative group">
            {currentImageUrl ? (
              <img 
                src={currentImageUrl} 
                alt={property.titulo} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                <Building className="w-12 h-12 stroke-[1.5]" />
                <span className="text-xs">Sem imagens cadastradas</span>
              </div>
            )}

            {/* Controles de Navegação */}
            {allImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 transition-all z-10 border border-white/10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 transition-all z-10 border border-white/10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="absolute top-3 right-14 px-3 py-1 rounded-full bg-slate-950/70 text-white text-xs font-semibold z-10 border border-white/10">
                  {activeImageIndex + 1} / {allImages.length}
                </div>
              </>
            )}

            {property.prioridade && (
              <div className="absolute top-3 left-3 z-10">
                <Badge variant="gold" size="md" icon={Star}>
                  DESTAQUE
                </Badge>
              </div>
            )}

            {/* Carrossel de Miniaturas */}
            {allImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-[90%] px-3 py-2 rounded-2xl bg-slate-950/70 backdrop-blur-md border border-white/10 flex gap-2 overflow-x-auto z-10">
                {allImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIndex === idx 
                        ? 'border-emerald-500 scale-95 shadow-md shadow-emerald-500/30' 
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Detalhes Técnicos e Conteúdo com Scroll Próprio e Rodapé Fixo */}
        <div className="w-full md:w-1/2 flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900">
          
          {/* Conteúdo Rolável */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-6 space-y-4">
            
            {/* Badges Principais */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant={getStatusBadgeVariant(property.status)} size="md">
                {property.status}
              </Badge>
              <Badge variant="default" size="md">
                {property.tipo}
              </Badge>
              {property.faixa && (
                <Badge variant="primary" size="md">
                  {property.faixa === 'SBPE' ? 'SBPE' : `${property.faixa} (MCMV)`}
                </Badge>
              )}
            </div>

            {/* Título e Localidade */}
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                {property.titulo}
              </h2>
              
              <div className="mt-2 flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{property.endereco ? `${property.endereco}, ` : ''}{property.bairro} — {property.cidade}</span>
                </div>
                
                {property.previsao_entrega && (property.status === 'Lançamento' || property.status === 'Em Obras') && (
                  <div className="mt-1">
                    <Badge variant="warning" size="md" icon={Calendar}>
                      Previsão de Entrega: {property.previsao_entrega}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Preço */}
            <div className="py-3 border-y border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  {property.area_max_m2 && property.area_max_m2 > property.area_m2 ? 'Preço Inicial' : 'Preço de Venda'}
                </span>
                <span className={`text-2xl font-extrabold ${property.prioridade ? 'text-amber-500' : 'text-emerald-500 dark:text-emerald-400'}`}>
                  {formatPrice(property.preco)}
                </span>
              </div>
              
              {property.cep && (
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">CEP</span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {property.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}
                  </span>
                </div>
              )}
            </div>

            {/* Especificações Técnicas */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <div className="flex flex-col items-center text-center p-1.5">
                <BedDouble className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Dormitórios</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{formatQuartos()}</span>
              </div>

              <div className="flex flex-col items-center text-center p-1.5 border-x border-slate-200/60 dark:border-slate-800">
                <Car className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Vagas</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{formatVagas()}</span>
              </div>

              <div className="flex flex-col items-center text-center p-1.5">
                <Maximize className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Privativa</span>
                <span className="text-xs font-bold text-slate-800 dark:text-white mt-0.5">{formatArea()}</span>
              </div>
            </div>

            {/* Averbação */}
            {renderAverbacaoSection()}

            {/* Observações / Descrição Sem Armadilha de Scroll Duplo */}
            {property.observacoes && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col gap-2">
                <div className="flex items-center gap-2 shrink-0">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Descrição & Notas Internas</h4>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                  {property.observacoes}
                </p>
              </div>
            )}

            {/* Responsável pelo Cadastro */}
            {property.created_by_name && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Responsável: <strong className="text-slate-700 dark:text-slate-200">{property.created_by_name}</strong></span>
              </div>
            )}

          </div>

          {/* Botões de Ação Fixos no Rodapé */}
          <div className="p-4 md:px-6 md:py-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5 bg-slate-50/50 dark:bg-slate-900 shrink-0">
            <div className="flex flex-col sm:flex-row gap-2.5 w-full">
              {property.conteudo_url && (
                <a
                  href={property.conteudo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="outline" size="md" icon={ExternalLink} className="w-full">
                    Página de Conteúdo
                  </Button>
                </a>
              )}

              {property.drive_url && (
                <a
                  href={property.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button variant="accent" size="md" icon={FolderOpen} className="w-full">
                    Google Drive / Anexos
                  </Button>
                </a>
              )}
            </div>

            {!property.averbacao?.startsWith('Construtora: ') && (
              <Button
                variant="primary"
                size="lg"
                className="w-full shadow-lg shadow-emerald-500/20"
                onClick={() => onContactClick(property)}
              >
                Falar com Consultor Responsável
              </Button>
            )}

            {(canEdit || canDelete) && (
              <div className="flex gap-2 w-full pt-2 border-t border-slate-200/60 dark:border-slate-800">
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Edit3}
                    className="flex-1"
                    onClick={() => {
                      onClose();
                      onEdit(property);
                    }}
                  >
                    Editar
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    className="flex-1"
                    onClick={() => {
                      onClose();
                      onDelete(property.id);
                    }}
                  >
                    Excluir
                  </Button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
