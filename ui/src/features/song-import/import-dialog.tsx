import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

import type { ImportedChart } from './api';
import { fetchErrorKey } from './import-errors';
import { ImportForm } from './import-form';
import { PasteChartForm } from './paste-chart-form';

export type ImportDialogState =
  | { kind: 'closed' }
  | { kind: 'fetching' }
  | { kind: 'fetch-error'; error: unknown }
  | { kind: 'paste' }
  | { kind: 'chart'; chart: ImportedChart };

type ImportDialogProps = {
  state: ImportDialogState;
  onClose: () => void;
  onConverted: (chart: ImportedChart) => void;
};

// Nearly full height on phones, a wide centred panel on desktop; closing while the form is dirty confirms first.
export function ImportDialog({ state, onClose, onConverted }: ImportDialogProps) {
  const { t } = useTranslation();
  const [isDirty, setIsDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const open = state.kind !== 'closed';

  const requestClose = () => {
    if (isDirty) {
      setConfirmOpen(true);
      return;
    }
    onClose();
  };

  const discard = () => {
    setConfirmOpen(false);
    setIsDirty(false);
    onClose();
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
        }}
      >
        <DialogContent className="wide:max-h-[90vh] max-h-[calc(100svh-var(--top)-var(--bottom))] max-w-none [--dw:1000px]">
          <DialogHeader>
            <DialogTitle>{t('songImport.dialog.title')}</DialogTitle>
          </DialogHeader>

          {state.kind === 'fetching' ? <Skeleton className="h-64 w-full" /> : null}

          {state.kind === 'fetch-error' ? (
            <Alert variant="destructive">
              <AlertDescription>{t(fetchErrorKey(state.error))}</AlertDescription>
            </Alert>
          ) : null}

          {state.kind === 'paste' ? <PasteChartForm onImported={onConverted} /> : null}

          {state.kind === 'chart' ? (
            <ImportForm chart={state.chart} onDirtyChange={setIsDirty} onSaved={onClose} />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('songImport.dialog.discardTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('songImport.dialog.discardDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('songImport.dialog.keepEditing')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={discard}>
              {t('songImport.dialog.discard')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
