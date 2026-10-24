import { Check, Undo } from 'pixelarticons/react';
import { type ReactNode, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import type { SaveStatus as Status } from '@/hooks/use-autosave';
import { useEditingMode } from '@/hooks/use-editing-mode';
import { useIsWide } from '@/hooks/use-wide';

import { ChipsRow } from './editor-chips';
import { SaveStatus } from './save-status';

type EditorFrameProps = {
  // The page's name for screen readers; the visible title is the input in `names`.
  heading: string;
  // The "‹ Songs" link above the title on wide screens.
  back: ReactNode;
  // The borderless title input and the line under it.
  names: ReactNode;
  status: Status;
  onRetry?: () => void;
  canUndo: boolean;
  onUndo: () => void;
  // Called by Done; resolve after the pending save, then navigate back to the item.
  onDone: () => void | Promise<void>;
  // Mode switches and the like, between Undo and Done.
  actions?: ReactNode;
  // Phone save bar content between Undo and Done; falls back to `actions`.
  barActions?: ReactNode;
  // `EditorChip`s; the Saved chip follows them.
  chips?: ReactNode;
  children: ReactNode;
};

const isTextField = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest('input, textarea, [contenteditable="true"]') !== null;

// The frame both editors share: title, Undo and Done, the chips row with the Saving / Saved chip, and on phones a glass
// save bar. Opening it hides the tab dock. There is no Save button; the editor saves with `useAutosave`.
export function EditorFrame({
  heading,
  back,
  names,
  status,
  onRetry,
  canUndo,
  onUndo,
  onDone,
  actions,
  barActions,
  chips,
  children,
}: EditorFrameProps) {
  const { t } = useTranslation();
  const wide = useIsWide();
  useEditingMode();

  const undo = () => {
    if (!canUndo) return;
    onUndo();
    toast(t('editor.frame.undone'));
  };
  const keys = useRef(undo);
  useEffect(() => {
    keys.current = undo;
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === 's') {
        event.preventDefault();
        toast(t('editor.frame.savesAsYouGo'));
      } else if (key === 'z' && !event.shiftKey && !isTextField(event.target)) {
        event.preventDefault();
        keys.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [t]);

  const undoButton = (size: 'icon' | 'icon-lg') => (
    <Button
      type="button"
      variant="ghost"
      size={size}
      disabled={!canUndo}
      aria-label={t('editor.frame.undo')}
      aria-keyshortcuts="Meta+Z Control+Z"
      title={t('editor.frame.undo')}
      onClick={undo}
    >
      <Undo />
    </Button>
  );
  const doneLabel = (
    <>
      <Check />
      {t('editor.frame.done')}
    </>
  );
  const saveStatus = <SaveStatus status={status} onRetry={onRetry} />;

  return (
    <div>
      {back}
      <h1 className="sr-only">{heading}</h1>
      <div className="wide:mt-2.5 flex items-start gap-4">
        <div className="min-w-0 flex-1">
          {names}
          {wide ? null : <div className="mt-1.5">{saveStatus}</div>}
        </div>
        {wide ? (
          <div className="mt-2.5 flex flex-none items-center gap-2">
            {undoButton('icon')}
            {actions}
            <Button type="button" onClick={() => void onDone()}>
              {doneLabel}
            </Button>
          </div>
        ) : null}
      </div>

      <ChipsRow>
        {chips}
        {wide ? <span className="ml-auto flex-none pl-2">{saveStatus}</span> : null}
      </ChipsRow>

      {children}

      {wide ? null : (
        <div className="glass glass-over fixed bottom-(--bottom) left-1/2 z-30 flex -translate-x-1/2 gap-1 p-1 [--glass-r:999px]">
          {undoButton('icon-lg')}
          {barActions ?? actions}
          <Button type="button" size="lg" onClick={() => void onDone()}>
            {doneLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
