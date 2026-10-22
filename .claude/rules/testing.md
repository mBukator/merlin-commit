---
paths:
  - "tests/**/*.test.ts"
---

# Testing Guidelines

**Last Updated**: 2026-02-07

These guidelines apply to all test files in the `tests/` directory.

---

## Testing Philosophy

**Prioritize plain tests over mocks.** Write real, integration-style tests first. Only introduce mocks when absolutely necessary.

###

When to Use Mocks

Use mocks for:

- External API calls (though merlin-commit has none by design)
- File system operations that would modify real user files
- Git operations that would create actual commits during tests
- Time-dependent functionality requiring fixed timestamps

### When NOT to Use Mocks

Don't mock:

- Internal module interactions
- Pure functions (message building, validation, formatting)
- Configuration parsing and validation
- String manipulation and constant lookups
- Business logic that doesn't touch the file system or git

---

## Test File Naming Convention

Test files must clearly indicate what they are testing.

**For command tests:**

```
<command-name>-command.test.ts
```

Examples:

- `commit-command.test.ts`
- `config-command.test.ts`
- `init-command.test.ts`

**For library module tests:**

```
<module-name>.test.ts
```

Examples:

- `git.test.ts`
- `message.test.ts`
- `prompt.test.ts`

**For utility tests:**

```
<utility-name>.test.ts
```

Examples:

- `config.test.ts`
- `validators.test.ts`

---

## Test Structure

Use the **Arrange-Act-Assert** pattern with nested `describe` blocks:

```typescript
describe('ModuleName', () => {
    describe('functionName', () => {
        describe('when condition', () => {
            it('should expected behavior', () => {
                // Arrange - Set up test data and dependencies
                const input = 'test value';
                const expected = 'expected result';

                // Act - Execute the function
                const result = functionName(input);

                // Assert - Verify the outcome
                expect(result).toBe(expected);
            });
        });
    });
});
```

**Example from merlin-commit:**

```typescript
describe('buildCommitMessage', () => {
    describe('when scope is provided', () => {
        it('should include scope in parentheses', () => {
            // Arrange
            const answers: CommitAnswers = {
                type: 'feat',
                scope: 'api',
                subject: 'add user endpoint'
            };

            // Act
            const message = buildCommitMessage(answers);

            // Assert
            expect(message).toBe('feat(api): add user endpoint');
        });
    });

    describe('when scope is not provided', () => {
        it('should omit scope from message', () => {
            // Arrange
            const answers: CommitAnswers = {
                type: 'fix',
                subject: 'resolve bug'
            };

            // Act
            const message = buildCommitMessage(answers);

            // Assert
            expect(message).toBe('fix: resolve bug');
        });
    });
});
```

---

## Testing Pure Functions

Pure functions are easiest to test - no mocks needed.

```typescript
// src/utils/validators.ts
export function validateSubjectLength(
    subject: string,
    maxLength: number
): ValidationResult {
    if (subject.length > maxLength) {
        return { valid: false, error: `Subject exceeds ${maxLength} characters` };
    }
    return { valid: true };
}

// tests/unit/validators.test.ts
describe('validateSubjectLength', () => {
    it('should return valid for short subjects', () => {
        const result = validateSubjectLength('short', 72);
        expect(result.valid).toBe(true);
    });

    it('should return invalid for long subjects', () => {
        const longSubject = 'a'.repeat(100);
        const result = validateSubjectLength(longSubject, 72);

        expect(result.valid).toBe(false);
        expect(result.error).toContain('exceeds 72 characters');
    });
});
```

---

## Testing With Mocks

### Mocking Git Operations

```typescript
import { vi } from 'vitest';
import { execa } from 'execa';
import { commit } from '../src/lib/git';

// Mock execa
vi.mock('execa');

describe('commit', () => {
    it('should call git commit with correct arguments', async () => {
        // Arrange
        const message = 'feat: add feature';
        const mockExeca = vi.mocked(execa);
        mockExeca.mockResolvedValue({
            stdout: 'abc123 feat: add feature',
            stderr: '',
            exitCode: 0
        } as any);

        // Act
        await commit(message, { noVerify: false, amend: false });

        // Assert
        expect(mockExeca).toHaveBeenCalledWith('git', ['commit', '-m', message]);
    });
});
```

### Mocking File System

```typescript
import { vi } from 'vitest';
import * as fs from 'fs';
import { loadConfig } from '../src/utils/config';

vi.mock('fs');

describe('loadConfig', () => {
    it('should load config from file', () => {
        // Arrange
        const mockConfig = { theme: 'wizard', maxSubjectLength: 72 };
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockConfig));

        // Act
        const config = loadConfig();

        // Assert
        expect(config).toEqual(mockConfig);
    });
});
```

---

## Test Coverage

### Target Coverage

- **Overall**: >80%
- **Critical paths**: 100% (security, git operations, validation)
- **Utils**: 100% (they're pure functions, easy to test)

### Don't Chase 100%

- Some code is hard to test meaningfully
- Focus on behavior, not coverage numbers
- Prefer clear tests over complex mocks for coverage

### Running Coverage

```bash
npm run test:coverage
```

---

## Testing Commands (Orchestration Layer)

Commands coordinate workflows, so focus on testing the coordination logic.

```typescript
describe('commitCommand', () => {
    beforeEach(() => {
        // Mock dependencies
        vi.mock('../src/lib/git');
        vi.mock('../src/lib/prompt');
        vi.mock('../src/lib/message');
    });

    it('should throw error when not in git repo', async () => {
        // Arrange
        vi.mocked(isGitRepo).mockResolvedValue(false);

        // Act & Assert
        await expect(commitCommand({})).rejects.toThrow('Not a git repository');
    });

    it('should create commit when user confirms', async () => {
        // Arrange
        vi.mocked(isGitRepo).mockResolvedValue(true);
        vi.mocked(hasStagedChanges).mockResolvedValue(true);
        vi.mocked(promptUser).mockResolvedValue({
            type: 'feat',
            subject: 'add feature'
        });
        vi.mocked(buildCommitMessage).mockReturnValue('feat: add feature');
        vi.mocked(confirm).mockResolvedValue(true);

        // Act
        await commitCommand({});

        // Assert
        expect(commit).toHaveBeenCalledWith('feat: add feature', {});
    });
});
```

---

## Testing Library Modules (Implementation Layer)

Lib modules implement domain logic. Test the logic, mock external dependencies.

```typescript
describe('buildCommitMessage', () => {
    it('should format message with all components', () => {
        const answers: CommitAnswers = {
            type: 'feat',
            scope: 'api',
            subject: 'add endpoint',
            body: 'Detailed description',
            breaking: 'BREAKING CHANGE: API changed',
            issues: 'Closes #123'
        };

        const message = buildCommitMessage(answers);

        expect(message).toContain('feat(api): add endpoint');
        expect(message).toContain('Detailed description');
        expect(message).toContain('BREAKING CHANGE: API changed');
        expect(message).toContain('Closes #123');
    });
});
```

---

## Testing Utils (Pure Function Layer)

Utils must be pure functions, so tests are straightforward.

```typescript
describe('validators', () => {
    describe('validateSubjectLength', () => {
        it.each([
            ['valid short subject', 'short', 72, true],
            ['valid at max length', 'a'.repeat(72), 72, true],
            ['invalid over max length', 'a'.repeat(73), 72, false],
            ['valid empty', '', 72, true],
        ])('%s', (_, subject, maxLength, expectedValid) => {
            const result = validateSubjectLength(subject, maxLength);
            expect(result.valid).toBe(expectedValid);
        });
    });
});
```

---

## Common Testing Patterns

### Testing Async Functions

```typescript
it('should resolve with result', async () => {
    const result = await asyncFunction();
    expect(result).toBe(expected);
});

it('should reject with error', async () => {
    await expect(asyncFunction()).rejects.toThrow('Error message');
});
```

### Testing Error Conditions

```typescript
it('should throw error for invalid input', () => {
    expect(() => functionName(invalidInput)).toThrow('Invalid input');
});
```

### Parameterized Tests

```typescript
it.each([
    ['input1', 'output1'],
    ['input2', 'output2'],
    ['input3', 'output3'],
])('should handle %s correctly', (input, expected) => {
    const result = functionName(input);
    expect(result).toBe(expected);
});
```

### Setup and Teardown

```typescript
describe('functionName', () => {
    beforeEach(() => {
        // Runs before each test
    });

    afterEach(() => {
        // Runs after each test
        vi.clearAllMocks();
    });

    beforeAll(() => {
        // Runs once before all tests
    });

    afterAll(() => {
        // Runs once after all tests
    });
});
```

---

## Running Tests

### Run All Tests

```bash
npm run test
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run test:coverage
```

### Single Test File

```bash
npx vitest run tests/unit/message.test.ts
```

### Single Test

```bash
npx vitest run -t "should format message"
```

---

## Best Practices

1. **Test behavior, not implementation**
    - Don't test private methods
    - Test public API and outcomes

2. **Write tests first for bugs**
    - When you find a bug, write a failing test
    - Fix the bug
    - Test now passes

3. **Keep tests simple**
    - If a test is complex, the code might be too complex
    - Refactor both

4. **One assertion per test** (when reasonable)
    - Makes failures clearer
    - Each test has one purpose

5. **Use descriptive test names**
    - "should return user when ID is valid"
    - Not "test1" or "works"

6. **Don't test library code**
    - Trust execa, inquirer, chalk, etc.
    - Test YOUR logic only

---

## Troubleshooting

### Tests Fail Randomly

- Likely async timing issues
- Use `await` properly
- Check for shared state between tests

### Mocks Not Working

- Ensure `vi.mock()` is called before imports
- Check mock is properly typed
- Verify mock path is correct

### Coverage Not 100%

- Don't worry about it
- Focus on critical paths
- Some code is hard to test meaningfully

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing JavaScript](https://testingjavascript.com/)
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
