import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Enhances the database URL with recommended parameters for Neon serverless PostgreSQL.
 * @param url The original database connection URL.
 * @returns The enhanced database connection URL.
 */
const enhanceDbUrl = (url: string): string => {
  // Don't modify if not a PostgreSQL URL or if required URLs are missing
  if (!url || !url.startsWith('postgres')) {
    console.warn('Database URL is missing or not PostgreSQL. Skipping enhancement.');
    return url;
  }
  if (!process.env.POSTGRES_URL_NON_POOLING) {
    console.warn('POSTGRES_URL_NON_POOLING is not set. Skipping pgbouncer specific enhancements.');
  }

  try {
    const urlObj = new URL(url);

    // Common parameters for serverless environments
    urlObj.searchParams.set('connect_timeout', '30'); // Increased timeout for potential cold starts
    urlObj.searchParams.set('pool_timeout', '15');   // Shorter timeout for waiting for a connection from the pool
    urlObj.searchParams.set('idle_timeout', '10');   // Release idle connections quickly
    // Removed statement_timeout as it might be too aggressive for complex queries

    // Check if using pgbouncer (often indicated by a specific env var or the pooled URL itself)
    // Assuming POSTGRES_PRISMA_URL is the pooled one if POSTGRES_URL_NON_POOLING is also set
    const isPGBouncer = !!process.env.POSTGRES_URL_NON_POOLING;

    if (isPGBouncer) {
      // PgBouncer might require disabling prepared statements depending on its configuration
      // urlObj.searchParams.set('pgbouncer', 'true'); // Often needed, depends on provider setup
      // urlObj.searchParams.set('prepared_statements', 'false'); // Consider if facing issues
      console.log('Applying PgBouncer specific settings to Prisma URL.');
    }

    return urlObj.toString();
  } catch (error) {
    console.error('Failed to parse or enhance database URL:', error);
    return url; // Return original URL on error
  }
};

// Determine the database URL, prioritizing the enhanced pooled URL
const prismaDbUrl = process.env.POSTGRES_PRISMA_URL
  ? enhanceDbUrl(process.env.POSTGRES_PRISMA_URL)
  : undefined; // Ensure it's explicitly undefined if not set


export const prisma = global.prisma || (() => {
  if (!prismaDbUrl) {
    throw new Error("Database URL (POSTGRES_PRISMA_URL) is not defined in environment variables.");
  }
  console.log('Initializing new PrismaClient...');

  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: prismaDbUrl,
      },
    },
  });

  // Optional: Initial connection attempt logging (can be noisy)
  // client.$connect()
  //   .then(() => console.log('PrismaClient connected.'))
  //   .catch(e => console.error('PrismaClient initial connection failed:', e));

  return client;
})();

// Prevent multiple instances during hot reloads in development
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// --- Database Utility Functions (Moved from middleware/database.ts for colocation) ---

// Keep track of the last database access time - simple in-memory approach
let lastDbAccessTime = Date.now();
// Consider a shorter threshold if warmup is frequent/needed
const DB_IDLE_THRESHOLD = 55000; // 55 seconds

// Define a type for Prisma errors
type PrismaError = Error & {
  code?: string;
  meta?: Record<string, unknown>;
  clientVersion?: string;
};

/**
 * Checks if the database might be considered idle based on the last access time.
 * @returns {boolean} Whether the database might be in a suspended state.
 */
export function isDatabaseIdle(): boolean {
  const now = Date.now();
  const idle = (now - lastDbAccessTime) > DB_IDLE_THRESHOLD;
  if (idle) {
    console.log(`Database considered idle. Last access: ${new Date(lastDbAccessTime).toISOString()}`);
  }
  return idle;
}

/**
 * Updates the last recorded database access time. Call this before/after DB operations.
 */
export function updateLastAccessTime(): void {
  lastDbAccessTime = Date.now();
}

/**
 * Attempts to warm up the database connection with a simple, fast query.
 * Best called proactively before operations if `isDatabaseIdle()` returns true.
 * @returns {Promise<boolean>} Whether the warmup query executed successfully.
 */
export async function warmupDatabase(): Promise<boolean> {
  console.log('Attempting database warmup...');
  const startTime = Date.now();
  try {
    // Use a non-blocking, simple query
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - startTime;
    console.log(`Database warmup successful (${duration}ms).`);
    updateLastAccessTime(); // Update time on successful warmup
    return true;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Database warmup failed (${duration}ms):`, error);
    return false;
  }
}

/**
 * Wraps a Prisma operation with retry logic, useful for transient connection issues common in serverless DBs.
 * Includes proactive warmup if the database seems idle.
 * @param operation A function that returns a Promise resolving to the Prisma operation result.
 * @param operationName A descriptive name for the operation (for logging).
 * @param maxRetries Maximum number of retry attempts.
 * @param initialDelay Delay before the first retry in milliseconds.
 * @returns The result of the Prisma operation.
 */
export async function withDatabaseRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'Database operation',
  maxRetries = 2, // Keep retries low to avoid long waits
  initialDelay = 500 // Start with a shorter delay
): Promise<T> {
  let lastError: Error | PrismaError | null = null;

  // Proactive warmup check
  if (isDatabaseIdle()) {
    await warmupDatabase();
  }
  updateLastAccessTime(); // Record access attempt time

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 0) {
        console.log(`${operationName} succeeded after retry attempt ${attempt}.`);
      }
      updateLastAccessTime(); // Record successful access time
      return result;
    } catch (error) {
      lastError = error as Error | PrismaError;
      updateLastAccessTime(); // Record failed access attempt time

      // Check if it's a potentially transient error (customize based on observed errors)
      const errorMessage = String(error).toLowerCase();
      const isTransientError = errorMessage.includes('connection') ||
                               errorMessage.includes('timeout') ||
                               errorMessage.includes('pool') ||
                               errorMessage.includes('socket') ||
                               (error as PrismaError)?.code === 'P1001'; // Prisma's "Can't reach database server"

      if (!isTransientError || attempt === maxRetries) {
        console.error(`${operationName} failed definitively after ${attempt} attempts. Error:`, lastError);
        throw lastError; // Non-transient error or max retries reached
      }

      // Exponential backoff with jitter
      const delay = Math.min(initialDelay * Math.pow(2, attempt) + Math.random() * initialDelay, 8000); // Max delay 8s
      console.warn(`${operationName} failed on attempt ${attempt} with transient error. Retrying in ${delay.toFixed(0)}ms... Error:`, lastError);

      // Optional: Try another warmup before the next attempt
      await warmupDatabase();

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Should theoretically not be reached if throw in loop works, but belts and suspenders
  console.error(`${operationName} failed after all retries.`);
  throw lastError || new Error(`${operationName} failed after ${maxRetries} retries.`);
}

// --- Prisma Helper Functions (Adapted from old lib/db.ts, place API logic in routes) ---
// It's generally better to keep the actual data fetching logic (like getQuestions, createQuiz)
// within the API route handlers (`src/app/api/.../route.ts`) themselves.
// This keeps the Prisma client file focused on setup and connection management.
// You can import `prisma` and `withDatabaseRetry` into your API routes.

// Example (keep this commented out or remove, implement in API routes instead):
/*
 export async function getQuestionsWithRetry() {
   return withDatabaseRetry(() => prisma.question.findMany({
     include: { tags: true },
   }), 'Fetching questions');
 }
*/ 