import React, { useState, useEffect } from 'react';
import { getConstrutoras, addConstrutora, updateConstrutora, deleteConstrutora } from '../services/propertyService';
import { Plus, Edit2, Trash2, Check, X, Building, Loader2 } from 'lucide-react';

export default function ConstrutorasTab() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newNome, setNewNome] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados de edição inline
  const [editingId, setEditingId] = useState(null);
  const [editingNome, setEditingNome] = useState('');

  // Ações de submissão
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await getConstrutoras();
      setList(data || []);
    } catch (err) {
      setErrorMsg('Erro ao carregar construtoras.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newNome.trim()) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const created = await addConstrutora(newNome.trim());
      if (created) {
        setList(prev => [...prev, created].sort((a, b) => a.nome.localeCompare(b.nome)));
        setNewNome('');
        setSuccessMsg('Construtora adicionada com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg('Erro ao cadastrar construtora. Verifique se o nome já existe.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditingNome(item.nome);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingNome('');
  };

  const handleSaveEdit = async (id) => {
    if (!editingNome.trim()) return;
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const updated = await updateConstrutora(id, editingNome.trim());
      if (updated) {
        setList(prev => prev.map(item => item.id === id ? updated : item).sort((a, b) => a.nome.localeCompare(b.nome)));
        setEditingId(null);
        setEditingNome('');
        setSuccessMsg('Construtora atualizada com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg('Erro ao salvar alteração.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Deseja realmente excluir permanentemente a construtora "${name}"?`)) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await deleteConstrutora(id);
      setList(prev => prev.filter(item => item.id !== id));
      setSuccessMsg('Construtora removida com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg('Erro ao remover construtora. Ela pode estar vinculada a captações ativas.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 animate-fadeIn">
      {/* Cabeçalho */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
          <Building size={16} />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white">
            Cadastro de Construtoras
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Gerencie as empresas para atribuição de responsabilidade / averbação
          </p>
        </div>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="mb-3 p-3 text-xs bg-red-50 dark:bg-red-950/20 border border-red-150 dark:border-red-900/40 text-red-600 dark:text-red-400 font-semibold rounded-xl">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mb-3 p-3 text-xs bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 font-semibold rounded-xl">
          {successMsg}
        </div>
      )}

      {/* Formulário de Adição Rápida */}
      <form onSubmit={handleAdd} className="mb-5 flex gap-2 shrink-0">
        <input
          type="text"
          value={newNome}
          onChange={(e) => setNewNome(e.target.value)}
          placeholder="Nome da construtora (ex: Construtora Plaenge)"
          className="flex-grow text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium transition"
          required
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !newNome.trim()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-500/40 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-sm"
        >
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          <span>Adicionar</span>
        </button>
      </form>

      {/* Listagem com Scroll */}
      <div className="flex-grow overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
            <Loader2 size={24} className="animate-spin text-slate-400" />
            <span className="text-[10px] uppercase font-bold tracking-wider">Carregando construtoras...</span>
          </div>
        ) : list.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {list.map((item) => (
              <div 
                key={item.id} 
                className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-950/20 transition-colors"
              >
                {editingId === item.id ? (
                  <div className="flex items-center gap-2 flex-grow pr-4">
                    <input
                      type="text"
                      value={editingNome}
                      onChange={(e) => setEditingNome(e.target.value)}
                      className="flex-grow text-xs border border-slate-250 dark:border-slate-800 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 focus:outline-none"
                      required
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveEdit(item.id)}
                      disabled={submitting || !editingNome.trim()}
                      className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-450 transition"
                      title="Salvar"
                    >
                      <Check size={13} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      title="Cancelar"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 pr-3">
                      <Building size={14} className="text-slate-400 shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {item.nome}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleStartEdit(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Editar nome"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.nome)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-650 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Excluir construtora"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
            <Building size={32} className="stroke-1 mb-2 text-slate-300 dark:text-slate-700" />
            <span className="text-xs font-bold text-slate-500">Nenhuma construtora cadastrada</span>
            <p className="text-[10px] text-slate-400 mt-1 max-w-[200px]">
              Utilize o campo acima para adicionar a primeira construtora no banco.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
