const LEADS_STORAGE_KEY = 'rmc_leads_mock';

const INITIAL_MOCK_LEADS = [
  {
    id: 'lead-1',
    propertyId: 'f87a87e5-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
    propertyTitle: 'Vitra Batel Residence',
    clientName: 'Juliana Mendes de Souza',
    clientEmail: 'juliana.souza@gmail.com',
    clientPhone: '41998887766',
    clientMessage: 'Olá! Tenho muito interesse neste imóvel no Batel. Gostaria de agendar uma visita para este sábado de manhã se possível.',
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString() // 5 horas atrás
  },
  {
    id: 'lead-2',
    propertyId: 'a12b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d',
    propertyTitle: 'Residencial Pinhais Park',
    clientName: 'Thiago Silva Neto',
    clientEmail: 'thiago.neto@hotmail.com',
    clientPhone: '41987654321',
    clientMessage: 'Gostaria de saber se este apartamento aceita financiamento pela Caixa Econômica Federal e qual o valor do condomínio mensal.',
    criado_em: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() // 20 horas atrás
  }
];

function getStoredLeads() {
  const data = localStorage.getItem(LEADS_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_LEADS));
    return INITIAL_MOCK_LEADS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_LEADS));
    return INITIAL_MOCK_LEADS;
  }
}

function saveStoredLeads(leads) {
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
}

export function getLeads() {
  return getStoredLeads();
}

export function addLead(leadData) {
  const leads = getStoredLeads();
  const newLead = {
    ...leadData,
    id: 'lead-' + Math.random().toString(36).substring(2, 9),
    criado_em: new Date().toISOString()
  };
  leads.unshift(newLead);
  saveStoredLeads(leads);
  return newLead;
}

export function deleteLead(id) {
  const leads = getStoredLeads();
  const filtered = leads.filter(l => l.id !== id);
  saveStoredLeads(filtered);
  return true;
}
