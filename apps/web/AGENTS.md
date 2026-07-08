# SHC Web Agent

**Canonical brain:** [../../blueprint/README.md](../../blueprint/README.md) → [AGENT_PLAYBOOK.md](../../blueprint/AGENT_PLAYBOOK.md)

- Customer + `/cook-portal` + `/ops` — tri-platform: [design-taste.md](../../blueprint/agent/design-taste.md)
- Verify: `FLAVOUR=polish SCOPE=web pnpm verify:goal`
- PWA assets via route handlers (`app/sw.js/route.ts`), not `public/`

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
