import { AppShell } from "@/components/layout/app-shell";
import { SellersPageContent } from "@/components/sellers/sellers-page-content";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { findAllSellers } from "@/modules/sellers/repository";

export const dynamic = "force-dynamic";

export default async function SellersPage() {
  const session = await auth();
  if (!session?.user || session.user.roleSlug !== "owner") {
    redirect("/dashboard");
  }

  const sellers = await findAllSellers();

  return (
    <AppShell
      title="Funcionários"
      subtitle="Gerencie os vendedores da sua equipe, vincule-os a unidades e controle o acesso ao sistema."
      pathname="/sellers"
    >
      <SellersPageContent sellers={sellers} />
    </AppShell>
  );
}
