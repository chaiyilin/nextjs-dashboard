# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo Structure

pnpm workspaces + Nx orchestration. Three packages:

- `web` (`@repo/web`) — Next.js app with App Router
- `infra/app` (`@repo/infra-app`) — CDK stack deploying the app to AWS
- `infra/governance` (`@repo/infra-governance`) — CDK stacks for AWS Organizations and baseline IAM

All commands below run from the repo root unless noted.

## Commands

### Web app
```bash
pnpm dev                        # start Next.js dev server (Turbopack)
pnpm build                      # build web app
pnpm --filter @repo/web lint    # ESLint
pnpm --filter @repo/web opennext-build  # build for OpenNext/Lambda deployment
```

### Infra — app stack
```bash
pnpm infra:synth    # cdk synth (app stack)
pnpm infra:deploy   # cdk deploy --all (app stack)
pnpm --filter @repo/infra-app diff
```

### Infra — governance
```bash
# Run from infra/governance or via pnpm --filter @repo/infra-governance
pnpm deploy:org       # deploy OrganizationStack (us-east-1, management account)
pnpm deploy:baseline  # deploy BaselineStack to staging + prod accounts
pnpm diff:org / diff:baseline
pnpm synth:org / synth:baseline
```

## Architecture

### Web (`web/`)

Next.js 15 App Router. No Zustand/TanStack Query yet — data fetching is done with RSC and `postgres` directly in `app/lib/data.ts`. Server Actions in `app/lib/actions.ts` handle all mutations (create/update/delete invoice, authenticate).

Authentication uses NextAuth v5 beta:
- `auth.config.ts` — route protection callback (used in middleware)
- `auth.ts` — credentials provider with bcrypt + postgres user lookup
- `proxy.ts` — auth proxy middleware

All DB access uses the `postgres` package directly with `POSTGRES_URL` env var.

### Infra — App Stack (`infra/app/`)

OpenNext serverless deployment on AWS:
- S3 bucket for static assets (`/_next/static/*`)
- Lambda (Node 22) for SSR server function
- Lambda (Node 22) for image optimisation
- CloudFront distribution routing between the three origins
- `BucketDeployment` uploads `.open-next/assets` on deploy

Build sequence: `opennext-build` → CDK reads `.open-next/` artifact paths.

### Infra — Governance (`infra/governance/`)

Two independent CDK apps deployed to `us-east-1`:

1. **`bin/organization.ts`** → `OrganizationStack` — creates AWS Organizations OU (`WorkloadsOU`) + member accounts (Staging, Prod). Deployed once from management account.

2. **`bin/baseline.ts`** → `BaselineStack` (×2) — deployed into each workload account by assuming `OrganizationAccountAccessRole`. Creates GitHub OIDC provider + `GitHubActionsRole` (AdministratorAccess) so GitHub Actions can deploy. Requires `STAGING_ACCOUNT_ID` and `PROD_ACCOUNT_ID` env vars.

### Deployment pipeline (`.github/workflows/deploy.yml`)

On push to `main`: `opennext-build` → configure AWS credentials (OIDC via `AWS_ROLE_ARN` secret) → `cdk deploy` app stack. Required secrets: `AWS_ROLE_ARN`, `POSTGRES_URL`, `AUTH_SECRET`.

## Coding Standards

- TypeScript strict mode; no `any` — use Zod for external data.
- Functional components only; `use client` directives must be explicit.
- PascalCase components, camelCase hooks/utilities.
- Parallelize independent `await` calls with `Promise.all`.
- No `useEffect` for data fetching.
