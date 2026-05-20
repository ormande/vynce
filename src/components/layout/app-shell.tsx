import { type ReactNode } from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PageTransitionWrapper } from "@/components/layout/page-transition-wrapper";
import { auth } from "@/lib/auth";
import { getNotificationCount } from "@/modules/notifications/service";
import { getPlatformSettings } from "@/modules/platform-settings/service";

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

  let transferBadgeCount = 0;
  let notificationCount = 0;
  const platformSettings = await getPlatformSettings();
  const singleUnitMode = platformSettings.singleUnitMode;

  if (session?.user) {
    if (!singleUnitMode) {
      const { getUnseenPendingTransfersCount } = await import(
        "@/modules/transfers/service"
      );
      transferBadgeCount = await getUnseenPendingTransfersCount(
        session.user.id,
        session.user.branchIds ?? [],
      );
    }
    notificationCount = await getNotificationCount({
      userId: session.user.id,
      roleSlug: session.user.roleSlug,
      branchIds: session.user.branchIds ?? [],
      accessAll: session.user.accessAll ?? false,
      singleUnitMode,
    });
  }

  return (
    <div className="flex min-h-screen w-full flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6">
      <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
        <AppSidebar
          pathname={pathname}
          roleSlug={session?.user?.roleSlug}
          transferBadgeCount={transferBadgeCount}
          singleUnitMode={singleUnitMode}
        />
      </div>

      <main className="flex-1 rounded-[36px] border border-white/60 bg-[rgba(252,250,247,0.82)] p-6 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur lg:p-8">
        <AppHeader
          title={title}
          subtitle={subtitle}
          notificationCount={notificationCount}
          userName={session?.user?.name}
          roleLabel={
            session?.user?.roleSlug === "owner"
              ? "Proprietário / Admin"
              : session?.user?.roleSlug === "seller"
                ? "Vendedor"
                : "Equipe"
          }
        />
        <PageTransitionWrapper>{children}</PageTransitionWrapper>
      </main>
    </div>
  );
}
