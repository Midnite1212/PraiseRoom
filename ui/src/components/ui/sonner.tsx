'use client';

import { useTheme } from 'next-themes';
import { Cancel, Check, CircleInfo, Loader, WarningDiamond } from 'pixelarticons/react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

// Praise Room: toasts are glass capsules that drop in at the top centre.
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      position="top-center"
      offset={{ top: 'calc(var(--top) + 56px)' }}
      mobileOffset={{ top: 'calc(var(--top) + 56px)' }}
      className="toaster group"
      icons={{
        success: <Check className="text-ok size-icon" />,
        info: <CircleInfo className="text-chord size-icon" />,
        warning: <WarningDiamond className="text-destructive size-icon" />,
        error: <Cancel className="text-destructive size-icon" />,
        loading: <Loader className="size-icon animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'glass glass-strong mx-auto flex min-h-11 w-fit max-w-[calc(100vw-24px)] items-center gap-2 py-2.5 pr-[18px] pl-3.5 text-[0.9375rem] font-semibold text-ink',
          title: 'leading-snug',
          description: 'text-ink-2 text-sm font-normal',
          icon: 'flex-none',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
