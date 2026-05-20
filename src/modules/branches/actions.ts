"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { toErrorMessage } from "@/lib/errors";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import {
  addUserToBranch,
  patchBranch,
  registerBranch,
  removeBranch,
  removeUserFromBranch,
  searchEmployeesForBranch,
  setBranchActive,
} from "@/modules/branches/service";

async function requireBranchesWrite() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autenticado.");
  }
  if (!hasPermission(session.user.permissions, permissionCatalog.branchesWrite)) {
    throw new Error("Sem permissão para gerenciar unidades.");
  }
  return session;
}

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

export async function createBranchAction(input: unknown) {
  try {
    await requireBranchesWrite();
    await registerBranch(input);
    revalidatePath("/branches");
    revalidatePath("/sales");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}

export async function updateBranchAction(id: string, input: unknown) {
  try {
    await requireBranchesWrite();
    await patchBranch(id, input);
    revalidatePath("/branches");
    revalidatePath(`/branches/${id}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}

export async function toggleBranchActiveAction(id: string) {
  try {
    await requireBranchesWrite();
    await setBranchActive(id);
    revalidatePath("/branches");
    revalidatePath(`/branches/${id}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}

export async function deleteBranchAction(id: string) {
  try {
    await requireBranchesWrite();
    const result = await removeBranch(id);
    revalidatePath("/branches");
    revalidatePath("/inventory");
    revalidatePath("/transfers");
    return { ok: true as const, ...result };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}

export async function addUserToBranchAction(branchId: string, userId: string) {
  try {
    await requireOwnerSession();
    await addUserToBranch(branchId, userId);
    revalidatePath(`/branches/${branchId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}

export async function removeUserFromBranchAction(branchId: string, userId: string) {
  try {
    await requireOwnerSession();
    await removeUserFromBranch(branchId, userId);
    revalidatePath(`/branches/${branchId}`);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}

export async function searchEmployeesAction(branchId: string, query: string) {
  try {
    await requireOwnerSession();
    const users = await searchEmployeesForBranch(branchId, query);
    return { ok: true as const, users };
  } catch (error) {
    return {
      ok: false as const,
      message: toErrorMessage(error),
      users: [] as { id: string; name: string | null; email: string | null; image: string | null }[],
    };
  }
}
