# Workflow: Feature Implementation

This standard workflow enforces predictable, verified execution across all feature additions.

```text
Plan -> Spec & Docs Check -> Test First -> Minimal Implementation -> Review & Verify -> Document
```

## Step 1: Grounding & Planning
1. Read the relevant specification in `docs/` (`PRD.md`, `Architecture.md`, `State.md`, `Database.md`, `API.md`, `Design.md`).
2. Verify feature falls within V1 scope and does not violate V1 exclusions.
3. Formulate a step-by-step implementation plan.

## Step 2: Test First (TDD)
1. Write failing unit or integration tests for the new functionality.
2. Confirm the test fails for the expected reason.

## Step 3: Minimal Implementation
1. Write the minimal amount of production code needed to make the test pass (Ponytail principle).
2. Avoid speculative abstractions, unnecessary helper files, and unneeded dependencies.

## Step 4: Verification & Self-Review
1. Run the test suite to confirm all tests pass.
2. Execute the `code-review` checklist:
   - Secret check
   - Authorization check
   - Concurrency & database transaction check
   - Token & accessibility compliance
3. Verify responsive layout and component states.

## Step 5: Documentation & Decision Record
1. If the change introduces an architectural choice, log it in `docs/Decision-Log.md`.
2. Update `docs/Changelog.md`.
