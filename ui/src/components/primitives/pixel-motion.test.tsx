import { render } from '@testing-library/react';
import { Chart, Home } from 'pixelarticons/react';
import { describe, expect, it } from 'vitest';

import { bars, nudge } from '@/lib/pixel-motion';

import { withPixelMotion } from './pixel-motion';

describe('withPixelMotion', () => {
  it('draws the original icon first, then the recipe frames in one strip', () => {
    const HopHome = withPixelMotion(Home, nudge(0, -1));
    const { container } = render(<HopHome className="size-icon" />);
    const original = render(<Home />)
      .container.querySelector('path')
      ?.getAttribute('d');

    const svg = container.querySelector('svg');
    const strip = container.querySelector('g.pixel-strip');
    const paths = strip?.querySelectorAll('path') ?? [];
    expect(svg).toHaveClass('size-icon');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(strip).toHaveAttribute('data-frames', '3');
    expect(strip).not.toHaveAttribute('data-loop');
    expect(paths).toHaveLength(2);
    expect(paths[0]).toHaveAttribute('d', original);
    expect(paths[1]?.getAttribute('d')).toMatch(/^M3\d/);
  });

  it('marks looping recipes', () => {
    const LiveChart = withPixelMotion(Chart, bars());
    const { container } = render(<LiveChart />);
    expect(container.querySelector('g.pixel-strip')).toHaveAttribute('data-loop', 'true');
  });
});
