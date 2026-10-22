# Architecture Guide

**Last Updated**: 2026-05-11

Complete architecture documentation for merlin-commit, including folder structure, data flow, module relationships, and design patterns.

---

## Table of Contents

- [Folder Structure](#folder-structure)
- [Module Organization](#module-organization)
- [Data Flow Architecture](#data-flow-architecture)
- [Module Relationships](#module-relationships)
- [Design Patterns](#design-patterns)
- [Tech Stack](#tech-stack)

---

## Folder Structure

```
merlin-commit/
├── .github/                        # GitHub configuration
│   ├── ISSUE_TEMPLATE/             # Bug report and feature request templates
│   └── pull_request_template.md    # PR template
├── .husky/                         # Git hooks (pre-commit, commit-msg)
├── bin/
│   └── merlin.js                   # CLI entry point (shebang wrapper)
├── src/
│   ├── cli.ts                      # Commander.js program setup
│   ├── commands/                   # Orchestration layer
│   │   ├── commit.ts               # Default commit workflow command
│   │   ├── config.ts               # Configuration management command
│   │   └── init.ts                 # Project initialization wizard
│   ├── lib/                        # Implementation layer
│   │   ├── commitlint-sync.ts      # Commitlint config detection and sync
│   │   ├── config-loader.ts        # Config loading, saving, theme resolution
│   │   ├── editor-wrapper.ts       # External editor integration
│   │   ├── git.ts                  # Git operations via execa
│   │   ├── message.ts              # Commit message building and preview
│   │   ├── prompt.ts               # Interactive prompts via @inquirer/prompts
│   │   ├── setup.ts                # Project setup utilities (husky, commitlint)
│   │   ├── sigint.ts               # Graceful SIGINT/Ctrl+C handling
│   │   ├── terminal.ts             # VS16 emoji width normalization
│   │   └── transformers.ts         # Inquirer input transformers (char counters)
│   ├── types/                      # Type definitions
│   │   ├── commit.ts               # CommitType, CommitAnswers, CommitOptions
│   │   ├── config.ts               # MerlinConfig, ConfigOptions, ConfigMenuAction
│   │   ├── theme.ts                # ThemeMessages
│   │   ├── common.ts               # Validator
│   │   ├── init.ts                 # InitOptions
│   │   └── index.ts                # Barrel re-exports
│   └── utils/                      # Pure helpers
│       ├── config.ts               # Config validation (pure function)
│       ├── constants.ts            # Themes, commit types, and defaults
│       ├── theme.ts                # Custom theme resolve/validate/merge helpers
│       └── validators.ts           # Inquirer input validators (range, etc.)
├── tests/
│   └── unit/                       # Unit tests (80% coverage target)
│       ├── cli.test.ts             # CLI setup tests
│       ├── commit-command.test.ts  # Command orchestration tests
│       ├── commitlint-sync.test.ts # Commitlint sync tests
│       ├── config.test.ts          # Config validation tests
│       ├── config-command.test.ts  # Config command tests
│       ├── config-loader.test.ts   # Config loader tests
│       ├── constants.test.ts       # Constants tests
│       ├── editor-wrapper.test.ts  # Editor wrapper tests
│       ├── git.test.ts             # Git operations tests
│       ├── init-command.test.ts    # Init command tests
│       ├── message.test.ts         # Message building tests
│       ├── prompt.test.ts          # Prompt tests
│       ├── setup.test.ts           # Setup utilities tests
│       ├── sigint.test.ts          # Signal handling tests
│       ├── terminal.test.ts        # Terminal detection tests
│       ├── theme.test.ts           # Custom theme helper tests
│       ├── transformers.test.ts    # Input transformer tests
│       └── validators.test.ts      # Validator tests
├── dist/                           # Compiled output (git-ignored)
├── Configuration Files
│   ├── package.json                # npm package configuration
│   ├── tsconfig.json               # TypeScript configuration
│   ├── tsconfig.base.json          # Shared TypeScript base config
│   ├── vitest.config.ts            # Vitest testing configuration
│   ├── eslint.config.mjs           # ESLint flat config
│   ├── .prettierrc                 # Prettier formatting config
│   └── commitlint.config.js        # Conventional commit linting
├── docs/                           # User docs: getting-started, usage, reference, guides, development
│   └── GLOSSARY.md                 # Wizard theme vocabulary glossary
└── Documentation
    ├── AGENTS.md                   # Tool-agnostic agent guidance (source of truth)
    ├── CLAUDE.md                   # Imports AGENTS.md, indexes Claude Code rules
    ├── .claude/                    # Claude Code layer
    │   ├── settings.json           # Shared agent permissions
    │   ├── rules/                  # Path-scoped rules
    │   ├── guides/                 # Reference documentation
    │   └── maintenance/            # Codebase map
    ├── CHANGELOG.md                # Release notes
    └── CODE_OF_CONDUCT.md          # Community guidelines
```

---

## Module Organization

### Three-Layer Architecture

Merlin-commit follows a **three-layer architecture** pattern:

```
┌─────────────────────────────────────┐
│        Commands Layer               │  ← Orchestration
│  (src/commands/*.ts)                │
│  - commit.ts                        │
│  - config.ts                        │
│  - init.ts                          │
└──────────────┬──────────────────────┘
               │ delegates to
               ↓
┌─────────────────────────────────────┐
│        Library Layer                │  ← Implementation
│  (src/lib/*.ts)                     │
│  - commitlint-sync.ts (lint sync)   │
│  - config-loader.ts (config I/O)    │
│  - git.ts (git operations)          │
│  - message.ts (formatting)          │
│  - prompt.ts (user input)           │
│  - setup.ts (initialization)        │
│  - editor-wrapper.ts (editing)      │
│  - sigint.ts (signal handling)      │
│  - terminal.ts (emoji normalization)│
│  - transformers.ts (UI helpers)     │
└──────────────┬──────────────────────┘
               │ uses
               ↓
┌─────────────────────────────────────┐
│        Utilities Layer              │  ← Pure Helpers
│  (src/utils/*.ts)                   │
│  - config.ts (config validation)    │
│  - constants.ts (data)              │
│  - theme.ts (custom themes)         │
│  - validators.ts (validation)       │
└─────────────────────────────────────┘
```

### Layer Responsibilities

| Layer         | Responsibility                                                     | Examples                                              |
| ------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| **Commands**  | Orchestrate workflows, coordinate modules, handle user interaction | `commitCommand()`, `configCommand()`, `initCommand()` |
| **Library**   | Implement domain logic, single-purpose modules                     | `commit()`, `buildCommitMessage()`, `promptUser()`    |
| **Utilities** | Pure functions, stateless helpers, shared logic                    | `validateConfig()`, `DEFAULT_CONFIG`, `COMMIT_TYPES`  |

---

## Data Flow Architecture

### Commit Workflow Data Flow

```
User runs `merlin` command
         ↓
    cli.ts parses arguments
         ↓
    commands/commit.ts (orchestrator)
         ↓
┌────────────────────────────────────────┐
│ 1. Validate preconditions              │
│    - isGitRepo() → lib/git.ts          │
│    - hasStagedChanges() → lib/git.ts   │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 2. Gather user input                   │
│    - promptUser() → lib/prompt.ts      │
│      → Returns CommitAnswers           │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 3. Build commit message                │
│    - buildCommitMessage() → lib/message│
│      → Returns formatted string        │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 4. Preview and confirm                 │
│    - formatPreview() → lib/message     │
│    - confirm() → @inquirer/prompts     │
└────────────┬───────────────────────────┘
             ↓
┌────────────────────────────────────────┐
│ 5. Create commit                       │
│    - commit() → lib/git.ts             │
│      → Returns CommitResult            │
└────────────┬───────────────────────────┘
             ↓
    Display success message
         ↓
    Exit with code 0
```

### Key Data Types

```typescript
// User input collected from prompts
type CommitAnswers = {
    type: string; // feat, fix, docs, etc.
    scope?: string; // Affected area
    subject: string; // Short description
    body?: string; // Detailed explanation
    breaking?: string; // Breaking changes
    issues?: string; // Issue references
};

// Configuration loaded from ~/.merlinrc.json
type MerlinConfig = {
    types?: CommitType[];
    maxSubjectLength?: number;
    maxScopeLength?: number;
    editor?: string;
    autoAdd?: boolean;
    theme?: "wizard" | "standard" | "custom";
    customTheme?: CustomThemeConfig; // { extends, messages }
    showCharacterCounter?: boolean;
};

// Result from git operations
type CommitResult = {
    success: boolean;
    hash: string;
    message: string;
};

// Commit type definition
type CommitType = {
    value: string; // "feat", "fix", etc.
    name: string; // Display name with emoji
    description: string; // Usage explanation
    emoji: string; // Icon representation
};
```

---

## Module Relationships

### Dependency Graph

```
┌─────────┐
│  cli.ts │
└────┬────┘
     │ imports
     ↓
┌─────────────────────────────────┐
│  commands/                      │
│  ├─ commit.ts                   │
│  ├─ config.ts                   │
│  └─ init.ts                     │
└────┬─────────┬──────────────────┘
     │         │
     │         └────────────┐
     ↓                      ↓
┌──────────────┐     ┌──────────────┐
│  lib/        │     │  utils/      │
│  ├─ cl-sync  │     │  ├─ config   │
│  ├─ cfg-load │     │  ├─ constants│
│  ├─ git      │     │  └─ validator│
│  ├─ message  │     └──────────────┘
│  ├─ prompt   │            ↑
│  ├─ setup    │            │
│  ├─ editor   │            │
│  ├─ sigint   │            │
│  ├─ terminal │            │
│  └─ transf.  │────────────┘
└──────────────┘

External Dependencies:
- execa (git operations)
- @inquirer/prompts (user input)
- chalk (colors)
- ora (spinners)
- commander (CLI)
```

### Allowed Dependencies

```
✅ commands → lib
✅ commands → utils
✅ commands → types
✅ lib → utils
✅ lib → types
✅ lib → external packages
✅ utils → types

❌ lib → commands (library shouldn't know about orchestration)
❌ utils → commands (utils shouldn't know about orchestration)
❌ utils → lib (utils should be pure/independent)
```

---

## Design Patterns

### 1. Command Pattern (Orchestration)

Commands are stateless functions that coordinate workflows:

```typescript
// Pattern: Validate → Gather → Process → Confirm → Execute
export async function commitCommand(options: CommitOptions): Promise<void> {
    await validate();
    const input = await gather();
    const processed = process(input);
    const confirmed = await confirm(processed);
    if (confirmed) await execute(processed, options);
}
```

### 2. Delegation Pattern

Commands delegate to specialized modules:

```typescript
// Command delegates, doesn't implement
export async function commitCommand(options: CommitOptions): Promise<void> {
    const isRepo = await isGitRepo(); // Delegates to lib/git.ts
    const answers = await promptUser(); // Delegates to lib/prompt.ts
    const message = buildCommitMessage(answers); // Delegates to lib/message.ts
    await commit(message, options); // Delegates to lib/git.ts
}
```

### 3. Pure Function Pattern (Utilities)

Utils are pure, stateless, deterministic. Validators use a factory pattern:

```typescript
// Pure factory function - returns an Inquirer-compatible validator
export function createMaxLengthValidator(
    maxLength: number,
    fieldName?: string
): Validator {
    return (value: string) => {
        if (value.length > maxLength) {
            return `${fieldName ?? "Value"} exceeds ${maxLength} characters`;
        }
        return true;
    };
}
```

### 4. Dependency Injection Pattern

Functions accept dependencies as parameters:

```typescript
// git.ts can accept custom executor for testing
export async function commit(
    message: string,
    options: CommitOptions,
    executor: typeof execa = execa
): Promise<CommitResult> {
    await executor("git", ["commit", "-m", message]);
}
```

### 5. Error Handling Pattern

Explicit error handling at appropriate layers:

```typescript
// Library layer handles domain errors
export async function commit(message: string): Promise<CommitResult> {
    try {
        const result = await execa("git", ["commit", "-m", message]);
        return { success: true, hash: parseHash(result.stdout) };
    } catch (error) {
        if (error.stderr.includes("nothing to commit")) {
            throw new Error("No changes to commit");
        }
        throw new Error(`Git commit failed: ${error.message}`);
    }
}

// Command layer handles orchestration errors
export async function commitCommand(options: CommitOptions): Promise<void> {
    try {
        await commit(message, options);
        console.log("✓ Commit created successfully");
    } catch (error) {
        console.error("Failed to create commit:", error.message);
        process.exit(1);
    }
}
```

### 6. Theme Pattern

Messages are theme-aware and organized into domain sub-groups:

```typescript
// ThemeMessages is structured by command domain with cross-cutting categories
type ThemeMessages = {
    commit: { intro, exit, dryRunExit, previewHeader };
    config: { intro, exit, ... };
    init: { intro, exit, ... };
    prompts: { selectType, enterScope, enterSubject, ... };
    errors: { commit: { notGitRepo, ... }, config: { ... }, init: { ... } };
    warnings: { commit: { ... }, config: { ... } };
    success: { commit: { ... }, config: { ... }, init: { ... } };
    tips: { commit: { ... }, init: { ... } };
};

// utils/constants.ts defines two complete message sets
export const WIZARD_MESSAGES: ThemeMessages = { /* wizard-themed text */ };
export const STANDARD_MESSAGES: ThemeMessages = { /* plain text */ };

// lib/config-loader.ts resolves messages with VS16 emoji normalization
export function getMessages(repoRoot?: string | null): ThemeMessages {
    const config = loadConfig(repoRoot);
    if (config.theme !== "wizard") return STANDARD_MESSAGES;
    return normalizeThemeStrings(WIZARD_MESSAGES);
}
```

---

## Tech Stack

### Core Dependencies

| Package               | Version   | Purpose                   |
| --------------------- | --------- | ------------------------- |
| **TypeScript**        | 5.7+      | Language                  |
| **Node.js**           | >=22.13.0 | Runtime                   |
| **Commander.js**      | ^14.0.2   | CLI framework             |
| **@inquirer/prompts** | ^8.2.0    | Interactive prompts       |
| **execa**             | ^9.6.1    | Safe subprocess execution |
| **chalk**             | ^5.6.2    | Terminal colors           |
| **ora**               | ^9.0.0    | Loading spinners          |

### Dev Dependencies

| Package        | Purpose                |
| -------------- | ---------------------- |
| **Vitest**     | Testing framework      |
| **ESLint**     | Code linting           |
| **Prettier**   | Code formatting        |
| **Commitlint** | Commit message linting |
| **Husky**      | Git hooks              |

### Why These Choices?

**execa over child_process**:

- Promise-based API
- Better error handling
- Args array prevents injection

**@inquirer/prompts over inquirer**:

- Modular, tree-shakeable
- Modern Promise API
- Better TypeScript support

**Commander.js over yargs**:

- Simpler API
- Better for command-based CLIs
- Smaller bundle size

---

## Module File Size Guidelines

| Category    | Target Size | Current                                                                                 |
| ----------- | ----------- | --------------------------------------------------------------------------------------- |
| Commands    | < 150 lines | commit: 176, config: 922, init: 410                                                     |
| Lib modules | < 300 lines | git: 345, editor: 256, setup: 270, prompt: 223, cfg-ld: 213, cl-sync: 191, terminal: 63 |
| Utils       | < 200 lines | config: 68, validators: 115, theme: 205, constants: 359                                 |

---

## Code Statistics

| Category      | Files | Total Lines |
| ------------- | ----- | ----------- |
| Source code   | 24    | ~4,863      |
| Test files    | 18    | ~7,152      |
| Config files  | 9     | -           |
| Documentation | 17    | -           |

---

## Key Architectural Decisions

### 1. **ES Modules Only**

- No CommonJS (`require`)
- Use `import/export`
- Target: ES2022

### 2. **TypeScript Strict Mode**

- `noUnusedLocals`: true
- `noUnusedParameters`: true
- `strict`: true

### 3. **Offline-First**

- No network calls
- No telemetry
- Privacy-focused

### 4. **Convention Over Configuration**

- Sensible defaults
- Optional configuration
- Works zero-config

### 5. **Safety First**

- execa args array (not string interpolation)
- Config validation
- No eval()
- Fixed file paths

---

## Extension Points

### Adding New Commands

1. Create `src/commands/new-command.ts`
2. Follow orchestration pattern
3. Register in `src/cli.ts`
4. Add tests in `tests/unit/new-command-command.test.ts`

### Adding New Commit Types

1. Update `COMMIT_TYPES` in `utils/constants.ts`
2. No code changes needed (data-driven)

### Adding New Themes

1. Add new message set in `utils/constants.ts`
2. Update `BaseThemeName` in `types/theme.ts`
3. Update `getMessages()` in `lib/config-loader.ts`

Users can also build custom themes without code changes via `theme: "custom"` and
`customTheme` in `.merlinrc.json` (see `utils/theme.ts`). Adding a template
function to `ThemeMessages` requires an entry in `TEMPLATE_PARAMETER_NAMES`.

---

## Resources

- .claude/rules/commands.md - Command layer rules
- .claude/rules/lib.md - Library module rules
- .claude/rules/utils.md - Utility function rules
- .claude/guides/git-workflow.md - Git workflow
- .claude/guides/development.md - Development setup
