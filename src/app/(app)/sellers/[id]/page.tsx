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
    <>
      <div className="mb-6">
        <h2 className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          {seller.name ?? "Funcionário"}
        </h2>
      </div>
      <SellerDetailsContent seller={seller} branches={branches} />
    </>
  );
}
