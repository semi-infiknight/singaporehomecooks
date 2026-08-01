import { logInfo, triggerOpsAlert } from "./shc-observability";
import ShcCookModuleService from "../modules/shc-cook/service";
import ShcNotificationModuleService from "../modules/shc-notification/service";

export type ComplianceDocSubmittedInput = {
  cook_id: string;
  doc_id: string;
  type: "sfa" | "wsq" | "halal";
  file_key: string;
};

const DOC_LABELS: Record<ComplianceDocSubmittedInput["type"], string> = {
  sfa: "SFA licence",
  wsq: "WSQ certificate",
  halal: "Halal certificate",
};

function resolveOpsActorId() {
  return process.env.SHC_OPS_ACTOR_ID?.trim() || "shc_ops";
}

/** Alert ops when a cook uploads SFA/WSQ for review (PagerDuty + optional in-app bell). */
export async function notifyOpsComplianceDocSubmitted(
  scope: { resolve: (name: string) => unknown },
  input: ComplianceDocSubmittedInput
) {
  const { cook_id, doc_id, type, file_key } = input;
  let cookLabel = cook_id;
  try {
    const cookService = scope.resolve("shcCook") as ShcCookModuleService;
    const [rows] = await cookService.listAndCountCooks({ id: cook_id } as any, { take: 1 }).catch(() => [[]]);
    const cook = (rows as any[])?.[0];
    if (cook?.display_name) cookLabel = `${cook.display_name} (${cook_id})`;
  } catch {
    /* optional cook lookup */
  }

  const docLabel = DOC_LABELS[type] || type.toUpperCase();
  const summary = `Cook compliance: ${cookLabel} uploaded ${docLabel}`;

  logInfo({
    event: "compliance.ops_notify.start",
    cook_id,
    doc_id,
    type,
    file_key,
  });

  const alertResult = await triggerOpsAlert({
    severity: "info",
    summary,
    source: "medusa-compliance-upload",
    dedupeKey: `compliance-${cook_id}-${type}-${doc_id}`,
    details: {
      cook_id,
      doc_id,
      type,
      file_key,
      admin_path: "/app/shc-ops/compliance",
    },
  });

  let inApp = false;
  const opsActorId = resolveOpsActorId();
  try {
    const notifService = scope.resolve("shcNotification") as ShcNotificationModuleService;
    await notifService.push(opsActorId, {
      type: "compliance_review",
      body: `${cookLabel} uploaded ${docLabel}. Review in SHC Ops → Compliance.`,
    });
    inApp = true;
  } catch (e) {
    logInfo({
      event: "compliance.ops_notify.in_app_skipped",
      cook_id,
      doc_id,
      reason: e instanceof Error ? e.message : "notification_failed",
    });
  }

  logInfo({
    event: "compliance.ops_notify.done",
    cook_id,
    doc_id,
    pagerduty: alertResult.delivered,
    in_app: inApp,
  });

  return { pagerduty: alertResult.delivered, in_app: inApp };
}
