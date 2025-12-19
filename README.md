# StockCount - Sistema de Contagem de Inventário

PWA offline-first para contagem de inventário com escaneamento de código de barras, sincronização por event sourcing e backend Supabase.

## 🚀 Funcionalidades

- ✅ **PWA Offline-First**: Funciona sem internet, sincroniza quando conectado
- ✅ **Scanner de Código de Barras**: Suporte para USB/Bluetooth (wedge) e câmera
- ✅ **Sincronização Automática**: Event sourcing com idempotência (a cada 1 hora)
- ✅ **Sessões de Contagem**: Organize contagens por sessões
- ✅ **Relatórios**: Visualize e exporte dados em CSV
- ✅ **Multi-dispositivo**: Sincronize entre vários dispositivos

## 📋 Pré-requisitos

- Node.js 18+
- Conta Supabase (já configurada)

## 🔧 Instalação

1. **Instale as dependências:**
```bash
cd stockcount
npm install
```

2. **Configure as variáveis de ambiente:**

Crie um arquivo `.env` na raiz do projeto:
```bash
VITE_SUPABASE_URL=https://irqyjmdvyzipoviabsdx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlycXlqbWR2eXppcG92aWFic2R4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNzY0NjksImV4cCI6MjA4MTc1MjQ2OX0.T8PSUwAEsXOfE0GBkUo9wtZaZxttlHX5JEEDt9abWyk
```

3. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

4. **Acesse o aplicativo:**
Abra http://localhost:3000 no navegador.

## 🌐 Deploy na Vercel (RECOMENDADO)

**⚠️ IMPORTANTE**: A câmera e instalação PWA **só funcionam em HTTPS**!

### Por que Vercel?
- ✅ HTTPS automático
- ✅ PWA funciona perfeitamente
- ✅ Câmera pede permissão corretamente
- ✅ Deploy automático via Git
- ✅ Gratuito

### Como fazer deploy:

1. Faça push do código para o GitHub (já feito!)
2. Acesse https://vercel.com
3. Clique em "Import Project"
4. Selecione o repositório `mercadinhofrancisco`
5. Vercel detecta automaticamente as configurações
6. Clique em "Deploy"

**Pronto!** Em ~2 minutos você terá:
- URL HTTPS personalizada (ex: `mercadinho.vercel.app`)
- PWA instalável
- Câmera funcionando
- Sincronização automática

## 📱 Sobre o Scanner de Câmera

### Como funciona?
- Usa a biblioteca **ZXing** (JavaScript puro)
- Roda 100% no navegador (frontend)
- **NÃO precisa de Python ou backend**
- É a mesma biblioteca usada em apps Android

### Requisitos:
- ✅ **HTTPS** (Vercel provê automaticamente)
- ✅ Navegador moderno (Chrome, Safari, Firefox)
- ✅ Permissão da câmera (browser solicita)

### Em localhost:
- ❌ Pode não funcionar (HTTP não seguro)
- ⚠️ Alguns browsers bloqueiam câmera em HTTP

### Em produção (Vercel):
- ✅ Funciona perfeitamente
- ✅ Browser pede permissão
- ✅ Detecção rápida e precisa

## 🔐 Primeiro Acesso

Para fazer login, você precisa criar um usuário no Supabase:

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Vá para **Authentication** > **Users**
3. Clique em **Add user** > **Create new user**
4. Preencha email e senha
5. Após criar o usuário, vá para **Table Editor** > **users_profile**
6. Adicione um registro com:
   - `id`: (copie o UUID do usuário criado)
   - `company_id`: `00000000-0000-0000-0000-000000000001`
   - `role`: `admin`
   - `name`: Seu nome
   - `active`: `true`

## 📱 Como Usar

### Instalar o PWA
1. Acesse o site na Vercel (HTTPS)
2. No Chrome/Edge: Aparecerá um ícone de instalação na barra de endereço
3. No iOS Safari: Toque em "Compartilhar" > "Adicionar à Tela de Início"
4. O app abrirá em tela cheia, como um app nativo!

### Cadastrar Produto com Scanner
1. Vá para **Produtos** no menu
2. Toque no botão **+**
3. Escolha **USB/Bluetooth** ou **Câmera**
4. Escaneie o código de barras
5. Digite o nome do produto
6. Salve

### Criar Sessão de Contagem
1. Vá para **Sessões** no menu inferior
2. Toque no botão **+** para criar nova sessão
3. Defina título
4. Clique em **Criar e Iniciar**

### Escanear Produtos
1. Na tela de contagem, use o scanner USB/Bluetooth ou câmera
2. O produto aparecerá automaticamente
3. Use os botões **+** e **-** para ajustar quantidade
4. Produtos não cadastrados podem ser criados na hora

### Exportar Relatório
1. Vá para **Relatórios**
2. Selecione a sessão desejada
3. Clique em **Exportar CSV**

## 🏗️ Build para Produção

```bash
npm run build
```

Os arquivos serão gerados na pasta `dist/`.

## 📦 Estrutura do Projeto

```
stockcount/
├── public/           # Ícones PWA
├── src/
│   ├── components/   # Componentes React
│   │   ├── barcode/  # Scanner de código de barras (ZXing)
│   │   ├── common/   # Componentes comuns
│   │   ├── counting/ # Componentes de contagem
│   │   └── layout/   # Layout da aplicação
│   ├── db/           # Banco local (Dexie/IndexedDB)
│   ├── hooks/        # React hooks customizados
│   ├── pages/        # Páginas da aplicação
│   ├── services/     # Serviços (Supabase)
│   ├── theme/        # Tema MUI
│   └── types/        # Tipos TypeScript
├── .env              # Variáveis de ambiente
└── vite.config.ts    # Configuração Vite + PWA
```

## 🛠️ Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Material-UI (MUI) v6
- **PWA**: vite-plugin-pwa + Workbox
- **Banco Local**: Dexie.js (IndexedDB)
- **Scanner**: ZXing (câmera - 100% JavaScript) + Keyboard Wedge
- **Backend**: Supabase (PostgreSQL + Auth + RPC)
- **Validação**: Zod
- **Deploy**: Vercel (HTTPS + CI/CD)

## 🔄 Sincronização

- **Intervalo**: A cada 1 hora
- **Automática**: Quando volta a ficar online
- **Offline-first**: Trabalhe sem internet, sincroniza depois
- **Idempotência**: Não duplica dados

## 📞 Suporte

Mercadinho Aratuba © 2024

---

**Deploy URL**: Após deploy na Vercel, sua URL aparecerá aqui automaticamente!
