export const DEFAULT_CATEGORIES = [
  // Essenciais
  { key: "moradia",      label: "Moradia",         icon: "Home",            group: "essenciais", color: "#FF6B1A" },
  { key: "alimentacao",  label: "Alimentação",      icon: "ShoppingCart",    group: "essenciais", color: "#FF8C42" },
  { key: "contas-fixas", label: "Contas Fixas",     icon: "Zap",             group: "essenciais", color: "#FFA562" },
  { key: "transporte",   label: "Transporte",       icon: "Car",             group: "essenciais", color: "#FFB582" },
  { key: "saude",        label: "Saúde",            icon: "HeartPulse",      group: "essenciais", color: "#E05C3A" },
  { key: "educacao",     label: "Educação",         icon: "GraduationCap",   group: "essenciais", color: "#C44B2A" },
  // Variáveis
  { key: "restaurantes", label: "Restaurantes",     icon: "UtensilsCrossed", group: "variaveis",  color: "#8B4513" },
  { key: "compras",      label: "Compras",          icon: "ShoppingBag",     group: "variaveis",  color: "#A0522D" },
  { key: "lazer",        label: "Lazer",            icon: "Sparkles",        group: "variaveis",  color: "#CD853F" },
  { key: "vestuario",    label: "Vestuário",        icon: "Shirt",           group: "variaveis",  color: "#DEB887" },
  { key: "manutencao",   label: "Manutenção",       icon: "Wrench",          group: "variaveis",  color: "#D2691E" },
  // Financeiro
  { key: "dividas",      label: "Pag. de Dívidas",  icon: "Receipt",         group: "financeiro", color: "#B22222" },
  { key: "investimentos",label: "Investimentos",    icon: "TrendingUp",      group: "financeiro", color: "#228B22" },
  { key: "renda",        label: "Renda Extra",      icon: "Banknote",        group: "financeiro", color: "#32CD32" },
] as const;
