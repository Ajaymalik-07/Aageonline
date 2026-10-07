# Tool Evaluation & Classification Matrix

This document records the evaluation of the seven requested reference and tool repositories for the AageOnline development harness.

## Evaluation Criteria
- **Purpose & Scope:** Does it address a necessary development or runtime requirement for AageOnline?
- **Architecture & Dependencies:** What are its runtime, OS, and server requirements?
- **Security & Pollution Risk:** Does it require invasive global modifications, credentials, or daemon services?
- **Overlap & Redundancy:** Does it duplicate existing Antigravity IDE capabilities or competing tools?

---

## Repository Classification & Decision Table

| Repository | Category | Role | Selected? | Decision & Justification |
|---|---|---|---|---|
| **browser-use/browser-use** | E. Experimental / Dev Tool | Browser automation & QA | **Reference & Dev-Only** | Antigravity IDE already provides native CDP browser tools (`browser_subagent`) and built-in `browser-use` skill. Python browser-use is not installed in production application dependencies to prevent dependency pollution. |
| **dietrichgebert/ponytail** | B. Agent skill / workflow | Minimalist code prompt & discipline | **Adopted as Skill & Rule** | Integrated into `.agents/skills/ponytail/SKILL.md` and `AGENTS.md`. Zero runtime dependencies, enforces minimal diffs and eliminates speculative code bloat. |
| **rohitg00/agentmemory** | C. Memory / context system | Persistent agent memory across sessions | **Adopted (Dev Harness Only)** | Selected as the single persistent agent memory system. Configured via development MCP/skills outside production application code. Never stores credentials or customer secrets. |
| **volcengine/OpenViking** | C. Memory / context system | Agent context database (`viking://`) | **Rejected as Active Infra** | Requires external server, Docker container, AGPLv3 license, and Doubao/Ark model APIs. Rejected in favor of lighter, local `agentmemory` to avoid duplicate memory systems and heavy operational overhead. |
| **ai-boost/awesome-harness-engineering** | D. Reference repository | Harness engineering patterns | **Adopted as Reference** | Kept as distilled principles in `.agents/references/awesome-harness-engineering.md`. Not an installable application dependency. |
| **affaan-m/ecc** | B. Agent skill / workflow | Engineering harness toolbox & skills | **Selective Adoption** | Full suite (293 skills, hooks, global scripts) rejected to prevent configuration pollution and conflicting hooks. Core engineering patterns (TDD, security review, code review) extracted into project-native skills. |
| **voltagent/awesome-design-md** | D. Reference repository | DESIGN.md guidelines & examples | **Adopted as Reference** | Distilled into `.agents/references/awesome-design-md.md` and used to structure the root `DESIGN.md`. Not an installable code package. |

---

## Detailed Comparison: AgentMemory vs OpenViking

| Dimension | `agentmemory` | `OpenViking` | Winner / Selected |
|---|---|---|---|
| **Architecture** | Local SQLite + embedded iii-engine daemon | Client-server architecture with Docker container | **agentmemory** (Local, self-contained) |
| **Model Dependency** | Keyless BM25 default, optional local embedding | Requires Doubao VLM / embedding API or hosted models | **agentmemory** (No mandatory external model API) |
| **Antigravity Fit** | Native MCP stdio/HTTP connector & skills | Custom `viking://` URI protocol requiring client shims | **agentmemory** (Standard MCP) |
| **Operational Cost** | Zero server maintenance, dev-tool only | Requires running database/server container, AGPLv3 | **agentmemory** (Zero maintenance) |
| **Data Scope** | Dev-session lessons, decisions, project patterns | Filesystem context abstraction (L0/L1/L2) | **agentmemory** (Tailored for coding agents) |

**Conclusion:** `agentmemory` is chosen as the development memory system. `OpenViking` remains documented as an evaluated alternative.
