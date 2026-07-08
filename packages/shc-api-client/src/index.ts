/**
 * AGENT: Runtime API boundary — all clients use createShcApiClient (Medusa only, no mock).
 * Wire screens via app hooks → this client. Errors: ShcRequestError + SHCErrorCode.
 * Blueprint: blueprint/agent/build-protocol.md · blueprint/06-api-surface/
 */
export { createShcApiClient, ShcRequestError } from "./client";
export type { ShcApiClient, ShcApiClientConfig, ShcUser } from "./client";