import { NextResponse } from 'next/server';
import { z } from 'zod';
import { ApiResponse } from './schemas';

/**
 * Standard success response
 */
export function successResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data } as ApiResponse<T>, { status });
}

/**
 * Standard error response
 */
export function errorResponse(message: string, details?: unknown, status = 500): NextResponse {
  console.error(`API Error (${status}):`, message, details || '');
  
  return NextResponse.json(
    { 
      error: message, 
      ...(details ? { details } : {}) 
    } as ApiResponse<never>, 
    { status }
  );
}

// Types for Prisma errors
type PrismaError = Error & {
  code: string;
  meta?: Record<string, unknown>;
  clientVersion?: string;
  name: string;
}

/**
 * Handle common API errors
 */
export function handleApiError(error: unknown, context = ''): NextResponse {
  // Log the error for server debugging
  console.error(`API Error in ${context || 'unknown context'}:`, error);
  
  // Validation errors
  if (error instanceof z.ZodError) {
    return errorResponse(
      'Validation error', 
      error.flatten(), 
      400
    );
  }

  // Prisma errors
  if (isPrismaError(error)) {
    // Common Prisma error codes
    if (error.code === 'P2025') {
      return errorResponse(
        'Resource not found', 
        { code: error.code, details: error.meta }, 
        404
      );
    }
    
    if (error.code === 'P2002') {
      return errorResponse(
        'Unique constraint violation', 
        { code: error.code, details: error.meta }, 
        409
      );
    }
    
    return errorResponse(
      'Database error', 
      { code: error.code, details: error.meta }, 
      500
    );
  }
  
  // Prisma validation errors - identified by name pattern
  if (error instanceof Error && error.name === 'PrismaClientValidationError') {
    return errorResponse(
      'Database validation error', 
      { message: error.message }, 
      400
    );
  }
  
  // Generic error handling
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  return errorResponse(message);
}

/**
 * Safely parse form data with Zod schema
 */
export async function parseFormData<T extends z.ZodTypeAny>(
  formData: FormData, 
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: z.ZodError }> {
  try {
    // Transform FormData into a plain object
    const data: Record<string, unknown> = {};
    
    // Convert FormData entries to a plain object (TypeScript-safe way)
    const entries = Array.from(formData.entries());
    
    for (const [key, value] of entries) {
      // Handle array notation in form data (e.g., questions[0][answers][0])
      if (key.includes('[') && key.includes(']')) {
        // Parse as nested path
        const path = key.replace(/\[/g, '.').replace(/\]/g, '').split('.');
        let current = data;
        
        for (let i = 0; i < path.length - 1; i++) {
          const segment = path[i];
          
          // If segment is a number, ensure parent is an array
          if (!isNaN(Number(segment)) && i > 0) {
            const parentKey = path[i - 1];
            const curr = current as Record<string, unknown>;
            
            if (!Array.isArray(curr[parentKey])) {
              curr[parentKey] = [];
            }
            
            const parentArray = curr[parentKey] as unknown[];
            if (!parentArray[Number(segment)]) {
              parentArray[Number(segment)] = {};
            }
            
            current = parentArray[Number(segment)] as Record<string, unknown>;
          } else {
            const curr = current as Record<string, unknown>;
            if (!curr[segment]) {
              curr[segment] = {};
            }
            current = curr[segment] as Record<string, unknown>;
          }
        }
        
        // Set value at the final path
        const finalKey = path[path.length - 1];
        (current as Record<string, unknown>)[finalKey] = value;
      } else {
        // For simple keys
        data[key] = value;
      }
    }
    
    // Parse with Zod schema
    const result = schema.safeParse(data);
    
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Type guard for Prisma errors
 */
export function isPrismaError(error: unknown): error is PrismaError {
  if (!(error instanceof Error)) return false;
  
  const err = error as Partial<PrismaError>;
  return typeof err.code === 'string' && (
    // Check for common Prisma error name patterns
    error.name.includes('Prisma') || 
    error.name.includes('PrismaClient')
  );
} 