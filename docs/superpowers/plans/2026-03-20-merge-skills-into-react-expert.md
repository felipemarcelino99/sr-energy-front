# Merge Skills into react-expert Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate `front-end-design`, `interface-design`, and `tdd-workflow.md` into the `react-expert` skill so that fewer files exist and design + TDD guidance auto-applies when `react-expert` triggers.

**Architecture:** `react-expert/SKILL.md` acts as the hub; heavy content moves to `references/` files using the load-on-demand pattern already established in the skill. The three source skills are deleted after their content is moved.

**Tech Stack:** Markdown files only — no code, no tests, no build step.

---

## File Map

| Action | Path |
|--------|------|
| Modify | `.claude/skills/react-expert/SKILL.md` |
| Create | `.claude/skills/react-expert/references/design-system.md` |
| Create | `.claude/skills/react-expert/references/tdd.md` |
| Copy   | `.claude/skills/interface-design/references/principles.md` → `react-expert/references/principles.md` |
| Copy   | `.claude/skills/interface-design/references/validation.md` → `react-expert/references/validation.md` |
| Copy   | `.claude/skills/interface-design/references/critique.md` → `react-expert/references/critique.md` |
| Copy   | `.claude/skills/interface-design/references/example.md` → `react-expert/references/example.md` |
| Delete | `.claude/skills/front-end-design/` (directory) |
| Delete | `.claude/skills/interface-design/` (directory) |
| Delete | `.claude/skills/tdd-workflow.md` |

All paths are relative to: `C:/Material Programação/projetos/sr-energy-front/`

---

### Task 1: Create `references/design-system.md`

Merge `interface-design/SKILL.md` + `front-end-design/SKILL.md` into a single reference file.

**Files:**
- Create: `.claude/skills/react-expert/references/design-system.md`
- Source: `.claude/skills/interface-design/SKILL.md`
- Source: `.claude/skills/front-end-design/SKILL.md`

- [ ] **Step 1: Read both source files**

Read `.claude/skills/interface-design/SKILL.md` and `.claude/skills/front-end-design/SKILL.md` in full.

- [ ] **Step 2: Create `design-system.md`**

Write `.claude/skills/react-expert/references/design-system.md` with this structure:

```
# Design System Reference

[Full content of interface-design/SKILL.md — strip the YAML frontmatter block (lines 1-4), keep everything from line 6 onward]

---

# Aesthetic Direction

[Full content of front-end-design/SKILL.md — strip the YAML frontmatter block (lines 1-5), keep everything from line 7 onward]
```

No summarization — copy content verbatim, only remove the YAML frontmatter from each source.

- [ ] **Step 3: Verify the file**

Open `.claude/skills/react-expert/references/design-system.md` and confirm:
- No YAML frontmatter at the top
- Contains the "Interface Design" heading and full interface-design content
- Contains "## Design Thinking" section from front-end-design at the bottom under "# Aesthetic Direction"
- No truncation

---

### Task 2: Create `references/tdd.md`

Move `tdd-workflow.md` content into the references directory.

**Files:**
- Create: `.claude/skills/react-expert/references/tdd.md`
- Source: `.claude/skills/tdd-workflow.md`

- [ ] **Step 1: Read source file**

Read `.claude/skills/tdd-workflow.md` in full.

- [ ] **Step 2: Create `tdd.md`**

Write `.claude/skills/react-expert/references/tdd.md` with this content:

```
[Full content of tdd-workflow.md — strip the YAML frontmatter block (lines 1-5), keep everything from line 7 onward]
```

Keep the `# TDD Workflow Skill` heading and all content verbatim.

- [ ] **Step 3: Verify the file**

Open `.claude/skills/react-expert/references/tdd.md` and confirm:
- No YAML frontmatter at the top
- Contains the TDD Cycle section, RED/GREEN/REFACTOR steps, AAA structure, test doubles table
- No truncation

---

### Task 3: Copy `interface-design` reference sub-files

Move the four reference files from `interface-design/references/` to `react-expert/references/`.

**Files:**
- Copy: `.claude/skills/interface-design/references/principles.md` → `.claude/skills/react-expert/references/principles.md`
- Copy: `.claude/skills/interface-design/references/validation.md` → `.claude/skills/react-expert/references/validation.md`
- Copy: `.claude/skills/interface-design/references/critique.md` → `.claude/skills/react-expert/references/critique.md`
- Copy: `.claude/skills/interface-design/references/example.md` → `.claude/skills/react-expert/references/example.md`

- [ ] **Step 1: Copy all four files**

Run:
```bash
cp "C:/Material Programação/projetos/sr-energy-front/.claude/skills/interface-design/references/principles.md" \
   "C:/Material Programação/projetos/sr-energy-front/.claude/skills/react-expert/references/principles.md"

cp "C:/Material Programação/projetos/sr-energy-front/.claude/skills/interface-design/references/validation.md" \
   "C:/Material Programação/projetos/sr-energy-front/.claude/skills/react-expert/references/validation.md"

cp "C:/Material Programação/projetos/sr-energy-front/.claude/skills/interface-design/references/critique.md" \
   "C:/Material Programação/projetos/sr-energy-front/.claude/skills/react-expert/references/critique.md"

cp "C:/Material Programação/projetos/sr-energy-front/.claude/skills/interface-design/references/example.md" \
   "C:/Material Programação/projetos/sr-energy-front/.claude/skills/react-expert/references/example.md"
```

- [ ] **Step 2: Verify**

```bash
ls "C:/Material Programação/projetos/sr-energy-front/.claude/skills/react-expert/references/"
```

Expected: principles.md, validation.md, critique.md, example.md present alongside existing files.

---

### Task 4: Update `react-expert/SKILL.md`

Update the hub skill to include design and TDD sections and updated description.

**Files:**
- Modify: `.claude/skills/react-expert/SKILL.md`

- [ ] **Step 1: Read current SKILL.md**

Read `.claude/skills/react-expert/SKILL.md` in full.

- [ ] **Step 2: Update frontmatter description**

Replace the current `description:` line with:

```yaml
description: Use when building React 18+ applications in .jsx or .tsx files, Next.js App Router projects, or create-react-app setups. Creates components, implements custom hooks, debugs rendering issues, migrates class components to functional, and implements state management. Invoke for Server Components, Suspense boundaries, useActionState forms, performance optimization, React 19 features, UI design (dashboards, components, pages), or TDD/test workflows.
```

Also update `related-skills` in metadata to remove `fullstack-guardian, playwright-expert, test-master` references that no longer apply (they can be left if still valid — just don't reference the deleted skills).

- [ ] **Step 3: Add two rows to the Reference Guide table**

In the existing Reference Guide table, add after the last row:

```markdown
| Design System | `references/design-system.md` | Building UI, dashboards, components, pages |
| Design Sub-refs | `references/principles.md`, `references/validation.md`, `references/critique.md`, `references/example.md` | Deep-dive on design tokens, craft validation, critique protocol |
| TDD | `references/tdd.md` | Writing tests, RED-GREEN-REFACTOR, AAA pattern, test doubles |
```

- [ ] **Step 4: Add Design section**

After the `## Constraints` section, add:

```markdown
## Design

When building UI components, pages, or dashboards:
- Apply intent-first thinking: who is the user, what must they accomplish, how should it feel?
- Every visual choice must have a reason — no defaults.
- Load `references/design-system.md` for full design principles, craft foundations, token architecture, and aesthetic direction.
- Load `references/principles.md` for code-level design token examples and dark mode.
- Load `references/critique.md` for the post-build craft critique protocol.
```

- [ ] **Step 5: Add TDD section**

After the Design section, add:

```markdown
## TDD

When implementing any feature or fixing bugs:
- Follow RED → GREEN → REFACTOR: write the failing test first, then minimal code to pass, then refactor.
- Structure tests with AAA: Arrange, Act, Assert.
- Load `references/tdd.md` for the full TDD cycle, naming conventions, test doubles, and common mistakes.
```

- [ ] **Step 6: Verify**

Read `.claude/skills/react-expert/SKILL.md` and confirm:
- Description includes design and TDD triggers
- Reference Guide table has Design System and TDD rows
- Design and TDD sections present after Constraints

---

### Task 5: Delete source skill files

Remove the three source skills now that their content has been moved.

**Files:**
- Delete: `.claude/skills/front-end-design/` (directory)
- Delete: `.claude/skills/interface-design/` (directory)
- Delete: `.claude/skills/tdd-workflow.md`

- [ ] **Step 1: Delete the directories and file**

```bash
rm -rf "C:/Material Programação/projetos/sr-energy-front/.claude/skills/front-end-design"
rm -rf "C:/Material Programação/projetos/sr-energy-front/.claude/skills/interface-design"
rm "C:/Material Programação/projetos/sr-energy-front/.claude/skills/tdd-workflow.md"
```

- [ ] **Step 2: Verify cleanup**

```bash
ls "C:/Material Programação/projetos/sr-energy-front/.claude/skills/"
```

Expected: only `react-expert/` remains (plus any other unrelated skills).

- [ ] **Step 3: Verify react-expert/references is complete**

```bash
ls "C:/Material Programação/projetos/sr-energy-front/.claude/skills/react-expert/references/"
```

Expected output includes all of:
- `server-components.md`
- `react-19-features.md`
- `state-management.md`
- `hooks-patterns.md`
- `performance.md`
- `testing-react.md`
- `migration-class-to-modern.md`
- `design-system.md`
- `tdd.md`
- `principles.md`
- `validation.md`
- `critique.md`
- `example.md`
