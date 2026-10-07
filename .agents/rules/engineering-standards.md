# Engineering Standards & Ponytail Code-Minimization Rules

These rules apply to all AI coding agents working on the AageOnline codebase.

## 1. Minimal Diffs & Simplicity (Ponytail Principle)
- Always write the minimal amount of code needed to accomplish the task.
- Resist the impulse to add speculative interfaces, abstract base classes, or unused utility functions.
- If a task requires changing 3 lines, change 3 lines. Do not reformat or refactor the entire module unless explicitly instructed.
- Prefer explicit, readable code over clever meta-programming.

## 2. Dependency Discipline
- Do not introduce new npm or python dependencies without clear, documented justification.
- Before installing any external package, check if Node.js / TypeScript built-ins or existing utilities can perform the operation.
- Reject heavy runtime libraries for trivial tasks (e.g., date formatting, query parsing).

## 3. Preservation of Invariants
- Never break existing tests or public contracts.
- Respect the documentation authority order: `PRD.md` -> `State.md` -> `Architecture.md` -> `Database.md` -> `API.md` -> `Design.md`.
- Material architecture decisions must be documented in `docs/Decision-Log.md`.
