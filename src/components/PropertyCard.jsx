import React from 'react';
import { BedDouble, Car, Maximize, MapPin, Edit3, Trash2, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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

  return (
    <div 
      className={`group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border transition-all duration-300 flex flex-col cursor-pointer ${
        isActive 
          ? 'border-emerald-500 shadow-lg shadow-emerald-500/5 -translate-y-1 ring-1 ring-emerald-500/50' 
          : 'border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 hover:-translate-y-1 hover:shadow-premium-hover'
      }`}
      onMouseEnter={() => onMouseEnter && onMouseEnter(property.id)}
      onMouseLeave={() => onMouseLeave && onMouseLeave()}
      onClick={() => onClick && onClick(property)}
    >
      {/* Imagem do Imóvel */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-950">
        {property.imagem_url ? (
          <img 
            src={property.imagem_url} 
            alt={property.titulo}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-650 text-xs">
            Sem imagem cadastrada
          </div>
        )}
        
        {/* Badges Flutuantes */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2 z-10">
          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${getStatusColor(property.status)}`}>
            {property.status}
          </span>
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-slate-900/80 dark:bg-slate-950/80 text-white border border-white/10 backdrop-blur-md">
            {property.tipo}
          </span>
        </div>

        {/* Controles Administrativos */}
        {canEdit && (
          <div className="absolute right-3 top-3 flex gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(property);
              }}
              className="p-1.5 rounded-lg bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-355 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white shadow transition-all duration-200"
              title="Editar Empreendimento"
            >
              <Edit3 size={14} />
            </button>
            {canDelete && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(property.id);
                }}
                className="p-1.5 rounded-lg bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-355 hover:text-red-650 dark:hover:text-red-400 hover:bg-white shadow transition-all duration-200"
                title="Excluir Empreendimento"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detalhes do Conteúdo */}
      <div className="p-4 flex flex-col flex-grow text-slate-800 dark:text-slate-200">
        <span className="text-xl font-black font-sans text-slate-900 dark:text-white tracking-tight mb-1">
          {formatPrice(property.preco)}
        </span>
        
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">
          {property.titulo}
        </h3>

        {/* Endereço / Região */}
        <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
          <MapPin size={11} className="text-slate-400 dark:text-slate-650 shrink-0" />
          <span className="line-clamp-1 font-medium">
            {property.endereco ? `${property.endereco}, ` : ''}{property.bairro} — {property.cidade}
          </span>
        </div>

        {property.created_by_name && (
          <div className="mt-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Cadastrado por {property.created_by_name}
          </div>
        )}

        {/* Tags Técnicas */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between text-slate-500 dark:text-slate-400 text-[10px] font-bold">
          <div className="flex items-center gap-1" title="Quartos">
            <BedDouble size={13} className="text-slate-400 dark:text-slate-550" />
            <span>{property.quartos} Qrt</span>
          </div>

          <div className="flex items-center gap-1" title="Vagas de Garagem">
            <Car size={13} className="text-slate-400 dark:text-slate-550" />
            <span>{property.vagas} Vag</span>
          </div>

          <div className="flex items-center gap-1" title="Área Privativa">
            <Maximize size={13} className="text-slate-400 dark:text-slate-550" />
            <span>{Math.round(property.area_m2)} m²</span>
          </div>
        </div>

        {/* Ação: Falar com Consultor */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onContactClick(property);
          }}
          className="mt-4 w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-slate-950 dark:text-white text-[11px] font-extrabold rounded-2xl flex items-center justify-center gap-1.5 transition-all shadow-sm"
        >
          <MessageSquare size={13} />
          <span>Falar com Consultor</span>
        </button>

        {/* Link para o Conteúdo Externo Adicional */}
        {property.conteudo_url && (
          <a
            href={property.conteudo_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 text-[10px] font-extrabold rounded-2xl flex items-center justify-center gap-1.5 transition-all border border-slate-200/40 dark:border-slate-800/80"
          >
            <span>Ver Conteúdo Completo ➔</span>
          </a>
        )}

      </div>
    </div>
  );
}
