import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Edit2, Trash2, Check, X, Shield, Users, Mail, ToggleLeft, ToggleRight, Key } from 'lucide-react';

export default function UserManagementTab() {
  const { profiles, addProfile, updateProfile, deleteProfile, resetPassword, user: currentUser } = useAuth();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  
  // Estados de formulário (criação e edição)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('corretor');
  const [password, setPassword] = useState('');
  const [sendInvite, setSendInvite] = useState(true);
  
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('corretor');
  const [editAtivo, setEditAtivo] = useState(true);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !email) {
      setErrorMsg('Por favor, preencha os campos obrigatórios (Nome e E-mail).');
      return;
    }

    if (!password && !sendInvite) {
      setErrorMsg('Por favor, defina uma senha ou ative o envio de convite por e-mail.');
      return;
    }

    const tempPassword = password || Math.random().toString(36).slice(-10) + 'A1!';

    try {
      const emailClean = email.trim().toLowerCase();
      await addProfile({
        nome: name,
        email: emailClean,
        role: role,
        senha: tempPassword,
        ativo: true
      });
      
      if (sendInvite) {
        try {
          await resetPassword(emailClean);
        } catch (inviteErr) {
          console.warn('Erro ao disparar e-mail de convite, mas perfil foi criado:', inviteErr);
        }
      }

      // Reseta formulário
      setName('');
      setEmail('');
      setPassword('');
      setRole('corretor');
      setSendInvite(true);
      setShowAddForm(false);
      setSuccessMsg(sendInvite 
        ? 'Consultor cadastrado e convite de senha enviado por e-mail!' 
        : 'Consultor cadastrado com sucesso no sistema e no Supabase!'
      );
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao cadastrar consultor.');
    }
  };

  const handleResetPassword = async (email) => {
    if (window.confirm(`Deseja enviar um e-mail de redefinição de senha para "${email}"?`)) {
      setErrorMsg('');
      setSuccessMsg('');
      try {
        await resetPassword(email);
        setSuccessMsg(`E-mail de redefinição enviado com sucesso para ${email}!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } catch (err) {
        setErrorMsg(err.message || 'Erro ao enviar e-mail de redefinição.');
      }
    }
  };

  const handleStartEdit = (user) => {
    setEditingUserId(user.id);
    setEditName(user.nome);
    setEditRole(user.role);
    setEditAtivo(user.ativo);
    setErrorMsg('');
  };

  const handleSaveEdit = async (id) => {
    setErrorMsg('');
    try {
      await updateProfile(id, {
        nome: editName,
        role: editRole,
        ativo: editAtivo
      });
      setEditingUserId(null);
      setSuccessMsg('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar alterações.');
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (id === 'admin-id' || id === currentUser?.id) {
      alert('Operação negada: Você não pode excluir a sua própria conta de administrador.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir permanentemente o cadastro do consultor "${name}"?`)) {
      setErrorMsg('');
      try {
        await deleteProfile(id);
        setSuccessMsg('Consultor excluído com sucesso!');
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) {
        setErrorMsg(err.message || 'Erro ao excluir consultor.');
      }
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'master':
        return 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50';
      case 'gerente':
        return 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-355 border border-slate-100 dark:border-slate-750';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-300">
      
      {/* Header do Painel */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-emerald-500" />
          <h2 className="text-xs font-extrabold text-slate-850 dark:text-slate-100 uppercase tracking-wider">Controle da Equipe</h2>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setErrorMsg('');
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-extrabold transition shadow-sm"
        >
          <UserPlus size={12} />
          <span>{showAddForm ? 'Cancelar' : 'Novo Consultor'}</span>
        </button>
      </div>

      {/* Feedbacks de Operação */}
      {errorMsg && (
        <div className="mb-4 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 text-[10px] font-bold">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
          {successMsg}
        </div>
      )}

      {/* Form de Cadastro */}
      {showAddForm && (
        <form onSubmit={handleAddUser} className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 flex flex-col gap-3 animate-fadeIn">
          <span className="text-[10px] font-extrabold text-slate-650 dark:text-slate-400 uppercase">Novo Acesso</span>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João Silva"
                className="text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                required
              />
            </div>
            
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Cargo / Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="text-[11px] border border-slate-200 dark:border-slate-850 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none"
              >
                <option value="corretor">Corretor</option>
                <option value="gerente">Gerente</option>
                <option value="master">Master / Admin</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Endereço de E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@imobiliaria.com"
                className="text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Senha de Acesso {sendInvite ? '(Opcional)' : ''}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={sendInvite ? "Gerada automaticamente se vazio" : "Defina a senha"}
                className="text-[11px] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                required={!sendInvite}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 py-1 px-1">
            <input
              type="checkbox"
              id="sendInvite"
              checked={sendInvite}
              onChange={(e) => setSendInvite(e.target.checked)}
              className="accent-emerald-500 w-3.5 h-3.5 cursor-pointer rounded"
            />
            <label htmlFor="sendInvite" className="text-[10px] font-bold text-slate-650 dark:text-slate-400 cursor-pointer select-none">
              ✉️ Enviar convite por e-mail para o consultor definir a própria senha
            </label>
          </div>

          <button
            type="submit"
            className="mt-1 py-2 rounded-lg bg-slate-900 dark:bg-slate-850 hover:bg-slate-800 text-white font-bold text-[10px] transition uppercase tracking-wider"
          >
            Cadastrar Consultor
          </button>
        </form>
      )}

      {/* Lista de Perfis */}
      <div className="flex-grow overflow-y-auto space-y-3">
        {profiles.map(p => {
          const isSelf = p.id === currentUser?.id;
          const isDefaultAdmin = p.id === 'admin-id';
          const isEditing = editingUserId === p.id;

          return (
            <div
              key={p.id}
              className={`p-3 rounded-2xl border transition ${
                isEditing 
                  ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/10' 
                  : 'border-slate-100 dark:border-slate-800/60 bg-white dark:bg-slate-950/40'
              }`}
            >
              {isEditing ? (
                /* Formulário de Edição Interno */
                <div className="flex flex-col gap-2.5 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">Editando Perfil</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleSaveEdit(p.id)}
                        className="p-1 rounded bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                        title="Salvar"
                      >
                        <Check size={12} />
                      </button>
                      <button
                        onClick={() => setEditingUserId(null)}
                        className="p-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-350"
                        title="Cancelar"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-xs border border-slate-200 dark:border-slate-850 rounded px-2 py-1 bg-white dark:bg-slate-900 text-slate-850"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="flex items-center gap-1.5">
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        disabled={isDefaultAdmin}
                        className="text-[11px] border border-slate-200 dark:border-slate-850 rounded px-1.5 py-1 bg-white dark:bg-slate-900"
                      >
                        <option value="corretor">Corretor</option>
                        <option value="gerente">Gerente</option>
                        <option value="master">Master</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditAtivo(!editAtivo)}
                      disabled={isDefaultAdmin || isSelf}
                      className="flex items-center justify-center gap-1 text-[10px] font-bold py-1 bg-slate-100 dark:bg-slate-800 rounded hover:bg-slate-200 transition"
                    >
                      {editAtivo ? (
                        <>
                          <ToggleRight size={14} className="text-emerald-500" />
                          <span className="text-emerald-600">Ativo</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft size={14} className="text-slate-400" />
                          <span className="text-slate-500">Inativo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Exibição Padrão */
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100">
                        {p.nome}
                      </h4>
                      {isSelf && (
                        <span className="text-[8px] bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-1 py-0.2 rounded font-extrabold uppercase">
                          Você
                        </span>
                      )}
                      {!p.ativo && (
                        <span className="text-[8px] bg-red-150 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 px-1 py-0.2 rounded font-bold uppercase">
                          Inativo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                      <Mail size={10} />
                      <span className="truncate max-w-[170px]">{p.email}</span>
                    </div>

                    <div className="mt-2">
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full tracking-wider ${getRoleBadge(p.role)}`}>
                        {p.role}
                      </span>
                    </div>
                  </div>

                  {/* Controles */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleResetPassword(p.email)}
                      className="p-1 rounded-lg border border-slate-100 dark:border-slate-850 text-slate-500 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      title="Enviar Redefinição de Senha por E-mail"
                    >
                      <Key size={12} />
                    </button>
                    <button
                      onClick={() => handleStartEdit(p)}
                      className="p-1 rounded-lg border border-slate-100 dark:border-slate-850 text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                      title="Editar Cargo/Perfil"
                    >
                      <Edit2 size={12} />
                    </button>
                    {!isSelf && !isDefaultAdmin && (
                      <button
                        onClick={() => handleDeleteUser(p.id, p.nome)}
                        className="p-1 rounded-lg border border-slate-100 dark:border-slate-850 text-slate-500 hover:text-red-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                        title="Remover Consultor"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}
