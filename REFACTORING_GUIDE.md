# API Refactoring Guide

This guide outlines how to refactor existing API routes to use the new standardized validation, error handling, and response patterns.

## Summary of Changes

1. Centralized schema validation with Zod
2. Standardized error handling and responses
3. Type-safe form data parsing
4. Proper TypeScript types and error handling

## Step-by-Step Refactoring Process

### 1. Update Imports

Replace:
```typescript
import { NextResponse } from 'next/server';
```

With:
```typescript
import { errorResponse, handleApiError, successResponse } from '@/lib/api-utils';
import { yourSchemaName } from '@/lib/schemas';
```

### 2. Replace Response Methods

Replace:
```typescript
return NextResponse.json({ data: result });
```

With:
```typescript
return successResponse(result);
```

Replace:
```typescript
return NextResponse.json({ error: "Error message" }, { status: 400 });
```

With:
```typescript
return errorResponse("Error message", details, 400);
```

### 3. Add Error Handling

Replace:
```typescript
try {
  // Your code
} catch (error) {
  console.error('Error:', error);
  return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
}
```

With:
```typescript
try {
  // Your code
} catch (error) {
  return handleApiError(error, 'Context info for debugging');
}
```

### 4. Add Schema Validation

Replace:
```typescript
const data = await request.json();
if (!data.requiredField) {
  return NextResponse.json({ error: "Missing required field" }, { status: 400 });
}
```

With:
```typescript
const data = await request.json();
const result = yourSchemaName.safeParse(data);
if (!result.success) {
  return errorResponse('Validation error', result.error.flatten(), 400);
}
const validData = result.data;
```

### 5. Handle FormData

Replace:
```typescript
const formData = await request.formData();
const field1 = formData.get('field1');
const field2 = formData.get('field2');
```

With:
```typescript
const formData = await request.formData();
const formDataResult = await parseFormData(formData, yourSchemaName);
if (!formDataResult.success) {
  return errorResponse('Invalid form data', formDataResult.error.flatten(), 400);
}
const validData = formDataResult.data;
```

## Type-Safe Tips

### Using Prisma With Enum Types

When passing enum values to Prisma, convert them to strings:

```typescript
// Convert app enum to string for Prisma
const questionType = data.type ? String(data.type) : 'MULTIPLE_CHOICE';

// Use type assertion when passing to Prisma
return prisma.question.create({
  data: {
    // ...other fields
    type: questionType as string,
  }
});
```

### Type Guards for Error Handling

Use our helper function for checking Prisma errors:

```typescript
import { isPrismaError } from '@/lib/api-utils';

if (isPrismaError(error)) {
  // Handle specific Prisma error codes
  if (error.code === 'P2025') {
    return errorResponse('Resource not found', { id }, 404);
  }
}
```

## Examples

See the following files for examples of refactored API routes:
- `/src/app/api/quizzes/[id]/route.ts`
- `/src/app/api/questions/route.ts`

## Remaining Work

The following API routes still need refactoring:
- `/src/app/api/download/route.ts`
- `/src/app/api/upload-quiz/route.ts`
- `/src/app/api/warmup/route.ts` 