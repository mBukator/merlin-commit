---
paths:
    - "**/*.ts"
---

# TypeScript Code Style Rules

These rules apply to all TypeScript files in the project. Prettier (`.prettierrc`) and ESLint
already enforce formatting, `===`, `const` over `let`, no `var` and a `default` in every
`switch`, so they are not restated here. Run `npm run format`.

---

## TypeScript-Specific Conventions

### Type vs Interface

**Prefer `type` over `interface`** - use type aliases by default; only use interface when declaration merging or extends is needed.

```typescript
// GOOD - type alias (preferred)
type CommitAnswers = {
    type: string;
    scope?: string;
    subject: string;
};

type CommitResult = {
    success: boolean;
    hash: string;
};

// AVOID - interface when type suffices
interface CommitAnswers {
    type: string;
    scope?: string;
    subject: string;
}

// ACCEPTABLE - interface when extending
interface ExtendedCommitAnswers extends CommitAnswers {
    timestamp: number;
}
```

### Never Use any in src/

**Never use `any` in `src/`** - always use `unknown` when the type is truly unknown, then narrow with type guards. Tests may cast mocks `as any`; ESLint turns `no-explicit-any` off for `tests/**`.

```typescript
// GOOD - unknown + type narrowing
function parseInput(value: unknown): string {
    if (typeof value === "string") {
        return value;
    }
    throw new Error("Expected a string");
}

// BAD - any bypasses all type safety
function parseInput(value: any): string {
    return value;
}
```

### Default Parameters

Use default parameters instead of checking for undefined.

```typescript
// GOOD
function buildMessage(type: string, subject: string, scope: string = ""): string {
    return scope ? `${type}(${scope}): ${subject}` : `${type}: ${subject}`;
}

// BAD
function buildMessage(type: string, subject: string, scope?: string): string {
    if (scope === undefined) {
        scope = "";
    }
    return scope ? `${type}(${scope}): ${subject}` : `${type}: ${subject}`;
}
```

### Literal Syntax

Use literal syntax for objects and arrays.

```typescript
// GOOD - Literal syntax
const config: MerlinConfig = {};
const types: CommitType[] = [];
const message = "";
const count = 0;
const isValid = false;

// BAD - Constructor syntax
const config = new Object();
const types = new Array();
const message = new String("");
```

---

## Best Practices

### Return Early

Use early returns to avoid deep nesting.

```typescript
// GOOD
function validate(message: string): boolean {
    if (!message) return false;
    if (message.length < 10) return false;
    if (message.length > 72) return false;
    return true;
}

// BAD
function validate(message: string): boolean {
    if (message) {
        if (message.length >= 10) {
            if (message.length <= 72) {
                return true;
            }
        }
    }
    return false;
}
```

### Optional Chaining

Use optional chaining for safer property access.

```typescript
// GOOD
const scope = config?.types?.[0]?.value;

// BAD
const scope = config && config.types && config.types[0] && config.types[0].value;
```

### Nullish Coalescing

Use `??` for default values (not `||`).

```typescript
// GOOD - handles 0, '', false correctly
const maxLength = config.maxSubjectLength ?? 72;

// BAD - 0 would be replaced with 72
const maxLength = config.maxSubjectLength || 72;
```

---

## Error Handling

### Explicit Error Handling

Handle errors explicitly, don't swallow them.

```typescript
// GOOD
try {
    await execa("git", ["commit", "-m", message]);
} catch (error) {
    console.error("Failed to create commit:", error);
    throw error;
}

// BAD
try {
    await execa("git", ["commit", "-m", message]);
} catch {
    // Silently swallowed!
}
```

### Use Error Objects

Always throw Error objects, not strings.

```typescript
// GOOD
throw new Error("Invalid commit type");

// BAD
throw "Invalid commit type";
```

---

## Comments

### When to Comment

- **DO**: Explain WHY, not WHAT
- **DON'T**: State the obvious
- **DO**: Document complex algorithms
- **DON'T**: Comment bad code - refactor it

```typescript
// GOOD
// Git requires commit messages to be under 72 characters for proper display in logs
const MAX_SUBJECT_LENGTH = 72;

// BAD
// Set max length to 72
const MAX_SUBJECT_LENGTH = 72;
```

### JSDoc

Public functions should have JSDoc comments.

````typescript
/**
 * Builds a conventional commit message from user answers.
 *
 * @param answers - User's commit information
 * @returns Formatted commit message following conventional commits spec
 * @example
 * ```typescript
 * const message = buildCommitMessage({
 *   type: 'feat',
 *   scope: 'api',
 *   subject: 'add user endpoint'
 * });
 * // Returns: "feat(api): add user endpoint"
 * ```
 */
export function buildCommitMessage(answers: CommitAnswers): string {
    // Implementation
}
````
