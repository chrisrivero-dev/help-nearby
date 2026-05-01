# GitHub Guide: Beginner to Intermediate

---

## Table of Contents

- [Foundational](#foundational)
  - [What Git Is](#what-git-is)
  - [Nomenclature](#nomenclature)
  - [Data Flow Diagram](#data-flow-diagram)
  - [Installation & Global Setup](#installation--global-setup)
  - [SSH Keys](#ssh-keys)
- [Fresh Project Flow](#fresh-project-flow)
  - [Scenario A: Start locally, push to GitHub](#scenario-a-start-locally-push-to-github)
  - [Scenario B: Clone an existing repo](#scenario-b-clone-an-existing-repo)
  - [Standard Commit Cycle](#standard-commit-cycle)
- [Working Across Multiple Machines](#working-across-multiple-machines)
  - [Normal Flow](#normal-flow)
  - [Reset Scenarios](#reset-scenarios)
- [Branching](#branching)
  - [Why Branches](#why-branches)
  - [Branch Basics](#branch-basics)
  - [Merging](#merging)
  - [Rebase](#rebase-clean-linear-history)
  - [Viewing Branch History](#viewing-branch-history)
- [Tagging](#tagging)
  - [Lightweight vs Annotated](#lightweight-vs-annotated)
  - [Tag Commands](#tag-commands)
- [Terminal vs VS Code](#terminal-vs-vs-code)
  - [VS Code Git Integration](#vs-code-git-integration)
  - [Using Terminal Inside VS Code](#using-terminal-inside-vs-code)
  - [When to Use CLI vs GUI](#when-to-use-cli-vs-gui)
- [Quick Reference Cheatsheet](#quick-reference-cheatsheet)
- [Follow-up Options](#follow-up-options)

---

## Foundational

### What Git Is

Git is a **distributed version control system**. Every machine with the repo has a full copy of history. GitHub is a **remote hosting service** for Git repositories — it is not Git itself.

### Nomenclature

| Term           | Meaning                                               |
| -------------- | ----------------------------------------------------- |
| `repo`         | A project folder tracked by Git                       |
| `remote`       | A repo hosted elsewhere (GitHub, GitLab, etc.)        |
| `origin`       | The default alias for your primary remote (GitHub)    |
| `upstream`     | A second remote (e.g., original repo you forked from) |
| `working tree` | Files on disk, currently being edited                 |
| `staging area` | Files queued for the next commit (`git add`)          |
| `commit`       | A snapshot of staged changes with a message           |
| `HEAD`         | Pointer to the current commit you're on               |
| `branch`       | A named pointer to a line of commits                  |
| `merge`        | Integrate one branch into another                     |
| `rebase`       | Replay commits on top of another branch               |
| `stash`        | Temporarily shelve uncommitted changes                |
| `clone`        | Download a full copy of a remote repo                 |
| `fetch`        | Download remote changes without merging               |
| `pull`         | Fetch + merge (or rebase) in one step                 |
| `push`         | Send local commits to the remote                      |

### Data Flow Diagram

```
[Machine A]           [GitHub / origin]          [Machine B]
 working tree  -push->  remote/main   <-pull-   working tree
 local/main   <-pull-   remote/main   -push->   local/main
              -fetch->  (remote refs)
```

- `push` sends your commits to the remote
- `pull` = `fetch` + `merge` (or `rebase`)
- `fetch` downloads remote state without changing local branches
- Multiple machines share state **only through the remote**

---

### Installation & Global Setup

```bash
# Verify Git is installed
git --version

# Set identity (required before first commit)
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Set default editor (VS Code)
git config --global core.editor "code --wait"

# View all config
git config --list
```

---

### SSH Keys

SSH keys authenticate you to GitHub without passwords.

```bash
# 1. Generate a key (Ed25519 recommended)
ssh-keygen -t ed25519 -C "you@example.com"
# Accept default path (~/.ssh/id_ed25519), set passphrase optionally

# 2. Start the SSH agent and add the key
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 3. Copy the PUBLIC key to clipboard
cat ~/.ssh/id_ed25519.pub
# Then: GitHub > Settings > SSH and GPG keys > New SSH key > paste

# 4. Test the connection
ssh -T git@github.com
# Expected: "Hi username! You've successfully authenticated..."
```

> Use SSH URLs (`git@github.com:user/repo.git`) not HTTPS to leverage keys.

---

## Fresh Project Flow

### Scenario A: Start locally, push to GitHub

```bash
# 1. Initialize repo
mkdir my-project && cd my-project
git init

# 2. Create a .gitignore (critical — do this first)
# Add node_modules/, .env, dist/, *.log, etc.

# 3. First commit
git add .
git commit -m "Initial commit"

# 4. Create repo on GitHub (no README, no .gitignore — keep it empty)
# Then link and push:
git remote add origin git@github.com:username/my-project.git
git branch -M main
git push -u origin main
# -u sets origin/main as the upstream tracking branch (only needed once)
```

### Scenario B: Clone an existing repo

```bash
git clone git@github.com:username/my-project.git
cd my-project
# origin is automatically configured
```

### Standard Commit Cycle

```bash
git status                  # See what changed
git diff                    # See unstaged diffs
git add filename            # Stage specific file
git add .                   # Stage everything
git diff --staged           # Review what's staged before committing
git commit -m "feat: description of change"
git push                    # Push to tracked remote branch
```

---

## Working Across Multiple Machines

### Concept

There is no direct sync between machines. All state flows through the remote (origin). The sequence: **pull before you work, push when done.**

### Normal Flow

**Starting a session on any machine:**

```bash
git fetch origin            # Download remote state (safe, no merge)
git status                  # Check if local is behind
git pull                    # Bring local branch up to date
# ... do work ...
git add .
git commit -m "message"
git push
```

**Before switching machines:**

- Always push completed or in-progress work
- If not ready to commit: use `git stash`

```bash
git stash               # Shelf current changes
git push                # Push any committed work
# ... switch machine ...
git pull
git stash pop           # Restore shelved changes
```

---

### Reset Scenarios

#### Scenario: Local has diverged from remote (non-destructive fix)

Your local and remote have different commits. Pull was rejected.

```bash
git fetch origin
git log --oneline --graph origin/main HEAD   # Visualize divergence
git pull --rebase origin main               # Replay your commits on top of remote
git push
```

#### Scenario: Discard ALL local changes (return to last commit)

```bash
git checkout -- .           # Discard unstaged changes in working tree
git restore .               # Modern equivalent
git reset HEAD .            # Unstage everything (keeps changes in working tree)
```

#### Scenario: Nuke local branch, reset it to match remote exactly

```bash
git fetch origin
git reset --hard origin/main
# WARNING: Destroys any local commits and changes not pushed
```

#### Scenario: Undo last commit (keep changes in working tree)

```bash
git reset --soft HEAD~1     # Undo commit, keep files staged
git reset --mixed HEAD~1    # Undo commit, keep files unstaged (default)
git reset --hard HEAD~1     # Undo commit, discard all changes — DESTRUCTIVE
```

#### Scenario: Undo a pushed commit (safe for shared branches)

```bash
git revert <commit-hash>    # Creates a new commit that reverses the target
git push
# Use revert (not reset) on shared/remote branches
```

#### Scenario: Pull fails due to uncommitted local changes

```bash
git stash
git pull
git stash pop
# If conflicts: resolve them, then git add + git stash drop
```

---

## Branching

### Why Branches

Isolate work. `main` stays stable. Features, fixes, experiments live in branches.

### Branch Basics

```bash
git branch                          # List local branches
git branch -a                       # List local + remote branches
git branch feature/login            # Create branch (does not switch)
git checkout feature/login          # Switch to branch (classic)
git switch feature/login            # Switch (modern syntax)
git checkout -b feature/login       # Create + switch (classic)
git switch -c feature/login         # Create + switch (modern)

git push -u origin feature/login    # Push branch to remote and track it
```

### Merging

```bash
# Merge feature into main
git switch main
git pull                            # Ensure main is current
git merge feature/login             # Merge feature branch in
git push

# Delete branch after merge
git branch -d feature/login         # Local delete (safe — warns if unmerged)
git branch -D feature/login         # Force delete
git push origin --delete feature/login  # Remote delete
```

### Rebase (clean linear history)

```bash
git switch feature/login
git fetch origin
git rebase origin/main              # Replay your commits on top of latest main
# Resolve any conflicts per-commit, then:
git rebase --continue               # After resolving each conflict
git rebase --abort                  # Bail out if needed
git push --force-with-lease         # Required after rebase on pushed branch
```

> **Rule:** Never rebase a branch others are working on. Rebase is safe for personal feature branches.

### Viewing Branch History

```bash
git log --oneline --graph --all     # Visual tree of all branches
git log main..feature/login         # Commits in feature not yet in main
```

---

## Tagging

Tags mark specific commits — typically release points.

### Lightweight vs Annotated

| Type        | Use case                                                             |
| ----------- | -------------------------------------------------------------------- |
| Lightweight | Quick local marker, no metadata                                      |
| Annotated   | Releases — includes author, date, message; stored as full Git object |

```bash
# Annotated tag (preferred for releases)
git tag -a v1.0.0 -m "Release version 1.0.0"

# Lightweight tag
git tag v1.0.0-beta

# Tag a specific past commit
git tag -a v0.9.0 <commit-hash> -m "Retroactive tag"

# List all tags
git tag
git tag -l "v1.*"                   # Filter by pattern

# View tag details
git show v1.0.0

# Push tags to remote (tags are NOT pushed with normal git push)
git push origin v1.0.0              # Push single tag
git push origin --tags              # Push all tags

# Delete a tag
git tag -d v1.0.0                   # Local
git push origin --delete v1.0.0    # Remote
```

---

## Terminal vs VS Code

### Answer: Git Lives in the Terminal — VS Code Wraps It

Git is a command-line tool. VS Code's Source Control panel (and extensions like GitLens) are **GUI wrappers** around the same underlying Git commands. Both work on the same repo simultaneously.

### VS Code Git Integration

| VS Code Action                      | Equivalent CLI             |
| ----------------------------------- | -------------------------- |
| Click "+" on file in Source Control | `git add <file>`           |
| Click "Commit"                      | `git commit -m "..."`      |
| Click "Sync"                        | `git pull` then `git push` |
| Click "..." > Pull                  | `git pull`                 |
| Click "..." > Push                  | `git push`                 |
| Bottom-left branch name > switch    | `git switch <branch>`      |
| Source Control graph (GitLens)      | `git log --graph`          |

### Using Terminal Inside VS Code

VS Code has an **integrated terminal**. All Git commands work there identically to a standalone terminal:

```
Menu: Terminal > New Terminal   (or Ctrl+` / Cmd+`)
```

You can run any Git command directly. The Source Control panel updates in real time.

### When to Use CLI vs GUI

| Use CLI                       | Use VS Code GUI                       |
| ----------------------------- | ------------------------------------- |
| Rebase, reset, complex merges | Staging individual lines/hunks        |
| Scripting or automation       | Visual diff review                    |
| SSH setup, config             | Quick commits during development      |
| Tags, remote management       | Branch switching during active coding |

> Knowing the CLI commands is mandatory. GUI tools fail silently, abstract away detail, and don't translate to servers or remote machines.

---

## Quick Reference Cheatsheet

```bash
# STATUS & INSPECTION
git status
git log --oneline --graph --all
git diff
git diff --staged
git show <commit>

# STAGING & COMMITTING
git add .
git add -p                  # Interactively stage hunks
git commit -m "message"
git commit --amend          # Edit last commit (before pushing only)

# REMOTE
git remote -v               # Show remotes
git fetch origin
git pull
git push
git push -u origin <branch>

# BRANCHES
git switch -c <branch>
git switch <branch>
git merge <branch>
git branch -d <branch>
git push origin --delete <branch>

# STASH
git stash
git stash pop
git stash list
git stash drop

# UNDO
git restore .               # Discard unstaged changes
git reset --soft HEAD~1    # Undo last commit, keep staged
git reset --hard origin/main  # Nuke to remote state
git revert <hash>           # Safe undo of pushed commit

# TAGS
git tag -a v1.0.0 -m "msg"
git push origin --tags
```

---

## Follow-up Options

1. Merge conflicts — how to read, resolve, and use VS Code's diff editor
2. Git rebase deep dive — interactive rebase, squashing commits
3. `.gitignore` patterns and global ignore files
4. Git workflows — Gitflow vs trunk-based development
5. GitHub-specific — PRs, forks, Actions CI basics
6. Aliases and productivity shortcuts (`.gitconfig`)
