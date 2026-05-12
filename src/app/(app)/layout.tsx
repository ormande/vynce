import { ReactNode } from "react";

import { requireSession } from "@/lib/auth-guards";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireSession();

  return children;
}
