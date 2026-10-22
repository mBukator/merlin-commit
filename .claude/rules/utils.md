---
paths:
    - "src/utils/*.ts"
---

# Utility Function Rules

**Last Updated**: 2026-03-13

These rules apply to all utility modules in `src/utils/` directory.

---

## Utility Responsibilities

Utilities are **PURE HELPERS** - stateless, reusable, pure functions that provide generic functionality.

### MUST Requirements for Utils:

1. **MUST be pure functions** - No side effects
2. **MUST be stateless** - No internal state
3. **MUST be reusable** - Generic, not command-specific
4. **MUST validate inputs** - Handle invalid data gracefully
5. **MUST have clear return types** - No `unknown` or `any` returns

---

## What Are Pure Functions?

A pure function:

1. **Same input → Same output** (deterministic)
2. **No side effects** (no console.log, no file writes, no network calls, no mutations)
3. **No external dependencies** (no reading global state, dates, random numbers)

**GOOD Examples:**

```typescript
// Pure - same input always gives same output
export function validateSubjectLength(
    subject: string,
    maxLength: number
): ValidationResult {
    if (subject.length > maxLength) {
        return { valid: false, error: `Subject exceeds ${maxLength} characters` };
    }
    return { valid: true };
}

// Pure - no side effects
export function trimAndLowercase(text: string): string {
    return text.trim().toLowerCase();
}

// Pure - deterministic
export function calculateScore(a: number, b: number): number {
    return a + b * 0.5;
}
```

**BAD Examples:**

```typescript
// NOT PURE - side effect (console.log)
export function validateSubjectLength(subject: string, maxLength: number): boolean {
    console.log("Validating:", subject); // Side effect!
    return subject.length <= maxLength;
}

// NOT PURE - mutates input
export function addToArray(arr: string[], item: string): string[] {
    arr.push(item); // Mutation!
    return arr;
}

// NOT PURE - depends on external state
let count = 0;
export function incrementCounter(): number {
    return ++count; // External state!
}

// NOT PURE - non-deterministic (uses Date)
export function isExpired(timestamp: number): boolean {
    return timestamp < Date.now(); // Different result each call!
}
```

---

## Current Utility Modules

### config.ts (63 lines) - Configuration Validation

**Purpose**: Pure validation of user configuration objects

**Exports**:

```typescript
export function validateConfig(userConfig: unknown): Partial<MerlinConfig>;
```

**Note**: This module is purely functional - it validates and sanitizes config data without any I/O. File I/O operations (load, save, reset) have been moved to `lib/config-loader.ts`.

### constants.ts (275 lines) - Constants and Themes

**Purpose**: Centralized constants, commit types, default config, theme messages

**Exports**:

```typescript
export const BREAKING_CHANGE_PREFIX_REGEX: RegExp;
export const colors: ChalkColorMap;
export const COMMIT_TYPES: CommitType[];
export const VALUE_COLUMN_WIDTH: number;
export const EMOJI_COLUMN_WIDTH: number;
export const VARIATION_SELECTOR: string;
export const WIZARD_MESSAGES: ThemeMessages;
export const STANDARD_MESSAGES: ThemeMessages;
export const DEFAULT_CONFIG: Required<MerlinConfig>;
export const TEMPLATE_PARAMETER_NAMES: Readonly<Record<string, readonly string[]>>;
export const MAX_CUSTOM_MESSAGE_LENGTH_CHARACTERS: number;
```

**Note**: All exports are constants - no functions.

### theme.ts - Custom Theme Helpers

**Purpose**: Pure helpers for resolving, validating and merging custom themes

**Exports**:

```typescript
export type MessageTemplate = (...templateArguments: unknown[]) => string;
export function resolveBaseTheme(config: Pick<Required<MerlinConfig>, "theme" | "customTheme">): BaseThemeName;
export function validateThemeOverrides(rawOverrides: unknown, reference: ThemeMessages): ThemeMessageOverrides;
export function compileMessageTemplate(template: string, parameterNames: readonly string[]): MessageTemplate;
export function mergeThemeMessages(base: ThemeMessages, overrides: ThemeMessageOverrides): ThemeMessages;
```

**Note**: Validation walks the built-in theme shape, so unknown keys are dropped without an allow-list. Template strings use `{placeholder}` substitution only - never evaluated.

### validators.ts (115 lines) - Input Validators

**Purpose**: Factory functions that create Inquirer-compatible validators

**Exports**:

```typescript
export function createRangeValidator(min: number, max: number): Validator;
export function createNonEmptyValidator(fieldName?: string): Validator;
export function createMaxLengthValidator(maxLength: number, fieldName?: string): Validator;
export function createPatternValidator(pattern: RegExp, errorMessage: string): Validator;
export function composeValidators(...validators: Validator[]): Validator;
```

**All functions are pure** - they return `Validator` functions (`(value: string) => true | string`) compatible with Inquirer prompts. Uses a factory/composition pattern for reusability.

---

## Validation Pattern

Validators use a factory pattern returning Inquirer-compatible functions (`true | string`):

```typescript
// GOOD - factory returns reusable validator
type Validator = (value: string) => true | string;

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

// GOOD - compose validators for complex rules
export function composeValidators(...validators: Validator[]): Validator {
    return (value: string) => {
        for (const validator of validators) {
            const result = validator(value);
            if (result !== true) return result;
        }
        return true;
    };
}

// BAD - throws exceptions
export function validateSubjectLength(subject: string, maxLength: number): void {
    if (subject.length > maxLength) {
        throw new Error("Subject too long"); // Don't throw!
    }
}
```

**Why?** Factory validators are composable, reusable, and directly compatible with Inquirer prompts.

---

## Pure Function Checklist

Before committing a util function, verify:

- [ ] No `console.log` or any logging
- [ ] No file system operations (fs.readFile, fs.writeFile, etc.)
- [ ] No network calls (fetch, axios, http, etc.)
- [ ] No mutations of input parameters
- [ ] No reading/writing global variables
- [ ] No Date.now(), Math.random(), or other non-deterministic calls
- [ ] Same input always produces same output
- [ ] No dependencies on external state

---

## Testing Utils

Utils are the easiest to test - no mocks needed:

```typescript
describe("createMaxLengthValidator", () => {
    it("should return true for valid length", () => {
        const validate = createMaxLengthValidator(72);

        expect(validate("short subject")).toBe(true);
    });

    it("should return error string for long input", () => {
        const validate = createMaxLengthValidator(72, "Subject");
        const longSubject = "a".repeat(100);

        const result = validate(longSubject);

        expect(result).toContain("exceeds 72 characters");
    });
});

describe("composeValidators", () => {
    it("should run validators in order and return first error", () => {
        const notEmpty = createNonEmptyValidator("Subject");
        const maxLen = createMaxLengthValidator(72);
        const composed = composeValidators(notEmpty, maxLen);

        expect(composed("valid")).toBe(true);
        expect(composed("")).not.toBe(true);
    });
});
```

**Target: 100% coverage for utils** - they're pure functions, so full coverage is achievable and valuable.

---

## Util Function Template

````typescript
// src/utils/module-name.ts

import type { InputType, ResultType } from "../types";

/**
 * Brief description of what this utility does.
 *
 * @param input - Input parameter description
 * @param options - Optional parameter description
 * @returns Result description
 *
 * @example
 * ```typescript
 * const result = utilityFunction('input', 42);
 * // result: { ... }
 * ```
 */
export function utilityFunction(input: InputType, options: number): ResultType {
    // Input validation
    if (!input) {
        return { valid: false, error: "Input required" };
    }

    // Pure logic - no side effects
    const processed = input.trim().toLowerCase();

    // Return result
    return { valid: true, value: processed };
}
````

---

## Type Definitions

Utils should define and export their result types:

```typescript
// GOOD - clear types
export type ValidationResult = {
    valid: boolean;
    error?: string;
    warnings?: string[];
};

export function validateInput(input: string): ValidationResult {
    // ...
}

// BAD - unclear return type
export function validateInput(input: string): { valid: boolean; error?: string } {
    // Inline type is harder to reuse
}
```

---

## Constants vs Functions

### When to Use Constants

For values that never change:

```typescript
export const MAX_SUBJECT_LENGTH = 72;
export const MAX_SCOPE_LENGTH = 20;
export const COMMIT_TYPES = ['feat', 'fix', 'docs', ...];
```

### When to Use Functions

For values that depend on inputs:

```typescript
// GOOD - function because it depends on config
export function getMaxLength(config: MerlinConfig): number {
    return config.maxSubjectLength ?? 72;
}

// BAD - this should be a function
export const MAX_LENGTH = loadConfig().maxSubjectLength; // Side effect!
```

---

## Dependency Rules for Utils

**Allowed**:

- utils → types (type imports)
- utils → other utils (sparingly)
- utils → external pure libraries (lodash, date-fns)

**Not Allowed**:

- utils → commands (utils shouldn't know about orchestration)
- utils → lib (utils shouldn't depend on domain logic)
- utils → cli (utils shouldn't know about CLI)

**If you need something from lib or commands**: You're probably not writing a util. Consider moving to lib/.

---

## Anti-Patterns to Avoid

### ❌ Side Effects

```typescript
// BAD - logging is a side effect
export function validateSubject(subject: string): boolean {
    console.log("Validating:", subject); // Side effect!
    return subject.length > 0;
}

// GOOD - pure function
export function validateSubject(subject: string): boolean {
    return subject.length > 0;
}
```

### ❌ Mutations

```typescript
// BAD - mutates input array
export function addItem(arr: string[], item: string): string[] {
    arr.push(item); // Mutation!
    return arr;
}

// GOOD - returns new array
export function addItem(arr: string[], item: string): string[] {
    return [...arr, item];
}
```

### ❌ Non-Deterministic

```typescript
// BAD - different result each time
export function generateId(): string {
    return Math.random().toString(36); // Non-deterministic!
}

// GOOD - pass seed/input
export function generateId(seed: string): string {
    return hashString(seed); // Deterministic for same seed
}
```

### ❌ External State

```typescript
// BAD - depends on global state
let validationCount = 0;

export function validate(input: string): boolean {
    validationCount++; // External state!
    return input.length > 0;
}

// GOOD - no external state
export function validate(input: string): boolean {
    return input.length > 0;
}
```

### ❌ Domain-Specific Logic

```typescript
// BAD - git-specific logic doesn't belong in utils
export function isValidCommit(message: string): boolean {
    // This is domain logic, belongs in lib/message.ts or lib/git.ts
    return message.startsWith("feat:") || message.startsWith("fix:");
}

// GOOD - generic validation
export function matchesPattern(text: string, pattern: RegExp): boolean {
    return pattern.test(text);
}
```

---

## When to Create New Utils

Create a new util when you have:

1. **Pure logic** used in multiple places
2. **Generic** functionality (not domain-specific)
3. **Validation** or **formatting** that's reusable

Don't create utils for:

- Command orchestration → commands/
- Domain logic → lib/
- One-off helpers → keep inline or in calling module

---

## Refactoring to Utils

If you find yourself copying validation or formatting code:

**Before:**

```typescript
// In commands/commit.ts
if (subject.length > 72) {
    console.log("Subject too long");
}

// In commands/config.ts
if (input.length > 72) {
    console.log("Subject too long");
}
```

**After:**

```typescript
// In utils/validators.ts - create reusable factory
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

// In lib/prompt.ts - use in Inquirer prompts
const subjectValidator = createMaxLengthValidator(config.maxSubjectLength, "Subject");
const answer = await input({ message: "Subject:", validate: subjectValidator });
```

---

## Testing Coverage

**Target: 100% coverage for utils**

Since utils are pure functions with no side effects, achieving 100% coverage is straightforward and valuable.

```bash
npm run test:coverage -- tests/unit/validators.test.ts
```

If coverage is < 100%, ask:

- Are there untested edge cases?
- Is the function too complex? (Should it be split?)
- Are there unreachable code paths? (Dead code to remove?)

---

## Resources

- [Pure Functions (FP)](https://en.wikipedia.org/wiki/Pure_function)
- [Functional Programming in TypeScript](https://github.com/gcanti/fp-ts)
- .claude/rules/code-style.md - Code style rules
- .claude/rules/testing.md - Testing guidelines
