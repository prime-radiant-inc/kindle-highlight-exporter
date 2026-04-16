# Plan Phase

You have an approved product spec and supporting materials in the `.brainstorm/` directory:

- **Spec:** `.brainstorm/spec.md` -- the full build specification
- **Stories:** `.brainstorm/stories/*.md` -- individual story cards with acceptance criteria
- **Design docs:** `.brainstorm/design/*.md` -- vision, design, and look-and-feel documents

## Instructions

1. Read `.brainstorm/spec.md` and all files in `.brainstorm/stories/` and `.brainstorm/design/`.
2. Read the target codebase to understand existing patterns, file structure, and dependencies.
3. Produce an implementation plan that:
   - Lists tasks in dependency order (what must be built first).
   - Maps each task to specific story IDs from the spec.
   - References actual file paths and modules in the codebase.
   - Identifies risks or ambiguities that need resolution before coding.
4. Save the plan to `.brainstorm/plan.md`.

## Constraints

- The spec is approved. Do not redesign or second-guess product decisions.
- Ground the plan in the real codebase, not hypothetical structure.
- Keep tasks small enough to implement and verify independently.
