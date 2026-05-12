import { ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-5 top-5 rounded-2xl bg-[var(--panel-strong)] p-2 text-[var(--accent)]">
        <ArrowUpRight className="h-4 w-4" />
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
        {value}
      </p>
      <p className="mt-3 text-sm text-[var(--muted-foreground)]">{helper}</p>
    </Card>
  );
}
