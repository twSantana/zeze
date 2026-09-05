import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Edit2, Trash2, Check, X, Shield, Users, Mail, Key, Sparkles, Send } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Badge } from './ui/Badge';
import { useToast } from './ui/Toast';

export default function UserManagementTab() {
  const { profiles, addProfile, updateProfile, deleteProfile, resetPassword, user: currentUser } = useAuth();
  const toast = useToast();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Estados de formulário (criação)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('corretor');
  const [password, setPassword] = useState('');
  const [sendInvite, setSendInvite] = useState(true);

  // Estados de formulário (edição)
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('corretor');
  const [editAtivo, setEditAtivo] = useState(true);

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (!name || !email) {
      toast.error('Preencha os campos obrigatórios (Nome e E-mail).');
      return;
    }

    if (!password && !sendInvite) {
      toast.error('Defina uma senha provisória ou marque a opção de enviar convite por e-mail.');
      return;
    }

    setLoadingAction(true);
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
          console.warn('Erro ao disparar convite por e-mail:', inviteErr);
        }
      }

      // Reseta formulário
      setName('');
      setEmail('');
      setPassword('');
      setRole('corretor');
      setSendInvite(true);
      setShowAddForm(false);
      
      toast.success(
        sendInvite
          ? 'Consultor cadastrado com sucesso! E-mail de convite enviado.'
          : 'Consultor cadastrado com sucesso no sistema!'
      );
    } catch (err) {
      toast.error(err.message || 'Erro ao cadastrar consultor.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResetPassword = async (email) => {
    try {
      await resetPassword(email);
      toast.success(`E-mail de redefinição de senha enviado para ${email}!`);
    } catch (err) {
      toast.error(err.message || 'Erro ao enviar e-mail de redefinição.');
    }
  };

  const handleStartEdit = (userProfile) => {
    setEditingUserId(userProfile.id);
    setEditName(userProfile.nome);
    setEditRole(userProfile.role);
    setEditAtivo(userProfile.ativo);
  };

  const handleSaveEdit = async (id) => {
    setLoadingAction(true);
    try {
      await updateProfile(id, {
        nome: editName,
        role: editRole,
        ativo: editAtivo
      });
      setEditingUserId(null);
      toast.success('Perfil de consultor atualizado!');
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar alterações.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleDeleteUser = async (id, nameStr) => {
    if (id === 'admin-id' || id === currentUser?.id) {
      toast.error('Você não pode excluir sua própria conta de administrador.');
      return;
    }

    setLoadingAction(true);
    try {
      await deleteProfile(id);
      toast.success(`Consultor "${nameStr}" removido com sucesso.`);
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir consultor.');
    } finally {
      setLoadingAction(false);
    }
  };

  const getRoleBadgeVariant = (roleVal) => {
    switch (roleVal) {
      case 'master':
        return 'purple';
      case 'gerente':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (roleVal) => {
    switch (roleVal) {
      case 'master':
        return 'Master / Admin';
      case 'gerente':
        return 'Gerente';
      default:
        return 'Corretor';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors duration-300">
      
      {/* Header do Painel */}
      <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Controle de Equipe
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gestão de acessos e consultores ativos
            </p>
          </div>
        </div>

        <Button
          variant={showAddForm ? 'outline' : 'primary'}
          size="sm"
          icon={showAddForm ? X : UserPlus}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancelar' : 'Novo Consultor'}
        </Button>
      </div>

      {/* Form de Cadastro */}
      {showAddForm && (
        <form onSubmit={handleAddUser} className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col gap-4 animate-fadeIn shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Novo Acesso de Consultor
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Nome Completo"
              placeholder="Ex: João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            
            <Input
              label="Endereço de E-mail"
              type="email"
              placeholder="joao@imobiliaria.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Nível de Permissão"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="corretor">Corretor / Consultor</option>
              <option value="gerente">Gerente de Vendas</option>
              <option value="master">Administrador Master</option>
            </Select>

            <Input
              label="Senha Provisória (Opcional)"
              type="password"
              placeholder="Defina ou deixe automático"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400 select-none">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              Enviar e-mail de convite para redefinição de senha
            </label>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loadingAction}
              icon={Send}
            >
              Cadastrar Consultor
            </Button>
          </div>
        </form>
      )}

      {/* Lista de Consultores */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
        {profiles.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            Nenhum consultor cadastrado até o momento.
          </div>
        ) : (
          profiles.map((p) => {
            const isEditing = editingUserId === p.id;

            return (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      containerClassName="sm:flex-1"
                    />
                    <Select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      containerClassName="sm:w-40"
                    >
                      <option value="corretor">Corretor</option>
                      <option value="gerente">Gerente</option>
                      <option value="master">Master</option>
                    </Select>
                    <Select
                      value={editAtivo ? 'true' : 'false'}
                      onChange={(e) => setEditAtivo(e.target.value === 'true')}
                      containerClassName="sm:w-28"
                    >
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </Select>
                    <div className="flex items-center gap-1.5 justify-end">
                      <Button
                        size="sm"
                        variant="primary"
                        icon={Check}
                        onClick={() => handleSaveEdit(p.id)}
                        isLoading={loadingAction}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={X}
                        onClick={() => setEditingUserId(null)}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0">
                        {p.nome ? p.nome.substring(0, 2).toUpperCase() : 'US'}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">
                            {p.nome}
                          </span>
                          <Badge variant={getRoleBadgeVariant(p.role)} size="sm">
                            {getRoleLabel(p.role)}
                          </Badge>
                          {!p.ativo && (
                            <Badge variant="danger" size="sm">Inativo</Badge>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {p.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Key}
                        title="Enviar redefinição de senha"
                        onClick={() => handleResetPassword(p.email)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Edit2}
                        title="Editar consultor"
                        onClick={() => handleStartEdit(p)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={Trash2}
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                        title="Excluir consultor"
                        onClick={() => handleDeleteUser(p.id, p.nome)}
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
