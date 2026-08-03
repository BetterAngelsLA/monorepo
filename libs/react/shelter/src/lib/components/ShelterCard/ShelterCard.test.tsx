/**
 * @vitest-environment jsdom
 */
import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_STORAGE_MAP_VIEWPORT } from '../../constants';
import { ShelterCard, TShelter } from './ShelterCard';

const navigateMock = vi.fn();

type FakeMap = {
  getCenter: () => { lat: () => number; lng: () => number };
  getZoom: () => number;
};

let mapMock: FakeMap | null;

function makeMap(): FakeMap {
  return {
    getCenter: () => ({ lat: () => 34.097262, lng: () => -118.361874 }),
    getZoom: () => 12,
  };
}

vi.mock('@vis.gl/react-google-maps', () => ({
  useMap: () => mapMock,
}));

// Mock the heavy `../Map` barrel (it would pull in Map.tsx, Google Maps
// controls and @monorepo/react/components), forwarding the real
// saveMapViewport/mapViewportFromMap helpers so the sessionStorage behavior
// is exercised.
vi.mock('../Map', async () => {
  const storage = await vi.importActual<
    typeof import('../Map/utils/mapViewportStorage')
  >('../Map/utils/mapViewportStorage');
  return {
    mapViewportFromMap: storage.mapViewportFromMap,
    saveMapViewport: storage.saveMapViewport,
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return { ...actual, useNavigate: () => navigateMock };
});

const shelter: TShelter = {
  id: '5',
  name: 'Buck Foundation Outreach',
  location: {
    latitude: 34.097262,
    longitude: -118.361874,
    place: '2679 Santa Monica Blvd, USA',
  },
};

beforeEach(() => {
  sessionStorage.clear();
  navigateMock.mockClear();
  mapMock = makeMap();
});

describe('ShelterCard', () => {
  it('saves the current map center + zoom before navigating to shelter details', () => {
    const { getByText } = render(<ShelterCard shelter={shelter} />);

    fireEvent.click(getByText('Buck Foundation Outreach'));

    expect(navigateMock).toHaveBeenCalledWith('/shelter/5');
    expect(sessionStorage.getItem(SESSION_STORAGE_MAP_VIEWPORT)).toBe(
      JSON.stringify({
        center: { latitude: 34.097262, longitude: -118.361874 },
        zoom: 12,
      })
    );
  });

  it('navigates to shelter details without saving when the map is not ready', () => {
    mapMock = null;

    const { getByText } = render(<ShelterCard shelter={shelter} />);

    fireEvent.click(getByText('Buck Foundation Outreach'));

    expect(navigateMock).toHaveBeenCalledWith('/shelter/5');
    expect(sessionStorage.getItem(SESSION_STORAGE_MAP_VIEWPORT)).toBeNull();
  });
});
