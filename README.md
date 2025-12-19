# StockCount - Sistema de Contagem de Inventário

PWA offline-first para contagem de inventário com escaneamento de código de barras, sincronização por event sourcing e backend Supabase.

## 🚀 Funcionalidades

- ✅ **PWA Offline-First**: Funciona sem internet, sincroniza quando conectado
- ✅ **Scanner de Código de Barras**: Suporte para USB/Bluetooth (wedge) e câmera
- ✅ **Sincronização Automática**: Event sourcing com idempotência
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

Renomeie o arquivo `env.local` para `.env`:
```bash
# Windows
ren env.local .env

# Linux/Mac
mv env.local .env
```

O arquivo já contém as credenciais do seu projeto Supabase.

3. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

4. **Acesse o aplicativo:**
Abra http://localhost:3000 no navegador.

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

### Criar Sessão de Contagem
1. Vá para **Sessões** no menu inferior
2. Toque no botão **+** para criar nova sessão
3. Defina título e localização
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
│   │   ├── barcode/  # Scanner de código de barras
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
- **Scanner**: ZXing (câmera) + Keyboard Wedge
- **Backend**: Supabase (PostgreSQL + Auth + RPC)
- **Validação**: Zod

## 📞 Suporte

Mercadinho Aratuba © 2024

