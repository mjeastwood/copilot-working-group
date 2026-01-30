# Testing Guide

This project uses [Vitest](https://vitest.dev/) as the testing framework along with [React Testing Library](https://testing-library.com/react) for component testing.

## Prerequisites

Make sure you have all dependencies installed:

```bash
npm install
```

## Running Tests

### Run all tests once

```bash
npm test
```

This runs all tests in run mode (non-watch mode), which is useful for CI/CD pipelines.

### Run tests in watch mode

```bash
npm test -- --watch
```

Watch mode will re-run tests automatically when you make changes to your code.

### Run tests with UI

```bash
npm run test:ui
```

This opens an interactive UI in your browser where you can:
- See all your tests
- Filter and run specific tests
- View test results and errors
- Debug failing tests

### Run tests with coverage

```bash
npm run test:coverage
```

Generates a code coverage report showing which lines of code are covered by tests.

## Running Specific Tests

### Run a specific test file

```bash
npm test -- src/components/ProductDetail/index.test.tsx
```

### Run tests matching a pattern

```bash
npm test -- --grep "ProductDetail"
```

### Run a single test

```bash
npm test -- --grep "should render the product detail page"
```

## Test Structure

Tests are co-located with their components:

```
src/
  components/
    ProductDetail/
      index.tsx
      index.test.tsx    # Tests for ProductDetail component
      ProductDetail.module.css
```

## Writing Tests

### Example Test Structure

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Testing Components with React Query and Router

Many components use React Query and React Router. See `src/components/ProductDetail/index.test.tsx` for examples of how to:
- Set up providers (QueryClientProvider, RouterProvider, CartProvider)
- Mock API services
- Test async data loading
- Test user interactions

## Available Matchers

This project uses `@testing-library/jest-dom` which provides custom matchers:

- `toBeInTheDocument()`
- `toHaveTextContent()`
- `toHaveAttribute()`
- `toBeEnabled()` / `toBeDisabled()`
- And many more - see [jest-dom documentation](https://github.com/testing-library/jest-dom)

## Debugging Tests

### View test output in detail

```bash
npm test -- --reporter=verbose
```

### Debug a specific test

Add `debugger` statements in your test and run:

```bash
node --inspect-brk ./node_modules/vitest/vitest.mjs --run
```

Then open Chrome DevTools to debug.

## Continuous Integration

Tests run automatically in CI. Make sure all tests pass before pushing:

```bash
npm test && npm run lint && npm run build
```

## Test Coverage Goals

- Aim for at least 80% code coverage
- Focus on testing critical user paths
- Test edge cases and error scenarios
- Ensure accessibility is tested

## Current Test Suite

### ProductDetail Component (17 tests)
- ✅ Rendering with default props
- ✅ Edge cases with product data
- ✅ Loading states
- ✅ Error and missing data handling
- ✅ User interactions (add to cart)
- ✅ Accessibility checks
- ✅ Props updates and re-rendering
- ✅ Conditional rendering based on product status

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [jest-dom Matchers](https://github.com/testing-library/jest-dom)
