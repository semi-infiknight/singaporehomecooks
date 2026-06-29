import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { SearchSynonym } from "./models/search-synonym";

export default Module("shcSearchSynonym", {
  service: Service,
});

export { SearchSynonym };
export * from "./service";
