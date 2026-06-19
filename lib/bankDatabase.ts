/**
 * Banco de dados centralizado de bancos brasileiros
 * Usado pelo parser OFX e pela tela de importação
 */

export interface BankInfo {
  code: string;
  name: string;
  shortName: string;
  color: string;
  icon: string;
  /** Particularidades de parsing OFX deste banco */
  ofxNotes?: string;
}

/**
 * Banco de dados completo de bancos brasileiros com suporte OFX
 * Códigos COMPE (3 dígitos) e ISPB (8 dígitos para fintechs)
 */
export const BRAZILIAN_BANKS: Record<string, BankInfo> = {
  // === BANCOS TRADICIONAIS ===
  "001": {
    code: "001",
    name: "Banco do Brasil",
    shortName: "BB",
    color: "#FFCC29",
    icon: "🏛️",
    ofxNotes: "OFX padrão. BANKID=001.",
  },
  "033": {
    code: "033",
    name: "Santander",
    shortName: "Santander",
    color: "#EC0000",
    icon: "🔴",
    ofxNotes: "Pode usar BANKID=033 ou 0033. Memos curtos.",
  },
  "104": {
    code: "104",
    name: "Caixa Econômica Federal",
    shortName: "Caixa",
    color: "#005CA9",
    icon: "🔵",
    ofxNotes: "Formato SGML. BANKID=104.",
  },
  "237": {
    code: "237",
    name: "Bradesco",
    shortName: "Bradesco",
    color: "#CC092F",
    icon: "🔴",
    ofxNotes: "OFX padrão. Pode incluir tags extras como CHECKNUM.",
  },
  "341": {
    code: "341",
    name: "Itaú Unibanco",
    shortName: "Itaú",
    color: "#FF6600",
    icon: "🟠",
    ofxNotes: "OFX padrão. Memos detalhados com número do PIX.",
  },
  "422": {
    code: "422",
    name: "Banco Safra",
    shortName: "Safra",
    color: "#003366",
    icon: "🏦",
  },
  "745": {
    code: "745",
    name: "Citibank",
    shortName: "Citi",
    color: "#003DA5",
    icon: "🏦",
  },

  // === FINTECHS / BANCOS DIGITAIS ===
  "260": {
    code: "260",
    name: "Nu Pagamentos (Nubank)",
    shortName: "Nubank",
    color: "#8A05BE",
    icon: "🟣",
    ofxNotes:
      "Exporta OFX pelo app. BANKID=260. Memos com detalhes de PIX/cartão.",
  },
  "077": {
    code: "077",
    name: "Banco Inter",
    shortName: "Inter",
    color: "#FF7A00",
    icon: "🟠",
    ofxNotes: "OFX baixado via internet banking. BANKID=077.",
  },
  "336": {
    code: "336",
    name: "C6 Bank",
    shortName: "C6",
    color: "#1A1A1A",
    icon: "⬛",
    ofxNotes: "BANKID=336. Formato padrão.",
  },
  "212": {
    code: "212",
    name: "Banco Original",
    shortName: "Original",
    color: "#00A651",
    icon: "🟢",
  },
  "655": {
    code: "655",
    name: "Banco Neon",
    shortName: "Neon",
    color: "#0066FF",
    icon: "💙",
    ofxNotes: "BANKID=655. Memos com descrições simplificadas.",
  },
  "290": {
    code: "290",
    name: "PagSeguro / PagBank",
    shortName: "PagBank",
    color: "#00A859",
    icon: "🟢",
  },
  "380": {
    code: "380",
    name: "PicPay",
    shortName: "PicPay",
    color: "#21C25E",
    icon: "🟩",
  },
  "323": {
    code: "323",
    name: "Mercado Pago",
    shortName: "Mercado Pago",
    color: "#009EE3",
    icon: "🔵",
  },

  // === COOPERATIVAS ===
  "756": {
    code: "756",
    name: "Sicoob",
    shortName: "Sicoob",
    color: "#003B2F",
    icon: "🟢",
    ofxNotes: "BANKID=756. OFX padrão exportado pelo internet banking.",
  },
  "748": {
    code: "748",
    name: "Sicredi",
    shortName: "Sicredi",
    color: "#008542",
    icon: "🟢",
    ofxNotes: "BANKID=748. Formato padrão SGML.",
  },
  "084": {
    code: "084",
    name: "Uniprime",
    shortName: "Uniprime",
    color: "#0054A6",
    icon: "🔵",
  },

  // === BANCOS DE INVESTIMENTO / CORRETORAS ===
  "208": {
    code: "208",
    name: "BTG Pactual",
    shortName: "BTG",
    color: "#002D62",
    icon: "🏦",
  },
  "746": {
    code: "746",
    name: "Modal",
    shortName: "Modal",
    color: "#FF6600",
    icon: "🟠",
  },

  // === OUTROS ===
  "356": {
    code: "356",
    name: "Banco Real (ABN Amro)",
    shortName: "Real",
    color: "#006341",
    icon: "🟢",
  },
  "637": {
    code: "637",
    name: "Banco Sofisa Direto",
    shortName: "Sofisa",
    color: "#1B3C87",
    icon: "🔵",
  },
  "389": {
    code: "389",
    name: "Banco Mercantil do Brasil",
    shortName: "Mercantil",
    color: "#003366",
    icon: "🏦",
  },
  "070": {
    code: "070",
    name: "BRB – Banco de Brasília",
    shortName: "BRB",
    color: "#005CA9",
    icon: "🏛️",
  },
  "021": {
    code: "021",
    name: "Banestes",
    shortName: "Banestes",
    color: "#003399",
    icon: "🏦",
  },
  "041": {
    code: "041",
    name: "Banrisul",
    shortName: "Banrisul",
    color: "#005BAA",
    icon: "🏦",
  },
  "004": {
    code: "004",
    name: "Banco do Nordeste",
    shortName: "BNB",
    color: "#C8102E",
    icon: "🏦",
  },
  "047": {
    code: "047",
    name: "Banco do Estado de Sergipe (Banese)",
    shortName: "Banese",
    color: "#0066CC",
    icon: "🏦",
  },
};

/**
 * Retorna info do banco pelo BANKID do OFX
 */
export function getBankInfo(bankId: string): BankInfo {
  // Normalizar: remover zeros à esquerda excessivos (ex: "0033" → "033")
  const normalized = bankId.replace(/^0+/, "").padStart(3, "0");
  return (
    BRAZILIAN_BANKS[normalized] ||
    BRAZILIAN_BANKS[bankId] || {
      code: bankId,
      name: `Banco ${bankId}`,
      shortName: `Banco ${bankId}`,
      color: "#FF6B1A",
      icon: "🏦",
    }
  );
}

/**
 * Retorna nome do banco pelo BANKID
 */
export function getBankName(bankId: string): string {
  return getBankInfo(bankId).name;
}

/**
 * Retorna cor do banco pelo BANKID
 */
export function getBankColor(bankId: string): string {
  return getBankInfo(bankId).color;
}

/**
 * Retorna ícone (emoji) do banco pelo BANKID
 */
export function getBankIcon(bankId: string): string {
  return getBankInfo(bankId).icon;
}

/**
 * Lista de bancos principais para exibição na UI
 */
export const FEATURED_BANKS: BankInfo[] = [
  BRAZILIAN_BANKS["260"], // Nubank
  BRAZILIAN_BANKS["341"], // Itaú
  BRAZILIAN_BANKS["237"], // Bradesco
  BRAZILIAN_BANKS["033"], // Santander
  BRAZILIAN_BANKS["104"], // Caixa
  BRAZILIAN_BANKS["001"], // BB
  BRAZILIAN_BANKS["077"], // Inter
  BRAZILIAN_BANKS["336"], // C6
  BRAZILIAN_BANKS["655"], // Neon
  BRAZILIAN_BANKS["756"], // Sicoob
  BRAZILIAN_BANKS["748"], // Sicredi
  BRAZILIAN_BANKS["290"], // PagBank
];
