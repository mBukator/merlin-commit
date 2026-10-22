---
paths:
    - "**/*.ts"
---

# TypeScript Code Style Rules

**Last Updated**: 2026-02-07

These rules apply to all TypeScript files in the project.

---

## Formatting Rules

### Indentation

- Use **4 spaces** for indentation (no tabs)
- Consistent indentation required for readability

```typescript
// GOOD
function example() {
    const value = 1;
    if (value > 0) {
        console.log('positive');
    }
}

// BAD
function example() {
  const value = 1;
    if (value > 0) {
      console.log('positive');
  }
}
```

### Operators

- Always put **spaces around operators**: `=`, `+`, `-`, `*`, `/`
- Add a **space after commas** in arrays and parameters

```typescript
// GOOD
const fullPrice = price + price * tax;
const items = ["apple", "banana", "cherry"];

function calculateTotal(items: Item[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
}

// BAD
const fullPrice=price+price*tax;
const items=["apple","banana","cherry"];

function calculateTotal(items:Item[]):number{
    return items.reduce((sum,item)=>sum+item.price,0);
}
```

### Line Length

- Keep lines under **100 characters**
- Break long lines logically

### Semicolons

- Always end statements with **semicolons**
- No exceptions

```typescript
// GOOD
const message = "Hello";
const count = 42;

// BAD
const message = "Hello"
const count = 42
```

### Braces

- Opening brace on **same line** as statement
- Closing brace on new line

```typescript
// GOOD
function example() {
    return true;
}

// BAD
function example()
{
    return true;
}
```

### Quotes

- Use **double quotes** for strings (per Prettier config)
- Use template literals for interpolation

```typescript
// GOOD
const name = "John";
const greeting = `Hello, ${name}`;

// BAD
const name = 'John';
const greeting = "Hello, " + name;
```

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

### Never Use any

**Never use `any`** - always use `unknown` when the type is truly unknown, then narrow with type guards.

```typescript
// GOOD - unknown + type narrowing
function parseInput(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    throw new Error('Expected a string');
}

// BAD - any bypasses all type safety
function parseInput(value: any): string {
    return value;
}
```

### Strict Equality

**Always use strict equality** - `===` and `!==`, never `==` or `!=`.

```typescript
// GOOD
if (value === 0) { }
if (type !== 'feat') { }

// BAD
if (value == 0) { }
if (type != 'feat') { }
```

### Variable Declaration

1. **Declare variables at the top** of their scope
2. **Initialize variables** when declaring them
3. **Use `const` by default**, `let` only when reassignment is needed
4. **Never use `var`**

```typescript
// GOOD
const userName = 'John';
const isValid = true;
let counter = 0;

if (isValid) {
    counter++;
}

// BAD
var userName = 'John';
let isValid = true;  // Should be const
let counter;         // Should initialize
counter = 0;
```

### Default Parameters

Use default parameters instead of checking for undefined.

```typescript
// GOOD
function buildMessage(type: string, subject: string, scope: string = ''): string {
    return scope ? `${type}(${scope}): ${subject}` : `${type}: ${subject}`;
}

// BAD
function buildMessage(type: string, subject: string, scope?: string): string {
    if (scope === undefined) {
        scope = '';
    }
    return scope ? `${type}(${scope}): ${subject}` : `${type}: ${subject}`;
}
```

### Switch Statements

Always include `default` case in switch statements.

```typescript
// GOOD
switch (commitType) {
    case 'feat':
        return 'Feature';
    case 'fix':
        return 'Bug fix';
    default:
        throw new Error(`Unknown type: ${commitType}`);
}

// BAD
switch (commitType) {
    case 'feat':
        return 'Feature';
    case 'fix':
        return 'Bug fix';
    // Missing default
}
```

### Literal Syntax

Use literal syntax for objects and arrays.

```typescript
// GOOD - Literal syntax
const config: MerlinConfig = {};
const types: CommitType[] = [];
const message = '';
const count = 0;
const isValid = false;

// BAD - Constructor syntax
const config = new Object();
const types = new Array();
const message = new String('');
```

---

## Best Practices

### Avoid eval()

**Never use eval()** - it's a security risk and bypasses type safety.

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
    await execa('git', ['commit', '-m', message]);
} catch (error) {
    console.error('Failed to create commit:', error);
    throw error;
}

// BAD
try {
    await execa('git', ['commit', '-m', message]);
} catch {
    // Silently swallowed!
}
```

### Use Error Objects

Always throw Error objects, not strings.

```typescript
// GOOD
throw new Error('Invalid commit type');

// BAD
throw 'Invalid commit type';
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

---

## Formatting Tools

This project uses Prettier for automatic formatting. Run before committing:

```bash
npm run format
```

Configuration is in `.prettierrc`:

- Double quotes
- Trailing commas (ES5)
- 4 space indentation
- Line width: 90
