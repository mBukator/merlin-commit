---
paths:
    - "**/*.ts"
---

# Naming Conventions

## Rules

### 1. No single-letter variables

Single letters are allowed only in very short lambdas.

```typescript
// BAD
for (const c of s) {
}
// GOOD
for (const cookieString of cookieStrings) {
}
```

### 2. Never abbreviate

```typescript
// BAD
const cfg = loadConfig();
const idx = items.findIndex((i) => i.active);
// GOOD
const config = loadConfig();
const activeItemIndex = items.findIndex((item) => item.active);
```

### 3. Include units in names

```typescript
// BAD
const timeout = 5000;
const maxLength = 72;
// GOOD
const timeoutMilliseconds = 5000;
const maxLengthCharacters = 72;
```

### 4. A function does only what its name says

No hidden side effects. If `validateCommitMessage` also commits, split it into
`validateCommitMessage` and `createGitCommit`. Avoid vague names like `handleData` or
`doCommit`.

### 5. Booleans start with `is`, `has` or `can`

```typescript
// BAD
const staged = await checkStagedChanges();
// GOOD
const hasStagedChanges = await checkStagedChanges();
const isDryRun = options.dryRun ?? false;
```

## Casing

| Element                    | Convention           | Example              |
| -------------------------- | -------------------- | -------------------- |
| Variables, functions       | camelCase            | `buildCommitMessage` |
| Constants                  | SCREAMING_SNAKE_CASE | `MAX_SUBJECT_LENGTH` |
| Classes, types, interfaces | PascalCase           | `CommitAnswers`      |
| Enums                      | PascalCase           | `ThemeType`          |
| File names                 | kebab-case           | `commit-builder.ts`  |
