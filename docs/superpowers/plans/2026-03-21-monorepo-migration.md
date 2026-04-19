# Monorepo Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge `sr-energy-front` and `sr-energy-back/sr-energy-api` into a single npm-workspaces monorepo at a new root directory `sr-energy`.

**Architecture:** Create a new root directory `C:\Material Programação\projetos\sr-energy` with npm workspaces. Copy each app into `apps/frontend` and `apps/api`. All existing tests must be green before migration starts and remain green after each step.

**Tech Stack:** npm workspaces (built-in to npm — no new libraries), TypeScript project references, Node.js ≥ 20, existing stacks unchanged (React + Vite for frontend, Fastify for API).

---

## Scope

This plan covers Phase 1 (structural migration) only. Phase 2 (shared `packages/types`) is a follow-up plan.

---

## File Map

| Path | Action | Responsibility |
|------|--------|---------------|
| `sr-energy/package.json` | Create | npm workspaces root — no runtime code, just orchestration |
| `sr-energy/tsconfig.base.json` | Create | Shared TS compiler options (universal only) |
| `sr-energy/.gitignore` | Create | Root gitignore |
| `sr-energy/.env.example` | Create | Documents all env vars (derived from actual .env.example files) |
| `sr-energy/packages/.gitkeep` | Create | Placeholder so packages/ directory exists |
| `sr-energy/apps/frontend/` | Copy from `sr-energy-front/` | React + Vite app |
| `sr-energy/apps/api/` | Copy from `sr-energy-back/sr-energy-api/` | Fastify API |
| `sr-energy/apps/frontend/package.json` | Modify | Set name to `@sr-energy/frontend` |
| `sr-energy/apps/api/package.json` | Modify | Set name to `@sr-energy/api` |
| `sr-energy/apps/frontend/tsconfig.json` | Modify | Extend `../../tsconfig.base.json` |
| `sr-energy/apps/api/tsconfig.json` | Modify | Extend `../../tsconfig.base.json` |
| `sr-energy/apps/api/tsconfig.json` | Modify | Add `declaration: true`, `declarationMap: true` |
| `sr-energy/apps/api/railway.toml` | Modify | Update build/start commands for monorepo root |

---

## Task 0: Verify Baseline — All Tests Green Before Migration

**Do not proceed unless both apps have green tests.**

- [ ] **Step 1: Run frontend tests**

```bash
cd "C:/Material Programação/projetos/sr-energy-front"
npm test
```

Expected: All Jest tests pass. If any fail, **stop and fix them before continuing.**

- [ ] **Step 2: Run API tests**

```bash
cd "C:/Material Programação/projetos/sr-energy-back/sr-energy-api"
npm test
```

Expected: All Jest tests pass. If any fail, **stop and fix them before continuing.**

---

## Task 1: Create Monorepo Root

**Files:**
- Create: `sr-energy/package.json`
- Create: `sr-energy/tsconfig.base.json`
- Create: `sr-energy/.gitignore`
- Create: `sr-energy/packages/.gitkeep`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p "C:/Material Programação/projetos/sr-energy/apps"
mkdir -p "C:/Material Programação/projetos/sr-energy/packages"
```

- [ ] **Step 2: Write root package.json**

Create `C:/Material Programação/projetos/sr-energy/package.json`:

```json
{
  "name": "sr-energy",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:frontend": "npm run dev --workspace=apps/frontend",
    "dev:api": "npm run dev --workspace=apps/api",
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "test:frontend": "npm run test --workspace=apps/frontend",
    "test:api": "npm run test --workspace=apps/api"
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 3: Write shared tsconfig.base.json (universal options only)**

Create `C:/Material Programação/projetos/sr-energy/tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "sourceMap": true
  }
}
```

> Note: `declaration` and `declarationMap` are intentionally omitted here — they are only needed for the API (not Vite frontend) and will be added to `apps/api/tsconfig.json` in Task 3.

- [ ] **Step 4: Write root .gitignore**

Create `C:/Material Programação/projetos/sr-energy/.gitignore`:

```
node_modules/
dist/
.env
.env.local
.env.production
*.log
.DS_Store
```

- [ ] **Step 5: Create packages placeholder**

```bash
touch "C:/Material Programação/projetos/sr-energy/packages/.gitkeep"
```

- [ ] **Step 6: Initialize git repo and commit**

```bash
cd "C:/Material Programação/projetos/sr-energy"
git init
git add package.json tsconfig.base.json .gitignore packages/.gitkeep
git commit -m "chore: initialize monorepo root with npm workspaces"
```

---

## Task 2: Migrate Frontend App

**Files:**
- Copy all of `sr-energy-front/` → `sr-energy/apps/frontend/`
- Modify: `apps/frontend/package.json` (name field)
- Modify: `apps/frontend/tsconfig.json` (extends)

- [ ] **Step 1: Copy frontend into apps/frontend**

```bash
cp -r "C:/Material Programação/projetos/sr-energy-front/." \
      "C:/Material Programação/projetos/sr-energy/apps/frontend/"
```

- [ ] **Step 2: Verify the copy succeeded**

```bash
ls "C:/Material Programação/projetos/sr-energy/apps/frontend/src"
```

Expected: Lists source files (e.g. `main.tsx`, `App.tsx`, directories like `views/`, `services/`). If empty or missing, re-run the copy.

- [ ] **Step 3: Update package.json name**

Open `apps/frontend/package.json`, change `"name"` to `"@sr-energy/frontend"`.

- [ ] **Step 4: Update tsconfig to extend base**

Open `apps/frontend/tsconfig.json`. Add `"extends": "../../tsconfig.base.json"` as the first field:

```json
{
  "extends": "../../tsconfig.base.json",
  ...rest of existing content unchanged...
}
```

> Keep all existing `compilerOptions` — they override or extend the base.

- [ ] **Step 5: Remove copied node_modules (will be re-hoisted from root)**

```bash
rm -rf "C:/Material Programação/projetos/sr-energy/apps/frontend/node_modules"
```

- [ ] **Step 6: Commit**

```bash
cd "C:/Material Programação/projetos/sr-energy"
git add apps/frontend/
git commit -m "chore: add frontend app to monorepo"
```

---

## Task 3: Migrate API App

**Files:**
- Copy all of `sr-energy-back/sr-energy-api/` → `sr-energy/apps/api/`
- Modify: `apps/api/package.json` (name field)
- Modify: `apps/api/tsconfig.json` (extends + add declaration options)

- [ ] **Step 1: Copy API into apps/api**

```bash
cp -r "C:/Material Programação/projetos/sr-energy-back/sr-energy-api/." \
      "C:/Material Programação/projetos/sr-energy/apps/api/"
```

- [ ] **Step 2: Verify the copy succeeded**

```bash
ls "C:/Material Programação/projetos/sr-energy/apps/api/src"
```

Expected: Lists API source files (e.g. `index.ts`, `routes/`, `services/`). If empty, re-run the copy.

- [ ] **Step 3: Update package.json name**

Open `apps/api/package.json`, change `"name"` to `"@sr-energy/api"`.

- [ ] **Step 4: Update tsconfig to extend base and add API-specific options**

Open `apps/api/tsconfig.json`. Add `extends` and ensure `declaration`/`declarationMap` are in `compilerOptions`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    ...rest of existing compilerOptions unchanged...
  },
  ...rest of file unchanged...
}
```

- [ ] **Step 5: Remove copied node_modules**

```bash
rm -rf "C:/Material Programação/projetos/sr-energy/apps/api/node_modules"
```

- [ ] **Step 6: Commit**

```bash
cd "C:/Material Programação/projetos/sr-energy"
git add apps/api/
git commit -m "chore: add api app to monorepo"
```

---

## Task 4: Install All Dependencies from Root

**Files:**
- `sr-energy/node_modules/` (generated)
- `sr-energy/package-lock.json` (generated)

- [ ] **Step 1: Run npm install from root**

```bash
cd "C:/Material Programação/projetos/sr-energy"
npm install
```

Expected: npm resolves both workspaces, hoists shared deps, creates symlinks. No errors. Warnings about unresolved peer deps are acceptable.

- [ ] **Step 2: Verify workspace resolution**

```bash
npm ls --workspaces --depth=0 2>&1 | head -30
```

Expected: Lists `@sr-energy/frontend` and `@sr-energy/api` without errors.

- [ ] **Step 3: Commit lockfile**

```bash
cd "C:/Material Programação/projetos/sr-energy"
git add package-lock.json
git commit -m "chore: install all workspace dependencies"
```

---

## Task 5: Verify Frontend Builds and Tests Pass

- [ ] **Step 1: Run frontend unit tests**

```bash
cd "C:/Material Programação/projetos/sr-energy"
npm run test:frontend
```

Expected: All Jest tests pass — same count as Task 0 Step 1.

If tests fail due to broken `moduleNameMapper` paths, open `apps/frontend/jest.config.cjs` and verify all paths are relative to the app root (`<rootDir>`) — they should be unchanged.

- [ ] **Step 2: Run frontend type-check and build**

```bash
npm run build --workspace=apps/frontend
```

Expected: Vite build succeeds, outputs to `apps/frontend/dist/`.

- [ ] **Step 3: Run frontend Cypress e2e (requires dev server)**

```bash
# Start dev server in background, capture PID
npm run dev:frontend &
DEV_PID=$!

# Wait for server to be ready (adjust port if needed)
sleep 5

# Run e2e tests
npm run cy:run --workspace=apps/frontend
CYPRESS_EXIT=$?

# Kill the dev server
kill $DEV_PID

# Fail step if cypress failed
exit $CYPRESS_EXIT
```

Expected: All Cypress tests pass.

- [ ] **Step 4: Commit if any config fixes were made**

```bash
cd "C:/Material Programação/projetos/sr-energy"
git add apps/frontend/
git commit -m "fix: update frontend config for monorepo workspace"
```

---

## Task 6: Verify API Builds and Tests Pass

- [ ] **Step 1: Run API unit tests**

```bash
cd "C:/Material Programação/projetos/sr-energy"
npm run test:api
```

Expected: All Jest tests pass — same count as Task 0 Step 2.

- [ ] **Step 2: Run API type-check and build**

```bash
npm run build --workspace=apps/api
```

Expected: `tsc` succeeds, outputs to `apps/api/dist/`.

- [ ] **Step 3: Smoke-test API startup**

```bash
# Copy .env into apps/api first (see Task 7)
npm run dev:api
```

Expected: Fastify server starts and logs "Server listening" (Ctrl+C to stop).

- [ ] **Step 4: Commit if any config fixes were made**

```bash
cd "C:/Material Programação/projetos/sr-energy"
git add apps/api/
git commit -m "fix: update api config for monorepo workspace"
```

---

## Task 7: Update Railway Deployment Config

The API is deployed on Railway. With the monorepo, Railway must run `npm install` from the **monorepo root** (not `apps/api`) so workspace hoisting works. Set Railway's Root Directory to the monorepo root and update `railway.toml` to scope commands to the workspace.

**Files:**
- Modify: `apps/api/railway.toml`

- [ ] **Step 1: Read current railway.toml**

Open `C:/Material Programação/projetos/sr-energy/apps/api/railway.toml` and note the current build/start commands.

- [ ] **Step 2: Update railway.toml with monorepo-aware commands**

Replace the build and start commands so they run from the monorepo root context:

```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && npm run build --workspace=apps/api"

[deploy]
startCommand = "node apps/api/dist/index.js"
healthcheckPath = "/health"
```

> Adjust `startCommand` if the actual entry point differs (check `apps/api/package.json` `"main"` field or `"start"` script).

> In the Railway dashboard: set **Root Directory** to the **monorepo root** (leave blank or set to `/`), NOT `apps/api`.

- [ ] **Step 3: Verify the start command path**

Check `apps/api/package.json` `"scripts.start"` — it should be `node dist/index.js`. In the monorepo, this becomes `node apps/api/dist/index.js`. Confirm the entry file is `index.js` (not `server.js`).

- [ ] **Step 4: Commit**

```bash
cd "C:/Material Programação/projetos/sr-energy"
git add apps/api/railway.toml
git commit -m "fix: update railway.toml for monorepo workspace build"
```

---

## Task 8: Copy Environment Files and Write .env.example

**Files:**
- Copy: `.env` files from both original repos (manual — NOT committed)
- Create: `sr-energy/.env.example` (derived from actual .env.example files)

- [ ] **Step 1: Copy env files into workspace apps (not committed)**

```bash
cp "C:/Material Programação/projetos/sr-energy-front/.env" \
   "C:/Material Programação/projetos/sr-energy/apps/frontend/.env"

cp "C:/Material Programação/projetos/sr-energy-back/sr-energy-api/.env" \
   "C:/Material Programação/projetos/sr-energy/apps/api/.env"
```

- [ ] **Step 2: Read the actual .env.example files from both apps**

```bash
cat "C:/Material Programação/projetos/sr-energy/apps/frontend/.env.example"
cat "C:/Material Programação/projetos/sr-energy/apps/api/.env.example"
```

Note every variable name listed.

- [ ] **Step 3: Write root .env.example using the actual variable names from Step 2**

Create `sr-energy/.env.example` — use the exact variable names found above, not guesses:

```bash
# === apps/frontend ===
# (paste all variables from apps/frontend/.env.example here)

# === apps/api ===
# (paste all variables from apps/api/.env.example here)
```

- [ ] **Step 4: Verify .env files are gitignored**

```bash
cd "C:/Material Programação/projetos/sr-energy"
git status apps/frontend/.env apps/api/.env
```

Expected: Both files show as "untracked" or "ignored" — they must NOT appear as staged or tracked.

- [ ] **Step 5: Commit .env.example**

```bash
git add .env.example
git commit -m "docs: add root .env.example documenting all workspace env vars"
```

---

## Task 9: Write Root README

**Files:**
- Create: `sr-energy/README.md`

- [ ] **Step 1: Write README**

Create `sr-energy/README.md`:

```markdown
# SR Energy — Monorepo

## Structure

\`\`\`
sr-energy/
├── apps/
│   ├── frontend/   # React 19 + Vite + TypeScript
│   └── api/        # Fastify + TypeScript
└── packages/       # Shared packages (future)
\`\`\`

## Getting Started

\`\`\`bash
npm install          # Install all workspace dependencies
npm run dev:frontend # Start Vite dev server (default: http://localhost:5173)
npm run dev:api      # Start Fastify API
\`\`\`

## Testing

\`\`\`bash
npm run test:frontend  # Jest unit tests for frontend
npm run test:api       # Jest unit tests for API
npm run cy:run --workspace=apps/frontend  # Cypress e2e tests
\`\`\`

## Deployment

- **API:** Railway — Root Directory = monorepo root, build: \`npm install && npm run build --workspace=apps/api\`
- **Frontend:** Configure per your hosting provider (build output: \`apps/frontend/dist/\`)
```

- [ ] **Step 2: Commit**

```bash
cd "C:/Material Programação/projetos/sr-energy"
git add README.md
git commit -m "docs: add monorepo README with structure and setup guide"
```

---

## Task 10: Final Smoke Test

- [ ] **Step 1: Run all tests from root**

```bash
cd "C:/Material Programação/projetos/sr-energy"
npm test
```

Expected: All frontend and API tests pass. Test count matches Task 0 baseline.

- [ ] **Step 2: Run full build from root**

```bash
npm run build
```

Expected: Both apps build successfully with no errors.

- [ ] **Step 3: Tag migration complete**

```bash
git tag v0.1.0-monorepo
```

---

## Known Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| npm hoisting conflicts (two apps need different dep versions) | Run `npm ls <dep-name>` to inspect; use workspace-level `nohoist` in root package.json if needed |
| `cp -r` fails silently with spaces in path | Verify with `ls apps/frontend/src` and `ls apps/api/src` immediately after each copy (Tasks 2 & 3) |
| Jest `moduleNameMapper` breaks after copy | Paths are relative to `<rootDir>` per app — should be unaffected; check `jest.config.cjs` if tests fail |
| Vite config breaks | `vite.config.ts` uses relative paths from app root — should be unaffected |
| Railway build fails due to missing workspace root | Task 7 ensures Railway runs `npm install` from monorepo root, not `apps/api` alone |
| Cypress hangs if dev server not killed | Task 5 Step 3 captures PID and kills server after run |

---

## Out of Scope (Future Plan)

- Extracting shared DTOs into `packages/types`
- Turborepo or caching layer (requires explicit approval per CLAUDE.md)
- CI/CD pipeline (GitHub Actions)
