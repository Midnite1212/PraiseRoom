import { Trash } from 'pixelarticons/react';
import { toast } from 'sonner';

// The red-trash toast for leaving or deleting a folder.
export const goneToast = (message: string) =>
  toast(message, { icon: <Trash className="text-destructive size-icon" /> });
