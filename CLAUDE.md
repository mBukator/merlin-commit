@AGENTS.md

# Claude Code layer

Rules in `.claude/rules/` carry `paths:` frontmatter and load by themselves when you work on a
matching file. Every rule is path-scoped; what every session needs lives in AGENTS.md. Rules are
listed here by path, not imported, so a session pays only for the rules it needs.

| Rule                             | Loads for                     |
| -------------------------------- | ----------------------------- |
| `.claude/rules/naming.md`        | `**/*.ts`                     |
| `.claude/rules/security.md`      | `src/**/*.ts`                 |
| `.claude/rules/code-style.md`    | `**/*.ts`                     |
| `.claude/rules/clean-code.md`    | `src/**/*.ts`                 |
| `.claude/rules/commands.md`      | `src/commands/*.ts`           |
| `.claude/rules/lib.md`           | `src/lib/*.ts`                |
| `.claude/rules/utils.md`         | `src/utils/*.ts`              |
| `.claude/rules/testing.md`       | `tests/**/*.test.ts`          |
| `.claude/rules/documentation.md` | `src/**/*.ts`, `docs/**/*.md` |

Guides in `.claude/guides/` and the codebase map never auto-load. Open them from the "Read when
relevant" table in AGENTS.md.
