---
paths:
  - "src/**/*.ts"
---

# Clean Code Principles

**Last Updated**: 2026-02-07

These principles apply to all source code in `src/` directory.

---

## DRY (Don't Repeat Yourself)

Extract repeated code into reusable functions. If you copy-paste code, refactor it.

**BAD:**

```typescript
function validateFeatCommit(message: string): boolean {
    if (message.length < 10) return false;
    if (message.length > 72) return false;
    if (!message.match(/^[a-z]/)) return false;
    return true;
}

function validateFixCommit(message: string): boolean {
    if (message.length < 10) return false;
    if (message.length > 72) return false;
    if (!message.match(/^[a-z]/)) return false;
    return true;
}
```

**GOOD:**

```typescript
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 72;

function isValidMessageFormat(message: string): boolean {
    if (message.length < MIN_MESSAGE_LENGTH) return false;
    if (message.length > MAX_MESSAGE_LENGTH) return false;
    if (!message.match(/^[a-z]/)) return false;
    return true;
}
```

---

## KISS (Keep It Simple, Stupid)

Write the simplest code that works. Avoid over-engineering.

**BAD:**

```typescript
function isEven(number: number): boolean {
    return (number & 1) === 0 ? true : false;
}
```

**GOOD:**

```typescript
function isEven(number: number): boolean {
    return number % 2 === 0;
}
```

**Another example - BAD:**

```typescript
class CommitMessageBuilder {
    private type: string = '';
    private scope: string = '';
    private subject: string = '';

    setType(type: string): this {
        this.type = type;
        return this;
    }

    setScope(scope: string): this {
        this.scope = scope;
        return this;
    }

    setSubject(subject: string): this {
        this.subject = subject;
        return this;
    }

    build(): string {
        return this.scope
            ? `${this.type}(${this.scope}): ${this.subject}`
            : `${this.type}: ${this.subject}`;
    }
}

const message = new CommitMessageBuilder()
    .setType('feat')
    .setScope('api')
    .setSubject('add user endpoint')
    .build();
```

**GOOD:**

```typescript
function buildCommitMessage(type: string, subject: string, scope?: string): string {
    return scope
        ? `${type}(${scope}): ${subject}`
        : `${type}: ${subject}`;
}

const message = buildCommitMessage('feat', 'add user endpoint', 'api');
```

---

## SOLID Principles

### S - Single Responsibility Principle (SRP)

A class or module should have only ONE reason to change.

**BAD:**

```typescript
class CommitService {
    createCommit(message: string): void {
        /* ... */
    }
    formatMessage(message: string): string {
        /* ... */
    }
    validateMessage(message: string): boolean {
        /* ... */
    }
    pushToRemote(): void {
        /* ... */
    }
    sendNotification(): void {
        /* ... */
    }
}
```

**GOOD:**

```typescript
// Each module has a single responsibility

// lib/git.ts - Git operations only
export async function createCommit(message: string): Promise {
    /* ... */
}
export async function pushToRemote(): Promise {
    /* ... */
}

// lib/message.ts - Message handling only
export function formatCommitMessage(answers: CommitAnswers): string {
    /* ... */
}

// utils/validators.ts - Validation only
export function validateSubject(subject: string): ValidationResult {
    /* ... */
}
```

### O - Open/Closed Principle (OCP)

Open for extension, closed for modification.

**BAD:**

```typescript
function formatCommitType(type: string): string {
    if (type === 'feat') return '✨ feat';
    if (type === 'fix') return '🐛 fix';
    if (type === 'docs') return '📚 docs';
    // Must modify this function to add new types
    return type;
}
```

**GOOD:**

```typescript
// COMMIT_TYPES in constants.ts - extend by adding to array
const COMMIT_TYPES: CommitType[] = [
    { value: 'feat', label: '✨ feat', description: 'New feature' },
    { value: 'fix', label: '🐛 fix', description: 'Bug fix' },
    { value: 'docs', label: '📚 docs', description: 'Documentation' },
    // Add new types here without modifying formatting logic
];

function formatCommitType(type: CommitType): string {
    return type.label;
}
```

### L - Liskov Substitution Principle (LSP)

Subtypes must be substitutable for their base types.

```typescript
// If MerlinConfig has a theme property, any valid theme should work
type MerlinConfig = {
    theme: 'wizard' | 'standard';
};

// Both themes must work identically in all contexts
const wizardConfig: MerlinConfig = { theme: 'wizard' };
const standardConfig: MerlinConfig = { theme: 'standard' };

// This function works with any valid config
function getMessages(config: MerlinConfig): ThemeMessages {
    return config.theme === 'wizard' ? WIZARD_MESSAGES : STANDARD_MESSAGES;
}
```

### I - Interface Segregation Principle (ISP)

Don't force implementations to depend on methods they don't use.

**BAD:**

```typescript
interface CommitHandler {
    createCommit(message: string): void;
    amendCommit(message: string): void;
    revertCommit(hash: string): void;
    squashCommits(count: number): void;
    rebaseInteractive(branch: string): void;
}
```

**GOOD:**

```typescript
interface CommitCreator {
    createCommit(message: string): void;
}

interface CommitAmender {
    amendCommit(message: string): void;
}

// Implement only what's needed
class BasicCommitService implements CommitCreator {
    createCommit(message: string): void {
        /* ... */
    }
}
```

### D - Dependency Inversion Principle (DIP)

High-level modules should depend on abstractions, not concrete implementations.

**BAD:**

```typescript
// High-level module depends on low-level implementation
class CommitCommand {
    private git = new GitCliAdapter(); // Direct dependency

    async execute(message: string): Promise {
        await this.git.commit(message);
    }
}
```

**GOOD:**

```typescript
// Both depend on abstraction
interface GitAdapter {
    commit(message: string): Promise;
}

class GitCliAdapter implements GitAdapter {
    async commit(message: string): Promise {
        await execa('git', ['commit', '-m', message]);
    }
}

class CommitCommand {
    constructor(private git: GitAdapter) {} // Injected dependency

    async execute(message: string): Promise {
        await this.git.commit(message);
    }
}
```

---

## Merlin-Commit Architectural Patterns

### Commands Layer: Orchestration

Commands coordinate workflows but don't implement domain logic.

```typescript
// src/commands/commit.ts - GOOD
export async function commitCommand(options: CommitOptions): Promise<void> {
    // 1. Validate preconditions
    const isRepo = await isGitRepo();
    if (!isRepo) throw new Error('Not a git repository');

    // 2. Gather user input
    const answers = await promptUser();

    // 3. Build message (delegates to message.ts)
    const message = buildCommitMessage(answers);

    // 4. Preview
    const preview = formatPreview(message);
    console.log(preview);

    // 5. Confirm
    const confirmed = await confirm({ message: 'Create commit?' });

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
    const args = ['commit', '-m', message];
    if (options.noVerify) args.push('--no-verify');
    if (options.amend) args.push('--amend');

    const result = await execa('git', args);
    return {
        success: true,
        hash: parseCommitHash(result.stdout),
        message
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
            error: `Subject exceeds ${maxLength} characters`
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
                    return { success: false, error: 'Auto-add disabled' };
                }
            } else {
                return { success: false, error: 'Message too long' };
            }
        } else {
            return { success: false, error: 'Empty message' };
        }
    } else {
        return { success: false, error: 'No message provided' };
    }
}
```

**GOOD - Early Returns:**

```typescript
function processCommit(message: string, config: MerlinConfig): CommitResult {
    // Guard clauses - check error conditions first
    if (!message) {
        return { success: false, error: 'No message provided' };
    }

    if (message.length === 0) {
        return { success: false, error: 'Empty message' };
    }

    if (message.length > config.maxSubjectLength) {
        return { success: false, error: 'Message too long' };
    }

    if (!config.autoAdd) {
        return { success: false, error: 'Auto-add disabled' };
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
        throw new Error('Not a git repository');
    }
}

// GOOD - early returns
async function validateAndStage(): Promise<boolean> {
    if (!await isGitRepo()) {
        throw new Error('Not a git repository');
    }

    if (!await hasUncommittedChanges()) {
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
        throw new Error('Too long');
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
        throw new Error('Message too long');
    }
}

function createCommit(message: string): void {
    execa('git', ['commit', '-m', message]);
}
```

### Avoid Side Effects

Functions should either DO something or RETURN something, not both.

**BAD:**

```typescript
function validateAndFormat(message: string): string {
    if (message.length > 72) {
        console.error('Message too long'); // Side effect!
    }
    return message.trim();
}
```

**GOOD:**

```typescript
function validateMessage(message: string): void {
    if (message.length > 72) {
        console.error('Message too long');
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
    await execa('git', ['commit', '-m', message]);
} catch {
    // Silently ignored!
}
```

**GOOD:**

```typescript
try {
    await execa('git', ['commit', '-m', message]);
} catch (error) {
    console.error('Failed to create commit:', error);
    throw error; // Re-throw for caller to handle
}
```

### Use Custom Error Types

Create meaningful error types for different failure modes.

```typescript
class InvalidCommitMessageError extends Error {
    constructor(message: string, public readonly details: string) {
        super(message);
        this.name = 'InvalidCommitMessageError';
    }
}

throw new InvalidCommitMessageError(
    'Commit message validation failed',
    'Subject exceeds 72 characters'
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

---

## Resources

- **Clean Code** by Robert C. Martin
- **Refactoring** by Martin Fowler
- **SOLID Principles**: [DigitalOcean Guide](https://www.digitalocean.com/community/conceptual_articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)
