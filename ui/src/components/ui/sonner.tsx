'use client';

import { useTheme } from 'next-themes';
import { Cancel, CheckboxOn, CircleInfo, Loader, WarningDiamond } from 'pixelarticons/react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CheckboxOn className="size-4" />,
        info: <CircleInfo className="size-4" />,
        warning: <WarningDiamond className="size-4" />,
        error: <Cancel className="size-4" />,
        loading: <Loader className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
