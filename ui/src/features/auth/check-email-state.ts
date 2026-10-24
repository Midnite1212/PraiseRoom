import { z } from 'zod';

const STORAGE_KEY = 'check-email';

export const checkEmailStateSchema = z.object({
  email: z.string().min(1),
  kind: z.enum(['reset', 'verify']),
});

export type CheckEmailState = z.infer<typeof checkEmailStateSchema>;

// "Check your email" names the address it was asked about. It is kept for this tab only, not in the URL.
export const saveCheckEmailState = (state: CheckEmailState): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The page then asks for the address again.
  }
};

export const readCheckEmailState = (): CheckEmailState | null => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    const parsed = checkEmailStateSchema.safeParse(stored === null ? null : JSON.parse(stored));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
};
