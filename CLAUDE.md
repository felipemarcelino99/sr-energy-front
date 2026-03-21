# CLAUDE.md — sr-energy-front

## Stack

- **Framework:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4 + DaisyUI
- **State:** Zustand
- **Routing:** React Router DOM v7
- **Backend:** Supabase
- **Testing (unit):** Jest + Testing Library
- **Testing (e2e):** Cypress
- **Rich text:** TipTap
- **Charts:** Recharts
- **HTTP:** Axios
- **Validation:** Zod

## Development Workflow

### 1. TDD — Tests First, Always

This project follows **Test-Driven Development strictly**. No implementation code may be written before its tests exist.

**Order of work, non-negotiable:**
1. Write failing tests using the global **`superpowers:test-driven-development`** skill
2. Implement the minimum code to make tests pass
3. Refactor under green tests

Run tests before marking any task complete:
```bash
npm test          # unit (Jest)
npm run cy:run    # e2e (Cypress)
```

A task is **only done when all tests pass**.

### 2. Visual Design

Before implementing any UI component or screen, use the **`interface-design`** skill to define the visual design first.

### 3. React Implementation

Use the **`react-expert`** agent for all React development work.

## Code Quality Standards

Follow these at all times — no exceptions:

- **Clean Code:** meaningful names, small focused functions, no dead code
- **Design Patterns:** use appropriate patterns (Repository, Strategy, Observer, etc.)
- **DRY:** no duplicated logic; extract shared behavior into hooks, utils, or services
- **SOLID principles** where applicable
- **Avoid unnecessary complexity:** the simplest solution that works is preferred
- **No premature abstractions:** only abstract when there are 3+ actual usages

## Security — Secrets & Environment Variables

- **NEVER expose `.env` secrets** in code, logs, comments, or responses
- Variables must always be accessed via `import.meta.env.VITE_*` — never hardcoded
- If any secret exposure is detected at any point, **report it immediately** before proceeding
- `.env` files must never be committed to version control

## Constraints — Do Not Break Without Explicit Permission

| Rule | Detail |
|------|--------|
| **No stack changes** | Do not swap or replace any library in the current stack |
| **No new libraries** | Must request and receive explicit user approval before adding any dependency |
| **No major version upgrades** | `npm install pkg@major` requires explicit approval |
| **No `--no-verify` or bypass hooks** | Fix the root cause instead |
