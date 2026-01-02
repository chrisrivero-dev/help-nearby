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
