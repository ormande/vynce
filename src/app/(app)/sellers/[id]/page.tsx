import { AppShell } from "@/components/layout/app-shell";
import { SellerDetailsContent } from "@/components/sellers/seller-details-content";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { findSellerById } from "@/modules/sellers/repository";
import { findAllBranches } from "@/modules/branches/repository";

export const dynamic = "force-dynamic";

export default async function SellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user || session.user.roleSlug !== "owner") {
    redirect("/dashboard");
  }

  const [seller, branches] = await Promise.all([
    findSellerById(id),
    findAllBranches(),
  ]);

  if (!seller || seller.role?.slug !== "seller") {
    notFound();
  }

  return (
    <AppShell
      title={seller.name ?? "Funcionário"}
      subtitle="Gerencie o vínculo com unidades, status da conta e visualize o histórico do funcionário."
      pathname="/sellers"
      backHref="/sellers"
    >
      <SellerDetailsContent seller={seller} branches={branches} />
    </AppShell>
  );
}
