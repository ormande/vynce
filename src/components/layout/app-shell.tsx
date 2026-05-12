import { type ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { auth } from "@/lib/auth";

export async function AppShell({
  title,
  subtitle,
  pathname,
  children,
}: {
  title: string;
  subtitle: string;
  pathname: string;
  children: ReactNode;
}) {
  const session = await auth();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6">
      <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
        <AppSidebar pathname={pathname} />
      </div>

      <main className="flex-1 rounded-[36px] border border-white/60 bg-[rgba(252,250,247,0.82)] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur lg:p-8">
        <AppHeader
          title={title}
          subtitle={subtitle}
          userName={session?.user?.name}
          roleLabel={
            session?.user?.roleSlug === "owner" ? "Owner/Admin" : "Funcionario"
          }
        />
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
