# Security Requirements

**Last Updated**: 2026-02-07

These security requirements are **non-negotiable** and apply to ALL code in the project.

---

## MUST Follow Requirements

### 1. No Network Calls

Fully offline operation - never make HTTP requests.

**Reason**: Merlin Commit is designed as a privacy-first tool. No telemetry, no analytics, no "calling home."

**BAD:**

```typescript
await fetch('https://api.example.com/log', {
    method: 'POST',
    body: JSON.stringify({ event: 'commit_created' })
});
```

**GOOD:**

```typescript
// Simply don't make any network calls
// All functionality is local
```

### 2. No Data Collection

Zero telemetry, analytics, or tracking.

**MUST NOT**:

- Send usage statistics
- Phone home for updates
- Track user behavior
- Collect any user data

### 3. No eval() or Code Execution

Never evaluate user-provided strings as code.

**BAD:**

```typescript
const userFunction = eval(userInput);
new Function(userInput)();
```

**GOOD:**

```typescript
// Use structured data and validation instead
const allowedTypes = ['feat', 'fix', 'docs'];
if (!allowedTypes.includes(userInput)) {
    throw new Error('Invalid commit type');
}
```

### 4. Safe Git Execution

Always use `execa` with args array, never string interpolation.

**CORRECT - Safe:**

```typescript
await execa("git", ["commit", "-m", message]);
await execa("git", ["commit", "-m", message, "--amend"]);
await execa("git", ["push", "origin", branchName]);
```

**WRONG - Vulnerable to injection:**

```typescript
execSync(`git commit -m "${message}"`);
execSync(`git push origin ${branchName}`);
exec(`git commit -m "${message}"`, callback);
```

**Why this matters**:

```typescript
// If message contains: "; rm -rf /"
// String interpolation becomes:
execSync(`git commit -m "; rm -rf /"`);  // DISASTER!

// But with args array:
execa("git", ["commit", "-m", "; rm -rf /"]); // SAFE - treated as literal string
```

### 5. Config Validation

All user configuration must be validated and sanitized.

**GOOD:**

```typescript
function validateConfig(config: unknown): MerlinConfig {
    if (typeof config !== 'object' || config === null) {
        throw new Error('Config must be an object');
    }

    const { theme, maxSubjectLength } = config as Record<string, unknown>;

    // Validate theme
    if (theme !== undefined && theme !== 'wizard' && theme !== 'standard') {
        throw new Error('Invalid theme');
    }

    // Validate maxSubjectLength
    if (maxSubjectLength !== undefined) {
        if (typeof maxSubjectLength !== 'number' || maxSubjectLength < 1 || maxSubjectLength > 200) {
            throw new Error('Invalid maxSubjectLength');
        }
    }

    return {
        theme: theme as 'wizard' | 'standard' || 'wizard',
        maxSubjectLength: maxSubjectLength as number || 72,
    };
}
```

### 6. Fixed Config Path

Config file path is `~/.merlinrc.json` - never use user input for file paths.

**CORRECT:**

```typescript
const configPath = path.join(os.homedir(), '.merlinrc.json');
```

**WRONG:**

```typescript
// Never construct paths from user input
const configPath = path.join(os.homedir(), userInput); // DANGEROUS!
```

---

## Security Checklist

Before committing code, verify:

- [ ] No network calls (fetch, axios, http, https)
- [ ] No telemetry or analytics
- [ ] No eval() or new Function()
- [ ] All git commands use execa with args array
- [ ] All user input is validated
- [ ] File paths are fixed, never from user input
- [ ] No sensitive data in logs
- [ ] No credentials in code (even examples)

---

## Common Vulnerabilities to Avoid

### Command Injection

**Vulnerable:**

```typescript
const result = execSync(`git log --author="${authorName}"`);
```

**Safe:**

```typescript
const result = await execa("git", ["log", `--author=${authorName}`]);
```

### Path Traversal

**Vulnerable:**

```typescript
const configFile = path.join(configDir, userInput);
fs.readFileSync(configFile);
```

**Safe:**

```typescript
const allowedFiles = ['config.json', 'settings.json'];
if (!allowedFiles.includes(userInput)) {
    throw new Error('Invalid file');
}
const configFile = path.join(configDir, userInput);
```

### Arbitrary Code Execution

**Vulnerable:**

```typescript
const handler = new Function('return ' + userInput);
handler();
```

**Safe:**

```typescript
// Use structured data and switch statements
const handlers = {
    'feat': handleFeat,
    'fix': handleFix,
};
const handler = handlers[userInput];
if (!handler) throw new Error('Invalid handler');
handler();
```

---

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Open a [private security advisory](https://github.com/mBukator/merlin-commit/security/advisories/new) on GitHub
3. Include: description, reproduction steps, potential impact

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Command Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
