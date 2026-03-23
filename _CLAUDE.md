# [Project Name] | nextjs-dashboard - monorepo

## 🎯 Project Context

this is a monorepo for nextjs-dashboard managed by nx, which includes the web application and shared packages. The web application is built with Next.js 13 using the app directory and React 19 features. The goal is to create a high-performance, accessible, and type-safe dashboard UI.

## 🛠 Tech Stack

- **Framework:** React 19 / Vite 6 / TypeScript (Strict)
- **Styling:** Tailwind CSS + Shadcn/ui (Radix Primitives)
- **State:** Zustand for global client state, TanStack Query v5 for server state
- **Testing:** Vitest + React Testing Library

## 📋 Critical Commands

- **Dev:** `npm run dev` | **Build:** `npm run build`
- **Test:** `npm test` (Unit) / `npm run test:e2e` (Playwright)
- **Lint:** `npm run lint` / `npm run type-check`
- **UI:** `npx shadcn@latest add [component]`

## 📐 Coding Standards

- **Component Pattern:** Functional components with standard exports. Use `use client` directives explicitly.
- **Naming:** PascalCase for components, camelCase for hooks/utilities.
- **File Structure:** Feature-based (`src/features/[feature-name]`).
- **Performance:** Avoid `useEffect` for data fetching; use TanStack Query. Parallelize `await` calls where possible.

## 🛑 Guardrails (Do Not Violate)

- **No `any`:** Use Zod schemas for external data.
- **No Class Components:** Zero exceptions.
- **DRY Logic:** Extract logic into custom hooks if reused in >1 component.
- **Security:** Never hardcode secrets. Use `.env.example` as a reference.

<!-- ## 🧠 Module Context

- For API logic, see `src/api/CLAUDE.md`.
- For Design System rules, see `src/components/ui/CLAUDE.md`. -->
