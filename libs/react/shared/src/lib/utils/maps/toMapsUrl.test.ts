import { isIOSBrowser } from '../platform';
import { toMapsUrl, type TMapsProvider } from './toMapsUrl';

vi.mock('../platform', () => ({
  isIOSBrowser: vi.fn(),
}));

type TParams = {
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  provider?: TMapsProvider;
};

const GOOGLE_ROOT = 'https://www.google.com/maps';
const APPLE_ROOT = 'https://maps.apple.com';

/** `[params, isIOSBrowser(), expected]` */
const cases: [TParams, boolean, string | null][] = [
  [{}, false, null],
  [{ address: '   ' }, false, null],
  [{ latitude: 1 }, false, null],
  [{ longitude: 2 }, false, null],
  [
    { latitude: 1, longitude: 2 },
    false,
    `${GOOGLE_ROOT}/dir/?api=1&destination=1%2C2`,
  ],
  [
    { latitude: 1, longitude: 2, address: 'test address' },
    false,
    `${GOOGLE_ROOT}/dir/?api=1&destination=1%2C2`,
  ],
  [
    { address: '  test address  ' },
    false,
    `${GOOGLE_ROOT}/dir/?api=1&destination=test%20address`,
  ],
  [
    { latitude: NaN, longitude: 2, address: 'test address' },
    false,
    `${GOOGLE_ROOT}/dir/?api=1&destination=test%20address`,
  ],
  [
    { latitude: 1, longitude: Infinity, address: 'test address' },
    false,
    `${GOOGLE_ROOT}/dir/?api=1&destination=test%20address`,
  ],
  [
    { latitude: 1, longitude: 2, provider: 'auto' },
    false,
    `${GOOGLE_ROOT}/dir/?api=1&destination=1%2C2`,
  ],
  [
    { latitude: 1, longitude: 2, provider: 'auto' },
    true,
    `${APPLE_ROOT}/?daddr=1%2C2`,
  ],
  [
    { address: 'test address', provider: 'auto' },
    true,
    `${APPLE_ROOT}/?daddr=test%20address`,
  ],
];

describe('toMapsUrl', () => {
  it.each(cases)(
    'toMapsUrl(%o) with isIOSBrowser() = %s → %s',
    (params, isIOS, expected) => {
      vi.mocked(isIOSBrowser).mockReturnValue(isIOS);

      expect(toMapsUrl(params)).toBe(expected);
    },
  );
});
