import { transactionService } from "@/services/supabase/transactionService";
import { supabase } from "@/lib/supabase";

// Mock the entire supabase client
jest.mock("@/lib/supabase", () => {
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    returns: jest.fn(),
  };

  return {
    supabase: {
      from: jest.fn(() => mockQuery),
      channel: jest.fn().mockReturnValue({
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      }),
      removeChannel: jest.fn(),
    },
  };
});

describe("transactionService", () => {
  const fromMock = supabase.from as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists transactions correctly", async () => {
    const mockTxs = [
      { id: "1", amount: 50, description: "Gasoline", category: "Transporte" },
    ];

    const mockQueryInstance = fromMock();
    mockQueryInstance.returns.mockResolvedValue({ data: mockTxs, error: null });

    const result = await transactionService.list("family-123");
    expect(result).toEqual(mockTxs);
    expect(fromMock).toHaveBeenCalledWith("transactions");
  });

  it("deletes a transaction", async () => {
    const mockQueryInstance = fromMock();
    // Simulate delete with no error
    mockQueryInstance.eq.mockResolvedValue({ error: null });

    await expect(transactionService.remove("tx-123")).resolves.not.toThrow();
  });
});
