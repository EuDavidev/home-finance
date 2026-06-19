# 🧪 Guia de Teste - Feature D1 (Lançamento Rápido)

## Status do Servidor

```
✅ Expo Metro Bundler ativado
✅ App compilado e pronto
✅ QR Code gerado
✅ Servidor: exp://192.168.10.174:8081
```

---

## 📱 Como Acessar

### **Opção 1: Android Emulator** (Recomendado)

```bash
# No terminal, pressione:
a
```

- Abre Android Emulator automaticamente
- App carrega em ~30 segundos

### **Opção 2: Expo Go (Telefone Real)**

```
1. Abra Expo Go no seu telefone
2. Escaneie o QR Code acima
3. App abre em ~5 segundos
```

### **Opção 3: Web**

```bash
# No terminal, pressione:
w
```

- Abre http://localhost:8081 no navegador
- Interface web básica (não tem FAB animado em web)

---

## 🎯 Teste 1: Verificar FAB

**Objetivo**: Confirmar que botão "+" aparece em todas as telas

### Passos:

1. ✅ App abre na tela **Home**
2. 👀 Procure botão **laranja com "+"** no canto **inferior direito**
3. ✅ Pressione o botão
4. 👀 Deve aparecer animação de **bounce**
5. 👀 Deve sentir **vibração** (se em dispositivo físico)

### ✅ Sucesso quando:

- [ ] FAB aparece em Home
- [ ] FAB aparece em Transações
- [ ] FAB aparece em Orçamentos
- [ ] FAB aparece em Mais
- [ ] Animação suave ao pressionar

---

## 🎯 Teste 2: Modal Abre

**Objetivo**: Verificar que modal abre corretamente ao clicar FAB

### Passos:

1. ✅ Pressione o FAB (botão "+")
2. 👀 Modal deve **deslizar de baixo para cima**
3. 👀 Deve mostrar campos:
   - Toggle: **Despesa** / **Receita**
   - Input: **Valor** (com "R$")
   - Input: **Descrição**
   - Grid: **Categorias Recentes**
   - Grid: **Todas as Categorias**

### ✅ Sucesso quando:

- [ ] Modal abre suavemente
- [ ] Todos os campos aparecem
- [ ] Campo de valor já tem foco (cursor piscando)
- [ ] Botão "Salvar Transação" visível na base

---

## 🎯 Teste 3: Preencher e Salvar

**Objetivo**: Registrar uma transação rápida

### Passos:

1. ✅ Modal aberto (do Teste 2)
2. 📝 Deixar **Despesa** selecionado
3. 📝 Digitar **Valor**: `50,50`
4. 📝 Digitar **Descrição**: `café`
5. 👀 Procure por categorias recentes (pode estar vazio se novo usuário)
6. 👀 Role para baixo e procure **Restaurantes** ou similar
7. 🖱️ Clicar na categoria **Restaurantes** (ou outra)
8. ✅ Categoria deve ficar **destacada** (fundo colorido)
9. 🖱️ Pressionar **"Salvar Transação"**

### ✅ Sucesso quando:

- [ ] Modal aceita input de valor
- [ ] Modal aceita input de descrição
- [ ] Categorias são selecionáveis
- [ ] Botão Salvar fica ativo (não desabilitado)
- [ ] Após clicar Salvar, modal **fecha**
- [ ] Sente **vibração de sucesso**

---

## 🎯 Teste 4: Realtime Sync

**Objetivo**: Verificar que transação aparece em tempo real

### Passos:

1. ✅ Transação salva (do Teste 3)
2. 🔄 Modal deve ter **fechado automaticamente**
3. 🧭 Pressione **aba "Transações"** (segunda aba)
4. 👀 Procure pela transação de **R$ 50,50** no topo da lista
5. 👀 Descrição: **"café"**
6. 👀 Categoria: **"Restaurantes"**

### ✅ Sucesso quando:

- [ ] Transação aparece na lista
- [ ] Valor correto: R$ 50,50
- [ ] Descrição correta: café
- [ ] Categoria correta: Restaurantes
- [ ] Sincronizou em <2 segundos

---

## 🎯 Teste 5: Validação

**Objetivo**: Confirmar que validação de campos funciona

### Passos:

1. ✅ Pressionar FAB para abrir modal
2. 🖱️ Deixar valor **vazio**
3. 📝 Digitar descrição: `teste`
4. 🖱️ Pressionar **"Salvar Transação"**
5. 👀 Deve mostrar **erro em vermelho**: "Preencha valor e descrição"
6. 📝 Digitar valor: `10`
7. 🖱️ Pressionar **"Salvar"** novamente
8. ✅ Dessa vez, deve **salvar com sucesso**

### ✅ Sucesso quando:

- [ ] Erro aparece quando faltam campos
- [ ] Mensagem de erro é clara
- [ ] Ao preencher, erro desaparece
- [ ] Salva quando todos campos preenchidos

---

## 🎯 Teste 6: Categorias Recentes

**Objetivo**: Verificar que categorias aparecem em ordem de uso

### Pré-requisito:

- [ ] Ter criado pelo menos 3-5 transações (dos testes anteriores)

### Passos:

1. ✅ Pressionar FAB
2. 👀 Procure seção **"Categorias Recentes"**
3. 👀 Deve mostrar as **5 categorias mais usadas** nos últimos 30 dias
4. 👀 Categorias devem ter **emoji** e **nome**
5. 🖱️ Clicar em uma categoria recente deve **selecionar** (destacar)

### ✅ Sucesso quando:

- [ ] Categorias Recentes aparecem
- [ ] Mostram emoji (🛒 🍽️ 🏠 etc)
- [ ] Mostram nome (Mercado, Restaurante, Casa)
- [ ] Clicáveis e selecionáveis
- [ ] Aparecem acima de "Todas"

---

## 🎯 Teste 7: Voice Input (Beta)

**Objetivo**: Verificar que botão de voz está funcional

### Passos:

1. ✅ Modal aberto
2. 👀 Procure botão **"🎤 Falar (beta)"**
3. 🖱️ Clicar no botão
4. ⏳ Deve mostrar **loading** (spinner)
5. 🔊 Pode ouvir feedback em português

### ✅ Sucesso quando:

- [ ] Botão de voz está visível
- [ ] Clicável sem erros
- [ ] Mostra loading corretamente
- [ ] Não trava o app

**Nota**: Voice-to-text completo será implementado em próxima fase

---

## 🔧 Troubleshooting

### ❌ FAB não aparece

**Solução**:

1. Recarregar app: Pressione `r` no terminal
2. Verificar se `_layout.tsx` foi editado (checkado ✅)
3. Verificar console para erros (Pressione `j` para debugger)

### ❌ Modal não abre

**Solução**:

1. Verificar se `QuickTransactionModal.tsx` foi importado
2. Recarregar: Pressione `r`
3. Limpar cache: `npm start -- --clear`

### ❌ Erro ao salvar

**Solução**:

1. Verificar conexão com Supabase
2. Verificar se usuário está logado
3. Verificar se family_id existe
4. Ver logs no debugger (Pressione `j`)

### ❌ Categorias recentes não aparecem

**Solução**:

1. Normal se usuário novo
2. Precisa de pelo menos 5 transações
3. Busca últimos 30 dias
4. Recarregar modal para atualizar

---

## 📊 Checklist Final

Após completar todos os testes, marque como concluído:

- [ ] Teste 1: FAB aparece ✅
- [ ] Teste 2: Modal abre ✅
- [ ] Teste 3: Preencher e salvar ✅
- [ ] Teste 4: Realtime sync ✅
- [ ] Teste 5: Validação ✅
- [ ] Teste 6: Categorias recentes ✅
- [ ] Teste 7: Voice input ✅

**🎉 Se todos os testes passarem, D1 está 100% funcional!**

---

## 📞 Próximos Passos

Após confirmação de testes bem-sucedidos:

1. **Build APK**: `eas build --platform android --profile preview`
2. **Feature D2**: Implementar Orçamentos com Alertas
3. **Feature A1**: Implementar Metas Financeiras
4. **Melhorias**: Voice-to-text real, ML categorização

---

**Data**: 2026-05-02 | **Status**: Pronto para Teste | **Complexidade**: ⭐⭐
