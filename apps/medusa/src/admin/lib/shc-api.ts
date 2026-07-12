import { sdk } from "./sdk"

/** Typed fetch wrapper for /admin/shc/* using Medusa Admin session. */
export async function shcGet<T = any>(path: string): Promise<T> {
  return sdk.client.fetch<T>(path)
}

export async function shcPost<T = any>(path: string, body?: Record<string, unknown>): Promise<T> {
  return sdk.client.fetch<T>(path, {
    method: "POST",
    body: body ?? {},
  })
}

export async function shcDelete<T = any>(path: string): Promise<T> {
  return sdk.client.fetch<T>(path, {
    method: "DELETE",
  })
}

export function errMessage(e: unknown): string {
  if (!e) return "Unknown error"
  if (typeof e === "string") return e
  const any = e as { message?: string; statusText?: string; status?: number }
  return any.message || any.statusText || `Request failed${any.status ? ` (${any.status})` : ""}`
}
