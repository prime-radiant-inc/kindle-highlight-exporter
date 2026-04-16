# Build from Brainstorm Spec

You are implementing a product designed in Brainstorm.

## Read these files first

- `.brainstorm/spec.md` — the build specification (features, scope, constraints)
- `.brainstorm/stories/` — story cards with acceptance criteria and implementation notes
- `.brainstorm/design/` — vision, design docs, look-and-feel, journey map
- `.brainstorm/collateral/` — reference files and approved mockups from brainstorming (if any)

If this project has a `CLAUDE.md`, `AGENTS.md`, or similar, read it for project conventions.

## Implementation approach

1. **Plan first.** Read the spec and all stories. Produce an implementation plan in dependency order. Save to `.brainstorm/plan.md`.

2. **Implement story by story.** Write tests first when practical. Commit with the story slug: `[story-slug] short description`.

3. **Generate a build report.** When done, create `.brainstorm/build-report.yaml` per `.brainstorm/build-report-schema.yaml`. Include every story with status (`done`, `partial`, `skipped`, or `blocked`).

## Constraints

- The spec is approved. Do not redesign or second-guess product decisions.
- Ground the plan in the real codebase, not hypothetical structure.
- If you hit a blocker, stop and report what went wrong.
- Visual, audio, or animation features you cannot verify: implement them and mark `done` (not `blocked`).
- **Implementation Notes** in story cards describe visual/aesthetic behavior to implement but NOT test. If notes conflict with acceptance criteria, acceptance criteria are the contract.
