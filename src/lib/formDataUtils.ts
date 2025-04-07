import { z } from 'zod';

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