import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import ShcCookModule from "../modules/shc-cook/index.js";

export default defineLink(
  {
    linkable: OrderModule.linkable.order,
    field: "id",
    isList: true,
  },
  ShcCookModule.linkable.shcCook
);
