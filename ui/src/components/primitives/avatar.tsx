import { cn } from '@/lib/utils';

const AVATAR_SIZES = {
  md: 'size-8 text-[0.8125rem]',
  sm: 'size-7 text-xs',
} as const;

export const toInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

export function InitialAvatar({
  name,
  isYou = false,
  size = 'md',
  className,
}: {
  name: string;
  isYou?: boolean;
  size?: keyof typeof AVATAR_SIZES;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        'text-ink inline-grid flex-none place-items-center rounded-full font-mono font-bold',
        AVATAR_SIZES[size],
        isYou ? 'bg-fill-on' : 'bg-fill-press',
        className
      )}
    >
      {toInitials(name)}
    </span>
  );
}

// Overlapping initials for the people in a folder, with a "+n" for the rest.
export function AvatarStack({
  people,
  youId,
  max = 3,
}: {
  people: readonly { id: string; name: string }[];
  youId?: string;
  max?: number;
}) {
  const rest = people.length - max;
  return (
    <span aria-hidden className="inline-flex flex-none">
      {people.slice(0, max).map((person) => (
        <InitialAvatar
          key={person.id}
          name={person.name}
          isYou={person.id === youId}
          size="sm"
          className="shadow-[0_0_0_2px_var(--ground)] not-first:-ml-2"
        />
      ))}
      {rest > 0 ? (
        <span className="bg-fill-press text-ink -ml-2 inline-grid size-7 place-items-center rounded-full font-mono text-xs font-bold shadow-[0_0_0_2px_var(--ground)]">
          +{rest}
        </span>
      ) : null}
    </span>
  );
}
