import { useQuery } from '@tanstack/react-query';
import { ClipboardPaste } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

import { detectImportLink, type ImportSearchResponse, importSearchQueryOptions } from './api';

type WebResultsProps = {
  q: string;
  onPickUrl: (url: string) => void;
  onPaste: () => void;
};

// The "From the web" section under the songs library search, for editors and admins only.
export function WebResults({ q, onPickUrl, onPaste }: WebResultsProps) {
  const { t } = useTranslation();
  const linkSource = detectImportLink(q);
  const results = useQuery({ ...importSearchQueryOptions(q), enabled: linkSource === null });

  return (
    <section className="flex flex-col gap-3 border-t pt-4">
      <h2 className="text-muted-foreground text-sm font-medium">{t('songImport.web.heading')}</h2>

      {linkSource ? (
        <button
          type="button"
          onClick={() => onPickUrl(q)}
          className="hover:bg-muted focus-visible:ring-ring w-full rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate font-medium">{t('songImport.web.importLink')}</span>
            <Badge variant="outline">{t(`songImport.sources.${linkSource}`)}</Badge>
          </div>
          <p className="text-muted-foreground truncate text-sm">{q}</p>
        </button>
      ) : (
        <>
          {results.isFetching ? <Skeleton className="h-24 w-full" /> : null}
          {results.isError ? (
            <Alert variant="destructive">
              <AlertDescription>{t('songImport.search.failed')}</AlertDescription>
            </Alert>
          ) : null}
          {results.data && !results.isFetching ? (
            <WebCandidates data={results.data} onSelect={onPickUrl} />
          ) : null}
        </>
      )}

      <Button type="button" variant="outline" size="sm" className="self-start" onClick={onPaste}>
        <ClipboardPaste />
        {t('songImport.web.pasteButton')}
      </Button>
    </section>
  );
}

type WebCandidatesProps = {
  data: ImportSearchResponse;
  onSelect: (url: string) => void;
};

function WebCandidates({ data, onSelect }: WebCandidatesProps) {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      {data.unavailable.length > 0 ? (
        <Alert>
          <AlertDescription>
            {t('songImport.search.sourceUnavailable', {
              sources: new Intl.ListFormat(i18n.language).format(
                data.unavailable.map((source) => t(`songImport.sources.${source}`))
              ),
            })}
          </AlertDescription>
        </Alert>
      ) : null}

      {data.candidates.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('songImport.search.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.candidates.map((candidate) => (
            <li key={candidate.url}>
              <button
                type="button"
                onClick={() => onSelect(candidate.url)}
                className="hover:bg-muted focus-visible:ring-ring w-full rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium">{candidate.title}</span>
                  <Badge variant="outline">{t(`songImport.sources.${candidate.source}`)}</Badge>
                </div>
                <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
                  <span>{candidate.artist ?? t('songImport.search.unknownArtist')}</span>
                  {candidate.votes !== null ? (
                    <span>{t('songImport.search.votes', { count: candidate.votes })}</span>
                  ) : null}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
