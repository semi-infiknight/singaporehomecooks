import { buildOrderInvoice, type BuildInvoiceInput } from "@shc/utils";

type CookRow = {
  id?: string;
  display_name?: string;
  area?: string;
  collection_address?: string | null;
  payout_legal_name?: string | null;
  paynow_uen?: string | null;
  sfa_reg_number?: string | null;
};

export function cookSupplierFromProfile(cook?: CookRow | null, fallbackName?: string) {
  const legalName = String(cook?.payout_legal_name || cook?.display_name || fallbackName || "Home cook").trim();
  const address = String(cook?.collection_address || cook?.area || "Singapore").trim();
  const uen = String(cook?.paynow_uen || cook?.sfa_reg_number || "").trim();
  return {
    legal_name: legalName,
    uen: uen || (cook?.id ? `Kitchen ${String(cook.id).slice(-8)}` : "Home-based food business"),
    address,
    gst_registered: false,
    gst_registration_number: null,
  };
}

export async function buildCustomerOrderInvoice(
  scope: any,
  order: BuildInvoiceInput["order"],
  actorName?: string
) {
  let cookSupplier: BuildInvoiceInput["cook_supplier"] | undefined;
  if (order.cook_id) {
    try {
      const cookSvc = scope.resolve("shcCook") as any;
      const [cooks] = await cookSvc.listAndCountCooks({ id: order.cook_id } as any, { take: 1 });
      cookSupplier = cookSupplierFromProfile(cooks?.[0], order.cook_name);
    } catch {
      cookSupplier = cookSupplierFromProfile(null, order.cook_name);
    }
  } else {
    cookSupplier = cookSupplierFromProfile(null, order.cook_name);
  }

  return buildOrderInvoice({
    order: { ...order, cook_area: order.cook_area },
    audience: "customer",
    actorName,
    cook_supplier: cookSupplier,
  });
}
