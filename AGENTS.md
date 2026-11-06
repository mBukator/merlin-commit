# AGENTS.md

Merlin Commit (`merlin-commit`, command `merlin`) is an offline TypeScript CLI that walks users
through writing Conventional Commits with a wizard-themed interface.

## Every task

- Node >=22.13, ESM only. Relative imports use the `.js` extension, even from `.ts` sources.
- Layers, top to bottom: `commands`, `lib`, `utils`, `types`. Import from a lower layer or the
  same layer (acyclic), never upward.
- Never use `any` in `src/`; use `unknown` and narrow.
- In prose, comments, CLI strings, commits and PRs, use hyphens (`-`), not em or en dashes.
- A change to user-facing behavior updates the matching `docs/` page in the same branch.

## Security invariants (MUST hold)

1. Run every git command through `execa` with an args array. Never build a command string.
2. No network calls. Merlin works fully offline.
3. No `eval()` or `new Function()`. Theme templates use `{placeholder}` substitution only.
4. Validate and sanitize all user configuration (`src/utils/config.ts`, `src/utils/theme.ts`).
5. Fixed file paths only (`~/.merlinrc.json`, `<repo-root>/.merlinrc.json`). Never build a path
   from user input.
6. No telemetry or analytics.

## Commands

```bash
npm run type-check                          # tsc --noEmit (hyphenated)
npm run knip                                # fails on unused exports, incl. unused barrel re-exports
npx vitest run tests/unit/message.test.ts   # one test file
```

Before pushing, run the CI gate:

```bash
npm run lint && npm run type-check && npm run knip && npm run test && npm run build
npx prettier --check "src/**/*.ts" "tests/**/*.ts" "docs/**/*.md"
```

## Git

- `main` and `develop` are protected: never commit or push to them. Branch from `develop`.
- PRs target `develop`, not the repo default `main`: `gh pr create --base develop`.
- Conventional Commits; commitlint caps the subject at 72 characters and the scope at 20.
- No AI attribution in commits or PRs (no `Co-Authored-By` trailer, no "Generated with" line).

## Read when relevant

| Read when you are...                         | File                                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------- |
| Naming a variable, function, type or file    | [naming.md](.claude/rules/naming.md)                                          |
| Writing TypeScript (types, errors, comments) | [code-style.md](.claude/rules/code-style.md)                                  |
| Designing or refactoring functions in `src/` | [clean-code.md](.claude/rules/clean-code.md)                                  |
| Working in `src/commands/`                   | [commands.md](.claude/rules/commands.md)                                      |
| Working in `src/lib/`                        | [lib.md](.claude/rules/lib.md)                                                |
| Working in `src/utils/`                      | [utils.md](.claude/rules/utils.md)                                            |
| Writing or fixing tests                      | [testing.md](.claude/rules/testing.md)                                        |
| Touching git calls, config or file I/O       | [security.md](.claude/rules/security.md)                                      |
| Changing user-facing behavior                | [documentation.md](.claude/rules/documentation.md)                            |
| Adding a module, command or extension point  | [architecture.md](.claude/guides/architecture.md)                             |
| Setting up, debugging, or hitting ESM issues | [development.md](.claude/guides/development.md)                               |
| Committing, opening a PR, releasing, hotfix  | [git-workflow.md](.claude/guides/git-workflow.md)                             |
| Adding or removing a source file             | [codebase-map.md](.claude/maintenance/codebase-map.md) (update it afterwards) |
