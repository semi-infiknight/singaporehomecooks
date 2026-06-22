import ShcNotificationModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export default Module("shcNotification", {
  service: ShcNotificationModuleService,
});

export { ShcNotificationModuleService };