# 🏦 Home Finance

Um aplicativo mobile de gestão financeira familiar desenvolvido com React Native, Expo e Supabase.

## 🚀 Funcionalidades

- 👨‍👩‍👧 **Gestão Familiar**: Organize finanças por grupo familiar
- 💳 **Contas Bancárias**: Monitore múltiplas contas
- 📊 **Transações**: Registre receitas e despesas
- 💰 **Cartões de Crédito**: Controle limite e fatura
- 💳 **Dívidas**: Acompanhe dívidas ativas
- 📈 **Análises**: Visualize relatórios e gráficos
- 🔐 **Segurança**: Autenticação via Supabase Auth
- 🎯 **Orçamentos**: Planeje e controle gastos

## 🛠️ Stack Técnico

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS + NativeWind
- **State Management**: Zustand
- **Routing**: Expo Router

## 📁 Estrutura do Projeto

```
home-finance/
├── app/
│   ├── (app)/              # Rotas autenticadas (tabs)
│   ├── (auth)/             # Rotas de autenticação
│   ├── _layout.tsx         # Layout raiz com proteção
│   └── ...
├── components/             # Componentes reutilizáveis
├── stores/                 # Zustand stores (auth, etc)
├── hooks/                  # Custom hooks
├── lib/                    # Utilitários e configurações
├── constants/              # Constantes e temas
├── supabase/               # Schemas SQL e migrations
└── assets/                 # Imagens e ícones
```

## 🗄️ Banco de Dados

### Tabelas Principais

- **families**: Grupos familiares
- **family_members**: Membros da família
- **accounts**: Contas bancárias
- **transactions**: Transações (receitas/despesas)
- **credit_cards**: Cartões de crédito
- **debts**: Dívidas ativas
- **debt_payments**: Pagamentos de dívidas

### Segurança RLS

Todas as tabelas possuem Row Level Security (RLS) para garantir que usuários só acessem seus próprios dados.

## 🚀 Quick Start

### Requisitos

- Node.js 18+
- Npm ou Yarn
- Supabase CLI (opcional)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/EuDavidev/home_finance.git
cd home-finance

# 2. Instale as dependências
npm install

# 3. Configure o .env com credenciais Supabase
cp .env.example .env.local

# 4. Inicie o desenvolvimento
npx expo start
```

### Variáveis de Ambiente

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🗄️ Setup do Banco de Dados

1. **Execute schema-families.sql** no Supabase SQL Editor
2. **Execute schema-contas-dividas.sql** para as tabelas adicionais
3. **(Opcional) Execute import-ofx-statement.sql** para importar dados do extrato

## 🔒 Autenticação

O app usa autenticação via Supabase Auth com:

- Email + Senha
- Verificação de email
- Session management automático
- Proteção de rotas

## 📝 Fluxo de Autenticação

1. **Onboarding** → Login/Register
2. **Family Setup** → Criar ou entrar em família
3. **Home** → Dashboard com dados da família

## 🚀 Deployment

### Vercel (Web)

```bash
npm run build
vercel deploy
```

### Expo Go / EAS Build

```bash
eas build --platform ios
eas build --platform android
```

## 🤝 Contribuindo

1. Crie uma branch (`git checkout -b feature/MinhaFuncionalidade`)
2. Commit as mudanças (`git commit -m 'feat: adicionar funcionalidade'`)
3. Push para a branch (`git push origin feature/MinhaFuncionalidade`)
4. Abra um Pull Request

## 📝 Commits

Use o padrão Conventional Commits:

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `docs:` documentação
- `style:` formatação
- `refactor:` refatoração
- `test:` testes
- `chore:` tarefas

## 📄 Licença

MIT License - veja o arquivo LICENSE

## 📞 Suporte

Para dúvidas ou problemas, abra uma Issue no GitHub.

---

**Desenvolvido com ❤️ por EuDavidev**
