import { defineLink } from "@medusajs/framework/utils";
import ProductModule from "@medusajs/medusa/product";
import ShcAvailabilityModule from "../modules/shc-availability";

export default defineLink(
  {
    linkable: ProductModule.linkable.product,
    field: "id",
  },
  ShcAvailabilityModule.linkable.shcAvailability
);
