# API Architecture Guide

This document outlines the best practices and structure for our Next.js API routes.

## Key Components

### 1. Schema Validation with Zod (`schemas.ts`)

All API routes should validate input using the Zod schemas defined in `src/lib/schemas.ts`. This ensures:

- Type-safe request handling
- Consistent validation errors
- Self-documenting API structure

Example usage:
```typescript
import { quizInputSchema } from '@/lib/schemas';

// In an API route
const result = quizInputSchema.safeParse(data);
if (!result.success) {
  return errorResponse('Validation error', result.error.flatten(), 400);
}
// Use validated data safely
const validData = result.data;
```

### 2. Standardized API Responses (`api-utils.ts`)

All API routes should use the response utilities from `src/lib/api-utils.ts`:

- `successResponse(data, status)` - For successful responses
- `errorResponse(message, details, status)` - For error responses
- `handleApiError(error, context)` - For handling exceptions

Example usage:
```typescript
import { successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

export async function GET() {
  try {
    const data = await fetchData();
    return successResponse(data);
  } catch (error) {
    return handleApiError(error, 'GET /api/example');
  }
}
```

### 3. Form Data Parsing (`formDataUtils.ts`)

Use the `parseFormData` utility to handle complex form data structures:

```typescript
import { parseFormData } from '@/lib/formDataUtils';
import { quizInputSchema } from '@/lib/schemas';

const formDataResult = await parseFormData(formData, quizInputSchema);
if (!formDataResult.success) {
  return errorResponse('Invalid form data', formDataResult.error.flatten(), 400);
}

// Use the validated data
const validData = formDataResult.data;
```

## Best Practices

1. **Database Client Usage**
   - Always use the singleton Prisma client from `src/lib/prisma.ts`
   - Call `prisma.$disconnect()` in a `finally` block

2. **Error Handling**
   - Use the `handleApiError` function for consistent error responses
   - Add context to error logs for easier debugging
   - Handle specific error types with appropriate status codes

3. **Type Safety**
   - Define proper TypeScript interfaces or use Zod inferred types
   - Avoid `any` types, especially in public API interfaces
   - Properly type guard error handling

4. **Code Organization**
   - Keep API routes focused on request/response handling
   - Extract business logic to service functions
   - Reuse validation schemas across related endpoints

## Schema Types

The main schema types are:

| Schema | Purpose |
|--------|---------|
| `questionBaseSchema` | Core question fields |
| `quizBaseSchema` | Core quiz fields |
| `questionInputSchema` | Validates question API input, includes upload fields |
| `quizInputSchema` | Validates quiz API input, includes upload fields |
| `questionDbSchema` | Schema for database operations |
| `quizDbSchema` | Schema for database operations |
| `apiResponseSchema` | Standard API response structure |

## Migration Path

When refactoring existing API routes:

1. First, import and use response utilities
2. Next, apply standard error handling pattern
3. Then, migrate to the centralized schema validation
4. Finally, replace any `any` types with proper type definitions

The team should prioritize fixing remaining type issues marked with `eslint-disable` comments, especially in the database interaction code. 