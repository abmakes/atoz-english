import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils';
import { warmupDatabase } from '@/lib/prisma';

/**
 * API route to warm up the database connection
 * This endpoint can be called before making important database operations
 * to ensure the database is active (not in suspended mode)
 */
export async function GET() {
  try {
    // Call the centralized warmup function
    const success = await warmupDatabase();
    
    if (success) {
      return successResponse({
        status: 'ok',
        message: 'Database connection warmed up successfully'
      });
    } else {
      // If warmupDatabase returns false (should ideally throw, but handle defensively)
      return errorResponse('Database warmup query failed', undefined, 500);
    }
  } catch (error) {
    // Handle any errors thrown by warmupDatabase or other issues
    return handleApiError(error, 'Database warmup');
  }
} 