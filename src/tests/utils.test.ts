import { describe, expect, it } from "vitest";

import { formatCurrency } from "@/lib/utils";

describe("formatCurrency", () => {
  it("formata valores em BRL", () => {
    expect(formatCurrency(1234.56)).toBe("R$ 1.234,56");
  });
});
