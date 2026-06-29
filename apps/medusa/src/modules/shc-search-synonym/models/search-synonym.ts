import { model } from "@medusajs/framework/utils";

export const SearchSynonym = model.define("shc_search_synonym", {
  id: model.id().primaryKey(),
  term: model.text().unique(),
  expansions: model.json().default([] as any),
});

export type SearchSynonym = any;
