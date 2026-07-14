// lib/utils/validators.ts
// Shared Zod validators used across all forms

import { z } from 'zod';

/** Indian mobile: 10 digits, starts with 6-9 */
export const mobileSchema = z
  .string()
  .regex(/^[6-9]\d{9}$/, 'Mobile number must be 10 digits (starts with 6-9)')
  .or(z.literal(''))
  .optional();

/** Optional mobile — same validation but not required */
export const optionalMobile = z
  .string()
  .refine(
    (val) => val === '' || val === undefined || /^[6-9]\d{9}$/.test(val),
    { message: 'Mobile number must be 10 digits (starts with 6-9)' }
  )
  .optional()
  .or(z.literal(''));
