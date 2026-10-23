import { Link } from '@tanstack/react-router';
import { ChevronLeft } from 'pixelarticons/react';

import { Button } from '@/components/ui/button';

// "‹ Songs" or "‹ Setlists" at the start of the reader's top row; just the chevron on phones.
export function ReaderBack({ to, label }: { to: '/songs' | '/setlists'; label: string }) {
  return (
    <Button
      asChild
      variant="glass"
      className="wide:w-auto wide:pr-4 wide:pl-2 wide:text-[0.9375rem] size-12 gap-0.5 px-0"
    >
      <Link to={to} aria-label={label}>
        <ChevronLeft />
        <span className="wide:inline hidden">{label}</span>
      </Link>
    </Button>
  );
}
