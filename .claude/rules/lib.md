---
paths:
    - "src/lib/*.ts"
---

# Library Module Rules

**Last Updated**: 2026-05-11

These rules apply to all library modules in `src/lib/` directory.

---

## Library Responsibilities

Library modules are **IMPLEMENTERS** - they implement specific domain logic with single responsibility.

### What Library Modules DO:

- Implement domain-specific logic (git operations, message building, prompts)
- Handle their specific concerns completely
- Export focused, reusable functions
- Handle errors explicitly within their domain
- Provide clear, well-typed interfaces

### What Library Modules DON'T DO:

- Orchestrate workflows (that's commands)
- Know about other lib modules' internals
- Handle CLI argument parsing
- Provide user-facing feedback (commands do this)

---

## Current Library Modules

### commitlint-sync.ts (191 lines) - Commitlint Config Sync

**Purpose**: Detect existing commitlint config files and sync MerlinConfig rules into them

**Exports**:

```typescript
export type DetectedCommitlintConfig = { filePath: string; format: CommitlintConfigFormat };
export type SyncResult = { success: boolean; filePath: string; appliedRuleNames: string[]; manualInstructions?: string };
export async function detectCommitlintConfig(repoRoot: string): Promise<DetectedCommitlintConfig | null>;
export function buildSyncRules(config: Required<MerlinConfig>): CommitlintRules;
export async function syncToCommitlintConfig(config: Required<MerlinConfig>, repoRoot: string): Promise<SyncResult>;
```

**Pattern**: Detects commitlint config format (JS/TS/JSON/YAML), builds rules from MerlinConfig, writes back with format preservation. Returns `manualInstructions` when auto-write is not possible (e.g. dynamic JS configs).

### config-loader.ts (213 lines) - Configuration I/O

**Purpose**: Load, save, merge, and reset user and project configuration

**Exports**:

```typescript
export function loadUserConfig(): Partial<MerlinConfig>;
export function loadProjectConfig(repoRoot: string): Partial<MerlinConfig>;
export function loadConfig(repoRoot?: string | null): Required<MerlinConfig>;
export function saveConfig(config: Partial<MerlinConfig>): void;
export function resetConfig(): void;
export function saveProjectConfig(config: Partial<MerlinConfig>, repoRoot: string): void;
export function removeProjectConfigField(
    field: keyof MerlinConfig,
    repoRoot: string
): void;
export function resetProjectConfig(repoRoot: string): void;
export function getMessages(repoRoot?: string | null): ThemeMessages;
```

**Pattern**: File I/O with 3-tier config merging (defaults < user < project) and validation. Uses `validateConfig()` from utils/config.ts for input sanitization. VS16 emoji spacing normalized via `normalizeThemeStrings()` using `lib/terminal.ts`. Custom themes are merged over their base via `mergeThemeMessages()` from `utils/theme.ts`.

### git.ts (345 lines) - Git Operations

**Purpose**: All git command execution via execa

**Exports**:

```typescript
export async function isGitRepo(): Promise<boolean>;
export async function hasStagedChanges(): Promise<boolean>;
export async function getUnstagedFiles(): Promise<string[]>;
export async function addFiles(files: string[]): Promise<void>;
export async function commit(message: string, noVerify?: boolean): Promise<string>;
export async function amendCommit(message: string, noVerify?: boolean): Promise<string>;
export async function getGitDirectory(): Promise<string>;
export async function getRepoRoot(): Promise<string | null>;
export type StagedFile = { status: "modified" | "new file" | "deleted" | "renamed" | "copied" | "typechange"; path: string };
export async function getStagedFilesWithStatus(): Promise<StagedFile[]>;
export type StagingCandidate = { path: string; status: "modified" | "deleted" | "untracked" | "renamed" | "copied" };
export async function getStagingCandidates(): Promise<StagingCandidate[]>;
```

**Pattern**: Each function does ONE git operation safely

### message.ts (130 lines) - Commit Message Building

**Purpose**: Format and preview commit messages

**Exports**:

```typescript
export function buildCommitMessage(answers: CommitAnswers): string;
export function formatPreview(message: string): string;
```

**Pattern**: Pure string transformations

### prompt.ts (223 lines) - Interactive Prompts

**Purpose**: Gather user input using @inquirer/prompts with dependency injection

**Exports**:

```typescript
export type PromptDependencies = {
    config: Required<MerlinConfig>;
    messages: ThemeMessages;
    getStagedFiles: () => Promise<StagedFile[]>;
    editBody: (context: CommitEditorContext) => string;
    editBreaking: () => string;
    editIssues: () => string;
};
export async function promptUser(deps: PromptDependencies): Promise<CommitAnswers>;
export async function promptFileSelection(candidates: StagingCandidate[], promptMessage: string): Promise<string[]>;
```

**Pattern**: Single entry point with injected dependencies for testability. `promptFileSelection` is a standalone function for interactive staging candidate selection used by the auto-add flow.

### setup.ts (270 lines) - Project Setup

**Purpose**: Initialize husky, commitlint, git alias, and project config

**Exports**:

```typescript
export const INIT_DEPENDENCIES: string[];
export async function hasPackageJson(): Promise<boolean>;
export async function detectExistingSetup(): Promise<DetectedSetup>;
export async function isPackageInstalled(packageName: string): Promise<boolean>;
export async function installDependencies(deps: string[]): Promise<void>;
export async function initializeHusky(): Promise<void>;
export async function createCommitMsgHook(): Promise<void>;
export async function createCommitlintConfig(): Promise<void>;
export async function checkGitAlias(): Promise<string | null>;
export async function setupGitAlias(scope: "global" | "local"): Promise<void>;
export async function createProjectConfig(): Promise<void>;
```

**Pattern**: Setup operations with detection and verification

### editor-wrapper.ts (256 lines) - External Editor Integration

**Purpose**: Launch external editor for long-form input using COMMIT_EDITMSG

**Exports**:

```typescript
export function validateEditorAvailable(editorCommand: string): boolean;
export type CommitEditorContext = {
    type: string;
    scope?: string;
    subject: string;
    stagedFiles: StagedFile[];
};
export function buildBreakingChangeTemplate(): string;
export function buildIssueReferenceTemplate(): string;
export async function editWithCommitEditMsg(
    template: string,
    editorCommand: string,
    gitDir: string
): Promise<string>;
export async function editWithGitCommitMessage(
    context: CommitEditorContext,
    editorCommand: string,
    gitDir: string
): Promise<string>;
```

**Pattern**: All editor fields write to `.git/COMMIT_EDITMSG`, strip comment lines on read-back

### sigint.ts (29 lines) - Signal Handling

**Purpose**: Graceful Ctrl+C exit

**Exports**:

```typescript
export function setupSigintHandler(
    messages: ThemeMessages,
    onExit?: () => void
): () => void;
```

**Pattern**: Process signal management, returns cleanup function

### terminal.ts (63 lines) - Terminal Detection

**Purpose**: Runtime terminal detection for VS16 emoji width normalization

**Exports**:

```typescript
export function isWideEmojiTerminal(): boolean;
export function normalizeEmojiSpacing(text: string): string;
export function resetTerminalCache(): void;
```

**Pattern**: Cached detection with lazy initialization. Detects whether the terminal renders VS16 (U+FE0F) emojis as 2 columns wide (modern terminals) or 1 column (VS Code/xterm.js). Used by `config-loader.ts` to normalize theme message spacing.

### transformers.ts (91 lines) - Inquirer Transformers

**Purpose**: Real-time input transformation for prompts

**Exports**:

```typescript
export type Transformer = (value: string, options: { isFinal: boolean }) => string;
export function createCharacterCounterTransformer(maxLength: number): Transformer;
export function createOptionalCharacterCounterTransformer(maxLength: number): Transformer;
```

**Pattern**: Factory functions returning Inquirer-compatible transformers

---

## Module Design Principles

### Single Responsibility

Each module has ONE domain:

```typescript
// GOOD - git.ts only does git operations
export async function commit(message: string): Promise<CommitResult> {
    await execa("git", ["commit", "-m", message]);
}

// BAD - git.ts shouldn't build messages
export async function commit(answers: CommitAnswers): Promise<CommitResult> {
    const message = `${answers.type}: ${answers.subject}`; // Wrong layer!
    await execa("git", ["commit", "-m", message]);
}
```

### Explicit Error Handling

Handle errors within the module's domain:

```typescript
// GOOD - git.ts handles git-specific errors
export async function commit(message: string): Promise<CommitResult> {
    try {
        const result = await execa("git", ["commit", "-m", message]);
        return {
            success: true,
            hash: parseCommitHash(result.stdout),
            message,
        };
    } catch (error) {
        if (error.exitCode === 1 && error.stderr.includes("nothing to commit")) {
            throw new Error("No changes to commit");
        }
        throw new Error(`Git commit failed: ${error.message}`);
    }
}

// BAD - silently swallowing errors
export async function commit(message: string): Promise<CommitResult | null> {
    try {
        const result = await execa("git", ["commit", "-m", message]);
        return { success: true, hash: parseCommitHash(result.stdout) };
    } catch {
        return null; // Caller doesn't know what went wrong!
    }
}
```

### Pure Functions When Possible

Prefer pure functions (no side effects, same input = same output):

```typescript
// GOOD - pure function in message.ts
export function buildCommitMessage(answers: CommitAnswers): string {
    const scope = answers.scope ? `(${answers.scope})` : '';
    return `${answers.type}${scope}: ${answers.subject}`;
}

// BAD - side effects
export function buildCommitMessage(answers: CommitAnswers): string {
    console.log('Building message...'); // Side effect!
    globalState.lastMessage = ...;      // Side effect!
    return message;
}
```

### Dependency Injection

Don't hard-code dependencies:

```typescript
// GOOD - dependency injected
export async function commit(
    message: string,
    options: CommitOptions,
    executor: GitExecutor = execa
): Promise<CommitResult> {
    await executor("git", ["commit", "-m", message]);
}

// ACCEPTABLE - default to execa but testable
export async function commit(
    message: string,
    options: CommitOptions
): Promise<CommitResult> {
    await execa("git", ["commit", "-m", message]);
}
```

---

## Function Signatures

### Type Everything

```typescript
// GOOD - fully typed
export async function commit(
    message: string,
    options: CommitOptions
): Promise<CommitResult> {
    // ...
}

// BAD - any or missing types
export async function commit(message: any, options?: any): Promise<any> {
    // ...
}
```

### Use Specific Return Types

```typescript
// GOOD - specific result type
type CommitResult = {
    success: boolean;
    hash: string;
    message: string;
};

export async function commit(message: string): Promise<CommitResult> {
    // ...
}

// BAD - generic object
export async function commit(message: string): Promise<object> {
    // ...
}
```

### Options as Single Object

```typescript
// GOOD - options object
type CommitOptions = {
    noVerify?: boolean;
    amend?: boolean;
    signoff?: boolean;
};

export async function commit(
    message: string,
    options: CommitOptions = {}
): Promise<CommitResult> {
    // ...
}

// BAD - many boolean parameters
export async function commit(
    message: string,
    noVerify?: boolean,
    amend?: boolean,
    signoff?: boolean
): Promise<CommitResult> {
    // Hard to read at call site!
}
```

---

## Testing Library Modules

Test the domain logic, mock external dependencies:

```typescript
describe("buildCommitMessage", () => {
    it("should format message with scope", () => {
        const answers: CommitAnswers = {
            type: "feat",
            scope: "api",
            subject: "add endpoint",
        };

        const message = buildCommitMessage(answers);

        expect(message).toBe("feat(api): add endpoint");
    });
});

describe("commit", () => {
    it("should call git with correct args", async () => {
        vi.mock("execa");
        const mockExeca = vi.mocked(execa);
        mockExeca.mockResolvedValue({
            stdout: "abc123 feat: test",
            stderr: "",
            exitCode: 0,
        } as any);

        await commit("feat: test", {});

        expect(mockExeca).toHaveBeenCalledWith("git", ["commit", "-m", "feat: test"]);
    });
});
```

---

## Module Structure Template

````typescript
// src/lib/module-name.ts

import /* dependencies */ "...";
import type {} from /* types */ "../types";

/**
 * Brief description of module's purpose.
 */

// Constants specific to this module
const MODULE_CONSTANT = "value";

/**
 * Main exported function.
 *
 * @param param - Parameter description
 * @returns Return value description
 * @throws {ErrorType} When error condition
 *
 * @example
 * ```typescript
 * const result = await functionName('input');
 * ```
 */
export async function mainFunction(param: string): Promise<ReturnType> {
    // Input validation
    if (!param) {
        throw new Error("Parameter required");
    }

    // Implementation
    try {
        const result = await doWork(param);
        return result;
    } catch (error) {
        // Handle domain-specific errors
        throw new Error(`Operation failed: ${error.message}`);
    }
}

/**
 * Helper function (not exported).
 */
function helperFunction(input: string): string {
    // Helper logic
    return input.trim();
}

// Export types specific to this module
export type ReturnType = {
    field: string;
};
````

---

## Anti-Patterns to Avoid

### ❌ Mixing Concerns

```typescript
// BAD - git.ts shouldn't know about prompts
export async function commitInteractive(): Promise<void> {
    const answers = await promptUser(); // Wrong layer!
    const message = buildCommitMessage(answers); // Wrong layer!
    await execa("git", ["commit", "-m", message]);
}

// GOOD - git.ts only does git
export async function commit(message: string): Promise<CommitResult> {
    await execa("git", ["commit", "-m", message]);
}
```

### ❌ Global State

```typescript
// BAD - module-level mutable state
let lastCommit: CommitResult | null = null;

export async function commit(message: string): Promise<CommitResult> {
    const result = await execa("git", ["commit", "-m", message]);
    lastCommit = result; // Mutation!
    return result;
}

// GOOD - return everything needed
export async function commit(message: string): Promise<CommitResult> {
    const result = await execa("git", ["commit", "-m", message]);
    return {
        success: true,
        hash: parseCommitHash(result.stdout),
        message,
    };
}
```

### ❌ Tight Coupling

```typescript
// BAD - message.ts directly imports git.ts
import { getCurrentBranch } from "./git";

export function buildCommitMessage(answers: CommitAnswers): string {
    const branch = await getCurrentBranch(); // Tight coupling!
    return `[${branch}] ${answers.type}: ${answers.subject}`;
}

// GOOD - accept branch as parameter
export function buildCommitMessage(answers: CommitAnswers, branch?: string): string {
    const prefix = branch ? `[${branch}] ` : "";
    return `${prefix}${answers.type}: ${answers.subject}`;
}
```

---

## Adding New Library Modules

When adding a new module:

1. **Identify the domain** - what ONE thing does this module do?
2. **Define the interface** - what functions will it export?
3. **Design for testing** - can you test without mocking everything?
4. **Follow the pattern** - pure functions when possible, explicit error handling
5. **Document with JSDoc** - explain purpose, parameters, return values
6. **Add tests** - test domain logic thoroughly

Example:

```typescript
// src/lib/new-module.ts

/**
 * Module description - what domain does this handle?
 */

import type { InputType, OutputType } from "../types";

/**
 * Main function description.
 *
 * @param input - Input description
 * @returns Output description
 * @throws {Error} When condition
 */
export async function mainFunction(input: InputType): Promise<OutputType> {
    // Validate input
    if (!isValid(input)) {
        throw new Error("Invalid input");
    }

    // Implement domain logic
    const result = await process(input);

    // Return result
    return result;
}

// Helper functions (not exported)
function isValid(input: InputType): boolean {
    // Validation logic
    return true;
}

async function process(input: InputType): Promise<OutputType> {
    // Processing logic
    return {} as OutputType;
}
```

---

## Module Dependencies

**Allowed**:

- lib → types (type imports only)
- lib → utils (for validation, formatting)
- lib → external packages (execa, @inquirer/prompts, etc.)

**Not Allowed**:

- lib → commands (library shouldn't know about orchestration)
- lib → lib (minimize cross-dependencies)
- lib → cli (library shouldn't know about CLI)

**If you need cross-module functionality**: Either extract to utils, or accept as parameter.

---

## Resources

- .claude/guides/architecture.md - Full architecture overview
- .claude/rules/commands.md - Command layer rules
- .claude/rules/utils.md - Utility function rules
- .claude/rules/testing.md - Testing guidelines
