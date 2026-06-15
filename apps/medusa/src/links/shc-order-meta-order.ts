import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import ShcOrderMetaModule from "../modules/shc-order-meta";

export default defineLink(
  {
    linkable: OrderModule.linkable.order,
    field: "id",
  },
  ShcOrderMetaModule.linkable.shcOrderMeta
);
