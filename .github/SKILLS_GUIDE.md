b# 🤖 Claude Skills Instaladas

Este projeto possui skills personalizadas instaladas de dois repositórios principais:

## 📦 Repositórios Clonados

### 1. **davepoon/buildwithclaude**

- Local: `.github/_buildwithclaude/`
- Skills: 26 + Agents: 117 + Commands: 175

**Acesso rápido:**

```
/plugin marketplace add davepoon/buildwithclaude
/plugin install agents-python-expert
/plugin install commands-version-control-git
```

**Principais skills:**

- **Agents**: Python Expert, Go Expert, DevOps, Security, Backend, Frontend
- **Commands**: /commit, /docs, /tdd, /code_analysis, /refactor
- **Hooks**: Git automations, Lint, Security, Slack/Discord integrações

---

### 2. **alirezarezvani/claude-skills**

- Local: `.github/_claude-skills/`
- Skills: 235+ (Production-ready)

**Principais domínios:**

#### Engineering (45 skills)

- Architecture, Frontend, Backend, QA, DevOps, SecOps
- AI/ML, Data Engineering
- Playwright Pro, Selenium, Cypress
- Self-improving agent, Security auditor
- MCP server builder, Terraform, Performance profiler

#### Product & Design (16 skills)

- Product Manager, Agile PO, UX Researcher
- UI Design, Landing page builder
- SaaS scaffolder, Analytics

#### Marketing (44 skills)

- Content, SEO, CRO, Growth, Sales
- Channel management, Marketing intelligence

#### C-Level Advisory (34 skills)

- CEO, CTO, CFO, COO, CMO roles
- Board meeting assistant
- Company culture & collaboration

#### Compliance & Regulatory (14 skills)

- ISO 13485, MDR, FDA, ISO 27001, GDPR

---

## 🚀 Como Usar

### Opção 1: VS Code Plugin Marketplace

```bash
/plugin marketplace add alirezarezvani/claude-skills
/plugin install engineering-skills@claude-code-skills
```

### Opção 2: Manual - Copiar Skills

Os skills estão em:

- `_buildwithclaude/plugins/*/`
- `_claude-skills/skills/*/`

Copie qualquer pasta `SKILL.md` para o seu projeto conforme necessário.

### Opção 3: Usar CLI Tools

A biblioteca **claude-skills** inclui 305 scripts Python CLI (stdlib-only):

```bash
cd .github/_claude-skills
python scripts/skill-runner.py --skill <skill-name> --task <task>
```

---

## 📚 Skills Recomendadas para Este Projeto (Home Finance)

Baseado no seu projeto de finanças familiares:

- ✅ **Backend Developer** - APIs REST, Supabase integration
- ✅ **Database Designer** - Schema design, migrations
- ✅ **Security Auditor** - Validação de segurança
- ✅ **Frontend Developer** - React Native UI/UX
- ✅ **QA Tester** - Test strategies
- ✅ **DevOps Engineer** - CI/CD, deployment
- ✅ **Product Manager** - Feature planning

---

## 📖 Documentação

Para mais informações sobre uma skill específica:

1. Navegue até a pasta da skill em `_buildwithclaude` ou `_claude-skills`
2. Leia o `SKILL.md` dentro da pasta
3. Use `/` no chat para listar todas as skills disponíveis

---

## 🔗 Links Úteis

- **Build With Claude**: https://www.buildwithclaude.com
- **Repo**: https://github.com/davepoon/buildwithclaude
- **Claude Skills**: https://github.com/alirezarezvani/claude-skills
- **VS Code Plugin Marketplace**: Ctrl+Shift+X → Search "plugin"

---

**Status**: ✅ Todos os skills instalados e prontos para uso!
