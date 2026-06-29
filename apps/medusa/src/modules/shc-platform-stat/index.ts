import { Module } from "@medusajs/framework/utils";
import Service from "./service";
import { PlatformStat } from "./models/platform-stat";

export default Module("shcPlatformStat", {
  service: Service,
});

export { PlatformStat };
export * from "./service";
