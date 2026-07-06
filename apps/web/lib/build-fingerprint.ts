import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const RAILWAY_BUILD_ID_HEADER = 'X-SHC-Railway-Build-Id';

let cachedBuildId: string | null = null;

export function getRailwayBuildId(): string {
  if (cachedBuildId) return cachedBuildId;
  try {
    cachedBuildId = readFileSync(join(process.cwd(), '.railway-build-id'), 'utf8').trim();
  } catch {
    cachedBuildId = 'unknown';
  }
  return cachedBuildId;
}

export function withRailwayBuildId(headers: Record<string, string>): Record<string, string> {
  return {
    ...headers,
    [RAILWAY_BUILD_ID_HEADER]: getRailwayBuildId(),
  };
}