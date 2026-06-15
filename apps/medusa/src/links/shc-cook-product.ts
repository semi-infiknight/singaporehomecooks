import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import ShcCookModule from "../modules/shc-cook/index.js";

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    isList: true,
  },
  ShcCookModule.linkable.shcCook,
  {
    // One cook -> many products (enforced in business rules)
  }
);
