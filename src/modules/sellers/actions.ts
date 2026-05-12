"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { toErrorMessage } from "@/lib/errors";
import { addUserToBranch, removeUserFromBranch } from "@/modules/branches/service";

async function requireOwnerSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autenticado.");
  }
  if (session.user.roleSlug !== "owner") {
    throw new Error("Apenas o proprietário pode executar esta ação.");
  }
  return session;
}

export async function disableSellerAction(userId: string) {
  try {
    await requireOwnerSession();

    await db.$transaction([
      db.user.update({
        where: { id: userId },
        data: { status: "DISABLED" },
      }),
      db.session.deleteMany({
        where: { userId },
      }),
    ]);

    revalidatePath("/sellers");
    revalidatePath(`/sellers/${userId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}

export async function reactivateSellerAction(userId: string) {
  try {
    await requireOwnerSession();

    await db.user.update({
      where: { id: userId },
      data: { status: "ACTIVE" },
    });

    revalidatePath("/sellers");
    revalidatePath(`/sellers/${userId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}

export async function updateSellerBranchAction(userId: string, branchId: string) {
  try {
    await requireOwnerSession();
    await addUserToBranch(branchId, userId);

    revalidatePath("/sellers");
    revalidatePath(`/sellers/${userId}`);
    revalidatePath(`/branches/${branchId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}

export async function removeSellerBranchAction(userId: string) {
  try {
    await requireOwnerSession();

    const link = await db.userBranch.findFirst({
      where: { userId },
      select: { branchId: true },
    });

    if (link) {
      await removeUserFromBranch(link.branchId, userId);
    }

    revalidatePath("/sellers");
    revalidatePath(`/sellers/${userId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}
