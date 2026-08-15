import React, { useState, useEffect } from 'react';
import { getMeusEmpreendimentos, togglePropertySold } from '../services/propertyService';
import { useAuth } from '../context/AuthContext';
import { Building, CheckCircle2, RotateCcw, Loader2, MapPin } from 'lucide-react';

export default function MyPropertiesTab({ onPropertyUpdate, onPropertyClick }) {
  const { user } = useAuth();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [actionId, setActionId] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      setErrorMsg('');
      try {
        const data = await getMeusEmpreendimentos(user.id, user.role);
        setList(data || []);
      } catch (err) {
        setErrorMsg('Erro ao carregar seus imóveis.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const handleToggleSold = async (property) => {
    setActionId(property.id);
    setErrorMsg('');
    const targetStatus = !property.vendido;
    try {
      const updated = await togglePropertySold(property.id, targetStatus);
      if (updated) {
        // Preserva coordenadas do original
        const updatedItem = { 
          ...property, 
          vendido: updated.vendido 
        };
        
        setList(prev => prev.map(item => item.id === property.id ? updatedItem : item));
        
        // Notifica o componente pai
        if (onPropertyUpdate) {
          onPropertyUpdate(updatedItem);
        }
      }
    } catch (err) {
      setErrorMsg('Erro ao atualizar status do imóvel.');
    } finally {
      setActionId(null);
    }
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
          <Building size={16} />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white">
            {user?.role === 'master' || user?.role === 'gerente' ? 'Gerenciar Imóveis' : 'Meus Imóveis'}
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            {user?.role === 'master' || user?.role === 'gerente' 
              ? 'Controle global de captações ativas e vendidas' 
              : 'Seus imóveis cadastrados e controle de vendas'}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-3 p-3 text-xs bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 text-red-600 dark:text-red-400 font-semibold rounded-xl shrink-0">
          {errorMsg}
        </div>
      )}

      {/* Listagem */}
      <div className="flex-grow overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 size={24} className="animate-spin text-slate-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Buscando captações...</span>
          </div>
        ) : list.length > 0 ? (
          list.map((property) => (
            <div 
              key={property.id}
              onClick={() => onPropertyClick && onPropertyClick(property)}
              className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex gap-3 relative ${
                property.vendido 
                  ? 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/60 dark:border-slate-800/40 opacity-75 hover:opacity-90'
                  : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/80 hover:border-slate-200 dark:hover:border-slate-700 shadow-sm'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 shrink-0 border border-slate-200/30">
                {property.imagem_url ? (
                  <img src={property.imagem_url} alt={property.titulo} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px] font-bold text-center p-1 bg-slate-100 dark:bg-slate-950">
                    Sem Foto
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="flex-grow min-w-0 flex flex-col justify-between py-0.5">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-1 pr-4">
                      {property.titulo}
                    </h4>
                    {property.vendido && (
                      <span className="px-1.5 py-0.5 text-[8px] font-black uppercase rounded bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200/30">
                        Vendido
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5">
                    <MapPin size={10} className="shrink-0" />
                    <span className="line-clamp-1">{property.bairro} — {property.cidade}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-1.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white">
                    {formatPrice(property.preco)}
                  </span>
                  
                  {/* Botão toggle de Vendido */}
                  <button
                    type="button"
                    disabled={actionId === property.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSold(property);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold flex items-center gap-1 transition-all ${
                      property.vendido
                        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                        : 'bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-900/30 text-red-650 dark:text-red-400 border border-red-100/50 dark:border-red-900/20'
                    }`}
                    title={property.vendido ? 'Reativar Imóvel' : 'Marcar como Vendido'}
                  >
                    {actionId === property.id ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : property.vendido ? (
                      <>
                        <RotateCcw size={10} />
                        <span>Reativar</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={10} />
                        <span>Marcar Vendido</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 text-center">
            <Building size={36} className="stroke-1 mb-2 text-slate-300 dark:text-slate-700" />
            <span className="text-xs font-bold text-slate-550">Nenhum imóvel cadastrado</span>
            <p className="text-[10px] text-slate-450 mt-1 max-w-[200px] leading-relaxed">
              Você ainda não cadastrou nenhuma captação no sistema.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
