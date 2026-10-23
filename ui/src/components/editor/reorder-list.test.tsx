import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { ReorderList } from './reorder-list';

type Item = { id: string; name: string };

const initial: Item[] = [
  { id: 'a', name: 'First' },
  { id: 'b', name: 'Second' },
  { id: 'c', name: 'Third' },
];

function Harness() {
  const [items, setItems] = useState(initial);
  return (
    <ReorderList
      items={items}
      getKey={(item) => item.id}
      getLabel={(item) => item.name}
      onReorder={setItems}
      renderItem={(item, _index, handle) => (
        <div>
          {handle}
          <span>{item.name}</span>
        </div>
      )}
    />
  );
}

const order = () =>
  screen.getAllByRole('listitem').map((row) => row.querySelector('span')?.textContent);

describe('ReorderList', () => {
  it('moves a row with the arrow keys, keeps focus on its handle and announces the position', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const handle = screen.getByRole('button', { name: /Move Second/ });

    handle.focus();
    await user.keyboard('{ArrowUp}');
    expect(order()).toEqual(['Second', 'First', 'Third']);
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Second');
    expect(screen.getByRole('button', { name: /Move Second/ })).toHaveFocus();
    expect(screen.getByText('Second moved to position 1 of 3')).toBeInTheDocument();
  });

  it('stops at the ends of the list', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    screen.getByRole('button', { name: /Move First/ }).focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('First');
    expect(screen.queryByText(/moved to position/)).not.toBeInTheDocument();
  });

  it('reorders live while a handle is dragged and commits on release', () => {
    render(<Harness />);
    const rows = screen.getAllByRole('listitem');
    rows.forEach((row, index) => {
      row.getBoundingClientRect = () => new DOMRect(0, index * 60, 300, 60);
    });

    fireEvent.pointerDown(screen.getByRole('button', { name: /Move First/ }), {
      button: 0,
      clientY: 30,
    });
    fireEvent.pointerMove(window, { clientY: 130 });
    expect(screen.getAllByRole('listitem')[2]).toHaveTextContent('First');

    fireEvent.pointerUp(window);
    expect(screen.getAllByRole('listitem')[2]).toHaveTextContent('First');
    expect(screen.getByText('First moved to position 3 of 3')).toBeInTheDocument();
  });
});
