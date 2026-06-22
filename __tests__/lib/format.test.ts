import { formatBRL, formatDate, currentMonthYear, formatCurrency } from "@/lib/format";

describe("formatBRL / formatCurrency", () => {
  it("formats positive currency correctly in pt-BR", () => {
    const formatted = formatBRL(1250.5);
    // Note: React Native's Intl might use non-breaking space or regular space
    expect(formatted).toContain("1.250,50");
    expect(formatted).toContain("R$");
  });

  it("formats negative currency correctly", () => {
    const formatted = formatBRL(-99.9);
    expect(formatted).toContain("99,90");
    expect(formatted).toContain("R$");
  });

  it("compacts large values if compact option is true", () => {
    const formatted = formatBRL(1500, true);
    expect(formatted).toBeTruthy();
  });
});

describe("formatDate", () => {
  it("formats string date correctly", () => {
    const formatted = formatDate("2026-06-22");
    expect(formatted).toContain("22");
    expect(formatted).toContain("2026");
  });

  it("formats Date object correctly", () => {
    const d = new Date(2026, 5, 22); // June 22
    const formatted = formatDate(d);
    expect(formatted).toContain("22");
    expect(formatted).toContain("2026");
  });
});

describe("currentMonthYear", () => {
  it("returns YYYY-MM format", () => {
    const val = currentMonthYear();
    expect(val).toMatch(/^\d{4}-\d{2}$/);
  });
});
