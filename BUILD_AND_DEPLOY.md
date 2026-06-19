# 📱 Guia de Build e Deploy - Home Finance APK

## 🎯 Objetivo

Gerar um APK instalável para Android que sincroniza dados em tempo real entre familiares usando Supabase Realtime.

---

## 📋 Pré-requisitos

### 1. **Configuração de Conta EAS**

EAS (Expo Application Services) é o serviço recomendado para builds React Native/Expo.

```bash
# Login no Expo
npx expo login

# Ou criar conta em https://expo.dev
```

### 2. **Instalar EAS CLI**

```bash
npm install -g eas-cli
```

### 3. **Configurar Projeto**

```bash
cd home-finance
eas init

# Isso criará um `eas.json` se ainda não existir
```

---

## 🔧 Configuração do eas.json

```json
{
  "cli": {
    "version": ">= 3.0.0",
    "promptToConfigurePushNotifications": false
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "preview2": {
      "android": {
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "preview3": {
      "developmentClient": true
    },
    "production": {
      "android": {
        "buildType": "apk",
        "withoutCredentials": true
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./service-account-key.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 🚀 Gerar APK para Teste (Preview)

### **Opção 1: Build Rápido (Recomendado para Primeira Vez)**

```bash
# Build APK para teste
eas build --platform android --profile preview

# Isso retornará um link para download do APK
# Download o APK e instale no celular
```

### **Opção 2: Build de Produção**

```bash
# Build APK otimizado para produção
eas build --platform android --profile production

# Aguarde completar (pode levar 10-15 minutos)
```

---

## 📲 Instalar APK no Celular

### **Método 1: Transferência Direta**

```bash
# Se você tiver o APK no computador
# 1. Conecte o celular via USB
# 2. Execute:

adb install caminho/para/app-release.apk

# Se tiver erro, verifique se adb está instalado
# Windows: Instale Android Studio ou Android SDK Platform Tools
```

### **Método 2: Download Direto**

1. Acesse o link retornado pelo EAS
2. Toque em "Baixar APK"
3. Abra o arquivo e instale
4. Permita instalação de "Fontes Desconhecidas" se solicitado

### **Método 3: Distribuição via QR Code**

O EAS gera um QR code - escaneie com seu celular para baixar direto.

---

## 🔐 Variáveis de Ambiente

### **Criar `.env.production`**

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=seu-anon-key-aqui
```

### **Adicionar ao `app.json`**

```json
{
  "expo": {
    "name": "Home Finance",
    "slug": "home-finance",
    "version": "1.0.0",
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTabletMode": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#131315"
      },
      "package": "com.eudavidev.homefinance",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "seu-project-id-aqui"
      }
    }
  }
}
```

---

## 🔄 Sincronização em Tempo Real (Realtime)

### **Como Funciona**

1. **Múltiplos Usuários**: Todos os membros da família têm o app
2. **Supabase Realtime**: Escuta mudanças no banco de dados
3. **Sincronização Automática**: Dados atualizam em todos os celulares

### **Exemplo de Uso**

```typescript
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function useRealtimeSync() {
  useEffect(() => {
    // Escutar mudanças em transações
    const subscription = supabase
      .from("transactions")
      .on("*", (payload) => {
        console.log("Nova transação:", payload.new);
        // Atualizar UI
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
```

---

## ✅ Checklist de Deploy

- [ ] Executar `npm install` e resolver dependências
- [ ] Configurar `.env` com credenciais Supabase
- [ ] Testar no Expo Go (`npx expo start`)
- [ ] Criar conta EAS e fazer login
- [ ] Executar `eas init`
- [ ] Gerar APK preview com `eas build --platform android`
- [ ] Instalar no celular e testar
- [ ] Testar sincronização em tempo real com 2 dispositivos
- [ ] Gerar build de produção se tudo OK
- [ ] Compartilhar APK com familiares

---

## 🔧 Troubleshooting

### **"Erro: Build falhou"**

```bash
# Limpar cache e reconstruir
npx expo prebuild --clean
eas build --platform android --profile preview --force
```

### **"APK não instala"**

- Verifique se tem espaço no celular
- Desinstale versão anterior
- Verifique Android version (mínimo 8.0)

```bash
# Ver requisitos
cat app.json | grep minSdkVersion
```

### **"Realtime não sincroniza"**

- Verifique se RLS policies estão corretas
- Teste em `Supabase Console > Realtime`
- Confirme se tabela está adicionada ao `supabase_realtime`

---

## 📊 Monitoramento

### **Ver Status do Build**

```bash
# Listar builds recentes
eas build:list

# Ver detalhes de um build
eas build:view BUILD_ID
```

### **Analytics**

No Supabase Console:

- **SQL Editor**: Monitor transações inseridas
- **Database**: Verifique tamanho e performance
- **Realtime**: Monitore conexões ativas

---

## 🚀 Deploy Contínuo (CI/CD)

### **Usar GitHub Actions** (Opcional)

Crie `.github/workflows/build.yml`:

```yaml
name: EAS Build

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "18"
      - run: npm install -g eas-cli
      - run: npm install
      - run: eas build --platform android --non-interactive
```

---

## 📱 Testando Sincronização em Tempo Real

### **Teste com 2 Celulares**

1. **Celular 1**: Abra o app e faça login (Você)
2. **Celular 2**: Faça login com conta da esposa
3. **Celular 1**: Adicione uma transação
4. **Celular 2**: Observe a transação aparecer em tempo real ✅

---

## 📦 Distribuição

### **Compartilhar com Família**

1. Gerar APK de produção
2. Fazer upload em Google Drive ou WeTransfer
3. Compartilhar link com familiares
4. Eles baixam e instalam

### **Google Play Store** (Futuro)

```bash
# Gerar arquivo de assinatura
keytool -genkey -v -keystore home-finance.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias home-finance-key

# Configurar em eas.json para upload automático
```

---

## 🔗 Recursos Úteis

- [Expo CLI Docs](https://docs.expo.dev)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Android SDK Setup](https://reactnative.dev/docs/environment-setup)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

---

## 💬 Suporte

Se encontrar problemas:

1. Verifique logs: `eas build:view BUILD_ID`
2. Teste com `npx expo start` primeiro
3. Abra issue no GitHub com descrição detalhada
4. Consulte documentação oficial

---

**Bom deploy! 🚀**
