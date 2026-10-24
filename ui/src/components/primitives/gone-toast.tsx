import { Trash } from 'pixelarticons/react';
import { type ExternalToast, toast } from 'sonner';

// The toast for anything removed or ended: a red trash icon, where `toast.success` shows a green check.
export const goneToast = (message: string, options?: ExternalToast) =>
  toast(message, { ...options, icon: <Trash className="text-danger size-icon" /> });
