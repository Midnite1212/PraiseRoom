import { useQuery } from '@tanstack/react-query';
import { Folder } from 'pixelarticons/react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Session } from '@/features/auth/session';

import { foldersQueryOptions } from '../api';
import { ownFolders } from '../permissions';

type FolderPickerProps = {
  session: Session;
  value: string[];
  onChange: (groupIds: string[]) => void;
};

export function FolderPicker({ session, value, onChange }: FolderPickerProps) {
  const { t } = useTranslation();
  const { data } = useQuery(foldersQueryOptions());
  const folders = ownFolders(session, data ?? []);
  const selected = new Set(value);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="justify-start">
          <Folder />
          {value.length > 0
            ? t('editor.foldersSelected', { count: value.length })
            : t('editor.folders')}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72">
        {folders.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t('editor.noFolders')}</p>
        ) : (
          <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
            {folders.map((folder) => {
              const id = `folder-${folder._id}`;
              return (
                <li key={folder._id} className="flex items-center gap-2">
                  <Checkbox
                    id={id}
                    checked={selected.has(folder._id)}
                    onCheckedChange={(checked) =>
                      onChange(
                        checked === true
                          ? [...value, folder._id]
                          : value.filter((groupId) => groupId !== folder._id)
                      )
                    }
                  />
                  <Label htmlFor={id} className="truncate font-normal">
                    {folder.groupName}
                  </Label>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
