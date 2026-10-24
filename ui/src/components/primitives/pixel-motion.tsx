import { Children, isValidElement, type ComponentProps, type ReactNode } from 'react';

import { buildStrip, type PixelRecipe } from '@/lib/pixel-motion';

type SvgProps = ComponentProps<'svg'>;

function pathsOf(node: ReactNode): string[] {
  if (!isValidElement<{ d?: unknown; children?: ReactNode }>(node)) return [];
  const own = typeof node.props.d === 'string' ? [node.props.d] : [];
  return [...own, ...Children.toArray(node.props.children).flatMap(pathsOf)];
}

// Frames are worked out once, when the icon is defined; at rest it draws the original icon, and the
// `pixel-strip` CSS steps through the rest while a lit control is hovered or focused.
export function withPixelMotion(Icon: (props: SvgProps) => ReactNode, recipe: PixelRecipe) {
  const paths = pathsOf(Icon({}));
  const strip = buildStrip(paths, recipe);
  return function PixelMotionIcon(props: SvgProps) {
    return (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden {...props}>
        <g className="pixel-strip" data-frames={strip.frames} data-loop={strip.loop || undefined}>
          {paths.map((d) => (
            <path key={d} d={d} />
          ))}
          <path d={strip.d} />
        </g>
      </svg>
    );
  };
}
