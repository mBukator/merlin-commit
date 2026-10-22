# AGENTS.md

Guidance for any coding agent working in this repository. This file is the tool-agnostic source
of truth; `CLAUDE.md` imports it and adds the Claude Code layer.

## Project

Merlin Commit is an interactive CLI for creating conventional commits with a wizard-themed
interface.

| Property   | Value                                        |
| ---------- | -------------------------------------------- |
| Package    | `merlin-commit` (command: `merlin`)          |
| Node       | >=22.13.0                                    |
| Language   | TypeScript 5.7+, strict, ESM only            |
| Tests      | Vitest, `tests/unit/` + `tests/integration/` |
| License    | MIT                                          |
| Repository | github.com/mBukator/merlin-commit            |
| User docs  | `docs/` (reference, usage, guides, etc.)     |

## Architecture

```
src/
├── commands/   # Orchestration: commit, config, init
├── lib/        # Implementation: git, message, prompt, config-loader, setup, ...
├── utils/      # Pure helpers: config validation, constants, theme, validators
└── types/      # Type definitions (barrel: src/types/index.ts)
```

Commands orchestrate, lib modules implement, utils provide pure functions. Imports point down
only:

- `commands -> lib | utils | types`
- `lib -> utils | types | external packages`
- `utils -> types`
- Never `lib -> commands`, `utils -> lib` or `utils -> commands`.

Full detail: `.claude/guides/architecture.md`.

## Security invariants (MUST hold)

1. Every git command runs through `execa` with an args array. Never build a command string.
    ```typescript
    await execa("git", ["commit", "-m", message]); // correct
    execSync(`git commit -m "${message}"`); // never
    ```
2. No network calls. Merlin works fully offline.
3. No `eval()` or `new Function()`. Custom theme templates use `{placeholder}` substitution only.
4. Validate and sanitize all user configuration (`src/utils/config.ts`, `src/utils/theme.ts`).
5. Fixed file paths only. Never build a path from user input.
6. No telemetry or analytics of any kind.

Details and examples: `.claude/rules/security.md`.

## Code conventions

- Names are descriptive and unabbreviated: `config`, not `cfg`; no single-letter variables
  outside very short lambdas.
- Include units in names: `timeoutMilliseconds`, `maxLengthCharacters`.
- Booleans start with `is`, `has` or `can`.
- A function does only what its name says.
- Prefer `type` over `interface`. Never use `any`; use `unknown` and narrow.
- 4-space indentation, double quotes, semicolons, `===`/`!==`, `const` by default, never `var`.
- ESM imports use the `.js` extension, even for `.ts` sources.
- In all prose, comments, CLI strings, commits and PRs, prefer hyphens (`-`) over em and en
  dashes.

Details: `.claude/rules/naming.md`, `.claude/rules/code-style.md`,
`.claude/rules/clean-code.md`.

## Commands

```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Watch mode compilation
npm run lint           # ESLint on src/ and tests/
npm run format         # Prettier --write on src, tests and docs
npm run type-check     # tsc --noEmit
npm run knip           # Unused exports, files and dependencies
npm run test           # Vitest, all tests once
npx vitest run tests/unit/message.test.ts   # One test file
```

### Before pushing

These mirror the CI `ci` job in `.github/workflows/ci.yml`:

```bash
npm run lint && npm run type-check && npm run knip && npm run test && npm run build
npx prettier --check "src/**/*.ts" "tests/**/*.ts" "docs/**/*.md"
```

`knip` fails on unused exports, for example a type re-exported from `src/types/index.ts` that
nothing imports through the barrel. The prettier check also covers `docs/`, so run it after
editing docs. Git hooks enforce part of this: `pre-commit` runs lint-staged and type-check,
`commit-msg` runs commitlint, `pre-push` runs knip, test and build.

## Git workflow

- `main` (releases) and `develop` (integration) are protected. Never commit or push to them
  directly.
- Branch from `develop`: `feat/*`, `fix/*`, `docs/*`, `chore/*`, `refactor/*`, `test/*`.
  `hotfix/*` branches from `main`.
- Open PRs against `develop` (`gh pr create --base develop`; the repo's default branch is
  `main`). PRs are squash-merged and follow `.github/pull_request_template.md`.
- Releases go `develop -> release/vX.Y.Z -> main`, then get synced back to `develop`.
- Commits follow Conventional Commits: `<type>(<scope>): <subject>`. commitlint enforces a
  subject of at most 72 characters and a scope of at most 20.
- Do not add AI attribution to commits or PRs: no `Co-Authored-By` trailer for an AI and no
  "Generated with" line.

Full detail: `.claude/guides/git-workflow.md`.
