import { cn } from '@/lib/utils';

import { InitialAvatar } from './avatar';

// A small avatar and a name: who made or shared a setlist.
export function AuthorLine({
  name,
  isYou = false,
  className,
}: {
  name: string;
  isYou?: boolean;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5', className)}>
      <InitialAvatar name={name} isYou={isYou} size="xs" />
      <span className="truncate">{name}</span>
    </span>
  );
}
