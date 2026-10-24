import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus } from 'pixelarticons/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { EmptyState } from '@/components/page/empty-state';
import { type ActiveFilter, FilterChips } from '@/components/page/filter-chips';
import { Finder } from '@/components/page/finder';
import { GroupTitle } from '@/components/page/group-title';
import { LIST_CLASSES, LIST_COMPACT_CLASSES } from '@/components/page/list-row';
import { PageHeader } from '@/components/page/page-header';
import { useSlideOver } from '@/components/page/slide-over';
import { Fab } from '@/components/primitives/fab';
import { nextSetlistId, setStatus } from '@/components/primitives/set-status';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { setlistsQueryOptions } from '@/features/setlists/api';
import { filterSetlists, groupSetlists } from '@/features/setlists/list';
import { NextSetCard } from '@/features/setlists/next-set-card';
import { SetlistCalendar } from '@/features/setlists/setlist-calendar';
import { SetlistFilterSheet } from '@/features/setlists/setlist-filter-sheet';
import { SetlistListContext } from '@/features/setlists/setlist-list-context';
import { SetlistPreview } from '@/features/setlists/setlist-preview';
import { ManagedSetlistRow } from '@/features/setlists/setlist-row';
import { useSetlistNames } from '@/features/setlists/use-setlist-names';
import { useIsWide } from '@/hooks/use-wide';
import { dateLocale } from '@/lib/date-locale';

const setlistsSearchSchema = z.object({
  q: z.string().default('').catch(''),
  show: z.enum(['all', 'mine', 'shared']).default('all').catch('all'),
  folders: z.array(z.string()).default([]).catch([]),
  day: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  set: z.string().optional().catch(undefined),
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
  const isWide = useIsWide();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isPlayedOpen, setIsPlayedOpen] = useState(false);
  const [litDay, setLitDay] = useState<string | null>(null);

  const setSearch = (next: Partial<typeof search>) =>
    void navigate({ search: (previous) => ({ ...previous, ...next }), replace: true });

  const visible = filterSetlists(setlists, {
    search: search.q,
    ownership: search.show,
    userId: session.id,
    folderIds: search.folders,
    day: search.day,
  });
  const isFiltering =
    search.q.trim() !== '' || search.show !== 'all' || search.folders.length > 0 || !!search.day;
  const groups = groupSetlists(visible, new Date(now), { leadWithNext: !isWide && !isFiltering });
  const sections = [
    {
      key: 'upcoming',
      title: groups.next ? t('setlists.then') : t('setlists.comingUp'),
      items: groups.upcoming,
    },
    { key: 'undated', title: t('setlists.undated'), items: groups.undated },
    { key: 'past', title: t('setlists.played'), items: groups.past },
  ].filter(({ items }) => items.length > 0);
  const showPlayed = isPlayedOpen || isFiltering;
  const nextId = nextSetlistId(setlists, now);
  const orderedIds = sections.flatMap(({ key, items }) =>
    key === 'past' && !showPlayed ? [] : items.map((setlist) => setlist._id)
  );
  const selected = isWide ? setlists.find((setlist) => setlist._id === search.set) : undefined;
  const selectedId = selected?._id;
  const pick = (setlistId: string | undefined) => setSearch({ set: setlistId });
  const slideOver = useSlideOver(selected !== undefined, () => pick(undefined));
  const closePreview = slideOver.close;

  useEffect(() => {
    if (!selectedId) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName));
      const isOverlayOpen = document.querySelector('[role="dialog"], [role="menu"]') !== null;
      if (event.defaultPrevented || isTyping || isOverlayOpen) return;
      if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (event.key === 'Escape') {
        closePreview();
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const next =
        orderedIds[orderedIds.indexOf(selectedId) + (event.key === 'ArrowDown' ? 1 : -1)];
      if (!next) return;
      event.preventDefault();
      void navigate({ search: (previous) => ({ ...previous, set: next }), replace: true });
      document.querySelector<HTMLElement>(`[data-setlist-id="${next}"]`)?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, orderedIds, navigate, closePreview]);

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
            label: new Intl.DateTimeFormat(dateLocale(i18n.language), {
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
    <SetlistListContext
      value={{
        litDay,
        onLightDay: setLitDay,
        selectedId,
        onSelect: isWide ? pick : undefined,
      }}
    >
      <PageHeader
        title={t('setlists.title')}
        actions={
          <Button asChild>
            <Link to="/setlists/new">
              <Plus />
              {newLabel}
            </Link>
          </Button>
        }
      />
      <div className="roomy:grid-cols-[minmax(0,1fr)_400px] roomy:items-start grid gap-x-10 gap-y-2">
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
          {groups.next ? <NextSetCard session={session} setlist={groups.next} now={now} /> : null}
          {sections.length === 0 && !groups.next ? (
            <EmptyState
              title={setlists.length === 0 ? t('setlists.empty') : t('setlists.noMatches')}
            >
              {setlists.length === 0 ? null : t('setlists.noMatchesHint')}
            </EmptyState>
          ) : (
            sections.map((section, index) => (
              <section key={section.key} aria-labelledby={`setlists-${section.key}`}>
                <GroupTitle
                  id={`setlists-${section.key}`}
                  title={section.title}
                  count={section.items.length}
                  first={index === 0 && !groups.next}
                  action={
                    section.key === 'past' && !isFiltering ? (
                      <Button
                        variant="link"
                        size="sm"
                        aria-expanded={showPlayed}
                        aria-controls="setlists-past-list"
                        aria-describedby="setlists-past"
                        onClick={() => setIsPlayedOpen(!isPlayedOpen)}
                      >
                        {showPlayed ? t('setlists.hidePlayed') : t('setlists.showPlayed')}
                      </Button>
                    ) : null
                  }
                />
                {section.key === 'past' && !showPlayed ? null : (
                  <ul
                    id={`setlists-${section.key}-list`}
                    className={section.key === 'past' ? LIST_COMPACT_CLASSES : LIST_CLASSES}
                  >
                    {section.items.map((setlist) => (
                      <ManagedSetlistRow
                        key={setlist._id}
                        session={session}
                        setlist={setlist}
                        names={names}
                        status={setStatus(setlist, nextId, now)}
                        compact={section.key === 'past'}
                      />
                    ))}
                  </ul>
                )}
              </section>
            ))
          )}
        </div>
        <div className="border-hairline roomy:grid roomy:sticky roomy:top-3.5 roomy:max-h-[calc(100vh-28px)] roomy:border-l roomy:pl-8 roomy:mt-0 compact:contents hidden [scrollbar-width:thin] gap-6 overflow-y-auto pr-0.5 pb-0.5">
          {selected ? (
            <SetlistPreview
              key={selected._id}
              session={session}
              setlist={selected}
              names={names}
              nextId={nextId}
              now={now}
              slideOver={slideOver}
            />
          ) : null}
          <div className="compact:hidden">
            <SetlistCalendar
              setlists={setlists}
              now={now}
              day={search.day}
              onDayChange={(day) => setSearch({ day })}
            />
          </div>
        </div>
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
    </SetlistListContext>
  );
}
