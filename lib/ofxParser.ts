/**
 * OFX Parser - Converte arquivos OFX em transações
 * Suporta formato OFXSGML (uso comum em bancos brasileiros)
 */

export interface OFXTransaction {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: "income" | "expense";
  transactionType: "pix" | "debito" | "credito" | "outros";
  bankId: string;
  accountNumber: string;
  fitId: string;
  category_id: string; // Categoria detectada automaticamente
  memo: string; // Memo original da transação
}

export interface OFXStatement {
  bankId: string;
  accountNumber: string;
  accountType: string;
  currency: string;
  startDate: string;
  endDate: string;
  balance: number;
  transactions: OFXTransaction[];
}

/**
 * Detecta o tipo de transação baseado no memo
 */
function detectTransactionType(
  memo: string,
): "pix" | "debito" | "credito" | "outros" {
  const memoUpper = memo.toUpperCase();

  if (memoUpper.includes("PIX")) {
    return "pix";
  } else if (
    memoUpper.includes("DÉBITO") ||
    memoUpper.includes("DEBIT") ||
    memoUpper.includes("COMPRA")
  ) {
    return "debito";
  } else if (
    memoUpper.includes("CRÉDITO") ||
    memoUpper.includes("CREDIT") ||
    memoUpper.includes("REMUNERAÇÃO") ||
    memoUpper.includes("SALÁRIO")
  ) {
    return "credito";
  }

  return "outros";
}

/**
 * Detecta categoria automaticamente com base na descrição
 * Cobertura expandida para extratos de todos os bancos brasileiros
 */
export function detectCategory(description: string): string {
  const desc = description.toUpperCase();

  const categoryRules: { [key: string]: string[] } = {
    mercado: [
      "MERCADO", "SUPERMERCADO", "AÇOUGUE", "PADARIA", "HORTIFRUTI",
      "ALIMENTOS", "MERCEARIA", "QUITANDA", "SACOLÃO", "ATACADÃO",
      "ATACADO", "ASSAÍ", "CARREFOUR", "EXTRA", "PÃO DE AÇÚCAR",
      "BIG", "SAMS", "COSTCO", "MAKRO", "MART", "EMPÓRIO",
      "FEIRA", "VERDURA", "LEGUMES", "FRUTAS",
    ],
    casa: [
      "ALUGUEL", "CONDOMÍNIO", "CONDOMINIO", "ÁGUA", "ENERGIA", "GÁS",
      "INTERNET", "TELEFONE", "HIDRO", "CELULAR", "FIBRA", "VIVO",
      "CLARO", "TIM", "OI", "NET", "COMGAS", "ENEL", "CEMIG",
      "SABESP", "COPASA", "LIGHT", "ELETROPAULO", "NEOENERGIA",
      "CPFL", "COELBA", "CELPE", "IPTU", "CONTA DE LUZ",
    ],
    lazer: [
      "CINEMA", "BAR", "RESTAURANTE", "PIZZARIA", "CAFÉ", "KARAOKE",
      "LANCHONETE", "IFOOD", "RAPPI", "UBER EATS", "DELIVERY",
      "HAMBURGUERIA", "SUSHI", "CHURRASCARIA", "MCDONALD", "BURGER",
      "SUBWAY", "STARBUCKS", "OUTBACK", "MADERO", "HABIB",
      "BOTECO", "BALADA", "SHOW", "TEATRO", "PARQUE", "MUSEU",
      "INGRESSO", "EVENTO",
    ],
    streaming: [
      "NETFLIX", "SPOTIFY", "AMAZON", "DISNEY", "HBO", "CRUNCHYROLL",
      "YOUTUBE", "APPLE", "GOOGLE PLAY", "DEEZER", "GLOBOPLAY",
      "PARAMOUNT", "STAR+", "PRIMEVIDEO", "TWITCH", "XBOX",
      "PLAYSTATION", "STEAM", "CHATGPT", "OPENAI", "MICROSOFT 365",
    ],
    saúde: [
      "FARMÁCIA", "FARMACIA", "MÉDICO", "DENTISTA", "HOSPITAL",
      "CLÍNICA", "CLINICA", "FARMACÊUTICO", "DROGARIA", "DROGA RAIA",
      "DROGASIL", "PANVEL", "ULTRAFARMA", "PLANO DE SAUDE",
      "UNIMED", "AMIL", "SULAMERICA", "BRADESCO SAUDE",
      "CONSULTA", "EXAME", "LABORATÓRIO", "LABORATORIO",
      "PSICÓLOGO", "NUTRICIONISTA", "FISIOTERAPIA", "ÓTICA", "OTICA",
    ],
    transporte: [
      "UBER", "TAXI", "COMBUSTÍVEL", "COMBUSTIVEL", "GASOLINA",
      "ESTACIONAMENTO", "ÔNIBUS", "ONIBUS", "METRÔ", "METRO",
      "PEDÁGIO", "PEDAGIO", "IPVA", "SEGURO AUTO", "SEGURO VEIC",
      "99POP", "99TAXI", "CABIFY", "SHELL", "POSTO", "ETANOL",
      "DIESEL", "BR DISTRIBUIDORA", "AUTO POSTO", "LAVA JATO",
      "LAVA CAR", "OFICINA", "BORRACHARIA", "PNEU", "AUTOPEÇAS",
    ],
    educação: [
      "ESCOLA", "UNIVERSIDADE", "FACULDADE", "CURSO", "LIVRO",
      "EDUCAÇÃO", "MATRÍCULA", "MATRICULA", "MENSALIDADE",
      "UDEMY", "COURSERA", "ALURA", "HOTMART", "APOSTILA",
      "MATERIAL ESCOLAR", "LIVRARIA", "PAPELARIA",
    ],
    vestuário: [
      "ROUPA", "CALÇADO", "CALÇADOS", "TÊNIS", "SAPATO",
      "RENNER", "RIACHUELO", "C&A", "ZARA", "SHEIN",
      "CENTAURO", "NETSHOES", "DECATHLON", "HERING",
      "MARISA", "PERNAMBUCANAS", "LOJAS AMERICANAS",
    ],
    pets: [
      "PETSHOP", "PET SHOP", "VETERINÁRIO", "VETERINARIO",
      "COBASI", "PETZ", "RAÇÃO", "RACAO",
    ],
    impostos: [
      "IMPOSTO", "TRIBUTO", "DARF", "DAS", "INSS",
      "IR", "RECEITA FEDERAL", "FGTS",
    ],
    investimentos: [
      "INVESTIMENTO", "CDB", "TESOURO", "AÇÕES", "ACOES",
      "FII", "RENDA FIXA", "POUPANÇA", "POUPANCA",
      "CORRETORA", "XP", "RICO", "CLEAR", "EASYNVEST",
      "APLICAÇÃO", "APLICACAO", "RESGATE",
    ],
    "cama/mesa/banho": [
      "LINEN", "TOALHA", "CAMA", "BANHO", "HIGIENE",
      "SHAMPOO", "PERFUMARIA", "COSMÉTICO", "COSMETICO",
      "O BOTICÁRIO", "BOTICARIO", "NATURA",
    ],
    outros: [],
  };

  // Mapeamento de chave interna → label exibido na UI (Title Case)
  // Mantém consistência com as categorias do formulário manual
  const categoryLabels: { [key: string]: string } = {
    mercado: "Alimentação",
    casa: "Moradia",
    lazer: "Lazer",
    streaming: "Streaming",
    "saúde": "Saúde",
    transporte: "Transporte",
    "educação": "Educação",
    "vestuário": "Vestuário",
    pets: "Pets",
    impostos: "Impostos",
    investimentos: "Investimentos",
    "cama/mesa/banho": "Cama/Mesa/Banho",
    outros: "Outros",
  };

  for (const [category, keywords] of Object.entries(categoryRules)) {
    if (keywords.some((keyword) => desc.includes(keyword))) {
      return categoryLabels[category] || category;
    }
  }

  return "Outros";
}

/**
 * Converte data OFX (YYYYMMDDHHMMSS) para ISO (YYYY-MM-DD)
 */
function parseOFXDate(ofxDate: string): string {
  if (!ofxDate || ofxDate.length < 8)
    return new Date().toISOString().split("T")[0];

  const year = ofxDate.substring(0, 4);
  const month = ofxDate.substring(4, 6);
  const day = ofxDate.substring(6, 8);

  return `${year}-${month}-${day}`;
}

/**
 * Parse OFX SGML format
 */
export function parseOFX(ofxContent: string): OFXStatement | null {
  try {
    // Remove quebras de linha extras
    const cleaned = ofxContent.replace(/\r\n/g, "\n");

    // Extrai informações da conta
    const bankIdMatch = cleaned.match(/<BANKID>([^<\s]+)/);
    const acctIdMatch = cleaned.match(/<ACCTID>([^<\s]+)/);
    const acctTypeMatch = cleaned.match(/<ACCTTYPE>(\w+)/);
    const curDefMatch = cleaned.match(/<CURDEF>(\w+)/);
    const balAmtMatch = cleaned.match(/<BALAMT>([-\d.]+)/);
    const startDateMatch = cleaned.match(/<DTSTART>(\d+)/);
    const endDateMatch = cleaned.match(/<DTEND>(\d+)/);

    if (!bankIdMatch || !acctIdMatch) {
      throw new Error("Formato OFX inválido - dados de conta não encontrados");
    }

    const bankId = bankIdMatch[1];
    const accountNumber = acctIdMatch[1];
    const accountType = acctTypeMatch?.[1] || "CHECKING";
    const currency = curDefMatch?.[1] || "BRL";
    const balance = parseFloat(balAmtMatch?.[1] || "0");
    const startDate = parseOFXDate(startDateMatch?.[1] || "");
    const endDate = parseOFXDate(endDateMatch?.[1] || "");

    // Extrai transações
    const transactions: OFXTransaction[] = [];
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;

    let match;
    while ((match = stmtTrnRegex.exec(cleaned)) !== null) {
      const trnBlock = match[1];

      const trnTypeMatch = trnBlock.match(/<TRNTYPE>(\w+)/);
      const dtPostedMatch = trnBlock.match(/<DTPOSTED>(\d+)/);
      const trnAmtMatch = trnBlock.match(/<TRNAMT>([-\d.]+)/);
      const fitIdMatch = trnBlock.match(/<FITID>([^<\s]+)/);
      const memoMatch = trnBlock.match(/<MEMO>([^<]+)/);

      if (trnAmtMatch && dtPostedMatch && fitIdMatch) {
        const amount = parseFloat(trnAmtMatch[1]);
        const trnType = trnTypeMatch?.[1] || "DEBIT";
        const memo = memoMatch?.[1] || "Transação";
        const category = detectCategory(memo);

        transactions.push({
          date: parseOFXDate(dtPostedMatch[1]),
          description: memo.trim(),
          amount: Math.abs(amount),
          type: trnType === "CREDIT" ? "income" : "expense",
          transactionType: detectTransactionType(memo),
          bankId,
          accountNumber,
          fitId: fitIdMatch[1],
          category_id: category,
          memo: memo.trim(),
        });
      }
    }

    return {
      bankId,
      accountNumber,
      accountType,
      currency,
      startDate,
      endDate,
      balance,
      transactions,
    };
  } catch (error) {
    console.error("Erro ao fazer parse do OFX:", error);
    return null;
  }
}

/**
 * Validação básica do arquivo OFX
 */
export function isValidOFX(content: string): boolean {
  return (
    content.includes("OFXHEADER") &&
    (content.includes("<STMTTRN>") || content.includes("<STMTTRNRS>"))
  );
}
