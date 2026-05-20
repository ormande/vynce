"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

export function PageTransitionWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="mt-8 animate-page-in">
      {children}
    </div>
  );
}
