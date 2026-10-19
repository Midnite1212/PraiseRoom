import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { fetchImportedChart } from './api';
import { ImportDialog, type ImportDialogState } from './import-dialog';
import { WebResults } from './web-results';

type SongImportFlowProps = {
  q: string;
};

// Owns the "From the web" section and the import dialog together, keyed by the songs search box.
export function SongImportFlow({ q }: SongImportFlowProps) {
  const [dialog, setDialog] = useState<ImportDialogState>({ kind: 'closed' });

  const fetchChart = useMutation({ mutationFn: fetchImportedChart });

  // A response that arrives after the dialog was closed, or after another pick, is dropped.
  const whileFetching = (next: ImportDialogState) =>
    setDialog((current) => (current.kind === 'fetching' ? next : current));

  return (
    <>
      <WebResults
        q={q}
        onPickUrl={(url) => {
          setDialog({ kind: 'fetching' });
          fetchChart.mutate(url, {
            onSuccess: (chart) => whileFetching({ kind: 'chart', chart }),
            onError: (error: unknown) => whileFetching({ kind: 'fetch-error', error }),
          });
        }}
        onPaste={() => setDialog({ kind: 'paste' })}
      />
      <ImportDialog
        state={dialog}
        onClose={() => setDialog({ kind: 'closed' })}
        onConverted={(chart) =>
          setDialog((current) => (current.kind === 'paste' ? { kind: 'chart', chart } : current))
        }
      />
    </>
  );
}
