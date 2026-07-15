---
title: Attach a local (never-initialized) project to a remote that already has commits
date: 2026-07-14
category: workflow-issues
module: git
problem_type: workflow_issue
component: development_workflow
severity: low
applies_when:
  - A local directory holds a full project but was never `git init`-ed
  - The GitHub remote already exists with commits (e.g. a GitHub-created "Initial commit" holding LICENSE/README)
  - You want to keep the remote's files without force-pushing over them or triggering an unrelated-histories merge
tags: [git, git-init, remote, unrelated-histories, initial-commit, github]
---

# Attach a local (never-initialized) project to a remote that already has commits

## Context

A common setup snag: you have a full project sitting in a local directory that was
never turned into a git repo, and the GitHub remote already has one or more commits
(typically a GitHub-created "Initial commit" containing just a `LICENSE` and/or
`README`). The naive paths all go wrong:

- `git init` + `git push` -> rejected (remote has commits you don't have).
- `git pull` after adding the remote -> "refusing to merge unrelated histories,"
  and forcing it produces an ugly merge commit joining two unrelated roots.
- Force-pushing your local root over the remote -> clobbers the remote's LICENSE
  commit and loses that history.

The goal is a clean state where your local files sit as ordinary new files
_on top of_ the remote's existing commit, ready to be committed and pushed
fast-forward.

## Guidance

Base your local branch on the remote commit with a **mixed reset**, restore the
remote's tracked files into the working tree, then set upstream. This grafts your
local files onto the remote history without a merge:

```bash
git init -b main
git remote add origin git@github.com:owner/repo.git
git fetch origin

# Base local main on the remote's commit WITHOUT touching the working tree.
# Mixed reset moves HEAD + index to origin/main but leaves your files on disk
# as "untracked" (they are now diffed against the remote commit).
git reset origin/main

# The reset marked the remote's tracked files (e.g. LICENSE) as "deleted" in the
# working tree because they were never on your disk. Restore them from the remote.
git checkout origin/main -- LICENSE

git branch --set-upstream-to=origin/main main

# Now your project files show up as untracked, LICENSE is present and tracked.
# Commit and push fast-forward.
git add -A
git commit -m "Initial commit of project"
git push
```

Key insight: `git reset <remote>/main` (mixed, the default) is what avoids the
unrelated-histories problem. It rewrites HEAD to point at the remote commit while
leaving your working-tree files alone, so git treats them as new additions on top
of that commit rather than as a divergent history to merge.

## Why This Matters

- **No merge mess:** you never run `git merge`/`git pull`, so there is no
  "unrelated histories" prompt and no synthetic merge commit joining two roots.
- **Remote history preserved:** the remote's LICENSE commit stays as the parent of
  your initial commit; nothing is force-pushed or lost.
- **Fast-forward push:** because your commit descends from `origin/main`, the push
  is a plain fast-forward with no `--force`.

## When to Apply

- Importing an existing local codebase into a freshly created GitHub repo that was
  initialized with a LICENSE/README/.gitignore.
- Any time `git push` is rejected on first push and you don't want to force over,
  or merge with, what the remote already has.

## Examples

Before (both fail):

```bash
git init && git add -A && git commit -m init && git push
# ! [rejected]  main -> main (fetch first)

git pull origin main
# fatal: refusing to merge unrelated histories
```

After (clean graft, see Guidance above): local files become untracked additions on
top of `origin/main`, the remote's LICENSE is checked back into the working tree,
upstream is set, and a single fast-forward push lands the initial commit.

Bonus during this flow: catch build artifacts that should be ignored before the
first commit (here `tsconfig.tsbuildinfo`, a TypeScript incremental-build file) and
add them to `.gitignore` so they never enter history.

## Related

- Landed as initial commit ec45a58 on the sidewalk-story project.
