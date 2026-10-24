import { useQuery } from '@tanstack/react-query';
import { Clipboard, Download } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { GroupTitle } from '@/components/page/group-title';
import { LIST_CLASSES, listRowClasses, RowText } from '@/components/page/list-row';
import { LoadingStatus } from '@/components/page/loading-status';
import { Tag } from '@/components/primitives/tag';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
    <section aria-labelledby="web-results" className="flex flex-col gap-1">
      <GroupTitle
        id="web-results"
        title={t('songImport.web.heading')}
        count={linkSource ? undefined : results.data?.candidates.length}
        action={
          <Button type="button" variant="link" size="sm" onClick={onPaste}>
            <Clipboard />
            {t('songImport.web.pasteButton')}
          </Button>
        }
      />

      {linkSource ? (
        <ul className={LIST_CLASSES}>
          <li>
            <button
              type="button"
              onClick={() => onPickUrl(q)}
              className={listRowClasses('grid-cols-[minmax(0,1fr)_auto]')}
            >
              <RowText
                title={t('songImport.web.importLink')}
                meta={
                  <>
                    <Tag>{t(`songImport.sources.${linkSource}`)}</Tag>
                    <span className="truncate">{q}</span>
                  </>
                }
              />
              <ImportLabel />
            </button>
          </li>
        </ul>
      ) : (
        <>
          {results.isFetching ? (
            <LoadingStatus>{t('songImport.web.searching')}</LoadingStatus>
          ) : null}
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
    </section>
  );
}

function ImportLabel() {
  const { t } = useTranslation();
  return (
    <span className="text-chord [&_svg]:size-icon inline-flex items-center gap-1.5 px-2.5 text-sm font-semibold">
      <Download />
      {t('songImport.web.import')}
    </span>
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
        <p className="text-ink-2 px-3 text-sm">{t('songImport.search.empty')}</p>
      ) : (
        <ul className={LIST_CLASSES}>
          {data.candidates.map((candidate) => (
            <li key={candidate.url}>
              <button
                type="button"
                onClick={() => onSelect(candidate.url)}
                className={listRowClasses('grid-cols-[minmax(0,1fr)_auto]')}
              >
                <RowText
                  title={candidate.title}
                  meta={
                    <>
                      <span>{candidate.artist ?? t('songImport.search.unknownArtist')}</span>
                      <Tag>{t(`songImport.sources.${candidate.source}`)}</Tag>
                      {candidate.votes !== null ? (
                        <span>{t('songImport.search.votes', { count: candidate.votes })}</span>
                      ) : null}
                    </>
                  }
                />
                <ImportLabel />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
