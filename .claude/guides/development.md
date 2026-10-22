# Development Guide

**Last Updated**: 2026-02-07

Complete development setup, commands, debugging tips, and common gotchas for merlin-commit.

---

## Table of Contents

- [Development Setup](#development-setup)
- [NPM Commands](#npm-commands)
- [CLI Usage](#cli-usage)
- [Debugging](#debugging)
- [Common Gotchas](#common-gotchas)
- [Dependency Management](#dependency-management)

---

## Development Setup

### Prerequisites

- **Node.js** >= 22.13.0

- **npm** >= 9.0.0
- **Git** >= 2.0.0

### Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/mBukator/merlin-commit.git
cd merlin-commit

# 2. Install dependencies
npm install

# 3. Build the project
npm run build

# 4. Link for local development
npm link

# 5. Verify installation
merlin --version
```

### IDE Setup (VS Code)

**Recommended Extensions**:

- ESLint (`dbaeumer.vscode-eslint`)
- Prettier (`esbenp.prettier-vscode`)
- TypeScript (`ms-vscode.vscode-typescript-next`)

**Workspace Settings** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## NPM Commands

### Build & Development

| Command         | Description                   | When to Use                            |
| --------------- | ----------------------------- | -------------------------------------- |
| `npm run build` | Compile TypeScript to `dist/` | Before testing locally, before commits |
| `npm run dev`   | Watch mode compilation        | During active development              |
| `npm run clean` | Remove `dist/` directory      | When build artifacts cause issues      |

**Examples**:

```bash
# Start watch mode during development
npm run dev

# Then in another terminal, test changes
merlin

# Build for production
npm run build
```

### Quality Checks

| Command              | Description                           | When to Use                     |
| -------------------- | ------------------------------------- | ------------------------------- |
| `npm run lint`       | Run ESLint on `src/**/*.ts`           | Before commits, in CI           |
| `npm run format`     | Format code with Prettier             | Before commits                  |
| `npm run type-check` | TypeScript type checking without emit | Before commits, when types fail |

**Full quality check**:

```bash
npm run lint && npm run type-check && npm run knip && npm run test && npm run build
npx prettier --check "src/**/*.ts" "tests/**/*.ts" "docs/**/*.md"
```

### Testing

| Command                 | Description                    | When to Use                   |
| ----------------------- | ------------------------------ | ----------------------------- |
| `npm run test`          | Run all tests once             | Before commits, in CI         |
| `npm run test:watch`    | Run tests in watch mode        | During test development       |
| `npm run test:coverage` | Run tests with coverage report | Before PRs, checking coverage |

**Run single test file**:

```bash
npx vitest run tests/unit/message.test.ts
```

**Run single test**:

```bash
npx vitest run -t "should format message with scope"
```

**Debug test**:

```bash
npx vitest run --inspect-brk tests/unit/message.test.ts
```

---

## CLI Usage

### Basic Commands

```bash
# Interactive commit workflow
merlin
merlin commit
merlin c  # Alias

# Configuration management
merlin config
merlin config --show
merlin config --reset

# Project initialization
merlin init
merlin init --husky-only
merlin init --commitlint-only

# Help and version
merlin --help
merlin --version
```

### Commit Options

| Option        | Description                        | Example              |
| ------------- | ---------------------------------- | -------------------- |
| `--dry-run`   | Preview commit without creating it | `merlin --dry-run`   |
| `--no-verify` | Skip git hooks (commitlint, husky) | `merlin --no-verify` |
| `--amend`     | Amend previous commit              | `merlin --amend`     |

**Examples**:

```bash
# Preview what commit would look like
merlin --dry-run

# Create commit skipping hooks (emergency only!)
merlin --no-verify

# Amend last commit
merlin --amend
```

### Config Options

| Option    | Description                   | Example                 |
| --------- | ----------------------------- | ----------------------- |
| `--show`  | Display current configuration | `merlin config --show`  |
| `--reset` | Reset to defaults             | `merlin config --reset` |

---

## Debugging

### Debug Mode

Enable Node.js debugging:

```bash
# Debug the CLI
node --inspect-brk bin/merlin.js

# Or use npm script
NODE_OPTIONS='--inspect-brk' merlin
```

Then open `chrome://inspect` in Chrome.

### Console Logging

Add debug logs (remove before committing):

```typescript
// Temporary debugging
console.log('Debug:', { variable, otherVariable });
console.error('Error:', error);
console.dir(complexObject, { depth: null });
```

### TypeScript Errors

**Problem**: Type errors during development

**Solution**:

```bash
# Check types explicitly
npm run type-check

# Or in watch mode
npx tsc --noEmit --watch
```

### Test Failures

**Problem**: Tests fail unexpectedly

**Solutions**:

```bash
# Run single test file
npx vitest run tests/unit/problematic.test.ts

# Run with verbose output
npx vitest run --reporter=verbose

# Run in watch mode to see failures immediately
npm run test:watch
```

### Build Issues

**Problem**: Build fails or produces unexpected output

**Solutions**:

```bash
# Clean and rebuild
npm run clean
npm run build

# Check for TypeScript errors
npm run type-check

# Verify tsconfig.json is correct
cat tsconfig.json
```

### Git Hooks Failing

**Problem**: Pre-commit hook blocks commit

**Solutions**:

```bash
# Run checks manually to see what's failing
npm run lint
npm run format
npm run type-check

# Fix issues
npm run format  # Auto-fix formatting
npm run lint -- --fix  # Auto-fix linting

# Then try commit again
git commit
```

---

## Common Gotchas

### 1. ESM vs CommonJS

**Issue**: Merlin uses ES Modules, not CommonJS

**Don't do**:

```javascript
const { commitCommand } = require('./commands/commit');  // ❌
```

**Do**:

```typescript
import { commitCommand } from './commands/commit.js';  // ✅
// Note: .js extension required for ESM
```

### 2. File Extensions in Imports

**Issue**: ESM requires `.js` extension in imports (even for `.ts` files)

**Don't do**:

```typescript
import { commit } from './lib/git';  // ❌
```

**Do**:

```typescript
import { commit } from './lib/git.js';  // ✅
// TypeScript compiler resolves .ts file
```

### 3. execa Import

**Issue**: execa v9 is ESM-only

**Don't do**:

```typescript
import execa from 'execa';  // ❌
```

**Do**:

```typescript
import { execa } from 'execa';  // ✅
```

### 4. Testing Async Functions

**Issue**: Forgetting to await in tests

**Don't do**:

```typescript
it('should commit', () => {
  commit('message');  // ❌ Missing await
  expect(something).toBe(true);
});
```

**Do**:

```typescript
it('should commit', async () => {
  await commit('message');  // ✅
  expect(something).toBe(true);
});
```

### 5. Mock Placement

**Issue**: Mocks must be before imports

**Don't do**:

```typescript
import { commit } from '../src/lib/git.js';
vi.mock('../src/lib/git.js');  // ❌ Too late!
```

**Do**:

```typescript
vi.mock('../src/lib/git.js');  // ✅ Before imports
import { commit } from '../src/lib/git.js';
```

### 6. Chalk and Colors

**Issue**: Colors don't show in tests

**Reason**: Chalk detects non-TTY and disables colors

**Solution**: Don't test color codes, test content:

```typescript
// ❌ Don't test ANSI codes
expect(output).toContain('\x1b[32m');

// ✅ Test actual content
expect(output).toContain('Success');
```

### 7. Path Separators

**Issue**: Windows uses `\`, Linux/Mac use `/`

**Don't do**:

```typescript
const configPath = `${homeDir}/.merlinrc.json`;  // ❌ Breaks on Windows
```

**Do**:

```typescript
import path from 'path';
const configPath = path.join(homeDir, '.merlinrc.json');  // ✅
```

---

## Dependency Management

### Adding Dependencies

```bash
# Production dependency
npm install package-name

# Dev dependency
npm install --save-dev package-name
```

**Before adding**:

1. Check if really needed
2. Review package size (use [bundlephobia](https://bundlephobia.com/))
3. Check last update date
4. Review security (npm audit)
5. Prefer well-maintained packages

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all packages (carefully!)
npm update

# Major version updates
npm install package-name@latest
```

**Update checklist**:

1. Read CHANGELOG for breaking changes
2. Update code if needed
3. Run full test suite
4. Test CLI manually
5. Commit with `chore(deps): update package-name to vX.X.X`

### Security Audits

```bash
# Check for vulnerabilities
npm audit

# Fix automatically (if possible)
npm audit fix

# Fix with breaking changes
npm audit fix --force
```

**Process**:

1. Run `npm audit` monthly
2. Review vulnerabilities
3. Update affected packages
4. Test thoroughly
5. Document breaking changes

### Package Policy

**Allowed**:

- CLI tools (commander, inquirer, chalk, ora)
- Git utilities (execa)
- Dev tools (typescript, eslint, prettier, vitest)

**Not Allowed**:

- Network libraries (no network calls)
- Analytics/telemetry
- Large bundles (>1MB)
- Unmaintained packages (>1 year)

---

## Performance Tips

### Build Performance

```bash
# Faster builds with swc (future consideration)
# Current: tsc takes ~2-3 seconds
# Target: <1 second with swc
```

### Test Performance

```bash
# Run specific tests only
npx vitest run tests/unit/validators.test.ts

# Parallel testing (default in vitest)
npm run test  # Runs tests in parallel

# Skip slow tests during development
it.skip('slow test', () => {  });
```

---

## Environment Variables

Merlin doesn't use environment variables by design (offline-first).

But for development:

```bash
# Debug mode
DEBUG=merlin:* merlin

# Skip hooks
SKIP_HOOKS=1 merlin
```

---

## Release Checklist

Before releasing new version:

- [ ] All tests pass
- [ ] No console.logs in code
- [ ] README.md updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] npm audit passes
- [ ] Build succeeds
- [ ] CLI works locally (`npm link`)
- [ ] Documentation updated
- [ ] Examples tested

---

## Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vitest Documentation](https://vitest.dev/)
- [Commander.js Documentation](https://github.com/tj/commander.js)
- [Inquirer Documentation](https://github.com/SBoudrias/Inquirer.js)
- .claude/guides/architecture.md - Architecture overview
- .claude/guides/git-workflow.md - Git workflow
