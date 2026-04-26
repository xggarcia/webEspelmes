import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShapeSelect } from './ShapeSelect';

const options = [
  { code: 'pillar', label: 'Pilar' },
  { code: 'taper', label: 'Candelera' },
  { code: 'votive', label: 'Votiva' },
];

describe('ShapeSelect', () => {
  it('renders every option as a button using the translator', () => {
    render(
      <ShapeSelect
        label="Forma"
        value="pillar"
        options={options}
        tNamespace={(k) => `t:${k}`}
        onChange={() => {}}
      />,
    );
    expect(screen.getByText('Forma')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 't:pillar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 't:taper' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 't:votive' })).toBeInTheDocument();
  });

  it('calls onChange with the option code when a button is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ShapeSelect
        label="Forma"
        value="pillar"
        options={options}
        tNamespace={(k) => k}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'votive' }));
    expect(onChange).toHaveBeenCalledWith('votive');
  });

  it('marks the active option with the ember styling', () => {
    render(
      <ShapeSelect
        label="Forma"
        value="taper"
        options={options}
        tNamespace={(k) => k}
        onChange={() => {}}
      />,
    );
    const active = screen.getByRole('button', { name: 'taper' });
    expect(active.className).toContain('border-ember');
  });
});

