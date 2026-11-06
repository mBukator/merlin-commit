---
paths:
    - "src/**/*.ts"
---

# Security Details

The six invariants live in AGENTS.md and load in every session. This file adds how to apply
them.

## Config validation

`validateConfig()` in `src/utils/config.ts` takes `unknown` and returns `Partial<MerlinConfig>`.
It drops any field that fails a type check and never throws, so a tampered or stale
`.merlinrc.json` falls back to defaults instead of crashing. Follow that pattern for new fields:

```typescript
if (typeof config.maxSubjectLength === "number" && config.maxSubjectLength > 0) {
    validated.maxSubjectLength = config.maxSubjectLength;
}
```

## File paths

Config is read from exactly two places: `~/.merlinrc.json` and `<repo-root>/.merlinrc.json`,
where the repo root comes from git. If a feature ever needs a user-chosen file, check it against
an allowlist before joining it into a path.

## Git arguments

Interpolating inside one argument is fine; building the command line is not:

```typescript
await execa("git", ["log", `--author=${authorName}`]); // safe
execSync(`git log --author="${authorName}"`); // injection
```

## Dispatch on user input

Map user strings to handlers through a lookup object and reject unknown keys. Never turn them
into code.

## Also

- Keep secrets and credentials out of logs and code, including examples.

## Reporting a vulnerability

Do not open a public issue. Open a
[private security advisory](https://github.com/mBukator/merlin-commit/security/advisories/new)
with a description, reproduction steps and impact.
