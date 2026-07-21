import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Statistics from '@/components/Statistics';
import type { Place } from '@/types';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'pt',
}));

function place(id: string, name: string, country: string): Place {
  return {
    id,
    name,
    country,
    latitude: 0,
    longitude: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('Statistics', () => {
  it('renders empty state when no places are provided', () => {
    render(<Statistics places={[]} />);
    expect(screen.getByText('statistics.noStatsYet')).toBeInTheDocument();
  });

  it('shows the correct total city count', () => {
    // 3 cities all in the same country → cities=3, countries=1 (distinct values)
    render(
      <Statistics
        places={[
          place('1', 'Sao Paulo', 'Brasil'),
          place('2', 'Rio',       'Brasil'),
          place('3', 'Curitiba',  'Brasil'),
        ]}
      />
    );
    expect(screen.getByText('3')).toBeInTheDocument(); // cities
    expect(screen.getByText('1')).toBeInTheDocument(); // countries
  });

  it('shows correct totals for cities and countries', () => {
    render(
      <Statistics
        places={[
          place('1', 'Sao Paulo', 'Brasil'),
          place('2', 'Rio',       'Brasil'),
          place('3', 'Tokyo',     'Japan'),
        ]}
      />
    );
    // 3 cities, 2 countries
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders each country name in the list', () => {
    render(
      <Statistics
        places={[
          place('1', 'Sao Paulo', 'Brasil'),
          place('2', 'Tokyo',     'Japan'),
        ]}
      />
    );
    expect(screen.getByText('Brasil')).toBeInTheDocument();
    expect(screen.getByText('Japão')).toBeInTheDocument();
  });

  it('counts one country when names differ only by language', () => {
    render(
      <Statistics
        places={[
          place('1', 'Naples', 'Italy'),
          place('2', 'Rome', 'Itália'),
        ]}
      />
    );

    expect(screen.getByText('1')).toBeInTheDocument(); // countries
    expect(screen.getByText('Itália')).toBeInTheDocument();
  });

  it('lists the country with most cities before countries with fewer', () => {
    render(
      <Statistics
        places={[
          place('1', 'Tokyo',      'Japan'),
          place('2', 'Osaka',      'Japan'),
          place('3', 'Kyoto',      'Japan'),  // Japan: 3
          place('4', 'Paris',      'France'), // France: 1
          place('5', 'Sao Paulo',  'Brasil'), // Brasil: 1
        ]}
      />
    );

    const japan  = screen.getByText('Japão');
    const france = screen.getByText('França');

    // Japan (3 cities) must appear before France (1 city) in the DOM
    expect(
      japan.compareDocumentPosition(france) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('calls onShareClick when the share button is clicked', async () => {
    const user = userEvent.setup();
    const onShareClick = vi.fn();

    render(
      <Statistics
        places={[place('1', 'Tokyo', 'Japan')]}
        onShareClick={onShareClick}
      />
    );

    await user.click(screen.getByTitle('statistics.share'));
    expect(onShareClick).toHaveBeenCalledOnce();
  });
});
