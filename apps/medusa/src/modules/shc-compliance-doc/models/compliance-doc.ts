import { model } from "@medusajs/framework/utils";

export const ComplianceDoc = model.define("shc_compliance_doc", {
  id: model.id().primaryKey(),
  cook_id: model.text(),
  type: model.enum(["sfa", "wsq"]),
  file_key: model.text(),
  expiry_date: model.dateTime().nullable(),
  verified_at: model.dateTime().nullable(),
});

export type ComplianceDoc = any;
