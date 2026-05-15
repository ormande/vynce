"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function PendingTransfersToast({ count }: { count: number }) {
  const router = useRouter();
  const hasShown = useRef(false);

  useEffect(() => {
    if (count > 0 && !hasShown.current) {
      hasShown.current = true;
      
      toast("Transferências Pendentes", {
        description: `Você tem ${count} nova(s) transferência(s) aguardando confirmação.`,
        icon: <ArrowLeftRight className="h-5 w-5 text-amber-500" />,
        action: {
          label: "Ver agora",
          onClick: () => router.push("/transfers?tab=incoming"),
        },
        duration: 8000,
      });
    }
  }, [count, router]);

  return null;
}
