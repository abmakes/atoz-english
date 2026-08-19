import { randomBytes } from 'crypto';

/**
 * Unguessable URL-safe token for student story links.
 * 18 random bytes -> 24 base64url characters (~144 bits of entropy).
 */
export function createShareToken(): string {
  return randomBytes(18).toString('base64url');
}
