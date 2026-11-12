import { ToggleGroup as ToggleGroupPrimitive } from 'radix-ui';
import { useTranslation } from 'react-i18next';

import { type Tool, TOOLS } from './tools';

export function ToolSwitch({ tool, onChange }: { tool: Tool; onChange: (tool: Tool) => void }) {
  const { t } = useTranslation();
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={tool}
      onValueChange={(next) => {
        const picked = TOOLS.find((candidate) => candidate === next);
        if (picked) onChange(picked);
      }}
      aria-label={t('tools.pick')}
      className="mb-4 flex flex-wrap gap-1.5"
    >
      {TOOLS.map((value) => (
        <ToggleGroupPrimitive.Item
          key={value}
          value={value}
          className="bg-fill-hover text-ink-2 hover:liquid-hover hover:text-ink aria-checked:liquid-on aria-checked:text-ink aria-checked:hover:liquid-on h-9 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ease-out"
        >
          {t(`tools.tabs.${value}`)}
        </ToggleGroupPrimitive.Item>
      ))}
    </ToggleGroupPrimitive.Root>
  );
}
