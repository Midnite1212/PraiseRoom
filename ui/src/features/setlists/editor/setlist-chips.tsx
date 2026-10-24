import { useQuery } from '@tanstack/react-query';
import { Calendar, Folder as FolderIcon } from 'pixelarticons/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EditorChip } from '@/components/editor/editor-chips';
import { PickRow } from '@/components/primitives/pick-row';
import { Button } from '@/components/ui/button';
import { PopoverClose, PopoverDescription, PopoverTitle } from '@/components/ui/popover';
import type { Session } from '@/features/auth/session';
import { membersOf, peopleQueryOptions } from '@/features/folders/api';
import { FolderSleeve } from '@/features/folders/folder-sleeve';
import { useFolderCover } from '@/features/folders/use-folder-cover';

import { type Folder, foldersQueryOptions } from '../api';
import { ownFolders } from '../permissions';
import { MiniCalendar } from './mini-calendar';

type DateChipProps = {
  value: string;
  today: string;
  onChange: (day: string) => void;
};

export function DateChip({ value, today, onChange }: DateChipProps) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const label = value
    ? new Intl.DateTimeFormat(i18n.language, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(new Date(`${value}T00:00:00`))
    : t('editor.addDate');
  return (
    <EditorChip
      open={open}
      onOpenChange={setOpen}
      contentClassName="w-80"
      value={
        <>
          <Calendar className="size-icon" aria-hidden />
          {label}
        </>
      }
    >
      <PopoverTitle>{t('editor.date')}</PopoverTitle>
      <MiniCalendar
        value={value}
        today={today}
        onChange={(day) => {
          onChange(day);
          setOpen(false);
        }}
      />
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onChange('');
            setOpen(false);
          }}
        >
          {t('editor.noDate')}
        </Button>
        <PopoverClose asChild>
          <Button type="button">{t('editor.frame.done')}</Button>
        </PopoverClose>
      </div>
    </EditorChip>
  );
}

type FoldersChipProps = {
  session: Session;
  value: string[];
  now: number;
  onToggle: (folderId: string) => void;
};

function FolderPickRow({
  folder,
  now,
  checked,
  memberCount,
  onToggle,
}: {
  folder: Folder;
  now: number;
  checked: boolean;
  memberCount: number | undefined;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const { cover } = useFolderCover(folder, now);
  return (
    <PickRow
      leading={<FolderSleeve cover={cover} size="pick" />}
      title={folder.groupName}
      hint={memberCount === undefined ? undefined : t('folders.members', { count: memberCount })}
      checked={checked}
      onToggle={onToggle}
    />
  );
}

// Links the setlist to the folders you belong to. Links to folders you are not in are kept as they are.
export function FoldersChip({ session, value, now, onToggle }: FoldersChipProps) {
  const { t } = useTranslation();
  const { data } = useQuery(foldersQueryOptions());
  const { data: people } = useQuery(peopleQueryOptions());
  const folders = ownFolders(session, data ?? []);
  const linkedNames = folders.filter(({ _id }) => value.includes(_id)).map((f) => f.groupName);
  const label =
    value.length === 0
      ? t('editor.noFolder')
      : value.length === 1 && linkedNames[0]
        ? linkedNames[0]
        : t('editor.foldersSelected', { count: value.length });
  return (
    <EditorChip
      contentClassName="w-[360px] max-w-[calc(100vw-2rem)]"
      value={
        <>
          <FolderIcon className="size-icon" aria-hidden />
          {label}
        </>
      }
    >
      <div className="flex flex-col gap-0.5">
        <PopoverTitle>{t('editor.folders')}</PopoverTitle>
        <PopoverDescription>{t('editor.foldersHint')}</PopoverDescription>
      </div>
      {folders.length === 0 ? (
        <p className="text-ink-2 text-sm">{t('editor.noFolders')}</p>
      ) : (
        <ul className="m-0 flex max-h-72 list-none flex-col gap-0.5 overflow-y-auto p-0">
          {folders.map((folder) => (
            <li key={folder._id}>
              <FolderPickRow
                folder={folder}
                now={now}
                checked={value.includes(folder._id)}
                memberCount={people ? membersOf(people, folder._id).length : undefined}
                onToggle={() => onToggle(folder._id)}
              />
            </li>
          ))}
        </ul>
      )}
      <PopoverClose asChild>
        <Button type="button" className="self-end">
          {t('editor.frame.done')}
        </Button>
      </PopoverClose>
    </EditorChip>
  );
}
