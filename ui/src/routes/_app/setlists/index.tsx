import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { EmptyState } from '@/components/page/empty-state';
import { type ActiveFilter, FilterChips } from '@/components/page/filter-chips';
import { Finder } from '@/components/page/finder';
import { GroupTitle } from '@/components/page/group-title';
import { LIST_CLASSES } from '@/components/page/list-row';
import { PageHeader } from '@/components/page/page-header';
import { Fab } from '@/components/primitives/fab';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { setlistsQueryOptions } from '@/features/setlists/api';
import { filterSetlists, groupSetlists } from '@/features/setlists/list';
import { SetlistCalendar } from '@/features/setlists/setlist-calendar';
import { SetlistFilterSheet } from '@/features/setlists/setlist-filter-sheet';
import { ManagedSetlistRow } from '@/features/setlists/setlist-row';
import { useSetlistNames } from '@/features/setlists/use-setlist-names';

const setlistsSearchSchema = z.object({
  q: z.string().default('').catch(''),
  show: z.enum(['all', 'mine', 'shared']).default('all').catch('all'),
  folders: z.array(z.string()).default([]).catch([]),
  day: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
});

export const Route = createFileRoute('/_app/setlists/')({
  validateSearch: setlistsSearchSchema,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(setlistsQueryOptions());
    // Read the clock here, not during render, so the grouping stays stable between renders.
    return { now: Date.now() };
  },
  pendingComponent: () => <Skeleton className="h-64 w-full" />,
  component: SetlistsPage,
});

function SetlistsPage() {
  const { t, i18n } = useTranslation();
  const { session } = Route.useRouteContext();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { now } = Route.useLoaderData();
  const { data: setlists } = useSuspenseQuery(setlistsQueryOptions());
  const names = useSetlistNames(session);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const setSearch = (next: Partial<typeof search>) =>
    void navigate({ search: (previous) => ({ ...previous, ...next }), replace: true });

  const visible = filterSetlists(setlists, {
    search: search.q,
    ownership: search.show,
    userId: session.id,
    folderIds: search.folders,
    day: search.day,
  });
  const groups = groupSetlists(visible, new Date(now));
  const sections = [
    { key: 'upcoming', title: t('setlists.upcoming'), items: groups.upcoming },
    { key: 'undated', title: t('setlists.undated'), items: groups.undated },
    { key: 'past', title: t('setlists.past'), items: groups.past },
  ].filter(({ items }) => items.length > 0);
  const comingUp = groupSetlists(setlists, new Date(now)).upcoming.length;

  const activeFilters: ActiveFilter[] = [
    ...(search.show === 'all'
      ? []
      : [
          {
            key: 'show',
            label: t(`setlists.filters.chip.${search.show}`),
            onRemove: () => setSearch({ show: 'all' }),
          },
        ]),
    ...search.folders.flatMap((id) => {
      const name = names.folders.get(id);
      return name
        ? [
            {
              key: `folder-${id}`,
              label: name,
              onRemove: () => setSearch({ folders: search.folders.filter((item) => item !== id) }),
            },
          ]
        : [];
    }),
    ...(search.day
      ? [
          {
            key: 'day',
            label: new Intl.DateTimeFormat(i18n.language, {
              day: 'numeric',
              month: 'short',
            }).format(new Date(`${search.day}T00:00:00`)),
            onRemove: () => setSearch({ day: undefined }),
          },
        ]
      : []),
  ];
  const filterCount = (search.show === 'all' ? 0 : 1) + search.folders.length;
  const folderOptions = [...names.folders].map(([id, name]) => ({
    id,
    name,
    count: setlists.filter((setlist) => setlist.groupIds.includes(id)).length,
  }));
  const newLabel = t('editor.newTitle');

  return (
    <>
      <PageHeader
        title={t('setlists.title')}
        description={t('setlists.comingUp', { count: comingUp })}
        actions={
          <Button asChild>
            <Link to="/setlists/new">
              <Plus />
              {newLabel}
            </Link>
          </Button>
        }
      />
      <div className="wide:grid-cols-[minmax(0,1fr)_300px] wide:items-start grid gap-x-10 gap-y-2">
        <div className="min-w-0">
          <Finder
            value={search.q}
            onChange={(q) => setSearch({ q })}
            placeholder={t('setlists.searchPlaceholder')}
            label={t('setlists.searchLabel')}
            filterCount={filterCount}
            onFilter={() => setIsFilterOpen(true)}
          />
          <FilterChips filters={activeFilters} />
          {sections.length === 0 ? (
            <EmptyState
              title={setlists.length === 0 ? t('setlists.empty') : t('setlists.noMatches')}
            >
              {setlists.length === 0 ? null : t('setlists.noMatchesHint')}
            </EmptyState>
          ) : (
            sections.map((section) => (
              <section key={section.key} aria-labelledby={`setlists-${section.key}`}>
                <GroupTitle
                  id={`setlists-${section.key}`}
                  title={section.title}
                  count={section.items.length}
                />
                <ul className={LIST_CLASSES}>
                  {section.items.map((setlist) => (
                    <ManagedSetlistRow
                      key={setlist._id}
                      session={session}
                      setlist={setlist}
                      names={names}
                      now={now}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
        <SetlistCalendar
          setlists={setlists}
          now={now}
          day={search.day}
          onDayChange={(day) => setSearch({ day })}
        />
      </div>
      <SetlistFilterSheet
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        ownership={search.show}
        folderIds={search.folders}
        folders={folderOptions}
        matchCount={visible.length}
        onChange={setSearch}
      />
      <Fab asChild aria-label={newLabel} title={newLabel}>
        <Link to="/setlists/new">
          <Plus />
        </Link>
      </Fab>
    </>
  );
}
