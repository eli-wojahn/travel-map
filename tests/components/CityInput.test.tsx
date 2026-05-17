import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CityInput from '@/components/CityInput';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'pt',
}));

vi.mock('@/lib/geocoding', () => ({
  geocodeCity: vi.fn(),
}));

import { geocodeCity } from '@/lib/geocoding';

const mockGeocode = vi.mocked(geocodeCity);

const saoPauloResult = {
  name: 'Sao Paulo',
  state: 'Sao Paulo',
  country: 'Brasil',
  latitude: -23.5505,
  longitude: -46.6333,
};

describe('CityInput', () => {
  it('calls onError when form is submitted with empty input', () => {
    const onError = vi.fn();
    const { container } = render(
      <CityInput onAddPlace={vi.fn()} onError={onError} />
    );

    // Direct form submit bypasses the disabled button
    fireEvent.submit(container.querySelector('form')!);

    expect(onError).toHaveBeenCalledWith('errors.pleaseEnterCity');
  });

  it('calls geocodeCity and onAddPlace on valid submission', async () => {
    const user = userEvent.setup();
    mockGeocode.mockResolvedValueOnce(saoPauloResult);
    const onAddPlace = vi.fn().mockResolvedValue(true);

    render(<CityInput onAddPlace={onAddPlace} />);

    await user.type(screen.getByRole('textbox'), 'Sao Paulo');
    await user.click(screen.getByRole('button', { name: 'dashboard.addCity' }));

    await vi.waitFor(() => {
      expect(onAddPlace).toHaveBeenCalledWith({
        name: 'Sao Paulo',
        state: 'Sao Paulo',
        country: 'Brasil',
        latitude: -23.5505,
        longitude: -46.6333,
      });
    });
  });

  it('clears the input after a successful add', async () => {
    const user = userEvent.setup();
    mockGeocode.mockResolvedValueOnce(saoPauloResult);

    render(<CityInput onAddPlace={vi.fn().mockResolvedValue(true)} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'Sao Paulo');
    await user.click(screen.getByRole('button', { name: 'dashboard.addCity' }));

    await vi.waitFor(() => expect(input).toHaveValue(''));
  });

  it('calls onError with the geocoding error message on failure', async () => {
    const user = userEvent.setup();
    mockGeocode.mockRejectedValueOnce(new Error('City "XYZ" not found'));
    const onError = vi.fn();

    render(<CityInput onAddPlace={vi.fn()} onError={onError} />);

    await user.type(screen.getByRole('textbox'), 'XYZ');
    await user.click(screen.getByRole('button', { name: 'dashboard.addCity' }));

    await vi.waitFor(() =>
      expect(onError).toHaveBeenCalledWith('City "XYZ" not found')
    );
  });

  it('calls onError when onAddPlace returns false (duplicate city)', async () => {
    const user = userEvent.setup();
    mockGeocode.mockResolvedValueOnce(saoPauloResult);
    const onError = vi.fn();

    render(
      <CityInput
        onAddPlace={vi.fn().mockResolvedValue(false)}
        onError={onError}
      />
    );

    await user.type(screen.getByRole('textbox'), 'Sao Paulo');
    await user.click(screen.getByRole('button', { name: 'dashboard.addCity' }));

    await vi.waitFor(() =>
      expect(onError).toHaveBeenCalledWith('cities.cityAlreadyAdded')
    );
  });

  it('disables the submit button and shows searching text during geocoding', async () => {
    const user = userEvent.setup();
    let resolveGeocode!: (value: typeof saoPauloResult) => void;
    mockGeocode.mockReturnValueOnce(
      new Promise((res) => {
        resolveGeocode = res;
      })
    );

    render(<CityInput onAddPlace={vi.fn()} />);

    await user.type(screen.getByRole('textbox'), 'Sao Paulo');
    await user.click(screen.getByRole('button', { name: 'dashboard.addCity' }));

    // While geocoding is pending the button changes to the loading label
    expect(
      screen.getByRole('button', { name: 'dashboard.searching' })
    ).toBeDisabled();

    // Resolve to clean up the pending promise
    resolveGeocode(saoPauloResult);
  });
});
