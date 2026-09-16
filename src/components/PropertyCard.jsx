import React from 'react';
import { BedDouble, Car, Maximize, MapPin, Edit3, Trash2, MessageSquare, Home, Building, Star, ExternalLink, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { SafeImage } from './ui/SafeImage';

export default function PropertyCard({ 
  property, 
  onMouseEnter, 
  onMouseLeave, 
  onClick, 
  onEdit, 
  onDelete,
  onContactClick,
  isActive 
}) {
  const { user, isGerente, isMaster } = useAuth();
  const canEdit = property.created_by === user?.id || isGerente || isMaster;
  const canDelete = isMaster;

  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
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

  const formatQuartos = () => {
    if (property.quartos_max && property.quartos_max > property.quartos) {
      return `${property.quartos} a ${property.quartos_max} Qrt`;
    }
    return `${property.quartos} Qrt`;
  };

  const formatVagas = () => {
    if (property.vagas_max && property.vagas_max > property.vagas) {
      return `${property.vagas} a ${property.vagas_max} Vag`;
    }
    return `${property.vagas} Vag`;
  };

  const formatArea = () => {
    const areaMin = Math.round(property.area_m2);
    const areaMax = property.area_max_m2 ? Math.round(property.area_max_m2) : 0;
    if (areaMax && areaMax > areaMin) {
      return `${areaMin} a ${areaMax} m²`;
    }
    return `${areaMin} m²`;
  };

  return (
    <div 
      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-300 flex flex-col cursor-pointer ${
        property.prioridade
          ? (isActive 
              ? 'border-amber-500 shadow-xl shadow-amber-500/10 -translate-y-1 ring-2 ring-amber-500/50' 
              : 'border-amber-400/80 dark:border-amber-600/40 hover:border-amber-500 hover:-translate-y-1 hover:shadow-2xl')
          : (isActive 
              ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 -translate-y-1 ring-2 ring-emerald-500/50' 
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1 hover:shadow-2xl')
      }`}
      onMouseEnter={() => onMouseEnter && onMouseEnter(property.id)}
      onMouseLeave={() => onMouseLeave && onMouseLeave()}
      onClick={() => onClick && onClick(property)}
    >
      {/* Imagem Principal */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
        <SafeImage 
          src={property.imagem_url} 
          alt={property.titulo}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          fallbackText="Sem foto principal"
          loading="lazy"
        />
        
        {/* Overlay em Gradiente Suave */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Badges Flutuantes Superior Esquerda */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5 z-10">
          {property.prioridade && (
            <Badge variant="gold" size="sm" icon={Star}>
              Prioridade
            </Badge>
          )}
          <Badge variant={getStatusBadgeVariant(property.status)} size="sm">
            {property.status}
          </Badge>
          <Badge variant="default" size="sm" icon={property.tipo === 'Casa' ? Home : Building}>
            {property.tipo}
          </Badge>
        </div>

        {/* Previsão de Entrega no canto inferior direito da imagem */}
        {property.previsao_entrega && (
          <div className="absolute right-3 bottom-3 z-10">
            <Badge variant="default" size="sm" icon={Calendar} className="bg-slate-950/80 text-slate-200 border-white/10 backdrop-blur-md">
              {property.previsao_entrega}
            </Badge>
          </div>
        )}

        {/* Botões de Ação Administrativa */}
        {canEdit && (
          <div className="absolute right-3 top-3 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(property);
              }}
              className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white shadow-lg backdrop-blur-md transition-all duration-200"
              title="Editar Empreendimento"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            {canDelete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(property.id);
                }}
                className="p-2 rounded-xl bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white shadow-lg backdrop-blur-md transition-all duration-200"
                title="Excluir Empreendimento"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detalhes do Conteúdo */}
      <div className="p-4 flex flex-col flex-grow text-slate-800 dark:text-slate-200">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {property.preco ? `${formatPrice(property.preco)}` : 'Sob Consulta'}
            {property.area_max_m2 && property.area_max_m2 > property.area_m2 ? ' (A partir)' : ''}
          </span>
        </div>
        
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {property.titulo}
        </h3>

        {/* Endereço / Região */}
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="line-clamp-1 font-medium">
            {property.bairro} — {property.cidade}
          </span>
        </div>

        {property.created_by_name && (
          <div className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            Consultor: <span className="text-slate-700 dark:text-slate-300 font-semibold">{property.created_by_name}</span>
          </div>
        )}

        {/* Ficha Técnica Rápida */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs font-medium">
          <div className="flex items-center gap-1.5" title="Quartos">
            <BedDouble className="w-4 h-4 text-slate-400" />
            <span>{formatQuartos()}</span>
          </div>

          <div className="flex items-center gap-1.5" title="Vagas de Garagem">
            <Car className="w-4 h-4 text-slate-400" />
            <span>{formatVagas()}</span>
          </div>

          <div className="flex items-center gap-1.5" title="Área Privativa">
            <Maximize className="w-4 h-4 text-slate-400" />
            <span>{formatArea()}</span>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mt-4 flex flex-col gap-2">
          {!property.averbacao?.startsWith('Construtora: ') && (
            <Button
              variant="primary"
              size="sm"
              icon={MessageSquare}
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onContactClick(property);
              }}
            >
              Falar com Consultor
            </Button>
          )}

          {property.conteudo_url && (
            <a
              href={property.conteudo_url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
            >
              <span>Ver Conteúdo Completo</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
