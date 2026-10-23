import { createContext, type ReactNode, use } from 'react';
import { createPortal } from 'react-dom';

type Slots = { left: HTMLElement | null; right: HTMLElement | null };

export const AppBarSlotsContext = createContext<Slots>({ left: null, right: null });

// Lets a page put its back button (left) or its menu (right, beside your profile) into the phone top bar.
export function AppBarSlot({ side, children }: { side: keyof Slots; children: ReactNode }) {
  const target = use(AppBarSlotsContext)[side];
  return target ? createPortal(children, target) : null;
}
