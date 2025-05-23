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