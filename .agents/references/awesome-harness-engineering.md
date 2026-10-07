# Harness Engineering Principles for AageOnline

Extracted from [ai-boost/awesome-harness-engineering](https://github.com/ai-boost/awesome-harness-engineering) as key guiding principles for AI agent environments.

## 1. Context Engineering Over Prompt Engineering
- Keep context lean and high-density. Agents perform better when presented with structured files (`AGENTS.md`, `DESIGN.md`, targeted `docs/`) rather than massive monolithic prompt dumps.
- Progressive disclosure: agents load top-level summaries (L0/L1) first and fetch detailed modules (L2) on demand.

## 2. Deterministic Verification Loops
- Model intelligence should be backed by computational guards (compilers, type checkers, deterministic unit tests, linters).
- Test-driven cycles (`Plan -> Test -> Implement -> Verify`) catch regressions immediately before changes reach humans.

## 3. Persistent Artifacts & State Externalization
- Externalize task state in persistent files (`docs/State.md`, `docs/Decision-Log.md`, `docs/Phases.md`) rather than relying on ephemeral conversation memory.
- Cross-session continuity depends on file-based ground truth.

## 4. Failure Mode Mapping
- **Context Rot:** Prevented by updating authoritative docs and keeping instructions concise.
- **Speculative Drift:** Prevented by strict V1 exclusion lists in `AGENTS.md`.
- **Hallucinated State:** Prevented by inspecting repository files before making modifications.
