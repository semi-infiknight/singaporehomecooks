import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import ShcProductMetaModule from "../modules/shc-product-meta/index.js";

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    field: "id",
  },
  ShcProductMetaModule.linkable.shcProductMeta
);
