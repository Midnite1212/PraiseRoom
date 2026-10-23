import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { ThemeProvider } from 'next-themes';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { syncAccent } from '@/lib/accent';
import { syncGlassStyle } from '@/lib/liquid-glass';
import { createQueryClient } from '@/lib/query-client';
import { listenForStaleChunks } from '@/lib/reload-on-stale-chunk';
import { syncTypeface } from '@/lib/typeface';

import { createAppRouter } from './router';
import './i18n';

import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';
import '@fontsource-variable/hanken-grotesk';
import '@fontsource/fusion-pixel-12px-proportional-tc';
import '@fontsource/geist-pixel';

import './styles.css';

listenForStaleChunks();
syncTypeface();
syncAccent();
syncGlassStyle();

const queryClient = createQueryClient();
const router = createAppRouter(queryClient);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Missing #root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
