import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';

import { TOOLS } from '@/features/tools/tools';
import { ToolsPage } from '@/features/tools/tools-page';

export const Route = createFileRoute('/_app/tools/')({
  validateSearch: z.object({ tool: z.enum(TOOLS).default('chords').catch('chords') }),
  component: ToolsRoute,
});

function ToolsRoute() {
  const { tool } = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <ToolsPage
      tool={tool}
      onToolChange={(next) => void navigate({ search: { tool: next }, replace: true })}
    />
  );
}
