import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DateBlock } from './date-block';

const date = new Date(2026, 9, 24).toISOString();

describe('DateBlock', () => {
  it('lights up only for the next set', () => {
    const next = render(<DateBlock date={date} status="next" />);
    expect(next.container.firstElementChild).toHaveClass('bg-fill-on');
    const up = render(<DateBlock date={date} status="up" />);
    expect(up.container.firstElementChild).not.toHaveClass('bg-fill-on');
  });

  it('shows a dash for an undated set', () => {
    const { container } = render(<DateBlock date={null} status="undated" />);
    expect(container).toHaveTextContent('–');
    expect(container).toHaveTextContent('No date');
  });
});
