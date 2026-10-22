---
paths:
    - "src/commands/*.ts"
---

# Command Layer Rules

**Last Updated**: 2026-02-07

These rules apply to all command files in `src/commands/` directory.

---

## Command Responsibilities

Commands are **ORCHESTRATORS** - they coordinate workflows but don't implement domain logic.

### What Commands DO:

- Validate preconditions (is git repo? are there staged changes?)
- Coordinate the sequence of operations
- Handle conditional logic (if user confirms, if file exists, etc.)
- Manage error states and user feedback
- Delegate actual work to lib modules

### What Commands DON'T DO:

- Implement git operations (that's `lib/git.ts`)
- Build commit messages (that's `lib/message.ts`)
- Create prompts (that's `lib/prompt.ts`)
- Validate input formats (that's `utils/validators.ts`)

---

## Orchestration Pattern

A well-designed command follows this pattern:

```typescript
export async function commandName(options: CommandOptions): Promise<void> {
    // 1. Validate preconditions
    await validatePreconditions();

    // 2. Gather user input (delegate to lib/prompt.ts)
    const userInput = await gatherUserInput();

    // 3. Process data (delegate to lib modules)
    const processedData = processUserInput(userInput);

    // 4. Preview/confirm with user
    const confirmed = await confirmAction(processedData);

    // 5. Execute action (delegate to lib modules)
    if (confirmed) {
        await executeAction(processedData, options);
    }

    // 6. Provide feedback
    displayResult();
}
```

---

## Example: commit.ts

This is the ideal structure for a command:

```typescript
// src/commands/commit.ts

export async function commitCommand(options: CommitOptions): Promise<void> {
    // 1. Validate environment
    const isRepo = await isGitRepo(); // Delegates to lib/git.ts
    if (!isRepo) {
        throw new Error("Not a git repository");
    }

    // 2. Check state
    const hasStaged = await hasStagedChanges(); // Delegates to lib/git.ts
    if (!hasStaged && !options.autoAdd) {
        console.log("No staged changes. Use git add or --auto-add");
        return;
    }

    // 3. Auto-add if requested
    if (options.autoAdd) {
        await stageAllChanges(); // Delegates to lib/git.ts
    }

    // 4. Gather user input
    const answers = await promptUser(); // Delegates to lib/prompt.ts

    // 5. Build message
    const message = buildCommitMessage(answers); // Delegates to lib/message.ts

    // 6. Preview
    if (!options.dryRun) {
        const preview = formatPreview(message); // Delegates to lib/message.ts
        console.log(preview);

        // 7. Confirm
        const confirmed = await confirm({
            message: "Create this commit?",
            default: true,
        });

        if (!confirmed) {
            console.log("Commit cancelled");
            return;
        }
    }

    // 8. Execute
    if (options.dryRun) {
        console.log("Dry run - would create commit");
        return;
    }

    try {
        const result = await commit(message, options); // Delegates to lib/git.ts
        console.log(`✓ Commit created: ${result.hash.substring(0, 7)}`);
    } catch (error) {
        console.error("Failed to create commit:", error);
        throw error;
    }
}
```

---

## Command Guidelines

### Keep Commands Thin

Target: Under 150 lines per command file.

If longer, extract logic to lib modules.

### Error Handling

Commands handle errors at the orchestration level:

```typescript
try {
    await executeOperation();
} catch (error) {
    if (error instanceof SpecificError) {
        console.error("Specific error occurred:", error.message);
        // Handle gracefully
    } else {
        console.error("Unexpected error:", error);
        throw error; // Re-throw for process exit
    }
}
```

### User Feedback

Commands are responsible for user-facing messages:

```typescript
// GOOD - Clear, actionable feedback
console.log("No staged changes. Use git add to stage files.");

// BAD - Technical jargon
console.error("ERR_NO_STAGED: staging area empty");
```

### Validation

Commands validate at high level, utils validate details:

```typescript
// Command validates business rules
if (!hasStaged && !options.autoAdd) {
    throw new Error("Cannot commit without staged changes");
}

// Utils validate format/constraints
if (!validateSubjectLength(subject, maxLength)) {
    throw new Error("Subject too long");
}
```

---

## Command Structure Template

```typescript
import {} from /* dependencies */ "../lib/...";
import {} from /* types */ "../types";

/**
 * Brief description of what this command does.
 *
 * @param options - Command options
 * @throws {Error} When preconditions not met
 */
export async function commandName(options: CommandOptions): Promise<void> {
    // Step 1: Validate preconditions
    await validatePreconditions();

    // Step 2: Gather input
    const input = await gatherInput();

    // Step 3: Process
    const processed = processInput(input);

    // Step 4: Confirm
    const confirmed = await confirmAction(processed);
    if (!confirmed) {
        console.log("Action cancelled");
        return;
    }

    // Step 5: Execute
    try {
        const result = await executeAction(processed, options);
        console.log("Success:", result);
    } catch (error) {
        console.error("Failed:", error);
        throw error;
    }
}

// Helper functions for this command (if needed)
async function validatePreconditions(): Promise<void> {
    // Validation logic
}

async function gatherInput(): Promise<InputType> {
    // Delegate to lib/prompt.ts
}

function processInput(input: InputType): ProcessedType {
    // Delegate to lib modules
}

async function confirmAction(data: ProcessedType): Promise<boolean> {
    // Confirmation logic
}

async function executeAction(
    data: ProcessedType,
    options: CommandOptions
): Promise<ResultType> {
    // Delegate to lib modules
}
```

---

## Command Options

Commands accept options from CLI arguments:

```typescript
type CommitOptions = {
    dryRun?: boolean; // Preview without executing
    noVerify?: boolean; // Skip git hooks
    amend?: boolean; // Amend previous commit
    autoAdd?: boolean; // Auto-stage changes
};

export async function commitCommand(options: CommitOptions): Promise<void> {
    // Use options to control behavior
    if (options.dryRun) {
        // Preview mode
    }

    if (options.autoAdd) {
        await stageAllChanges();
    }

    // Pass options to lib modules
    await commit(message, {
        noVerify: options.noVerify,
        amend: options.amend,
    });
}
```

---

## Testing Commands

Focus on testing orchestration logic, not implementation details:

```typescript
describe("commitCommand", () => {
    beforeEach(() => {
        // Mock all lib dependencies
        vi.mock("../lib/git");
        vi.mock("../lib/prompt");
        vi.mock("../lib/message");
    });

    it("should throw error when not in git repo", async () => {
        vi.mocked(isGitRepo).mockResolvedValue(false);

        await expect(commitCommand({})).rejects.toThrow("Not a git repository");
    });

    it("should create commit when all conditions met", async () => {
        // Arrange - mock happy path
        vi.mocked(isGitRepo).mockResolvedValue(true);
        vi.mocked(hasStagedChanges).mockResolvedValue(true);
        vi.mocked(promptUser).mockResolvedValue({ type: "feat", subject: "test" });
        vi.mocked(buildCommitMessage).mockReturnValue("feat: test");
        vi.mocked(confirm).mockResolvedValue(true);
        vi.mocked(commit).mockResolvedValue({ success: true, hash: "abc123" });

        // Act
        await commitCommand({});

        // Assert - verify orchestration
        expect(commit).toHaveBeenCalledWith("feat: test", {});
    });
});
```

---

## Anti-Patterns to Avoid

### ❌ Implementing Domain Logic in Commands

```typescript
// BAD - git logic in command
export async function commitCommand(options: CommitOptions): Promise<void> {
    const args = ["commit", "-m", message];
    if (options.amend) args.push("--amend");
    await execa("git", args); // Git logic belongs in lib/git.ts!
}
```

### ❌ Complex Transformations in Commands

```typescript
// BAD - message building in command
export async function commitCommand(options: CommitOptions): Promise<void> {
    const message = answers.scope
        ? `${answers.type}(${answers.scope}): ${answers.subject}`
        : `${answers.type}: ${answers.subject}`;
    // Message building belongs in lib/message.ts!
}
```

### ❌ Validation Logic in Commands

```typescript
// BAD - validation in command
export async function commitCommand(options: CommitOptions): Promise<void> {
    if (subject.length > 72) {
        throw new Error("Subject too long");
    }
    // Validation belongs in utils/validators.ts!
}
```

---

## Current Commands

### commit.ts

- **Purpose**: Interactive commit workflow
- **Dependencies**: git.ts, message.ts, prompt.ts, sigint.ts
- **Flow**: Validate → Prompt → Build → Preview → Confirm → Commit

### config.ts

- **Purpose**: User configuration management
- **Dependencies**: config.ts (utils), constants.ts
- **Flow**: Show menu → Get selection → Update config → Save

### init.ts

- **Purpose**: Project initialization wizard
- **Dependencies**: setup.ts, git.ts
- **Flow**: Detect project → Prompt options → Setup tools → Verify

---

## Adding New Commands

When adding a new command:

1. **Define the workflow** - what steps are needed?
2. **Identify dependencies** - which lib modules to use?
3. **Follow the pattern** - validate, gather, process, confirm, execute
4. **Keep it thin** - delegate all domain logic
5. **Add tests** - test orchestration, mock dependencies
6. **Update CLI** - register command in `cli.ts`

Example:

```typescript
// src/commands/new-command.ts

export async function newCommand(options: NewCommandOptions): Promise<void> {
    // Follow the pattern
    await validatePreconditions();
    const input = await gatherInput();
    const processed = processInput(input);
    await executeAction(processed, options);
}
```

Then register in `cli.ts`:

```typescript
program
    .command("new-command")
    .description("Description of new command")
    .action(newCommand);
```

---

## Resources

- .claude/guides/architecture.md - Full architecture overview
- .claude/rules/lib.md - Library module rules
- .claude/rules/testing.md - Testing guidelines
