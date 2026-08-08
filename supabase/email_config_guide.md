# Guia de Configuração de E-mail Automático Gratuito (Supabase + Resend/Brevo)

Para enviar e-mails automáticos ao cadastrar novos consultores (e-mail de convite) e para redefinir senhas (reset password) de forma 100% gratuita, a melhor estratégia é conectar o **Supabase Auth** a um provedor de SMTP gratuito como o **Resend** ou **Brevo**.

Seguindo este método, você não precisa programar nenhuma linha de código adicional no frontend nem criar servidores complexos. O próprio Supabase cuidará de disparar os e-mails nativamente de forma segura e confiável!

---

## Opção Recomendada: Resend (Gratuito - 3.000 e-mails/mês)

O Resend é extremamente moderno, rápido e fácil de configurar.

### Passo 1: Criar Conta no Resend e Validar Domínio
1. Crie uma conta gratuita em [resend.com](https://resend.com).
2. Vá em **Domains** e adicione o domínio do seu site/empresa (ex: `zelonyimoveis.com.br`).
3. Adicione os registros DNS (TXT e MX) fornecidos pelo Resend no seu gerenciador de domínio (ex: Registro.br, Hostgator, Cloudflare) para validar que o domínio é seu.
4. Vá em **API Keys**, clique em **Create API Key**, dê permissão de escrita/envio e copie a chave gerada (ela começa com `re_`).

### Passo 2: Configurar no Painel do Supabase
1. Acesse o console do seu projeto no Supabase: [database.supabase.com](https://database.supabase.com).
2. Vá em **Project Settings** (ícone de engrenagem) > **Auth**.
3. Role a página até a seção **SMTP Provider** (Provedor SMTP).
4. Ative o switch **Enable Custom SMTP** (Habilitar SMTP Customizado).
5. Preencha as credenciais do Resend:
   * **Sender Email**: O e-mail de envio desejado (ex: `cadastro@zelonyimoveis.com.br` ou `contato@zelonyimoveis.com.br`).
   * **Sender Name**: `Mapa Zelony` ou `Zelony Imóveis`.
   * **Host**: `smtp.resend.com`
   * **Port**: `587`
   * **Username**: `resend`
   * **Password**: A sua API Key criada no Passo 1 (ex: `re_12345...`).
6. Clique em **Save** (Salvar).

---

## Opção Alternativa: Brevo (Gratuito - 300 e-mails/dia / 9.000/mês)

Se precisar de um limite diário maior, o Brevo é uma ótima alternativa de SMTP robusto.

### Passo 1: Obter credenciais SMTP no Brevo
1. Crie uma conta gratuita em [brevo.com](https://brevo.com).
2. Valide o domínio da sua empresa no painel do Brevo.
3. Clique no menu do seu perfil no topo direito e acesse **SMTP & API**.
4. Copie as chaves de SMTP fornecidas (Host, Porta, Login/Username e a Senha SMTP).

### Passo 2: Configurar no Painel do Supabase
1. No painel do Supabase > **Project Settings** > **Auth** > **SMTP Provider**:
   * **Sender Email**: O e-mail configurado no Brevo (ex: `contato@zelonyimoveis.com.br`).
   * **Sender Name**: `Mapa Zelony`.
   * **Host**: `smtp-relay.brevo.com`
   * **Port**: `587`
   * **Username**: Seu e-mail de login do Brevo (ou chave de API de SMTP).
   * **Password**: A chave gerada para o SMTP do Brevo.
2. Clique em **Save**.

---

## 📩 Personalizando os Modelos de E-mail

Agora que o SMTP está configurado, você pode personalizar os textos e links dos e-mails disparados pelo Supabase:

1. No painel do Supabase, acesse **Auth** > **Email Templates** (na barra lateral esquerda de configurações).
2. Você pode editar os seguintes modelos:
   * **Confirm Signup (Confirmação de Cadastro)**: Enviado automaticamente quando um novo usuário se registra ou é criado.
   * **Reset Password (Redefinição de Senha)**: Enviado quando o usuário solicita redefinição.
   * **Invite User (Convite de Usuário)**: E-mail que contém o link de ativação da conta.
3. Você pode escrever o texto em português, estilizar com HTML (deixar as cores e logo do Mapa Zelony) e incluir variáveis nativas do Supabase como `{{ .ConfirmationURL }}` (link de confirmação) e `{{ .Email }}` (e-mail do destinatário).

---

Pronto! Ao seguir este guia, o seu fluxo de e-mails para novos usuários e redefinição de senhas funcionará instantaneamente sem custo algum e sob a marca própria da **Zelony Imóveis**.
