# Review Phase

Implementation is complete. Review the work against the original spec and acceptance criteria.

## Instructions

1. Read `.brainstorm/spec.md` and all story files in `.brainstorm/stories/`.
2. For each story, verify that:
   - All acceptance criteria are met by the implementation.
   - Tests exist and pass for the described behavior.
   - The commit history includes commits tagged with the story slug.
3. Run the project's test suite. Note any failures.
4. Check for common issues:
   - Unused imports or dead code introduced during implementation.
   - Missing error handling or edge cases called out in the spec.
   - Inconsistencies between the implementation and design docs.

## Build Report

Generate or update `.brainstorm/build-report.yaml` with the review results. See `.brainstorm/build-report-schema.yaml` for the expected format.

Set each story's status:
- `done` — the code implements the described behavior. If you cannot verify
  specific criteria (e.g. visual appearance, audio playback, animation feel
  in a headless environment), mark the story `done` and note which criteria
  you implemented but could not verify.
- `partial` — some criteria implemented, others not attempted. Explain gaps.
- `skipped` — not implemented at all. Explain why.
- `blocked` — could not implement due to an external dependency, missing
  API, or build failure. This means the code does not exist, not that you
  could not test it.

Example: A story says "ball glows on shake with smooth animation." You wrote
the animation code and it compiles. You cannot verify the visual output in
your environment. Status: `done`. Notes: "Implemented glow animation on
shake event. Visual appearance not verified — requires running the app."
