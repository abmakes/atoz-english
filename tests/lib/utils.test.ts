import { cn } from '@/lib/utils';

describe('cn function', () => {
  // Test for expected use
  test('should merge class names with tailwind-merge', () => {
    const result = cn('text-red-500', 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });

  // Test for combining conflicting classes (edge case)
  test('should properly merge conflicting class names', () => {
    const result = cn('text-red-500', 'text-blue-500');
    // tailwind-merge should keep the last conflicting class
    expect(result).toBe('text-blue-500');
  });

  // Test for handling non-string inputs (failure case)
  test('should handle undefined and null values', () => {
    const result = cn('text-red-500', undefined, null, 'bg-blue-500');
    expect(result).toBe('text-red-500 bg-blue-500');
  });
}); 