import React, { useState } from 'react';
import { X, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { addLead } from '../services/leadService';

export default function LeadModal({ isOpen, onClose, property }) {
  if (!isOpen || !property) return null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(
    `Olá! Tenho interesse no empreendimento "${property.titulo}" em ${property.bairro}, ${property.cidade}. Por favor, me envie mais informações.`
  );
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const leadData = {
      propertyId: property.id,
      propertyTitle: property.titulo,
      clientName: name,
      clientEmail: email,
      clientPhone: phone.replace(/\D/g, ''), // Salva apenas números
      clientMessage: message
    };

    // Simulando envio de rede rápida
    setTimeout(() => {
      addLead(leadData);
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800/50 overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <MessageSquare size={18} className="text-emerald-400" />
            <h3 className="font-sans font-bold text-sm">Falar com um Consultor</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          /* Sucesso */
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-500 animate-bounce">
              <CheckCircle size={32} />
            </div>
            <h4 className="text-md font-bold text-slate-800 dark:text-slate-100 mt-2">Mensagem Enviada!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] leading-relaxed">
              Sua solicitação de interesse foi registrada. Um corretor parceiro entrará em contato com você via WhatsApp em breve.
            </p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 text-xs font-bold transition"
            >
              Fechar Janela
            </button>
          </div>
        ) : (
          /* Formulário */
          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4 text-slate-800 dark:text-slate-200">
            <div className="text-center px-2">
              <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Empreendimento Selecionado</p>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50 line-clamp-1">{property.titulo}</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{property.bairro} — {property.cidade}</p>
            </div>

            <div className="flex flex-col gap-1 mt-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Seu Nome *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Pedro Henrique"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">E-mail para Contato *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: pedro@email.com"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">WhatsApp / Celular *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 41999998888"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sua Mensagem</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 hover:dark:bg-slate-700 font-bold text-xs transition shadow-md disabled:bg-slate-300"
            >
              {loading ? (
                <span>Enviando...</span>
              ) : (
                <>
                  <Send size={14} />
                  <span>Enviar Mensagem</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
