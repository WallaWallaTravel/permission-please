# Development Workflow & Best Practices

This document outlines the day-to-day development workflow, Git conventions, and best practices for the Permission Please project.

## 🔄 Daily Development Cycle

### Morning Routine

```bash
# 1. Pull latest changes
git checkout main
git pull origin main

# 2. Update dependencies if needed
npm install

# 3. Run migrations if needed
npx prisma migrate dev

# 4. Start development environment
npm run dev          # Terminal 1: Dev server
npm run test         # Terminal 2: Test watch mode
npm run db:studio    # Terminal 3: Database GUI (optional)
```

### Feature Development Loop

```bash
# 1. Create feature branch
git checkout -b feature/form-templates

# 2. Write test first (TDD)
# Create: src/lib/templates.test.ts
# Write failing test

# 3. Implement feature
# Create: src/lib/templates.ts
# Make test pass

# 4. Run tests continuously
npm run test  # Should already be running in watch mode

# 5. Manual testing
# Test in browser at http://localhost:3000

# 6. Check coverage
npm run test:coverage

# 7. Commit with descriptive message
git add .
git commit -m "feat: add form template system"

# Pre-commit hook automatically runs:
# - ESLint (fixes issues)
# - Prettier (formats code)
# - Type check
# - Related tests

# 8. Push to remote
git push origin feature/form-templates

# 9. Create Pull Request
# Use GitHub web interface
```

## 📝 Git Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear, semantic commit history.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature for the user
- **fix**: Bug fix for the user
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semi colons, etc)
- **refactor**: Code refactoring (neither fixes a bug nor adds a feature)
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Build process or auxiliary tool changes
- **ci**: CI/CD configuration changes

### Examples

```bash
# New feature
git commit -m "feat(forms): add template library"

# Bug fix
git commit -m "fix(signatures): resolve canvas rendering on Safari"

# Documentation
git commit -m "docs(api): update authentication examples"

# Performance improvement
git commit -m "perf(dashboard): implement virtual scrolling for form list"

# Breaking change
git commit -m "feat(api): redesign form submission API

BREAKING CHANGE: Form submission endpoint now requires authentication token"

# Multiple files
git commit -m "feat(auth): implement OAuth providers

- Add Google OAuth
- Add Microsoft OAuth
- Update auth documentation
- Add provider selection UI"
```

## 🌿 Branch Strategy

### Main Branches

- **`main`** - Production-ready code, always deployable
- **`develop`** - Integration branch for features (optional for small teams)

### Supporting Branches

#### Feature Branches

```bash
# Format: feature/<feature-name>
feature/form-templates
feature/email-reminders
feature/analytics-dashboard

# Create from main
git checkout -b feature/form-templates main

# Merge back to main via PR
```

#### Bug Fix Branches

```bash
# Format: fix/<bug-description>
fix/signature-canvas-ios
fix/email-formatting

# Create from main
git checkout -b fix/signature-canvas-ios main
```

#### Hotfix Branches (Production bugs)

```bash
# Format: hotfix/<issue>
hotfix/security-patch
hotfix/email-server-down

# Create from main, merge to main and develop
```

### Branch Naming Rules

- Use lowercase
- Use hyphens to separate words
- Be descriptive but concise
- Include ticket number if applicable: `feature/PP-123-form-templates`

## 🔀 Pull Request Process

### 1. Before Creating PR

```bash
# Ensure all tests pass
npm run test:coverage

# Ensure type checking passes
npm run type-check

# Ensure linting passes
npm run lint

# Ensure E2E tests pass (for major features)
npm run test:e2e

# Build successfully
npm run build
```

### 2. PR Template

Create `.github/pull_request_template.md`:

```markdown
## Description

Brief description of what this PR does

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## How Has This Been Tested?

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Manual testing

## Checklist

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## Screenshots (if applicable)

## Related Issues

Closes #<issue-number>
```

### 3. PR Review Guidelines

**For Authors:**

- Keep PRs small and focused (< 400 lines changed)
- Write clear description and rationale
- Add screenshots/videos for UI changes
- Respond to feedback promptly
- Don't merge your own PRs

**For Reviewers:**

- Review within 24 hours
- Be constructive and specific
- Ask questions to understand intent
- Approve when satisfied
- Suggest improvements, don't demand perfection

### 4. Merging

```bash
# After approval, merge using GitHub
# Prefer "Squash and merge" for cleaner history
# Delete branch after merging
```

## 🧪 Testing Workflow

### Test-Driven Development (TDD) Cycle

```
1. ❌ Write failing test
   ↓
2. ✅ Write minimal code to pass
   ↓
3. ♻️ Refactor while keeping tests green
   ↓
4. 🔁 Repeat
```

### Example TDD Session

```typescript
// Step 1: Write test (RED)
describe('createFormTemplate', () => {
  it('creates a template from existing form', () => {
    const form = buildForm({ title: 'Zoo Trip' });
    const template = createFormTemplate(form);

    expect(template.title).toBe('Zoo Trip Template');
    expect(template.isTemplate).toBe(true);
  });
});

// Run test: npm run test
// Result: ❌ FAIL - createFormTemplate is not defined

// Step 2: Implement (GREEN)
export function createFormTemplate(form: Form): Template {
  return {
    ...form,
    title: `${form.title} Template`,
    isTemplate: true,
  };
}

// Run test: npm run test
// Result: ✅ PASS

// Step 3: Refactor (REFACTOR)
export function createFormTemplate(form: Form): Template {
  return {
    ...form,
    title: form.title.includes('Template') ? form.title : `${form.title} Template`,
    isTemplate: true,
    createdAt: new Date(),
  };
}

// Run test: npm run test
// Result: ✅ PASS - Tests still pass after refactor!
```

### When to Write Tests

**Always write tests for:**

- ✅ Business logic functions
- ✅ API routes
- ✅ Data transformations
- ✅ Custom hooks
- ✅ Utility functions
- ✅ Complex components

**Optional tests for:**

- Simple presentational components
- Third-party library wrappers
- Configuration files

### Test Coverage Goals

```bash
# Check coverage
npm run test:coverage

# Open coverage report in browser
open coverage/index.html
```

**Targets:**

- Overall: > 80%
- Critical paths (auth, signatures): > 95%
- New features: > 85%

## 🚀 Deployment Workflow

### Automated Deployment (Vercel)

```
Push to main → GitHub webhook → Vercel build → Deploy to production
                                        ↓
                              Run all checks:
                              - Build
                              - Tests
                              - Type check
                              - Linting
                              - E2E tests
```

### Manual Deployment Checklist

Before deploying to production:

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] E2E tests passed
- [ ] Performance audit passed (Lighthouse > 90)
- [ ] Accessibility audit passed
- [ ] Security audit passed (`npm audit`)
- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] Error tracking configured (Sentry)
- [ ] Monitoring dashboards set up

### Rollback Procedure

If something goes wrong:

```bash
# Vercel automatically keeps previous deployments
# Rollback via Vercel dashboard or CLI

vercel rollback <deployment-url>

# Or redeploy previous commit
git revert HEAD
git push origin main
```

## 📊 Code Review Checklist

### Functionality

- [ ] Code does what it's supposed to do
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] No obvious bugs

### Testing

- [ ] Tests are present and meaningful
- [ ] Tests cover happy path and edge cases
- [ ] Tests are readable and maintainable
- [ ] No commented-out tests

### Code Quality

- [ ] Code is readable and self-documenting
- [ ] No duplicate code
- [ ] Functions are small and focused
- [ ] Variable names are descriptive
- [ ] No magic numbers or strings

### Performance

- [ ] No unnecessary re-renders (React)
- [ ] Database queries are optimized
- [ ] Images are optimized
- [ ] No memory leaks

### Security

- [ ] Input validation present
- [ ] Authentication/authorization checked
- [ ] No sensitive data in logs
- [ ] No SQL injection vulnerabilities

### Accessibility

- [ ] Semantic HTML used
- [ ] ARIA attributes where needed
- [ ] Keyboard navigation works
- [ ] Color contrast sufficient

## 🛠 Debugging Tips

### React DevTools Profiler

```bash
# Find performance issues
1. Open React DevTools
2. Go to Profiler tab
3. Click record
4. Interact with app
5. Stop recording
6. Analyze flamegraph
```

### Database Query Debugging

```typescript
// Enable Prisma query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Or use Prisma Studio
npm run db:studio
```

### Network Debugging

```bash
# Check API calls in browser DevTools
1. Open Network tab
2. Filter by Fetch/XHR
3. Inspect request/response
4. Check timing
```

### Error Tracking

```typescript
// Sentry captures errors automatically
// View in Sentry dashboard
// https://sentry.io

// Manually log errors
import * as Sentry from '@sentry/nextjs';

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { component: 'FormSubmission' },
    extra: { formId, userId },
  });
}
```

## 📈 Performance Monitoring

### Local Performance Testing

```bash
# Lighthouse CI
npm run build
npm run start
npx lighthouse http://localhost:3000 --view

# Bundle analysis
npm run build
npx @next/bundle-analyzer
```

### Production Monitoring

- **Vercel Analytics**: Real User Monitoring (RUM)
- **Sentry**: Error tracking and performance
- **Prisma**: Database query performance

```typescript
// Custom performance logging
console.time('FormCreation');
await createForm(data);
console.timeEnd('FormCreation');
```

## 🎯 Definition of Done

A feature is "done" when:

- [ ] Code is written and reviewed
- [ ] All tests pass (unit, integration, E2E)
- [ ] Code coverage meets threshold
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Accessibility tested
- [ ] Performance tested (if applicable)
- [ ] Documentation updated
- [ ] Deployed to staging and tested
- [ ] Product owner approves
- [ ] Deployed to production
- [ ] Monitoring confirms no errors

---

**Remember**: Quality over speed. Take time to do it right the first time. 🎯
