import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Session } from '@/features/auth/session';
import {
  foldersQueryOptions,
  type SetlistSummary,
  setlistsQueryOptions,
} from '@/features/setlists/api';
import { formatSetlistDate } from '@/features/setlists/format-date';
import { filterSetlists, groupSetlists, type SetlistOwnership } from '@/features/setlists/list';
import { ownFolders } from '@/features/setlists/permissions';
import { SetlistActions } from '@/features/setlists/setlist-actions';

const OWNERSHIP_OPTIONS = ['all', 'mine', 'shared'] as const;

const setlistsSearchSchema = z.object({
  q: z.string().default('').catch(''),
  show: z.enum(OWNERSHIP_OPTIONS).default('all').catch('all'),
});

export const Route = createFileRoute('/_app/setlists/')({
  validateSearch: setlistsSearchSchema,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(setlistsQueryOptions());
    // Read the clock here, not during render, so the grouping stays stable between renders.
    return { now: Date.now() };
  },
  pendingComponent: () => <Skeleton className="mx-auto h-64 max-w-3xl" />,
  component: SetlistsPage,
});

const isOwnership = (value: string): value is SetlistOwnership =>
  OWNERSHIP_OPTIONS.some((option) => option === value);

function SetlistsPage() {
  const { t } = useTranslation();
  const { session } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: setlists } = useSuspenseQuery(setlistsQueryOptions());
  const { data: folders } = useQuery(foldersQueryOptions());

  const folderNames = new Map(
    ownFolders(session, folders ?? []).map(({ _id, groupName }) => [_id, groupName])
  );
  const visible = filterSetlists(setlists, {
    search: search.q,
    ownership: search.show,
    userId: session.id,
  });
  const { now } = Route.useLoaderData();
  const groups = groupSetlists(visible, new Date(now));
  const sections = [
    { key: 'upcoming', title: t('setlists.upcoming'), items: groups.upcoming },
    { key: 'undated', title: t('setlists.undated'), items: groups.undated },
    { key: 'past', title: t('setlists.past'), items: groups.past },
  ].filter(({ items }) => items.length > 0);

  const setSearch = (next: Partial<typeof search>) =>
    void navigate({ search: { ...search, ...next }, replace: true });

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{t('setlists.title')}</h1>
        <Button asChild>
          <Link to="/setlists/new">
            <Plus />
            {t('editor.newTitle')}
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            type="search"
            value={search.q}
            onChange={(event) => setSearch({ q: event.target.value })}
            placeholder={t('setlists.searchPlaceholder')}
            aria-label={t('setlists.searchLabel')}
            className="pl-8"
          />
        </div>
        <ToggleGroup
          type="single"
          variant="outline"
          value={search.show}
          onValueChange={(value) => {
            if (isOwnership(value)) setSearch({ show: value });
          }}
          aria-label={t('setlists.show')}
        >
          {OWNERSHIP_OPTIONS.map((option) => (
            <ToggleGroupItem key={option} value={option}>
              {t(`setlists.ownership.${option}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {sections.length === 0 ? (
        <p className="bg-sheet text-muted-foreground rounded-xl border p-8 text-center">
          {setlists.length === 0 ? t('setlists.empty') : t('setlists.noMatches')}
        </p>
      ) : (
        sections.map((section) => (
          <section
            key={section.key}
            className="flex flex-col gap-2"
            aria-labelledby={`setlists-${section.key}`}
          >
            <h2
              id={`setlists-${section.key}`}
              className="text-label font-mono text-xs font-medium tracking-[0.14em] uppercase"
            >
              {section.title}
            </h2>
            <ul className="bg-sheet divide-y overflow-hidden rounded-xl border">
              {section.items.map((setlist) => (
                <SetlistRow
                  key={setlist._id}
                  session={session}
                  setlist={setlist}
                  folderNames={folderNames}
                />
              ))}
            </ul>
          </section>
        ))
      )}
    </section>
  );
}

function SetlistRow({
  session,
  setlist,
  folderNames,
}: {
  session: Session;
  setlist: SetlistSummary;
  folderNames: Map<string, string>;
}) {
  const { t, i18n } = useTranslation();
  const folders = setlist.groupIds.flatMap((id) => {
    const name = folderNames.get(id);
    return name ? [{ id, name }] : [];
  });

  return (
    <li className="hover:bg-accent/60 flex items-center gap-2 pr-2 transition-colors">
      <Link
        to="/setlists/$setlistId"
        params={{ setlistId: setlist._id }}
        className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3"
      >
        <span className="truncate font-medium">{setlist.name}</span>
        <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="font-mono">
            {formatSetlistDate(setlist.date, i18n.language) ?? t('setlists.noDate')}
            {' · '}
            {t('reader.songCount', { count: setlist.songs.length })}
          </span>
          {setlist.createdBy !== session.id ? (
            <Badge variant="secondary">{t('setlists.shared')}</Badge>
          ) : null}
          {folders.map(({ id, name }) => (
            <Badge key={id} variant="outline">
              {name}
            </Badge>
          ))}
        </span>
      </Link>
      <SetlistActions session={session} setlist={setlist} />
    </li>
  );
}
