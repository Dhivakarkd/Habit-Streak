import { z } from 'zod';

export const checkinSchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID'),
  date: z
    .string()
    .refine(
      (date) => /^\d{4}-\d{2}-\d{2}$/.test(date),
      'Date must be in YYYY-MM-DD format'
    ),
  status: z.enum(['completed', 'missed', 'pending', 'freeze'], {
    errorMap: () => ({ message: 'Invalid status' }),
  }),
});

export type CheckinInput = z.infer<typeof checkinSchema>;
