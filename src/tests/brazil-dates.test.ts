import { describe, expect, it } from "vitest";

import {
  brazilNoonFromDateKey,
  brazilStartOfDay,
  getBrazilDayOfMonth,
  getBrazilMonthWindow,
  toBrazilDateKey,
} from "@/lib/brazil-dates";
import { buildMonthlyChartSeries } from "@/lib/monthly-series";

describe("brazil-dates", () => {
  it("agrupa venda noturna BRT no dia correto (servidor UTC)", () => {
    // 20/05/2026 22:00 em Brasília = 21/05/2026 01:00 UTC
    const soldAt = new Date("2026-05-21T01:00:00.000Z");
    expect(toBrazilDateKey(soldAt)).toBe("2026-05-20");
    expect(getBrazilDayOfMonth(soldAt)).toBe(20);
  });

  it("mantém data escolhida no formulário ao gravar meio-dia BRT", () => {
    const soldAt = brazilNoonFromDateKey("2026-05-15");
    expect(toBrazilDateKey(soldAt)).toBe("2026-05-15");
    expect(getBrazilDayOfMonth(soldAt)).toBe(15);
  });

  it("preenche todos os dias do mês na série", () => {
    const window = getBrazilMonthWindow(new Date("2026-05-15T15:00:00.000Z"));
    expect(window.daysInMonth).toBe(31);

    const series = buildMonthlyChartSeries(
      [{ at: brazilStartOfDay("2026-05-10"), amount: 100 }],
      window,
    );

    expect(series).toHaveLength(31);
    expect(series[9]?.total).toBe(100);
    expect(series[0]?.dateKey).toBe("2026-05-01");
    expect(series[30]?.dateKey).toBe("2026-05-31");
  });
});
