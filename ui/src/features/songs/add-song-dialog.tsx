import { ChevronRight, Clipboard, Globe, Music } from 'pixelarticons/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { RowTile } from '@/components/primitives/date-block';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type AddSongDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPaste: () => void;
  onFindOnWeb: () => void;
};

// The ways a song gets into the library: paste a chart, or find it on a chord site.
export function AddSongDialog({ open, onOpenChange, onPaste, onFindOnWeb }: AddSongDialogProps) {
  const { t } = useTranslation();
  const choose = (action: () => void) => () => {
    onOpenChange(false);
    action();
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader icon={<Music />}>
          <DialogTitle>{t('songs.add.title')}</DialogTitle>
          <DialogDescription>{t('songs.add.description')}</DialogDescription>
        </DialogHeader>
        <div className="-mx-1 flex flex-col">
          <Choice
            icon={<Clipboard />}
            title={t('songs.add.paste')}
            hint={t('songs.add.pasteHint')}
            onClick={choose(onPaste)}
          />
          <Choice
            icon={<Globe />}
            title={t('songs.add.web')}
            hint={t('songs.add.webHint')}
            onClick={choose(onFindOnWeb)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Choice({
  icon,
  title,
  hint,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hover:liquid-hover [&_svg]:size-icon flex min-h-[60px] w-full items-center gap-3 rounded-2xl px-2.5 py-1.5 text-left transition-colors"
    >
      <RowTile size="sm">{icon}</RowTile>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <small className="text-ink-3 block text-xs">{hint}</small>
      </span>
      <ChevronRight className="text-ink-3" />
    </button>
  );
}
