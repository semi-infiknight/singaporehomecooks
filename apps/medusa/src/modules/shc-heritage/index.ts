import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { Heritage } from "./models/heritage";

export default Module("shcHeritage", {
  service: Service,
});

export { Heritage };
export * from "./service";
