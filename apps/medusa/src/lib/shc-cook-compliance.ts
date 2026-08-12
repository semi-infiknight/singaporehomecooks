import { canCookAcceptOrder, canCookListProducts } from "@shc/business-rules";
import { isCookComplianceVerified } from "@shc/utils";
import type { SHCErrorCode } from "@shc/types";
import ShcCookModuleService from "../modules/shc-cook/service";
import ShcComplianceDocModuleService from "../modules/shc-compliance-doc/service";

export async function cookHasVerifiedCompliance(scope: any, cookId: string): Promise<boolean> {
  const complianceService: ShcComplianceDocModuleService = scope.resolve("shcComplianceDoc");
  const [docs] = await complianceService
    .listAndCountComplianceDocs({ cook_id: cookId } as any, { take: 50 })
    .catch(() => [[]]);
  return isCookComplianceVerified((docs as any[]) || []);
}

async function loadCookGateContext(
  scope: any,
  cookId: string
): Promise<
  | { ok: true; cook: any; hasVerifiedCompliance: boolean }
  | { ok: false; code: SHCErrorCode; message: string }
> {
  const cookService: ShcCookModuleService = scope.resolve("shcCook");
  const [cooks] = await cookService.listAndCountCooks({ id: cookId } as any, { take: 1 }).catch(() => [[]]);
  const cook = (cooks as any[])?.[0];
  if (!cook) {
    return { ok: false, code: "SHC-COOK-001", message: "Cook profile not found" };
  }
  const hasVerifiedCompliance = await cookHasVerifiedCompliance(scope, cookId);
  return { ok: true, cook, hasVerifiedCompliance };
}

/** Gate cook Accept (paid → accepted). Returns SHC error code on failure. */
export async function assertCookCanAcceptOrder(
  scope: any,
  cookId: string
): Promise<{ ok: true } | { ok: false; code: SHCErrorCode; message: string }> {
  const ctx = await loadCookGateContext(scope, cookId);
  if (!ctx.ok) return ctx;

  const gate = canCookAcceptOrder({
    status: String(ctx.cook.status || "pending"),
    availabilityPaused: Boolean(ctx.cook.availability_paused),
    hasVerifiedCompliance: ctx.hasVerifiedCompliance,
  });

  if (!gate.valid) {
    return {
      ok: false,
      code: (gate.code || "SHC-COMPLIANCE-002") as SHCErrorCode,
      message: gate.error || "Compliance docs required and not verified",
    };
  }

  return { ok: true };
}

/** Gate cook listing create (POST /store/shc/listings). Compliance is not required to save dishes. */
export async function assertCookCanPublishListing(
  scope: any,
  cookId: string
): Promise<{ ok: true } | { ok: false; code: SHCErrorCode; message: string }> {
  const ctx = await loadCookGateContext(scope, cookId);
  if (!ctx.ok) return ctx;

  const gate = canCookListProducts({
    status: String(ctx.cook.status || "pending"),
    availabilityPaused: Boolean(ctx.cook.availability_paused),
    hasVerifiedCompliance: ctx.hasVerifiedCompliance,
  });

  if (!gate.valid) {
    return {
      ok: false,
      code: (gate.code || "SHC-COMPLIANCE-002") as SHCErrorCode,
      message: gate.error || "Compliance docs required before publishing",
    };
  }

  return { ok: true };
}
