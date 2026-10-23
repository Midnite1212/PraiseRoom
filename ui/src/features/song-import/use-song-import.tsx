import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { fetchImportedChart } from './api';
import { ImportDialog, type ImportDialogState } from './import-dialog';

// The import dialog and the two ways into it: a picked web result (fetched and converted) or a pasted chart.
export const useSongImport = () => {
  const [dialog, setDialog] = useState<ImportDialogState>({ kind: 'closed' });
  const fetchChart = useMutation({ mutationFn: fetchImportedChart });

  // A response that arrives after the dialog was closed, or after another pick, is dropped.
  const whileFetching = (next: ImportDialogState) =>
    setDialog((current) => (current.kind === 'fetching' ? next : current));

  const pickUrl = (url: string) => {
    setDialog({ kind: 'fetching' });
    fetchChart.mutate(url, {
      onSuccess: (chart) => whileFetching({ kind: 'chart', chart }),
      onError: (error: unknown) => whileFetching({ kind: 'fetch-error', error }),
    });
  };

  const element = (
    <ImportDialog
      state={dialog}
      onClose={() => setDialog({ kind: 'closed' })}
      onConverted={(chart) =>
        setDialog((current) => (current.kind === 'paste' ? { kind: 'chart', chart } : current))
      }
    />
  );

  return { pickUrl, openPaste: () => setDialog({ kind: 'paste' }), element };
};
