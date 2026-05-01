# Cline Guide — Plan Mode, Rules, and Workflow Optimization

> Reference for structuring Cline's Plan responses, configuring `.clinerules`, and optimizing the full Plan → Act workflow.

---

## Table of Contents

1. [Plan & Act Mode — Core Concepts](#1-plan--act-mode--core-concepts)
2. [Plan Mode — Response Formatting](#2-plan-mode--response-formatting)
3. [Deep Planning](#3-deep-planning)
4. [`.clinerules` — Setup and Structure](#4-clinerules--setup-and-structure)
5. [Rule File Templates](#5-rule-file-templates)
6. [Model Assignment by Phase](#6-model-assignment-by-phase)
7. [Self-Improving Rules](#7-self-improving-rules)
8. [Context & Token Optimization](#8-context--token-optimization)
9. [Anti-Patterns to Eliminate](#9-anti-patterns-to-eliminate)
10. [`.clinerules/` Directory Scaffold](#10-clinerules-directory-scaffold)
11. [Memory Bank Integration](#11-memory-bank-integration)
12. [Validated Workflow Sequences](#12-validated-workflow-sequences)

---

## 1. Plan & Act Mode — Core Concepts

Cline operates in two distinct, separated phases.

| Mode     | Purpose                                  | File Access  |
| -------- | ---------------------------------------- | ------------ |
| **Plan** | Exploration, architecture, clarification | Read-only    |
| **Act**  | Code generation, file edits, commands    | Read + Write |

**Why this matters:** Most AI coding tools execute immediately on prompts. Cline's Plan phase prevents the "assumptions + modified unrelated files" failure mode by building full context before any action is taken.

**The principle:** Frontload context → cultivate shared understanding → empower execution.

### When to use each entry point

| Task Type                                  | Entry Point                          |
| ------------------------------------------ | ------------------------------------ |
| Typos, simple fixes, config changes        | Start in **Act** directly            |
| New features, bug investigation, refactors | Start in **Plan**, switch to **Act** |
| Multi-file, architectural, multi-session   | Use `/deep-planning` in Plan mode    |

---

## 2. Plan Mode — Response Formatting

Default Plan mode output is verbose and unstructured. The model will narrate reasoning, repeat context, and produce prose walls before stating the plan. This is controlled via `.clinerules`.

### Required Plan Response Structure

Force this exact structure in every Plan response:

```
1. Objective        — one-line restatement of the goal
2. Assumptions      — unknowns, constraints, inferences made
3. Affected Files   — explicit list of files to be read or changed
4. Steps            — numbered, imperative, one action per step
5. Risks / Open Qs  — blockers needing resolution before Act
6. Clarifying Qs    — numbered list, only at the end
```

### Output Rules (enforce via `.clinerules`)

- No prose preambles — start with **Objective** immediately
- Steps must be atomic: one action, one file, one outcome per step
- Do not explain what Plan mode is or describe the exploration process
- Do not narrate reading of files ("I'm looking at…", "Let me check…")
- Confidence rating (1–10) required before any major architectural step
- Clarifying questions go in a numbered list at the end, never inline with steps
- Do not create documentation files unless explicitly requested

---

## 3. Deep Planning

Use the `/deep-planning` slash command for complex tasks only.

**When to trigger `/deep-planning`:**

- Task touches 5+ files
- Requires architectural decisions (schema changes, new modules, service boundaries)
- Will span multiple sessions
- Has unclear requirements or competing approaches

**When NOT to use it:** Standard Plan mode + well-structured `.clinerules` is sufficient for single-session features. Deep planning adds token overhead; only justify it with corresponding complexity.

> The deep planning prompt is model-family aware — it adapts to the reasoning strengths of whichever model is assigned to Plan mode.

---

## 4. `.clinerules` — Setup and Structure

`.clinerules` files are plain Markdown injected into every Cline system prompt within a project. They are the primary control surface for Plan response quality, coding standards, and workflow behavior.

### Storage Locations

| Scope     | Path                                            | Effect                                   |
| --------- | ----------------------------------------------- | ---------------------------------------- |
| Workspace | `.clinerules` or `.clinerules/` in project root | Project-specific, team-shareable via Git |
| Global    | `~/Documents/Cline/Rules/`                      | Applies across all projects              |

When both exist, workspace rules take precedence on conflicts.

### Rules File Architecture

```
.clinerules/
├── universal.md         # Always active: tone, output defaults, global prohibitions
├── plan-format.md       # Plan mode structure and output rules
├── act-coding.md        # Code style, file operation rules, forbidden patterns
├── architecture.md      # Project-specific structural decisions
├── testing.md           # Test standards, frameworks, patterns
└── commit-format.md     # Conventional Commits, message structure
```

### File Format Rules

- Plain Markdown only — no special syntax or schema
- Use `#` headers for scope, `-` bullets for individual instructions
- Include the _why_ when a rule is non-obvious
- Keep each file under 150 lines for reliable adherence
- Under 300 lines total across all active rule files before degradation sets in

### Performance Rule

Every character in `.clinerules` consumes context window space on every request.

- Merge related rules into single concise instructions
- Reference files instead of reproducing patterns: `"Follow the structure of src/services/userService.ts"`
- Remove rules for behavior Cline exhibits correctly by default
- Move task-specific context to `@` mentions instead of encoding it in rules

### Path-Based Conditional Rules (Frontmatter)

Activate rules only for specific file paths:

```md
---
paths:
  - "src/components/**"
  - "src/pages/**"
---

# Frontend Guidelines

- Use Tailwind CSS for styling
- Prefer server components where possible
```

```md
---
paths:
  - "src/api/**"
  - "src/services/**"
---

# Backend Guidelines

- Use dependency injection for services
- All database queries go through repositories
```

---

## 5. Rule File Templates

### `plan-format.md`

```md
# Plan Mode Formatting

## Response Structure

Always structure Plan responses in this exact order:

1. **Objective** — one-line restatement of the goal
2. **Assumptions** — list unknowns, constraints, inferences
3. **Affected Files** — explicit list of files to be read or changed
4. **Steps** — numbered, imperative, one action per step
5. **Risks / Open Questions** — blockers that must be resolved before Act
6. **Clarifying Questions** — numbered list at the end only, never inline

## Output Rules

- Start with Objective immediately. No preambles.
- Steps must be atomic: one action, one file, one outcome.
- Do not explain what Plan mode is. Do not narrate file exploration.
- Do not say "I'm going to…" or "Let me check…" — just execute and report.
- Provide a confidence rating (1–10) before any major architectural decision.
- Clarifying questions in a numbered list at the end only.
- Do not create documentation or config files unless explicitly requested.
- Rate your confidence (1–10) and list all assumptions before any structural change.
```

### `universal.md`

```md
# Universal Rules

## Behavior

- Be concise and direct in all responses.
- No explanatory files unless explicitly requested.
- Focus on implementation over explanation.
- Only create files essential to the task.
- Ask before creating files not directly requested.
- Use existing project structure; do not invent new directories.
- DO NOT BE LAZY. DO NOT OMIT CODE.
- Only modify the specific file referenced unless a dependency change is unavoidable.

## Prohibitions

- No apologies or hedging language.
- No repeating the user's prompt back.
- No narrating your own process.
- No placeholder or stub code unless explicitly asked for scaffolding.
```

### `act-coding.md`

```md
# Act Mode — Coding Standards

## Style

- camelCase for variables and functions
- PascalCase for classes and components
- UPPER_SNAKE_CASE for constants

## Operations

- Surgical updates only — do not rewrite files for minor changes.
- Show BEFORE and AFTER for any partial update.
- Full file rewrites must include all content — never truncate for brevity.
- Do not mix prose into code blocks.
- Always fence code and identify the filename above the fence.

## Completions

- Always confirm task is done and list every file changed.
- If a file was read but not changed, do not list it.
```

### `commit-format.md`

```md
# Commit Message Format

Follow Conventional Commits specification:
<type>[optional scope]: <description>

Types: feat, fix, refactor, docs, test, chore, perf, ci

## Rules

- Subject line: imperative tense, under 72 characters
- Body: bullet points describing concrete changes
- No vague descriptions ("updates", "fixes stuff")

## Examples

feat(auth): add JWT refresh token rotation
fix(api): resolve null pointer on empty user payload
refactor(db): extract query builder into repository layer
```

---

## 6. Model Assignment by Phase

Different models have different strengths. Assign them accordingly rather than using a single model throughout.

| Phase                | Recommended Model             | Reason                                       |
| -------------------- | ----------------------------- | -------------------------------------------- |
| Plan / Deep Planning | Claude Sonnet, Gemini 2.5 Pro | Strong reasoning, large context window       |
| Act / Implementation | DeepSeek V3                   | Precise code generation, ~95% cost reduction |
| Review / Critique    | Claude Sonnet                 | Contextual analysis, architectural feedback  |

### Cost Implication

Using DeepSeek V3 for Act and reserving Claude Sonnet for Plan and Review produces approximately 80% cost savings versus using a premium model throughout, with no quality loss on implementation tasks.

---

## 7. Self-Improving Rules

Because `.clinerules` are plain files in the workspace, Cline can read, write, and edit them directly. This enables interactive rule refinement without manually opening files.

### Trigger Self-Improvement via Rule

Add this to `universal.md`:

```md
## End-of-Task Reflection

Before completing any Plan phase or major Act sequence, ask:
"Would you like me to reflect on this session and propose updates to active .clinerules?"
Await confirmation. If confirmed:

1. Review all feedback given during the session.
2. Identify which active rule files are relevant.
3. Propose specific, line-level edits only — no wholesale rewrites.
4. Apply edits using replace_in_file, not full rewrites.
```

### Self-Improving Rule File (`self-improving-cline.md`)

```md
# Self-Improvement Protocol

## Process

1. At task completion, offer: "Before I finish, would you like me to suggest improvements to the active .clinerules based on this session?"
2. Await user confirmation. If declined, complete task immediately.
3. If confirmed:
   a. Synthesize all user feedback from the conversation.
   b. Identify active global and workspace rule files.
   c. Propose specific, actionable improvements to rule content.
   d. Prioritize changes that directly address friction points.
   e. Apply with replace_in_file — targeted edits only.
```

### Interactive Refinement

```
"Cline, update plan-format.md to require a risk assessment section after every Step 3."
"Cline, add a rule to act-coding.md that prohibits adding comments unless I ask."
```

---

## 8. Context & Token Optimization

### `.clineignore`

Equivalent to `.gitignore` for Cline's file exploration. Reduces context window consumption by 50–80% on large projects.

```
node_modules/
dist/
build/
.next/
coverage/
*.log
*.lock
```

### `@` Mentions Over Broad Exploration

Instead of letting Cline explore broadly, use `@` mentions to target specific files directly. This is 40–60% more efficient in token usage.

```
# Less efficient
"Fix the bug in the authentication flow"

# More efficient
"Fix the bug in @src/auth/tokenService.ts — the refresh logic on line 84"
```

### Context Window Management

- Start new tasks with `New Task` when switching contexts unrelated to the current session
- Create checkpoints before major changes (architectural refactors, schema migrations)
- Avoid accumulating long conversation histories on unrelated sub-tasks

### Rule File Token Budget

| Rule File Size  | Adherence Quality                       |
| --------------- | --------------------------------------- |
| Under 150 lines | Reliable                                |
| 150–300 lines   | Acceptable with focused structure       |
| Over 300 lines  | Degraded — split into conditional files |

---

## 9. Anti-Patterns to Eliminate

| Anti-Pattern          | Symptom                                         | Fix (add to `.clinerules`)                                                        |
| --------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| Prompt restatement    | Every response begins by repeating the task     | `"Do not restate the task in your response."`                                     |
| Exploration narration | "I'm reading src/api.ts…", "Let me check..."    | `"Do not describe files you are reading. Report findings only."`                  |
| Inline questions      | Clarifying questions scattered throughout steps | `"All clarifying questions must be in a numbered list at the end."`               |
| Unbounded steps       | Plan has 20+ vague steps with no clear end      | `"Steps must be atomic, numbered, and finite. Each step = one file, one action."` |
| Unsolicited docs      | Creates README, CHANGELOG, or explanation files | `"Do not create documentation files unless explicitly requested."`                |
| Code truncation       | "…rest of file unchanged…" in full file edits   | `"Full file rewrites must include all content. Never omit code for brevity."`     |
| Stub implementations  | Placeholder functions with TODO comments        | `"No stub implementations unless explicitly asked for scaffolding."`              |
| Context bleed         | Act mode changes files outside task scope       | `"Only modify files directly referenced in the current task."`                    |

---

## 10. `.clinerules/` Directory Scaffold

Complete scaffold ready to drop into any project root.

```
your-project/
├── .clinerules/
│   ├── universal.md           # Tone, global prohibitions, always active
│   ├── plan-format.md         # Plan response structure
│   ├── act-coding.md          # Code style, file operations
│   ├── architecture.md        # Project-specific structural decisions
│   ├── testing.md             # Test standards and patterns
│   ├── commit-format.md       # Conventional Commits standard
│   └── self-improving-cline.md  # End-of-task reflection protocol
├── .clineignore               # Files/dirs to exclude from context
├── memory_bank/
│   ├── projectBrief.md        # Project overview, goals, constraints
│   ├── activeContext.md       # Current focus, in-progress work
│   └── progress.md            # Completed work, pending items
├── src/
└── ...
```

---

## 11. Memory Bank Integration

Memory Bank is a set of structured Markdown files that persist project context across sessions. Without it, Cline starts every session without knowledge of prior decisions.

### Core Files

| File               | Contents                                             |
| ------------------ | ---------------------------------------------------- |
| `projectBrief.md`  | Overview, goals, tech stack, target users            |
| `activeContext.md` | Current task focus, recent decisions, open questions |
| `progress.md`      | What is done, what is in progress, what is blocked   |

### `projectBrief.md` Template

```md
# Project Brief

## Overview

[What this project is and what it does]

## Core Features

- Feature 1
- Feature 2

## Tech Stack

- Framework:
- Styling:
- Backend:
- Database:
- Deployment:

## Project Structure

[Key directory layout]

## Architectural Decisions

- [Decision 1 and rationale]
- [Decision 2 and rationale]

## Constraints

- [Performance requirements, compliance, team conventions]
```

### Update Protocol

Add to `universal.md`:

```md
## Memory Bank

At the start of each session, read memory_bank/activeContext.md and memory_bank/progress.md.
At the end of each session, update both files to reflect completed work and current state.
Do not update projectBrief.md unless architectural decisions changed.
```

---

## 12. Validated Workflow Sequences

### Standard Feature Implementation

```
1. Open in Plan mode
2. Use @ mentions to target relevant files
3. Review Plan output — verify Affected Files and Steps are correct
4. Ask clarifying questions if Risks section has unresolved blockers
5. Switch to Act mode
6. Review each file change before approving
7. Run tests after Act completes
8. Trigger self-improvement reflection (optional)
```

### Multi-Session Architectural Work

```
1. Update memory_bank/projectBrief.md with new requirements
2. Open in Plan mode, use /deep-planning
3. Co-develop plan across multiple Plan exchanges before switching to Act
4. Create checkpoint before first file write
5. Switch to Act — implement in phases matching Plan steps
6. After each phase, update memory_bank/progress.md
7. New session: read activeContext.md before continuing
```

### Bug Investigation

```
1. Start in Plan mode (read-only exploration is safe)
2. @ mention the suspected file(s)
3. Let Plan map the call stack and identify root cause
4. Plan output should include: root cause, affected files, fix steps, regression risk
5. Switch to Act only after root cause is confirmed
6. Surgical Act: change only what Plan identified
```

### Context Switching Mid-Task

```
1. Use toggleable .clinerules to switch rule sets without losing conversation history
2. Toggle off feature rules, toggle on refactor or debug rules
3. Address the tangent, then toggle back
4. Note: toggling .clinerules breaks prompt cache — expect slight token overhead
```

---

## Quick Reference — `.clinerules` Prompts

Paste these directly into a rules file:

```md
"Be concise and direct in all responses."
"Do not create documentation files unless explicitly requested."
"Focus on code implementation over explanation."
"Only create files essential to the task."
"DO NOT BE LAZY. DO NOT OMIT CODE."
"Only modify the specific file referenced."
"Rate your confidence (1–10) before any major change."
"List all assumptions before proceeding with structural changes."
"Ask clarifying questions as a numbered list at the end only."
"Complete each task using only existing files unless new ones are required."
"Update existing code — do not create documentation."
```

---

_Last updated: April 2026 | Based on Cline v3.13+ and validated community practices_
