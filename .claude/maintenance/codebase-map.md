# Codebase Map

**Last Updated**: 2026-05-17

File inventory with ownership and last-updated tracking for merlin-commit.

---

## Purpose

This file tracks all source files, their responsibilities, sizes, and maintenance status. Use this to:

- Identify owners for specific modules
- Track when files were last significantly changed
- Plan refactoring efforts
- Onboard new contributors

---

## Source Files Inventory

### Commands (src/commands/)

| File      | Lines | Purpose                                   | Last Major Change | Owner/Contact |
| --------- | ----- | ----------------------------------------- | ----------------- | ------------- |
| commit.ts | 176   | Interactive commit workflow orchestration | 2026-05-11        | Core team     |
| config.ts | 922   | User and project configuration management | 2026-05-11        | Core team     |
| init.ts   | 410   | Project initialization wizard             | 2026-03-21        | Core team     |

**Total**: 3 files, ~1,508 lines

### Library Modules (src/lib/)

| File               | Lines | Purpose                                     | Last Major Change | Owner/Contact |
| ------------------ | ----- | ------------------------------------------- | ----------------- | ------------- |
| commitlint-sync.ts | 191   | Commitlint config detection and sync        | 2026-05-11        | Core team     |
| config-loader.ts   | 213   | Config loading, saving, theme resolution    | 2026-04-19        | Core team     |
| editor-wrapper.ts  | 256   | External editor integration                 | 2026-03-21        | Core team     |
| git.ts             | 345   | Git operations via execa                    | 2026-05-11        | Core team     |
| message.ts         | 130   | Commit message building and preview         | 2026-03-08        | Core team     |
| prompt.ts          | 223   | Interactive prompts via @inquirer/prompts   | 2026-05-11        | Core team     |
| setup.ts           | 270   | Project setup utilities (husky, commitlint) | 2026-04-19        | Core team     |
| sigint.ts          | 29    | Graceful SIGINT/Ctrl+C handling             | 2026-03-08        | Core team     |
| terminal.ts        | 63    | VS16 emoji width normalization              | 2026-05-11        | Core team     |
| transformers.ts    | 91    | Inquirer input transformers                 | 2026-03-21        | Core team     |

**Total**: 10 files, ~1,709 lines

### Utilities (src/utils/)

| File          | Lines | Purpose                                     | Last Major Change | Owner/Contact |
| ------------- | ----- | ------------------------------------------- | ----------------- | ------------- |
| config.ts     | 68    | Config validation (pure)                    | 2026-05-11        | Core team     |
| constants.ts  | 359   | Themes, commit types, defaults              | 2026-10-18        | Core team     |
| theme.ts      | 205   | Custom theme resolve/validate/merge helpers | 2026-10-18        | Core team     |
| validators.ts | 115   | Inquirer input validators                   | 2026-03-08        | Core team     |

**Total**: 4 files, ~747 lines

### Types (src/types/)

| File      | Lines | Purpose                                        | Last Major Change | Owner/Contact |
| --------- | ----- | ---------------------------------------------- | ----------------- | ------------- |
| commit.ts | 102   | CommitType, CommitAnswers, CommitOptions       | 2026-03-14        | Core team     |
| config.ts | 98    | MerlinConfig, ConfigOptions, ConfigurableField | 2026-05-11        | Core team     |
| theme.ts  | 354   | ThemeMessages (domain sub-grouped)             | 2026-05-11        | Core team     |
| common.ts | 5     | Validator                                      | 2026-03-14        | Core team     |
| init.ts   | 26    | InitOptions                                    | 2026-03-14        | Core team     |
| index.ts  | 10    | Barrel re-exports (incl. ConfigurableField)    | 2026-04-19        | Core team     |

**Total**: 6 files, ~595 lines

### CLI Entry

| File   | Lines | Purpose                    | Last Major Change | Owner/Contact |
| ------ | ----- | -------------------------- | ----------------- | ------------- |
| cli.ts | 59    | Commander.js program setup | 2026-05-11        | Core team     |

**Total**: 1 file, 59 lines

---

## Test Files Inventory

### Unit Tests (tests/unit/)

| File                    | Purpose                      | Last Major Change | Coverage |
| ----------------------- | ---------------------------- | ----------------- | -------- |
| cli.test.ts             | CLI setup tests              | 2026-03-08        | Good     |
| commit-command.test.ts  | Command orchestration tests  | 2026-05-11        | Good     |
| commitlint-sync.test.ts | Commitlint sync tests        | 2026-05-11        | Good     |
| config.test.ts          | Config validation tests      | 2026-03-08        | Good     |
| config-command.test.ts  | Config command tests         | 2026-04-19        | Good     |
| config-loader.test.ts   | Config loader tests          | 2026-04-19        | Good     |
| constants.test.ts       | Constants tests              | 2026-03-21        | Good     |
| editor-wrapper.test.ts  | Editor wrapper tests         | 2026-03-08        | Good     |
| git.test.ts             | Git operations tests         | 2026-03-08        | Good     |
| init-command.test.ts    | Init command tests (largest) | 2026-04-19        | Good     |
| message.test.ts         | Message building tests       | 2026-03-08        | Good     |
| prompt.test.ts          | Prompt tests                 | 2026-04-19        | Good     |
| setup.test.ts           | Setup utilities tests        | 2026-04-19        | Good     |
| sigint.test.ts          | Signal handling tests        | 2026-03-08        | Good     |
| terminal.test.ts        | Terminal detection tests     | 2026-03-21        | Good     |
| theme.test.ts           | Custom theme helper tests    | 2026-10-18        | Good     |
| transformers.test.ts    | Input transformer tests      | 2026-03-21        | Good     |
| validators.test.ts      | Validator tests              | 2026-03-08        | Good     |

**Total**: 18 files, ~7,152 lines combined

**Coverage Target**: >80% overall, 100% for utils

---

## Configuration Files

| File                 | Purpose                     | Last Major Change | Owner     |
| -------------------- | --------------------------- | ----------------- | --------- |
| package.json         | npm package configuration   | 2026-02-07        | Core team |
| tsconfig.json        | TypeScript configuration    | 2026-02-07        | Core team |
| vitest.config.ts     | Testing configuration       | 2026-02-07        | Core team |
| eslint.config.mjs    | ESLint flat config          | 2026-02-07        | Core team |
| .prettierrc          | Prettier formatting         | 2026-02-07        | Core team |
| commitlint.config.js | Conventional commit linting | 2026-02-07        | Core team |

---

## Documentation Files

| File                      | Purpose                           | Last Major Change | Owner     |
| ------------------------- | --------------------------------- | ----------------- | --------- |
| AGENTS.md                 | Tool-agnostic agent guidance      | 2026-10-22        | Core team |
| CLAUDE.md                 | Imports AGENTS.md + rule index    | 2026-10-22        | Core team |
| .claude/rules/\*.md       | Path-scoped rules (9 files)       | 2026-10-22        | Core team |
| .claude/guides/\*.md      | Reference documentation (3 files) | 2026-10-22        | Core team |
| .claude/maintenance/\*.md | This codebase map                 | 2026-10-22        | Core team |
| .claude/settings.json     | Shared agent permissions          | 2026-10-22        | Core team |
| README.md                 | Project README                    | 2026-05-17        | Core team |
| CODE_OF_CONDUCT.md        | Community guidelines              | 2026-01-XX        | Core team |

### User-Facing Documentation (docs/)

Organized into five subdirectories added in PR #76.

| Directory        | Files                                                          | Purpose                          |
| ---------------- | -------------------------------------------------------------- | -------------------------------- |
| docs/index.md    | index.md                                                       | Navigation hub by audience       |
| docs/GLOSSARY.md | GLOSSARY.md                                                    | Wizard theme vocabulary          |
| getting-started/ | installation.md, quickstart.md                                 | First-run setup and first commit |
| usage/           | commit-types.md, themes.md, editor-integration.md, auto-add.md | Feature guides                   |
| reference/       | cli-reference.md, configuration.md, config-schema.md           | Complete reference material      |
| guides/          | team-setup.md, commitlint-integration.md                       | Team rollout and integrations    |
| development/     | contributing.md, architecture.md, testing.md, releases.md      | Contributor documentation        |

**Total**: 17 doc files (16 added 2026-05-17 + GLOSSARY pre-existing)

---

## Module Size Guidelines

### Current Status

| Category    | Target      | Current Average | Status                            |
| ----------- | ----------- | --------------- | --------------------------------- |
| Commands    | < 150 lines | ~442 lines      | ⚠️ config.ts, init.ts over target |
| Lib modules | < 300 lines | ~168 lines      | ✅ All within target              |
| Utils       | < 200 lines | ~172 lines      | ✅ All within target              |

### Files Needing Attention

**Over Size Target**:

- `src/commands/config.ts` (922 lines) - Significantly over target, grew via PRs #64/#66/#67/#70/#71/#73 (project config, ThemeMessages sub-groups, back navigation, showCharacterCounter, scoped --show, syncCommitlint)
- `src/commands/init.ts` (410 lines) - Over target
- `src/utils/constants.ts` (337 lines) - Over 200-line target but acceptable (mostly data)

---

## Ownership and Responsibilities

### Core Team Responsibilities

**Commands Layer**:

- commit.ts - Commit workflow
- config.ts - Configuration
- init.ts - Project initialization

**Library Layer**:

- commitlint-sync.ts - Commitlint config detection and sync
- config-loader.ts - Config loading, saving, theme resolution
- editor-wrapper.ts - Editor integration
- git.ts - All git operations
- message.ts - Message formatting
- prompt.ts - User input
- setup.ts - Tool setup
- sigint.ts - Signal handling
- terminal.ts - VS16 emoji width normalization
- transformers.ts - UI helpers

**Utils Layer**:

- config.ts - Config validation (pure)
- constants.ts - Data definitions
- validators.ts - Input validation (factory pattern)

### External Contributors

No external maintainers currently. Open to contributions via PRs.

---

## Review Schedule

### Monthly Review

- [ ] Check for new files not in this map
- [ ] Update line counts if significant changes
- [ ] Verify ownership is still accurate
- [ ] Check for files that have grown too large

### Quarterly Review

- [ ] Full inventory review
- [ ] Update all "Last Major Change" dates
- [ ] Identify technical debt
- [ ] Plan refactoring efforts
- [ ] Archive obsolete files

### On Every Release

- [ ] Update all line counts
- [ ] Verify test coverage percentages
- [ ] Check for dead code
- [ ] Update documentation status

---

## Technical Debt Tracking

### Current Technical Debt

- `src/commands/config.ts` (922 lines) far exceeds 150-line command target - strong candidate for splitting
- `src/commands/init.ts` (410 lines) exceeds 150-line command target

### Completed Refactors

- Config file I/O moved from `utils/config.ts` to `lib/config-loader.ts` (2026-03-08) - utils layer is now purely functional

### Future Considerations

- Split large command files (config.ts, init.ts) if they grow further
- Evaluate constants.ts organization if it grows beyond 400 lines

---

## Quick Stats

| Metric              | Count      | Target |
| ------------------- | ---------- | ------ |
| Total source files  | 24         | -      |
| Total source lines  | ~4,863     | -      |
| Total test files    | 18         | -      |
| Test file lines     | ~7,152     | -      |
| Config files        | 9          | -      |
| Documentation files | 17         | -      |
| Average file size   | ~181 lines | < 300  |

---

## How to Update This File

### Adding New Files

When adding a new source file:

1. Add entry to appropriate table
2. Include: file name, lines, purpose, date, owner
3. Update totals
4. Update quick stats
5. Commit with message: `docs(maintenance): add NewFile.ts to codebase map`

### Updating Existing Files

When making major changes:

1. Update "Last Major Change" date
2. Update line count if significantly changed (+/- 20%)
3. If file grew too large, add to "Files Needing Attention"
4. Commit with message: `docs(maintenance): update codebase map for File.ts`

### Monthly Update

```bash
# Get line counts
find src -name "*.ts" -exec wc -l {} \;

# Update this file
# Commit
git add .claude/maintenance/codebase-map.md
git commit -m "docs(maintenance): monthly codebase map update"
```

---

## Last Updated

**Date**: 2026-10-22
**Updated By**: Agent layer reorganization
**Changes**: Added utils/theme.ts and theme.test.ts (custom themes, PR #122). Refreshed source and test totals. Documentation table now reflects the AGENTS.md / CLAUDE.md split, the shared settings.json and the single maintenance file.
