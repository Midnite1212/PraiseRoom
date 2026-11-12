import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/page/page-header';

import { CapoHelper } from './capo-helper';
import { ChordLibrary } from './chord-library';
import { KeyGuide } from './key-guide';
import { Metronome } from './metronome';
import { ToolSwitch } from './tool-switch';
import type { Tool } from './tools';
import { Tuner } from './tuner';

const TOOL_VIEWS: Record<Tool, ComponentType> = {
  chords: ChordLibrary,
  keys: KeyGuide,
  capo: CapoHelper,
  tuner: Tuner,
  metronome: Metronome,
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
      <ToolSwitch tool={tool} onChange={onToolChange} />
      <ToolView />
    </>
  );
}
