@AGENTS.md

# Claude Code layer

Rules in `.claude/rules/` carry `paths:` frontmatter and load by themselves when you work on a
matching file. Rules without frontmatter load in every session. They are listed here by path,
not imported, so a session pays only for the rules it needs.

| Rule                             | Loads for                     |
| -------------------------------- | ----------------------------- |
| `.claude/rules/naming.md`        | always                        |
| `.claude/rules/security.md`      | always                        |
| `.claude/rules/code-style.md`    | `**/*.ts`                     |
| `.claude/rules/clean-code.md`    | `src/**/*.ts`                 |
| `.claude/rules/commands.md`      | `src/commands/*.ts`           |
| `.claude/rules/lib.md`           | `src/lib/*.ts`                |
| `.claude/rules/utils.md`         | `src/utils/*.ts`              |
| `.claude/rules/testing.md`       | `tests/**/*.test.ts`          |
| `.claude/rules/documentation.md` | `src/**/*.ts`, `docs/**/*.md` |

Read on demand:

- `.claude/guides/architecture.md`: folder structure, data flow, design patterns, extension
  points.
- `.claude/guides/development.md`: setup, debugging and common ESM gotchas.
- `.claude/guides/git-workflow.md`: branching, commit format, PR and release process.
- `.claude/maintenance/codebase-map.md`: file inventory, sizes and technical debt. Update it
  when you add a source file.
