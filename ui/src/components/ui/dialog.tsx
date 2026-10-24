import { cn } from 'cn';
import { Close } from 'pixelarticons/react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';
import { useMoreBelow } from '@/hooks/use-more-below';

// Praise Room: dialogs are glass sheets that rise from the bottom on phones and sit in the middle on
// wide screens. Hosts can widen one with `[--dw:520px]`.
const SHEET_CLASSES =
  'glass glass-strong fixed z-50 flex flex-col [--glass-r:32px] right-2.5 bottom-[calc(var(--bottom)+var(--kb,0px))] left-2.5 mx-auto max-h-[min(82svh,720px,calc(100svh-var(--kb,0px)-var(--bottom)-0.75rem))] max-w-[560px] origin-bottom px-4 pt-[18px] pb-4 text-sm text-ink outline-none data-open:animate-sheet-in data-closed:animate-sheet-out wide:top-1/2 wide:right-auto wide:bottom-auto wide:left-1/2 wide:w-[min(var(--dw,480px),calc(100vw-48px))] wide:max-w-none wide:max-h-[min(80vh,720px)] wide:-translate-x-1/2 wide:-translate-y-1/2 wide:origin-center';

const SCRIM_CLASSES =
  'fixed inset-0 isolate z-50 bg-scrim data-open:animate-scrim-in data-closed:animate-scrim-out';

function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(SCRIM_CLASSES, className)}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  footer,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
  // Pinned under the scrolling content, so its buttons stay in reach on long sheets.
  footer?: React.ReactNode;
}) {
  useKeyboardInset();
  const body = useMoreBelow();
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(SHEET_CLASSES, className)}
        {...props}
      >
        {/* The glass rim is drawn on the host, so the content scrolls inside it rather than with it. */}
        <div
          ref={body.ref}
          className={cn(
            'no-scrollbar -mx-4 -my-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-1',
            body.isMore && '[mask-image:linear-gradient(#000_calc(100%-32px),transparent)]'
          )}
        >
          {children}
        </div>
        {footer ? <div className="pt-3.5">{footer}</div> : null}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button variant="ghost" className="absolute top-3.5 right-3.5 z-10" size="icon">
              <Close />
              <span className="sr-only">Close</span>
            </Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  icon,
  tone = 'default',
  children,
  ...props
}: React.ComponentProps<'div'> & { icon?: React.ReactNode; tone?: 'default' | 'danger' }) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex items-start gap-3 pr-10', className)}
      {...props}
    >
      {icon ? (
        <span
          aria-hidden
          className={cn(
            'grid size-10 flex-none place-items-center rounded-xl',
            tone === 'danger' ? 'bg-danger-tint text-destructive' : 'bg-fill-on text-ink'
          )}
        >
          {icon}
        </span>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">{children}</div>
    </div>
  );
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<'div'> & {
  showCloseButton?: boolean;
}) {
  return (
    <div data-slot="dialog-footer" className={cn('flex gap-2 *:flex-1', className)} {...props}>
      {showCloseButton && (
        <DialogPrimitive.Close asChild>
          <Button variant="secondary">Close</Button>
        </DialogPrimitive.Close>
      )}
      {children}
    </div>
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('font-heading text-base leading-snug font-semibold', className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-[0.8125rem] text-ink-2 *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-ink',
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  SCRIM_CLASSES,
  SHEET_CLASSES,
};
