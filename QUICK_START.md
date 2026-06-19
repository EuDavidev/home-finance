# 🚀 Quick Start - Deploy Home Finance APK

## ⚡ 5 Passos para Instalar no Celular

### Passo 1: Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Passo 2: Fazer Login no Expo

```bash
npx expo login

# Use suas credenciais do https://expo.dev
```

### Passo 3: Gerar APK

```bash
cd c:\Users\davis\OneDrive\Documentos\home_finance\home-finance

# Build de teste (mais rápido, ~10 min)
eas build --platform android --profile preview

# Ou build de produção (mais otimizado)
eas build --platform android --profile production
```

**O build vai:**

- Compilar seu app React Native
- Gerar APK
- Retornar um link para download

### Passo 4: Instalar no Celular

**Opção A: Download direto**

1. Abra o link retornado
2. Clique em "Download APK"
3. Toque no arquivo baixado
4. Permita instalação de "Fontes desconhecidas"

**Opção B: Com USB (ADB)**

```bash
# Com celular conectado
adb install app-release.apk
```

### Passo 5: Testar!

1. ✅ Abra o app
2. ✅ Faça login
3. ✅ Vá para "Mais Opções" > "Importar Extrato"
4. ✅ Carregue seu arquivo OFX
5. ✅ Veja suas transações importadas! 🎉

---

## 📱 Testar Sincronização em Tempo Real

### Cenário: Você + Esposa

**Dispositivo 1 (Você):**

1. Login com sua email
2. Vá para "Mais Opções" > "Minha Família"
3. Adicione sua esposa usando email dela
4. Escolha um nome e cor

**Dispositivo 2 (Esposa):**

1. Login com email dela
2. Vá para "Transações"
3. Vejo as transações que você tem? ✅ Realtime funcionando!

**Agora:**

1. Carregue um arquivo OFX no Dispositivo 1
2. No Dispositivo 2, a transação aparece em tempo real ✨

---

## 🛠️ Troubleshooting Rápido

| Erro                      | Solução                                      |
| ------------------------- | -------------------------------------------- |
| "Build falhou"            | `npx expo prebuild --clean`                  |
| "APK não instala"         | Desinstale versão anterior, verifique espaço |
| "Não encontra device"     | `adb devices` para verificar conexão         |
| "Realtime não sincroniza" | Verifique RLS policies em Supabase           |
| "Email não encontrado"    | Pessoa precisa se registrar primeiro         |

---

## 📂 Arquivos Importantes

```
home-finance/
├── app/(app)/mais/
│   ├── importar-ofx.tsx       ← Importar extratos
│   ├── familia.tsx             ← Gerenciar membros
│   └── index.tsx               ← Menu (atualizado)
├── lib/
│   └── ofxParser.ts            ← Parser OFX
├── eas.json                    ← Config de build
├── app.json                    ← Config do app
├── BUILD_AND_DEPLOY.md         ← Guia completo
├── COMPLETION_STATUS.md        ← Status final
└── QUICK_START.md              ← Este arquivo
```

---

## ✅ Checklist Final

- [ ] `eas build --platform android` executado
- [ ] APK baixado do link retornado
- [ ] APK instalado no celular
- [ ] App aberto e testado
- [ ] Importação OFX testada
- [ ] Sincronização em tempo real testada
- [ ] Compartilhado com família! 🎉

---

## 🎯 Próximas Features (Futuro)

- 📊 Gráficos mais avançados
- 🏦 Sync com banco API
- 📱 Versão iOS
- 💾 Backup automático
- 🔔 Notificações de transações

---

## 📞 Precisando de Ajuda?

1. Verifique `BUILD_AND_DEPLOY.md` para guia completo
2. Consulte `COMPLETION_STATUS.md` para status técnico
3. Veja logs: `eas build:view BUILD_ID`

---

**Pronto? Execute:**

```bash
eas build --platform android --profile preview
```

**Bom deploy! 🚀**
