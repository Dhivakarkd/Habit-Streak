import { z } from 'zod';

export const createChallengeSchema = z.object({
  name: z
    .string()
    .min(3, 'Challenge name must be at least 3 characters')
    .max(50, 'Challenge name must be at most 50 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be at most 500 characters'),
  category: z.enum(['Fitness', 'Wellness', 'Productivity', 'Learning', 'Creative'], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
  userIds: z.array(z.string()).optional().default([]),
  addCreator: z.boolean().default(true),
});

export type CreateChallengeInput = z.infer<typeof createChallengeSchema>;
