| Command                              | Description                                 |
| ------------------------------------ | ------------------------------------------- |
| `git clone <repo-url>`               | Clone remote repo and establish `origin`    |
| `git checkout main`                  | Switch to the stable base branch            |
| `git pull origin main`               | Sync local `main` with GitHub               |
| `git checkout -b feature/x`          | Create and switch to a feature branch       |
| _(edit files)_                       | Make isolated feature changes               |
| `git add .`                          | Stage selected changes                      |
| `git commit -m "msg"`                | Commit staged changes to branch             |
| `git push -u origin feature/x`       | Publish feature branch to GitHub            |
| `git checkout main`                  | Switch back to `main`                       |
| `git pull origin main`               | Update `main` before syncing feature        |
| `git checkout feature/x`             | Return to feature branch                    |
| `git merge main`                     | Merge latest `main` into feature branch     |
| `git push`                           | Push updated feature branch                 |
| _(open PR)_                          | Request merge of feature branch into `main` |
| _(merge PR)_                         | Merge approved PR into `main`               |
| `git checkout main`                  | Switch to updated `main`                    |
| `git pull origin main`               | Sync local `main` after merge               |
| `git branch -d feature/x`            | Delete local feature branch                 |
| `git push origin --delete feature/x` | Delete remote feature branch                |

## Best-Practice Considerations (Branching & Collaboration)

### Branching

- **One feature per branch**  
  Keep scope narrow; easier review and rollback.
- **Branch from up-to-date `main`**  
  Always pull before branching.
- **Short-lived branches**  
  Merge or discard quickly to avoid drift.
- **Clear naming**  
  `feature/x`, `fix/y`, `experiment/z`.

### Commits

- **Commit by intent**  
  One logical change per commit.
- **Small, frequent commits**  
  Easier to review and debug.
- **Readable messages**  
  State _what_ changed, not _how_.

### Syncing

- **Pull before starting work**  
  Reduces conflicts.
- **Merge `main` into your branch before PR**  
  Resolve conflicts early.
- **Avoid blind `git pull`**  
  Prefer `fetch` + intentional merge when history matters.

### Pull Requests

- **Always PR into `main`**  
  Never commit directly.
- **Require review**  
  At least one other person approves.
- **Small, focused PRs**  
  Faster, higher-quality feedback.

### `main` Branch

- **Always stable**  
  Should build/run at any time.
- **Protected**  
  No direct pushes; PRs only.
- **Clean history**  
  Prefer squash merges for features.

### Collaboration Hygiene

- **Communicate early**  
  Call out overlapping work.
- **One owner per branch**  
  Don’t share feature branches.
- **Delete merged branches**  
  Keep the repo tidy.

### Conflict Avoidance

- **Avoid unrelated file changes**  
  Reduces merge pain.
- **Split refactors from features**  
  Refactor first, then add features.

### Mental Rules

- Branches isolate risk
- PRs select winners
- `main` is sacred
