# Merge Skills into react-expert — Design Spec

**Date:** 2026-03-20

## Goal

Consolidate four separate skills into a single `react-expert` skill so that:
1. There are fewer skill files to manage
2. Design and TDD guidance automatically applies whenever `react-expert` triggers

## Skills Being Merged

| Skill | Location | Disposition |
|-------|----------|-------------|
| `react-expert` | `.claude/skills/react-expert/SKILL.md` | Hub — updated in place |
| `front-end-design` | `.claude/skills/front-end-design/SKILL.md` | Content → `react-expert/references/design-system.md` |
| `interface-design` | `.claude/skills/interface-design/SKILL.md` | Content → `react-expert/references/design-system.md` |
| `interface-design/references/` | `.claude/skills/interface-design/references/` | Files copied to `react-expert/references/` (kept separate) |
| `tdd-workflow.md` | `.claude/skills/tdd-workflow.md` | Content → `react-expert/references/tdd.md` |

## New File Structure

```
.claude/skills/react-expert/
  SKILL.md                          ← updated hub
  references/
    server-components.md            ← unchanged
    react-19-features.md            ← unchanged
    state-management.md             ← unchanged
    hooks-patterns.md               ← unchanged
    performance.md                  ← unchanged
    testing-react.md                ← unchanged
    migration-class-to-modern.md    ← unchanged
    design-system.md                ← NEW: front-end-design + interface-design SKILL.md merged
    principles.md                   ← MOVED from interface-design/references/
    validation.md                   ← MOVED from interface-design/references/
    critique.md                     ← MOVED from interface-design/references/
    example.md                      ← MOVED from interface-design/references/
    tdd.md                          ← NEW: from tdd-workflow.md
```

## Changes to react-expert/SKILL.md

### Description update
Add design and TDD triggers to the frontmatter description.

### New Reference Guide rows
| Topic | Reference | Load When |
|-------|-----------|-----------|
| Design System | `references/design-system.md` | Building UI components, pages, dashboards |
| TDD | `references/tdd.md` | Writing tests, implementing features |

### New sections in SKILL.md body
- **Design** section: brief summary of intent-first approach, pointer to `references/design-system.md`
- **TDD** section: RED-GREEN-REFACTOR summary, pointer to `references/tdd.md`

## Cleanup

Delete after content is moved:
- `.claude/skills/front-end-design/` (entire directory)
- `.claude/skills/interface-design/` (entire directory)
- `.claude/skills/tdd-workflow.md`

## design-system.md composition

Merge order:
1. `interface-design/SKILL.md` as primary (comprehensive design principles, craft foundations, token architecture, workflow)
2. `front-end-design/SKILL.md` content appended as **Aesthetic Direction** section (bold aesthetic choices, typography, color, motion, spatial composition)

Both are kept because they serve different angles: interface-design = structured craft principles, frontend-design = creative/aesthetic direction.
