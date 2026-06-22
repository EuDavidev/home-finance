import { parseOFX, isValidOFX, detectCategory } from "@/lib/ofxParser";

const VALID_OFX = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252

<OFX>
<SIGNONMSGSRSV1>
<SONRS>
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<DTSERVER>20260622120000
<LANGUAGE>POR
</SONRS>
</SIGNONMSGSRSV1>
<BANKMSGSRSV1>
<STMTTRNRS>
<TRNUID>1001
<STATUS>
<CODE>0
<SEVERITY>INFO
</STATUS>
<STMTRS>
<CURDEF>BRL
<BANKTRANLIST>
<DTSTART>20260601
<DTEND>20260622
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260615120000
<TRNAMT>-150.00
<FITID>tx123456
<CHECKNUM>123456
<MEMO>COMPRA DEBITO CARREFOUR</MEMO>
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260616120000
<TRNAMT>2500.00
<FITID>tx123457
<CHECKNUM>123457
<MEMO>RESGATE INVESTIMENTO CDB
</STMTTRN>
</BANKTRANLIST>
<LEDGERBAL>
<BALAMT>5000.00
<DTASOF>20260622
</LEDGERBAL>
<BANKID>0341
<ACCTID>1234567
<ACCTTYPE>CHECKING
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>
`;

const INVALID_OFX = `
RANDOM TEXT WITHOUT HEADER
`;

describe("isValidOFX", () => {
  it("returns true for valid OFX headers and transaction blocks", () => {
    expect(isValidOFX(VALID_OFX)).toBe(true);
  });

  it("returns false for invalid content", () => {
    expect(isValidOFX(INVALID_OFX)).toBe(false);
  });
});

describe("parseOFX", () => {
  it("correctly parses statement info and transactions", () => {
    const statement = parseOFX(VALID_OFX);
    expect(statement).not.toBeNull();
    if (statement) {
      expect(statement.bankId).toBe("0341");
      expect(statement.accountNumber).toBe("1234567");
      expect(statement.balance).toBe(5000.00);
      expect(statement.transactions.length).toBe(2);

      // Debit transaction
      const t1 = statement.transactions[0];
      expect(t1.amount).toBe(150.00);
      expect(t1.type).toBe("expense");
      expect(t1.transactionType).toBe("debito");
      expect(t1.category_id).toBe("Alimentação");

      // Credit transaction
      const t2 = statement.transactions[1];
      expect(t2.amount).toBe(2500.00);
      expect(t2.type).toBe("income");
      expect(t2.category_id).toBe("Investimentos");
    }
  });
});

describe("detectCategory", () => {
  it("detects Alimentação for SUPERMERCADO", () => {
    expect(detectCategory("SUPERMERCADO DIA")).toBe("Alimentação");
  });

  it("detects Moradia for ENEL CONTA LUZ", () => {
    expect(detectCategory("ENEL ELETROPAULO")).toBe("Moradia");
  });

  it("detects Lazer for IFOOD EATS", () => {
    expect(detectCategory("IFOOD.COM")).toBe("Lazer");
  });

  it("detects Streaming for NETFLIX.COM", () => {
    expect(detectCategory("NETFLIX MENSALIDADE")).toBe("Streaming");
  });

  it("returns Outros for unknown terms", () => {
    expect(detectCategory("SOMETHING UNKNOWN")).toBe("Outros");
  });
});
