# [Project Name] | React 2026

## 🎯 Project Context

Modern React 19 app utilizing Server Components (if Next.js) or Vite 6.
Goal: High-performance, accessible, and type-safe UI.

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
