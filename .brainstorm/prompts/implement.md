# Implement Phase

You have an implementation plan at `.brainstorm/plan.md` produced during the planning phase.

## Instructions

1. Read `.brainstorm/plan.md` and `.brainstorm/spec.md`.
2. Implement each task from the plan in order. For each task:
   - Write tests first when practical (TDD).
   - Make the tests pass with a clean implementation.
   - Commit with a message prefixed by the story slug, e.g., `[story-001-login] add auth middleware`.
3. Report progress as you complete each task (e.g., "Task 3 of 12 complete").
4. If you hit a blocker, stop and report what went wrong. Do not force through failures.
5. **Implementation Notes vs. Acceptance Criteria.** Story cards may have an `## Implementation Notes` section. Implement the visual guidance described there, but do not write test assertions for it. Only `## Acceptance Criteria` items become test assertions. If notes conflict with criteria, criteria win.

## Commit Convention

Every commit message must start with the story slug in brackets:

```
[story-slug] short description of the change
```

The story slug comes from the story filename (e.g., `story-001-login.md` uses `[story-001-login]`).

## Build Report

After all tasks are complete, generate `.brainstorm/build-report.yaml` summarizing what was done. See `.brainstorm/build-report-schema.yaml` for the expected format.

The build report must include:
- Every story ID from the spec with its final status.
- Commit hashes associated with each story.
- Notes on anything skipped, deferred, or partially implemented.

## Unverifiable Criteria

When you implement visual, audio, or animation features that you cannot
verify in your environment, note this in your commit messages and carry
the note forward to the build report — do not treat unverifiable criteria
as blockers.
