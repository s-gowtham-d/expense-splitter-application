import { randomBytes } from 'crypto';

/**
 * Generate a unique ID
 * Using crypto.randomBytes for better uniqueness
 */
export function generateId(): string {
  return randomBytes(8).toString('hex');
}
