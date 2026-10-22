# Git Workflow Guide

**Last Updated**: 2026-02-07

Complete guide to the git workflow, branching strategy, commit conventions, and release process for merlin-commit.

---

## Table of Contents

- [Branching Strategy](#branching-strategy)
- [Workflow Steps](#workflow-steps)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)
- [Git Hooks](#git-hooks)

---

## Branching Strategy

### Protected Branches

| Branch      | Purpose                                | Protection Rules                                     |
| ----------- | -------------------------------------- | ---------------------------------------------------- |
| **main**    | Production-ready code, tagged releases | No direct commits, PR required, all checks must pass |
| **develop** | Integration branch for features        | No direct commits, PR required, all checks must pass |

### Branch Types

| Pattern      | Purpose                          | Created From | Merges Into          | Lifetime                  |
| ------------ | -------------------------------- | ------------ | -------------------- | ------------------------- |
| `feat/*`     | New features                     | `develop`    | `develop` via PR     | Until merged or abandoned |
| `fix/*`      | Bug fixes                        | `develop`    | `develop` via PR     | Until merged              |
| `docs/*`     | Documentation changes            | `develop`    | `develop` via PR     | Until merged              |
| `chore/*`    | Maintenance tasks (deps, config) | `develop`    | `develop` via PR     | Until merged              |
| `refactor/*` | Code refactoring                 | `develop`    | `develop` via PR     | Until merged              |
| `test/*`     | Adding/fixing tests              | `develop`    | `develop` via PR     | Until merged              |
| `release/v*` | Release preparation              | `develop`    | `main` and `develop` | Until released            |
| `hotfix/*`   | Urgent production fixes          | `main`       | `main` and `develop` | Until fixed               |

### Branch Naming Examples

**Good**:

- `feat/add-custom-types`
- `fix/scope-validation`
- `docs/update-readme`
- `chore/upgrade-dependencies`
- `release/v1.1.0`
- `hotfix/critical-security-fix`

**Bad**:

- `feature-1` (not descriptive)
- `johns-branch` (personal, not descriptive)
- `fix` (too generic)
- `WIP-stuff` (work-in-progress should be descriptive)

---

## Workflow Steps

### Starting New Work

```bash
# 1. Ensure you're on develop and up to date
git checkout develop
git pull origin develop

# 2. Create feature branch
git checkout -b feat/your-feature-name

# 3. Make changes
# ... edit files ...

# 4. Run quality checks
npm run lint
npm run format
npm run type-check
npm run test
npm run build

# 5. Stage and commit
git add <files>
merlin  # Use merlin to create conventional commit

# 6. Push to remote
git push -u origin feat/your-feature-name

# 7. Create PR on GitHub
gh pr create --base develop --title "feat: your feature title" --body "..."
```

### Working on Feature Branch

```bash
# Regularly pull from develop to stay updated
git checkout develop
git pull origin develop
git checkout feat/your-feature

# Rebase on develop (preferred over merge)
git rebase develop

# Or merge if you prefer
git merge develop

# Continue work
# ... make changes ...

# Commit changes
merlin

# Push updates
git push origin feat/your-feature

# If you rebased, force push (carefully!)
git push --force-with-lease origin feat/your-feature
```

### Before Creating PR

```bash
# 1. Ensure all tests pass
npm run test

# 2. Run all quality checks
npm run lint && npm run type-check && npm run knip && npm run test && npm run build
npx prettier --check "src/**/*.ts" "tests/**/*.ts" "docs/**/*.md"

# 3. Review your changes
git diff develop...HEAD

# 4. Check commit history
git log develop..HEAD --oneline

# 5. Ensure branch is up to date with develop
git pull origin develop
# Or: git rebase develop

# 6. Push final changes
git push origin feat/your-feature
```

---

## Commit Message Format

Merlin-commit follows [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type         | Description                   | Example                                                 |
| ------------ | ----------------------------- | ------------------------------------------------------- |
| **feat**     | New feature                   | `feat(prompts): add custom commit type configuration`   |
| **fix**      | Bug fix                       | `fix(git): resolve staging detection for renamed files` |
| **docs**     | Documentation only            | `docs(readme): update installation instructions`        |
| **style**    | Code style (formatting, etc.) | `style: fix indentation in config module`               |
| **refactor** | Code refactoring              | `refactor(message): simplify formatting logic`          |
| **perf**     | Performance improvement       | `perf(git): cache git repo check result`                |
| **test**     | Adding/fixing tests           | `test(validators): add edge case tests`                 |
| **build**    | Build system changes          | `build: update rollup configuration`                    |
| **ci**       | CI configuration              | `ci: add Node.js 20 to test matrix`                     |
| **chore**    | Maintenance                   | `chore(deps): upgrade inquirer to v10`                  |
| **revert**   | Revert previous commit        | `revert: revert "feat: add custom types"`               |

### Scope Examples

Scope indicates which part of codebase is affected:

- `prompts` - Interactive prompt changes
- `git` - Git operation changes
- `message` - Commit message formatting
- `config` - Configuration handling
- `cli` - CLI interface changes
- `validators` - Validation logic
- `types` - TypeScript types
- `tests` - Test files

### Subject Guidelines

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Maximum 72 characters
- Be concise but descriptive

**Good**:

- `feat(git): add support for signed commits`
- `fix(prompt): handle EOF in interactive mode`
- `docs: clarify configuration options`

**Bad**:

- `feat: Added some stuff` (past tense, vague)
- `fix: Fixed it.` (period, vague)
- `Update README` (not conventional format)

### Body Guidelines

- Separate from subject with blank line
- Wrap at 72 characters
- Explain **what** and **why**, not **how**
- Use bullet points if multiple points

Example:

```
feat(config): add config validation

- Validate all user configuration before saving
- Throw clear errors for invalid values
- Support migration from old config format

This prevents runtime errors from malformed config files
and provides better user experience with actionable error messages.
```

### Footer Guidelines

Use for breaking changes and issue references:

**Breaking Changes**:

```
feat(api): change config file format

BREAKING CHANGE: config file format changed from JSON to YAML.
Migration: run `merlin migrate-config` to update your config.
```

**Issue References**:

```
fix(git): resolve merge conflict detection

Closes #123
Fixes #456
Resolves #789
```

### AI Attribution

Do not add AI attribution to commits or PRs: no `Co-Authored-By` trailer for an AI assistant
and no "Generated with" line in commit bodies or PR descriptions.

BAD EXAMPLE:

```
feat(prompts): add new prompt type

Co-Authored-By: <AI assistant> <noreply@example.com>
```

GOOD EXAMPLE:

```
feat(prompts): add new prompt type
```

---

## Pull Request Process

### Creating PR

1. **Push your branch**:

    ```bash
    git push -u origin feat/your-feature
    ```

2. **Create PR using GitHub CLI**:

    ```bash
    gh pr create \
      --base develop \
      --title "feat(scope): brief description" \
      --body "$(cat <<'EOF'
    ## Summary
    - Change 1
    - Change 2
    - Change 3

    ## Test Plan
    - [ ] Unit tests added/updated
    - [ ] Manual testing performed
    - [ ] No regressions
    EOF
    )"
    ```

3. **Or create via GitHub web interface**

### PR Title

Follow conventional commit format:

- `feat(scope): add feature description`
- `fix(scope): resolve bug description`
- `docs: update documentation`

### PR Description Template

To find description template for pull request go to .github/pull_request_template.md

### PR Review Process

**As Author**:

1. Ensure all CI checks pass
2. Respond to review comments promptly
3. Make requested changes
4. Request re-review after changes

**As Reviewer**:

1. Review code logic and architecture
2. Check for security issues
3. Verify tests cover changes
4. Ensure code follows style guide
5. Approve when satisfied

### Merging PR

**Merge Strategy**: **Squash and Merge** (default)

Why squash?

- Clean, linear history on develop
- One commit per feature/fix
- Easier to revert if needed
- Clear changelog generation

**Process**:

1. All checks must pass
2. At least one approval required
3. Resolve any merge conflicts
4. Squash and merge to develop
5. Delete feature branch

---

## Release Process

### Preparation

1. **Create release branch from develop**:

    ```bash
    git checkout develop
    git pull origin develop
    git checkout -b release/v1.1.0
    ```

2. **Update version in package.json**:

    ```bash
    npm version minor  # or major/patch
    ```

3. **Update CHANGELOG.md**:

    ```markdown
    ## [1.1.0] - 2026-02-07

    ### Added

    - New feature 1
    - New feature 2

    ### Fixed

    - Bug fix 1
    - Bug fix 2

    ### Changed

    - Breaking change 1
    ```

4. **Run final checks**:

    ```bash
    npm run lint
    npm run test
    npm run build
    ```

5. **Commit version bump**:
    ```bash
    git add package.json CHANGELOG.md package-lock.json
    git commit -m "chore(release): bump version to 1.1.0"
    git push origin release/v1.1.0
    ```

### Releasing

1. **Create PR from release branch to main**:

    ```bash
    gh pr create \
      --base main \
      --title "release: v1.1.0" \
      --body "Release version 1.1.0"
    ```

2. **Review and merge to main**

3. **Tag the release**:

    ```bash
    git checkout main
    git pull origin main
    git tag -a v1.1.0 -m "Release version 1.1.0"
    git push origin v1.1.0
    ```

4. **Merge release branch back to develop**:

    ```bash
    gh pr create \
      --base develop \
      --head release/v1.1.0 \
      --title "chore: sync release v1.1.0 to develop" \
      --body "Sync version bump from release"
    ```

5. **Delete release branch**:

    ```bash
    git branch -d release/v1.1.0
    git push origin --delete release/v1.1.0
    ```

6. **Publish to npm** (if applicable):
    ```bash
    npm publish
    ```

### Hotfix Process

For urgent fixes to production:

1. **Create hotfix branch from main**:

    ```bash
    git checkout main
    git pull origin main
    git checkout -b hotfix/critical-bug
    ```

2. **Fix the issue and test**

3. **Bump patch version**:

    ```bash
    npm version patch
    ```

4. **Create PR to main**:

    ```bash
    gh pr create --base main --title "hotfix: critical bug"
    ```

5. **After merge, tag the hotfix**:

    ```bash
    git tag -a v1.0.1 -m "Hotfix version 1.0.1"
    git push origin v1.0.1
    ```

6. **Merge hotfix to develop**:
    ```bash
    gh pr create --base develop --title "chore: sync hotfix v1.0.1"
    ```

---

## Git Hooks

Merlin-commit uses Husky for git hooks.

### Pre-Commit Hook

**Location**: `.husky/pre-commit`

**Actions**:

1. Run `npx lint-staged` - ESLint `--fix` and Prettier on staged `src/` and `tests/` files
2. Run `npm run type-check` - TypeScript validation

**If fails**: Commit is blocked, fix issues and try again

### Commit-Msg Hook

**Location**: `.husky/commit-msg`

**Actions**:

1. Run `commitlint` to validate commit message format
2. Ensure message follows conventional commits spec

**If fails**: Commit is blocked with error explaining issue

### Pre-Push Hook

**Location**: `.husky/pre-push`

**Actions**:

1. Run `npm run knip` - unused exports, files and dependencies
2. Run `npm run test` - full test suite
3. Run `npm run build` - TypeScript compilation

**If fails**: Push is blocked, fix issues and try again

### Bypassing Hooks

Coding agents must never bypass hooks (`.claude/settings.json` denies `--no-verify`). For
humans, it is **not recommended**, but sometimes necessary:

```bash
git commit --no-verify -m "message"
merlin --no-verify
```

**Only use when**:

- Emergencies
- CI is broken and needs urgent fix
- Hook has a bug (then fix the hook!)

---

## Best Practices

### Do

- ✅ Keep commits focused and atomic
- ✅ Write descriptive commit messages
- ✅ Rebase feature branches regularly
- ✅ Run tests before pushing
- ✅ Use conventional commit format
- ✅ Review your own PR before requesting review
- ✅ Keep branches up to date with develop

### Don't

- ❌ Commit directly to main or develop
- ❌ Force push to main or develop
- ❌ Create vague commit messages ("fix stuff", "WIP")
- ❌ Leave failing tests
- ❌ Skip pre-commit hooks without good reason
- ❌ Let branches get too far behind develop
- ❌ Commit sensitive data (.env, credentials)

---

## Troubleshooting

### Merge Conflicts

```bash
# Update your branch
git checkout feat/your-feature
git pull origin develop

# Fix conflicts in editor
# ... resolve conflicts ...

# Mark as resolved
git add <resolved-files>

# Continue
git rebase --continue
# Or if merging:
git commit
```

### Accidentally Committed to Wrong Branch

```bash
# Save your changes
git stash

# Switch to correct branch
git checkout -b correct-branch

# Apply changes
git stash pop

# Commit
merlin
```

### Need to Amend Last Commit

```bash
# Make changes
# ... edit files ...

# Stage changes
git add <files>

# Amend (using merlin)
merlin --amend

# Force push if already pushed
git push --force-with-lease origin feat/your-feature
```

---

## Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Pro Git Book](https://git-scm.com/book/en/v2)
- .claude/guides/architecture.md - Architecture overview
- .claude/guides/development.md - Development setup
