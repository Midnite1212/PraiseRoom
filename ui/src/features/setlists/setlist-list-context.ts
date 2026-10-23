import { createContext, type FocusEvent, use } from 'react';

export type SetlistListState = {
  // The day (`YYYY-MM-DD`) whose calendar cell, rows and card light up together.
  litDay: string | null;
  onLightDay: (day: string | null) => void;
  // Wide Setlists page: a click picks a row for the side preview instead of opening it.
  selectedId: string | undefined;
  onSelect: ((setlistId: string) => void) | undefined;
};

const IDLE: SetlistListState = {
  litDay: null,
  onLightDay: () => undefined,
  selectedId: undefined,
  onSelect: undefined,
};

export const SetlistListContext = createContext<SetlistListState>(IDLE);

export const useSetlistList = () => use(SetlistListContext);

// Pointer and focus handlers that light a day while its element is hovered or focused.
export const dayLinkHandlers = (list: SetlistListState, day: string) => ({
  onPointerEnter: () => list.onLightDay(day),
  onPointerLeave: () => list.onLightDay(null),
  onFocus: () => list.onLightDay(day),
  onBlur: (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) list.onLightDay(null);
  },
});
