# Naming Conventions

**Last Updated**: 2026-02-07

These naming rules apply to ALL code in the project, regardless of file type or location.

---

## Pre-Naming Requirement

Before creating ANY variable, function, constant, class, interface, or type name, STOP and verify:

1. **Clarity**: Can someone understand its purpose without reading the implementation?
2. **Accuracy**: Does the name accurately describe what it holds or does?
3. **Readability**: Is the name readable at a glance (not too long, not abbreviated)?
4. **Single Responsibility**: Does the name reflect a single, focused purpose?

---

## Core Rules

### Rule 1: No Single-Letter Variables

Variables must have descriptive names. Single letters are forbidden except in very short lambdas.

**BAD:**

```typescript
const n = "John";
const s = `; ${document.cookie}`.split("; ");
for (let c of cookies) {
}
```

**GOOD:**

```typescript
const userName = "John";
const cookieStrings = `; ${document.cookie}`.split("; ");
for (const cookie of cookies) {
}
```

**Complete Example - BAD:**

```typescript
public static parseCookie(n: string): string | null {
  const s = `; ${document.cookie}`.split('; ');
  for (let c of s) {
    if (c.indexOf(n) === 0) {
      return c.substring(n.length + 1);
    }
  }
  return null;
}
```

**Complete Example - GOOD:**

```typescript
public static parseCookie(cookieName: string): string | null {
  const cookieStrings = `; ${document.cookie}`.split('; ');
  for (const cookieString of cookieStrings) {
    if (cookieString.indexOf(cookieName) === 0) {
      return cookieString.substring(cookieName.length + 1);
    }
  }
  return null;
}
```

### Rule 2: Never Abbreviate

Write out full words. Clarity always wins over brevity.

**BAD:**

```typescript
const cfg = loadConfig();
const msg = formatCommitMsg();
const usr = getCurrentUsr();
const idx = items.findIndex((i) => i.active);
const btn = document.getElementById("btn");
```

**GOOD:**

```typescript
const config = loadConfig();
const message = formatCommitMessage();
const user = getCurrentUser();
const activeItemIndex = items.findIndex((item) => item.active);
const button = document.getElementById("submitButton");
```

**Complete Example - BAD:**

```typescript
public calculateRelScore(m1: Mov, m2: Mov): number {
  const GW = 0.4;
  const YW = 0.1;
  const DW = 0.2;
  const WW = 0.3;
  let s = 0;
  if (m1.gen === m2.gen) s += GW;
  if (m1.yr === m2.yr) s += YW;
  if (m1.dir === m2.dir) s += DW;
  for (const w of m1.writers) {
    if (m2.writers.includes(w)) {
      s += WW;
      break;
    }
  }
  return s;
}
```

**Complete Example - GOOD:**

```typescript
public calculateMovieRelationScore(movie1: Movie, movie2: Movie): number {
  const GENRE_WEIGHT = 0.4;
  const YEAR_WEIGHT = 0.1;
  const DIRECTOR_WEIGHT = 0.2;
  const WRITER_WEIGHT = 0.3;

  let score = 0;

  if (movie1.genre === movie2.genre) {
    score += GENRE_WEIGHT;
  }
  if (movie1.year === movie2.year) {
    score += YEAR_WEIGHT;
  }
  if (movie1.director === movie2.director) {
    score += DIRECTOR_WEIGHT;
  }

  const hasSharedWriter = movie1.writers.some(
    writer => movie2.writers.includes(writer)
  );
  if (hasSharedWriter) {
    score += WRITER_WEIGHT;
  }

  return score;
}
```

### Rule 3: Include Units in Variable Names

When a variable represents a measurement, duration, or quantity with a unit, include the unit in the name.

**BAD:**

```typescript
const timeout = 5000;
const delay = 30;
const size = 1024;
const maxLength = 72;
```

**GOOD:**

```typescript
const timeoutMilliseconds = 5000;
const delaySeconds = 30;
const sizeBytes = 1024;
const maxLengthCharacters = 72;
```

### Rule 4: Functions Must Do Only What Their Name Says

A function name must accurately reflect its SINGLE responsibility. If a function does more than its name suggests, it violates this rule.

**BAD:**

```typescript
// Function name says "parse" but it also starts session and fetches user
function parseCookies(cookieString: string): ParsedCookie[] {
    const cookies = cookieString.split(";").map(parseSingleCookie);
    startUserSession(cookies); // Hidden side effect!
    fetchUserProfile(); // Another hidden side effect!
    return cookies;
}

// Vague name that doesn't explain what it does
function handleData(data: unknown): void {
    /* ... */
}

// Name suggests one thing, does another
function validateCommit(message: string): void {
    // Actually creates the commit, not just validates!
    execSync(`git commit -m "${message}"`);
}
```

**GOOD:**

```typescript
// Each function does exactly what its name says
function parseCookieString(cookieString: string): ParsedCookie[] {
    return cookieString.split(";").map(parseSingleCookie);
}

function startUserSession(cookies: ParsedCookie[]): void {
    // Only starts session, nothing else
}

function fetchUserProfile(): Promise {
    // Only fetches profile, nothing else
}

// Clear, accurate names
function validateCommitMessage(message: string): ValidationResult {
    /* ... */
}
function createGitCommit(message: string): void {
    /* ... */
}
function formatCommitSubject(subject: string): string {
    /* ... */
}
```

### Rule 5: Boolean Variables Must Use is, has, or can Prefixes

When naming Boolean variables, use prefixes such as `is`, `has`, or `can` to make their purpose clear. These prefixes instantly tell you that the variable holds a true or false value, even before you read the logic. Use `is` to describe the current state of something, `has` to indicate possession or completion, and `can` to express capability or permission.

**BAD:**

```typescript
const valid = validateInput(message);
const staged = await checkStagedChanges();
const admin = user.role === 'admin';
const edit = checkPermissions(user, document);
const loading = true;
```

**GOOD:**

```typescript
const isValid = validateInput(message);
const hasStagedChanges = await checkStagedChanges();
const isAdmin = user.role === 'admin';
const canEdit = checkPermissions(user, document);
const isLoading = true;
```

**Complete Example - BAD:**

```typescript
async function commitWorkflow(options: CommitOptions): Promise<void> {
    const repo = await isGitRepo();
    const staged = await hasStagedChanges();
    const empty = message.trim().length === 0;
    const confirmed = await confirm({ message: 'Create commit?' });
    const dry = options.dryRun ?? false;

    if (!repo || !staged || empty || !confirmed || dry) {
        return;
    }
}
```

**Complete Example - GOOD:**

```typescript
async function commitWorkflow(options: CommitOptions): Promise<void> {
    const isRepository = await isGitRepo();
    const hasStagedFiles = await hasStagedChanges();
    const isEmpty = message.trim().length === 0;
    const isConfirmed = await confirm({ message: 'Create commit?' });
    const isDryRun = options.dryRun ?? false;

    if (!isRepository || !hasStagedFiles || isEmpty || !isConfirmed || isDryRun) {
        return;
    }
}
```

---

## Naming Convention Tables

| Element    | Convention           | Example                       |
| ---------- | -------------------- | ----------------------------- |
| Variables  | camelCase            | `commitMessage`, `userConfig` |
| Functions  | camelCase            | `buildCommitMessage()`        |
| Constants  | SCREAMING_SNAKE_CASE | `MAX_SUBJECT_LENGTH`          |
| Classes    | PascalCase           | `CommitBuilder`               |
| Interfaces | PascalCase           | `CommitAnswers`               |
| Types      | PascalCase           | `CommitType`                  |
| Enums      | PascalCase           | `ThemeType`                   |
| File names | kebab-case           | `commit-builder.ts`           |

---

## Merlin-Commit Specific Examples

**BAD:**

```typescript
// In lib/git.ts
async function doCommit(m: string, opts: any): Promise {
    const r = await execa("git", ["status"]);
    if (r.stdout.includes("nothing")) return;
    await execa("git", ["add", "."]);
    await execa("git", ["commit", "-m", m]);
}
```

**GOOD:**

```typescript
// In lib/git.ts
async function createCommit(message: string, options: CommitOptions): Promise {
    await execa("git", ["commit", "-m", message]);
    return { success: true, message };
}

async function stageAllChanges(): Promise {
    await execa("git", ["add", "."]);
}

async function hasUncommittedChanges(): Promise {
    const result = await execa("git", ["status", "--porcelain"]);
    return result.stdout.trim().length > 0;
}
```
