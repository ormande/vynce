import { AppError } from "@/lib/errors";
import { db } from "@/lib/db";
import {
  countBranchSales,
  countBranchTransfers,
  createBranch,
  createUserBranchAssignment,
  deleteBranchWithStockMigration,
  deleteUserBranchAssignment,
  findAllBranches,
  findAllBranchesAdmin,
  findAnyActiveWarehouse,
  findBranchById,
  findUserBranchLink,
  findUserByIdWithRole,
  getLinkedUserIdSetForBranch,
  searchSellerUsers,
  toggleBranchActive,
  updateBranch,
} from "@/modules/branches/repository";
import {
  branchCreateSchema,
  branchUpdateSchema,
} from "@/modules/branches/schemas";

export async function listActiveBranches() {
  return findAllBranches();
}

export async function listBranchesAdmin() {
  return findAllBranchesAdmin();
}

export async function getBranchById(id: string) {
  const branch = await findBranchById(id);
  if (!branch) {
    throw new AppError("Unidade não encontrada.", 404);
  }
  return branch;
}

export async function registerBranch(input: unknown) {
  const data = branchCreateSchema.parse(input);
  return createBranch({
    name: data.name,
    address: data.address?.trim() ? data.address.trim() : undefined,
    isWarehouse: data.isWarehouse ?? false,
  });
}

export async function patchBranch(id: string, input: unknown) {
  const data = branchUpdateSchema.parse(input);
  return updateBranch(id, {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.address !== undefined
      ? { address: data.address?.trim() ? data.address.trim() : null }
      : {}),
    ...(data.isWarehouse !== undefined ? { isWarehouse: data.isWarehouse } : {}),
  });
}

export async function setBranchActive(id: string) {
  const updated = await toggleBranchActive(id);
  if (!updated) {
    throw new AppError("Unidade não encontrada.", 404);
  }
  return updated;
}

export async function removeBranch(id: string) {
  const branch = await db.branch.findUnique({
    where: { id },
    select: { id: true, isWarehouse: true, name: true },
  });
  if (!branch) {
    throw new AppError("Unidade não encontrada.", 404);
  }

  if (branch.isWarehouse) {
    const otherWarehouse = await findAnyActiveWarehouse(id);
    if (!otherWarehouse) {
      throw new AppError(
        "Não é possível excluir a única unidade-depósito. Cadastre outra unidade como depósito antes.",
        409,
      );
    }
  }

  // Bloqueia exclusão se houver vendas — preservação de histórico contábil.
  const salesCount = await countBranchSales(id);
  if (salesCount > 0) {
    throw new AppError(
      `Esta unidade possui ${salesCount} venda(s) registrada(s). Desative-a em vez de excluir para preservar o histórico.`,
      409,
    );
  }

  // Bloqueia exclusão se houver transferências (entrada ou saída).
  const transfersCount = await countBranchTransfers(id);
  if (transfersCount > 0) {
    throw new AppError(
      "Esta unidade possui histórico de transferências. Desative-a em vez de excluir.",
      409,
    );
  }

  // Procura uma warehouse ativa para receber o estoque (excluindo a própria unidade).
  const warehouse = await findAnyActiveWarehouse(id);
  if (!warehouse) {
    throw new AppError(
      "Nenhum depósito central ativo para receber o estoque. Crie ou ative um antes de excluir esta unidade.",
      409,
    );
  }

  const result = await deleteBranchWithStockMigration(id, warehouse.id);
  return {
    deletedBranchName: branch.name,
    warehouseName: warehouse.name,
    migratedProducts: result.migratedProducts,
  };
}

export async function addUserToBranch(branchId: string, userId: string) {
  await getBranchById(branchId);

  const user = await findUserByIdWithRole(userId);
  if (!user || user.role?.slug !== "seller") {
    throw new AppError("Usuário não encontrado ou não possui perfil de vendedor.", 400);
  }

  // Seller can only be in one branch at a time
  await db.userBranch.deleteMany({
    where: { userId },
  });

  return createUserBranchAssignment(userId, branchId);
}

export async function removeUserFromBranch(branchId: string, userId: string) {
  await getBranchById(branchId);

  const link = await findUserBranchLink(userId, branchId);
  if (!link) {
    throw new AppError("Vínculo não encontrado.", 404);
  }
  if (link.user.role?.slug !== "seller") {
    throw new AppError("Este vínculo não pode ser removido por aqui.", 400);
  }

  await deleteUserBranchAssignment(userId, branchId);
}

export async function searchEmployeesForBranch(branchId: string, query: string) {
  await getBranchById(branchId);
  const linked = await getLinkedUserIdSetForBranch(branchId);
  const candidates = await searchSellerUsers(query);
  return candidates.filter((u) => !linked.has(u.id));
}
