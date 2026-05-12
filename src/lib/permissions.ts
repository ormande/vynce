export const permissionCatalog = {
  dashboardView: "dashboard:view",
  customersRead: "customers:read",
  customersWrite: "customers:write",
  productsRead: "products:read",
  productsWrite: "products:write",
  inventoryRead: "inventory:read",
  inventoryWrite: "inventory:write",
  salesRead: "sales:read",
  salesWrite: "sales:write",
  receivablesRead: "receivables:read",
  receivablesWrite: "receivables:write",
  reportsRead: "reports:read",
  usersManage: "users:manage",
  settingsManage: "settings:manage",
  branchesRead: "branches:read",
  branchesWrite: "branches:write",
  branchesTransfer: "branches:transfer",
  transfersRead: "transfers:read",
  transfersWrite: "transfers:write",
  transfersConfirm: "transfers:confirm",
} as const;

export type PermissionKey =
  (typeof permissionCatalog)[keyof typeof permissionCatalog];

export function hasPermission(
  permissions: string[] | undefined,
  permission: PermissionKey,
) {
  return permissions?.includes(permission) ?? false;
}

export function canTransferProduct(params: {
  roleSlug: string;
  fromBranchId: string;
  toBranchId: string;
  userBranchIds: string[];
  warehouseBranchId: string;
}): { allowed: boolean; reason?: string } {
  const { roleSlug, fromBranchId, toBranchId, userBranchIds, warehouseBranchId } =
    params;

  if (roleSlug === "owner") {
    return { allowed: true };
  }

  if (roleSlug === "seller") {
    if (!userBranchIds.includes(fromBranchId)) {
      return {
        allowed: false,
        reason: "Você só pode transferir produtos da sua própria unidade.",
      };
    }

    if (toBranchId === warehouseBranchId) {
      return {
        allowed: false,
        reason: "Vendedores não podem transferir produtos para o depósito central.",
      };
    }

    if (toBranchId === fromBranchId) {
      return {
        allowed: false,
        reason: "A unidade de destino deve ser diferente da unidade de origem.",
      };
    }

    return { allowed: true };
  }

  return { allowed: false, reason: "Papel de usuário não reconhecido." };
}
