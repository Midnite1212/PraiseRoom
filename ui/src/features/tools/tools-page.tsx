import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/page/page-header';
import { Segmented } from '@/components/primitives/segmented';

import { CapoHelper } from './capo-helper';
import { ChordLibrary } from './chord-library';
import { KeyGuide } from './key-guide';
import { type Tool, TOOLS } from './tools';
import { Tuner } from './tuner';

const TOOL_VIEWS: Record<Tool, ComponentType> = {
  chords: ChordLibrary,
  keys: KeyGuide,
  capo: CapoHelper,
  tuner: Tuner,
};

export function ToolsPage({
  tool,
  onToolChange,
}: {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
}) {
  const { t } = useTranslation();
  const ToolView = TOOL_VIEWS[tool];

  return (
    <>
      <PageHeader title={t('tools.title')} />
      <Segmented
        value={tool}
        onChange={onToolChange}
        label={t('tools.pick')}
        className="wide:w-auto mb-4 w-full"
        options={TOOLS.map((value) => ({ value, label: t(`tools.tabs.${value}`) }))}
      />
      <ToolView />
    </>
  );
}
