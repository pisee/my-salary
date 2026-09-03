# Project-wide behavior

## 1. Be a good software engineer

### 1.1 Always work in feature branches

No matter how small the change, always create a new feature branch from `main`.

```bash
git switch -c feat/your-feature-name
# ... work ...
git add .
git commit -m "feat: brief description of changes"
git push origin feat/your-feature-name
```

### 1.2 Commit messages in conventional format

Follow [Conventional Commits](https://www.conventionalcommits.org/) with a summary line and optional detailed body.

```
<type>: <short description>

<blank line>

[optional detailed body]
```

- **type**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

### 1.3 Prefer tiny commits over big ones

Each commit should represent a single logical change. This makes bisecting easier and PR reviews clearer.

### 1.4 Clean up after yourself

- Remove commented-out code
- Remove unused imports
- Keep code minimal and focused

## 2. Code style and patterns

### 2.1 Use interfaces instead of inline types where possible

```typescript
// OK
interface MyProps {
  id: string;
  name: string;
}

function MyComponent({ id, name }: MyProps) {
  // ...
}

// NOT OK
function MyComponent({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  // ...
}
```

### 2.2 Avoid deeply nested ternaries

```typescript
// NOT OK (hard to read)
const result =
  condition1
    ? value1
    : condition2
      ? value2
      : condition3
        ? value3
        : value4;

// Better
let result;
if (condition1) {
  result = value1;
} else if (condition2) {
  result = value2;
} else if (condition3) {
  result = value3;
} else {
  result = value4;
}
```

### 2.3 Prefer inline return for simple conditions

```typescript
function getStatus(isComplete: boolean, isActive: boolean) {
  // OK
  if (isComplete) return "completed";
  if (isActive) return "active";
  return "pending";
}
```

### 2.4 Use concise boolean expressions

```typescript
// Better
function showMessage(hasMessages: boolean, isError: boolean) {
  return hasMessages || isError;
}
```

## 3. Testing philosophy

### 3.1 Prefer real-world interaction tests

- Unit tests are fine, but integration tests showing real user flows are better
- Don't test implementation details; test observable behavior
- Real data and real user scenarios > isolated mocks when possible

### 3.2 Testing should be fast but comprehensive

Balance speed with coverage:

- Quick unit tests for simple logic
- Integration tests for core flows
- Slow tests isolated in separate files

## 4. Documentation standards

### 4.1 Keep documentation in the code

- Use clear JSDoc for functions and components
- Document complex logic inline with `// explanation:` comments
- Keep docs in sync with code changes (run `npm run format-docs` to regenerate)

### 4.2 Use storybook for component documentation

- Each component gets its own story file
- Show various states and interactions
- Keep stories updated with code changes

## 5. Tooling and workflow

### 5.1 Run format-on-save

All code must follow the project's formatting standards. Use `npm run format` to fix issues before committing.

### 5.2 Keep dependencies updated

Update dependencies regularly and test thoroughly after updates.

### 5.3 Prefer npm over yarn

While both work, the project uses npm by default. Use `npm install` instead of `yarn add`.

## 6. Performance considerations

### 6.1 Avoid unnecessary re-renders

- Memoize expensive calculations with `useMemo`
- Stable function references with `useCallback`
- Memoize expensive components with `React.memo`

### 6.2 Efficient data fetching

- Use proper caching and invalidation
- Avoid fetching data in loops or deep component trees

## 7. Security best practices

- Never store secrets in code
- Use environment variables for sensitive configuration
- Validate all user inputs
- Follow React security guidelines

## 8. Cross-platform consistency

### 8.1 Test on both Windows and Linux

Since the project runs in WSL, test on Windows to catch path issues, case sensitivity problems, and CRLF/LF line ending differences.

### 8.2 Handle platform-specific code gracefully

Use `path.join` and appropriate path handling instead of string concatenation.

## 9. Accessibility (a11y) standards

### 9.1 All interactive elements must be keyboard accessible

Use proper HTML semantics and ARIA attributes where needed.

### 9.2 Provide focus management

- Logical tab order
- Visible focus states
- Proper focus trapping in modals

### 9.3 Use semantic HTML

Buttons for actions, links for navigation, proper headings.

## 10. Debugging and logging

### 10.1 Don't over-log

Log only what's necessary for debugging. Avoid noisy logs that clutter the console.

### 10.2 Use proper log levels

- `info`: General information
- `warn`: Potential issues
- `error`: Actual errors
- `debug`: Detailed debugging info (only in development)

### 10.3 Remove debug code before production

Never commit debug logs or temporary console statements to main.

## 11. Database schema management

### 11.1 NEVER write SQL directly in code

- No `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE` in source code
- No inline SQL in `initDatabase()` or any other function
- Never modify `migrations/*.sql` files manually

### 11.2 Schema change procedure (mandatory)

When changing DB schema, always follow this order:

1. **Edit TypeScript schema file** in `src/core/db/schema/` using `drizzle-orm/sqlite-core` API
2. **Generate migration SQL**: `npm run db:generate`
3. **Review generated SQL** in `migrations/` directory
4. **Apply to local DB** (optional): `npm run db:migrate`
5. **Build**: `npm run build` (copies migrations to `dist-electron/migrations/`)

### 11.3 Reference

See `docs/guide/migrations.md` for detailed explanation of the migration system.

---

## Behavioral Guidelines

See `docs/rule/andrej-karpathy-skills.md` for core behavioral rules:

- **Think Before Coding** — State assumptions, ask when uncertain, push back on overcomplication
- **Simplicity First** — Minimum code that solves the problem. No speculative features.
- **Surgical Changes** — Touch only what's needed. Don't refactor adjacent code.
- **Goal-Driven Execution** — Define success criteria before implementation. Verify before claiming done.
