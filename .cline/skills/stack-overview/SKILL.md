---
name: stack-overview
description: Discover the project's tech stack, tooling, and available capabilities. Use when asked about what technologies are used, how to run something, what tools are available, existing skills, or how the project is organized. Always poll the latest state via the discovery script first.
---

# Stack Overview

This skill discovers the project's complete tech stack, tooling, and capabilities. It provides a capability registry that maps user requests to available execution tools and other skills.

## When to Use

- User asks "what's the stack?" or "what technologies are used?"
- User asks "how do I run tests/lint/build/migrate?"
- User asks about project structure or organization
- User wants to know what skills are available
- Before creating new skills (to discover existing capabilities)
- As a first step before delegating to execution skills

## Steps

### 1. Run the Discovery Script

Execute the project's discovery script to get the current capability registry:

```
python backend/discover_stack.py
```

This outputs a structured markdown registry of all detected tools, configs, and capabilities.

### 2. Parse the Capability Registry

The script outputs sections for:

- **Package Managers** — pnpm, npm, pip, etc.
- **Frameworks** — Next.js, FastAPI, etc.
- **Configurations** — tsconfig, tailwind, pytest, eslint, etc.
- **Directory Structure** — top-level and key subdirectories
- **Testing Tools** — jest, pytest, mypy, etc.
- **Linting & Formatting** — ruff, prettier, stylelint, etc.
- **Git State** — worktrees, branches, remotes
- **Existing Skills** — skills registered in `.cline/skills/`
- **Execution Commands** — mapped commands for common operations

### 3. Map Request to Capabilities

Based on the registry, match the user's request to available tools:

| User Request         | Available Tool/Command             |
| -------------------- | ---------------------------------- |
| "run tests"          | pytest (backend) / jest (frontend) |
| "type-check"         | tsc (frontend) / mypy (backend)    |
| "format"             | prettier / ruff                    |
| "build"              | next build (frontend)              |
| "migrate"            | alembic upgrade head (backend)     |
| "what skills exist?" | List skills from registry          |

### 4. Delegate to Execution Skills

For actual implementation tasks, recommend or activate the relevant execution skill:

- Frontend work → suggest `nextjs-frontend` skill (when available)
- Backend work → suggest `fastapi-backend` skill (when available)
- New capabilities → re-run the discovery script (`python backend/discover_stack.py`) to update the registry

### 5. Provide a Summary

Give a concise, actionable summary tailored to the user's specific question. Do not dump the entire registry — filter to what's relevant.

## Important Rules

- **Always poll first** — never rely on cached knowledge of the project state
- **Be concise** — summarize, don't dump raw output
- **Be actionable** — include exact commands the user can run
- **Acknowledge limitations** — if a capability is not detected, say so
- **Update awareness** — when new tools/configs are added, re-run the discovery script (`python backend/discover_stack.py`)
