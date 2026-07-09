import { Module } from "@medusajs/framework/utils";
import Service from "./service";

export default Module("shcTiffin", {
  service: Service,
});

export * from "./service";