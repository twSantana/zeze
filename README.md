<div align="center">
  <img src="./public/logo.png" alt="SellMaps Logo" width="380" style="border-radius: 20px;" />

  <h1>🗺️ SellMaps — Plataforma de Mapeamento & Inteligência Imobiliária</h1>

  <p><em>Sistema moderno, responsivo e de alta performance para mapeamento geográfico, busca avançada e gestão de empreendimentos imobiliários para corretoras, gerentes e consultores.</em></p>
</div>

---

## 🚀 Visão Geral

O **SellMaps** é uma solução completa desenvolvida para transformar a forma como corretores e consultores imobiliários apresentam e gerenciam seus empreendimentos. Integrando um mapa interativo reativo a um painel de gestão corporativo, o SellMaps oferece busca geográfica em tempo real, gestão de captações, controle de acessos (RBAC) e integração direta com WhatsApp para geração de leads.

---

## ✨ Principais Funcionalidades

### 📍 1. Experiência de Mapa Interativo
- **Pop-up no Hover**: Exibição instantânea das informações do imóvel (foto de capa, título, faixa de preço, tipologia e botão de ação) ao passar o cursor sobre qualquer marcador no mapa.
- **Auto-Spiderfy em Clusters**: Quando um imóvel hovered está dentro de um grupo/cluster de marcadores, o sistema desdobra as ramificações automaticamente sem necessidade de cliques excessivos.
- **Carregamento sob Demanda por Bounding Box**: Otimização extrema de performance que carrega apenas os imóveis contidos no viewport visível do mapa.

### 💼 2. Gestão de Imóveis & Modais
- **Detalhes Otimizados**: Modal com galeria de fotos, especificações técnicas, diferenciais do condomínio e link para o Google Drive / Tabela de vendas.
- **Rodapé de Ações Fixo**: Botões de ação (*Falar com Consultor*, *Google Drive*, *Editar*, *Excluir*) sempre acessíveis na parte inferior da tela com área de conteúdo scrollável independente.
- **Contato Direto via WhatsApp**: Direcionamento automático para o WhatsApp do corretor responsável pela captação do imóvel.

### 🖼️ 3. Resiliência de Imagens (`SafeImage`)
- Componente nativo de tratamento de mídias que realiza **sanitização de URLs** (upgrade automático de `http` para `https` e codificação de caracteres especiais).
- Tratamento gracioso de erros (`onError`) exibindo um placeholder moderno com aviso de *"Imagem indisponível"* em caso de links quebrados.

### 👥 4. Controle de Acessos & Perfis (RBAC)
- **Cargos (Roles)**: `Master`, `Gerente` e `Corretor`.
- **Aba Meus Imóveis**: Permite que cada consultor gerencie de forma centralizada suas próprias captações.
- **Aba Equipe (Master/Gerente)**: Cadastro de novos consultores, atualização de perfis e atribuição de cargos.
- **Aba Parceiros (Master)**: Registro e acompanhamento de construtoras parceiras.
- **Primeiro Acesso Obrigatório**: Validação de número de WhatsApp profissional para garantir a integridade dos leads.

### 🌙 5. Design & Dark Mode
- Interface totalmente responsiva (*Mobile-First* com Bottom Sheet e Desktop com Sidebar).
- Suporte a tema claro e escuro (Dark Mode) com persistência automática de preferência.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Estilização**: [TailwindCSS](https://tailwindcss.com/), Vanilla CSS utilities
- **Mapas**: [Leaflet](https://leafletjs.com/), [React-Leaflet](https://react-leaflet.js.org/), [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Backend & Banco de Dados**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage & RLS)

---

## 📁 Estrutura do Projeto

```text
sellmaps/
├── public/                 # Assets estáticos (favicons, imagens de fundo)
├── src/
│   ├── assets/             # Recursos de mídia
│   ├── components/         # Componentes da aplicação
│   │   ├── admin/          # Componentes das abas administrativas
│   │   ├── ui/             # Componentes reutilizáveis de UI (SafeImage, Toast, Button, Input, Select, Badge)
│   │   ├── AdminModal.jsx          # Modal de criação/edição de imóveis
│   │   ├── BottomSheet.jsx         # Interface mobile para exibição da lista
│   │   ├── ConstrutorasTab.jsx     # Aba de construtoras parceiras
│   │   ├── LeadModal.jsx           # Modal de contato/captação de leads
│   │   ├── LoginScreen.jsx         # Tela de autenticação
│   │   ├── MapView.jsx             # Componente do mapa Leaflet & eventos
│   │   ├── MyPropertiesTab.jsx     # Aba "Meus Imóveis"
│   │   ├── PropertyCard.jsx        # Card de apresentação do imóvel
│   │   ├── PropertyDetailModal.jsx # Modal detalhada do imóvel
│   │   ├── Sidebar.jsx             # Barra lateral com busca e filtros
│   │   └── UserManagementTab.jsx   # Gestão de usuários e permissões
│   ├── context/
│   │   └── AuthContext.jsx # Provedor de contexto de autenticação & perfil
│   ├── services/
│   │   ├── propertyService.js      # Comunicação com a API de Imóveis no Supabase
│   │   └── supabase.js             # Inicialização do cliente Supabase
│   ├── App.jsx             # Componente principal e roteamento de modais
│   ├── index.css           # Design tokens, variáveis e scrollbars
│   └── main.jsx            # Ponto de entrada do React
├── supabase/               # Schemas SQL e guias de migração para o banco de dados
├── index.html              # HTML5 principal
├── package.json            # Dependências e scripts
└── README.md               # Documentação do projeto
```

---

## ⚡ Como Rodar o Projeto Localmente

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**

### 1. Clonar o Repositório
```bash
git clone https://github.com/twSantana/zeze.git
cd sistema-mapeamento-imobiliario
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto e adicione suas credenciais do Supabase:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 4. Executar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse o aplicativo em `http://localhost:5173`.

---

## 📜 Scripts Disponíveis

- `npm run dev`: Inicia o servidor local de desenvolvimento com HMR.
- `npm run build`: Cria o bundle otimizado para produção na pasta `dist/`.
- `npm run preview`: Visualiza localmente o build de produção.
- `npm run lint`: Executa a verificação de código usando Oxlint.

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

Os scripts para provisionar o banco de dados estão localizados no diretório `/supabase`:
- `schema.sql`: Estrutura inicial com tabelas `profiles`, `imoveis`, `construtoras` e `leads`.
- `update_schema_v*.sql`: Migrações incrementais para suporte a mídias, geolocalização por Bounding Box, permissões RLS e WhatsApp obrigatório.

---

## 📄 Licença

Este projeto é de propriedade privada para uso de mapeamento e inteligência imobiliária. Todos os direitos reservados.
