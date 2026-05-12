"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { toErrorMessage } from "@/lib/errors";
import { hasPermission, permissionCatalog } from "@/lib/permissions";
import {
  cancelTransfer,
  confirmTransfer,
  getBranchStocksForTransferPicker,
  requestTransfer,
} from "@/modules/transfers/service";

async function requireTransfersSession() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Não autenticado.");
  }
  if (!hasPermission(session.user.permissions, permissionCatalog.transfersRead)) {
    throw new Error("Sem permissão para acessar transferências.");
  }
  return session;
}

function sessionContext(session: NonNullable<Awaited<ReturnType<typeof auth>>>) {
  return {
    userId: session.user.id,
    roleSlug: session.user.roleSlug,
    branchIds: session.user.branchIds ?? [],
    accessAll: session.user.accessAll,
  };
}

export async function requestTransferAction(input: unknown) {
  try {
    const session = await requireTransfersSession();
    if (!hasPermission(session.user.permissions, permissionCatalog.transfersWrite)) {
      throw new Error("Sem permissão para solicitar transferências.");
    }
    await requestTransfer(input, sessionContext(session));
    revalidatePath("/transfers");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}

export async function confirmTransferAction(input: unknown) {
  try {
    const session = await requireTransfersSession();
    if (!hasPermission(session.user.permissions, permissionCatalog.transfersConfirm)) {
      throw new Error("Sem permissão para confirmar recebimento.");
    }
    await confirmTransfer(input, sessionContext(session));
    revalidatePath("/transfers");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}

export async function cancelTransferAction(input: unknown) {
  try {
    const session = await requireTransfersSession();
    if (
      session.user.roleSlug !== "owner" &&
      !hasPermission(session.user.permissions, permissionCatalog.transfersWrite)
    ) {
      throw new Error("Sem permissão para cancelar transferências.");
    }
    await cancelTransfer(input, sessionContext(session));
    revalidatePath("/transfers");
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, message: toErrorMessage(error) };
  }
}

export async function listStocksForTransferFromBranchAction(branchId: string) {
  try {
    const session = await requireTransfersSession();
    const ctx = sessionContext(session);
    if (session.user.roleSlug === "seller" && !session.user.accessAll) {
      if (!ctx.branchIds.includes(branchId)) {
        throw new Error("Unidade não autorizada.");
      }
    }
    const rows = await getBranchStocksForTransferPicker(branchId);
    return {
      ok: true as const,
      stocks: rows.map((r) => ({
        productId: r.productId,
        name: r.product.name,
        quantity: r.quantity,
      })),
    };
  } catch (error) {
    return {
      ok: false as const,
      message: toErrorMessage(error),
      stocks: [] as { productId: string; name: string; quantity: number }[],
    };
  }
}
