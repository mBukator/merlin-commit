---
paths:
    - "src/**/*.ts"
---

# Clean Code Principles

These principles apply to all source code in `src/` directory.

---

## Merlin-Commit Architectural Patterns

### Commands Layer: Orchestration

Commands coordinate workflows but don't implement domain logic.

```typescript
// src/commands/commit.ts - GOOD
export async function commitCommand(options: CommitOptions): Promise<void> {
    // 1. Validate preconditions
    const isRepo = await isGitRepo();
    if (!isRepo) throw new Error("Not a git repository");

    // 2. Gather user input
    const answers = await promptUser();

    // 3. Build message (delegates to message.ts)
    const message = buildCommitMessage(answers);

    // 4. Preview
    const preview = formatPreview(message);
    console.log(preview);

    // 5. Confirm
    const confirmed = await confirm({ message: "Create commit?" });

    // 6. Execute (delegates to git.ts)
    if (confirmed) {
        await commit(message, options);
    }
}
```

### Library Layer: Implementation

Lib modules implement specific domain logic.

```typescript
// src/lib/git.ts - GOOD
export async function commit(message: string, options: CommitOptions): Promise {
    const args = ["commit", "-m", message];
    if (options.noVerify) args.push("--no-verify");
    if (options.amend) args.push("--amend");

    const result = await execa("git", args);
    return {
        success: true,
        hash: parseCommitHash(result.stdout),
        message,
    };
}
```

### Utils Layer: Pure Functions

Utils must be pure, stateless, and reusable.

```typescript
// src/utils/validators.ts - GOOD
export function validateSubjectLength(
    subject: string,
    maxLength: number
): ValidationResult {
    if (subject.length > maxLength) {
        return {
            valid: false,
            error: `Subject exceeds ${maxLength} characters`,
        };
    }
    return { valid: true };
}
```

---

## Function Design

### Keep Functions Small

Target: Under 50 lines per function. If longer, break it down.

### Prefer Early Returns (Guard Clauses)

**ALWAYS use early returns to avoid deep nesting.** Check for error conditions or edge cases first and return immediately. This improves readability and reduces cognitive load.

**Why Early Returns?**

- Reduces nesting levels (flatter code is easier to read)
- Makes error conditions explicit and obvious
- Separates validation from main logic
- Eliminates else clauses

**BAD - Deep Nesting:**

```typescript
function processCommit(message: string, config: MerlinConfig): CommitResult {
    if (message) {
        if (message.length > 0) {
            if (message.length <= config.maxSubjectLength) {
                if (config.autoAdd) {
                    // Main logic buried 4 levels deep!
                    return createCommit(message);
                } else {
                    return { success: false, error: "Auto-add disabled" };
                }
            } else {
                return { success: false, error: "Message too long" };
            }
        } else {
            return { success: false, error: "Empty message" };
        }
    } else {
        return { success: false, error: "No message provided" };
    }
}
```

**GOOD - Early Returns:**

```typescript
function processCommit(message: string, config: MerlinConfig): CommitResult {
    // Guard clauses - check error conditions first
    if (!message) {
        return { success: false, error: "No message provided" };
    }

    if (message.length === 0) {
        return { success: false, error: "Empty message" };
    }

    if (message.length > config.maxSubjectLength) {
        return { success: false, error: "Message too long" };
    }

    if (!config.autoAdd) {
        return { success: false, error: "Auto-add disabled" };
    }

    // Main logic at top level - easy to find and understand
    return createCommit(message);
}
```

**More Examples:**

```typescript
// BAD - nested conditions
async function validateAndStage(): Promise<boolean> {
    if (await isGitRepo()) {
        if (await hasUncommittedChanges()) {
            if (await hasStagedChanges()) {
                return true;
            } else {
                await stageAllChanges();
                return true;
            }
        } else {
            return false;
        }
    } else {
        throw new Error("Not a git repository");
    }
}

// GOOD - early returns
async function validateAndStage(): Promise<boolean> {
    if (!(await isGitRepo())) {
        throw new Error("Not a git repository");
    }

    if (!(await hasUncommittedChanges())) {
        return false;
    }

    if (await hasStagedChanges()) {
        return true;
    }

    await stageAllChanges();
    return true;
}
```

**Rule of Thumb:** If you find yourself writing `else` blocks, consider if early returns would be clearer.

### One Level of Abstraction

Functions should operate at one level of abstraction.

**BAD:**

```typescript
function processCommit(answers: CommitAnswers): void {
    // Mixing high-level orchestration with low-level details
    const message = `${answers.type}(${answers.scope}): ${answers.subject}`;
    if (message.length > 72) {
        throw new Error("Too long");
    }
    execSync(`git commit -m "${message}"`); // Security issue too!
}
```

**GOOD:**

```typescript
function processCommit(answers: CommitAnswers): void {
    const message = buildCommitMessage(answers);
    validateMessage(message);
    createCommit(message);
}

function buildCommitMessage(answers: CommitAnswers): string {
    return `${answers.type}(${answers.scope}): ${answers.subject}`;
}

function validateMessage(message: string): void {
    if (message.length > 72) {
        throw new Error("Message too long");
    }
}

function createCommit(message: string): void {
    execa("git", ["commit", "-m", message]);
}
```

### Avoid Side Effects

Functions should either DO something or RETURN something, not both.

**BAD:**

```typescript
function validateAndFormat(message: string): string {
    if (message.length > 72) {
        console.error("Message too long"); // Side effect!
    }
    return message.trim();
}
```

**GOOD:**

```typescript
function validateMessage(message: string): void {
    if (message.length > 72) {
        console.error("Message too long");
    }
}

function formatMessage(message: string): string {
    return message.trim();
}
```

---

## Error Handling

### Don't Swallow Errors

Always handle or propagate errors.

**BAD:**

```typescript
try {
    await execa("git", ["commit", "-m", message]);
} catch {
    // Silently ignored!
}
```

**GOOD:**

```typescript
try {
    await execa("git", ["commit", "-m", message]);
} catch (error) {
    console.error("Failed to create commit:", error);
    throw error; // Re-throw for caller to handle
}
```

### Use Custom Error Types

Create meaningful error types for different failure modes.

```typescript
class InvalidCommitMessageError extends Error {
    constructor(
        message: string,
        public readonly details: string
    ) {
        super(message);
        this.name = "InvalidCommitMessageError";
    }
}

throw new InvalidCommitMessageError(
    "Commit message validation failed",
    "Subject exceeds 72 characters"
);
```

---

## Refactoring Checklist

Before committing, ask:

- [ ] Is this function doing ONE thing?
- [ ] Are there any repeated code blocks?
- [ ] Can I simplify this logic?
- [ ] Are my abstractions at the right level?
- [ ] Am I using early returns instead of nested if/else blocks?
- [ ] Is this testable without mocking everything?
- [ ] Would a new developer understand this?
