/**
 * FE-08-pick — the order shelters appear in the picker.
 *
 * Server order buries a match below the fold: before this, the one shelter that
 * met a stated need could sit tenth in a list of sixteen, and the volunteer had
 * to scroll the whole thing to learn whether a match existed at all.
 *
 * The rule is match count first, then distance, then name. Distance is the
 * tiebreak and never the primary key — a nearer shelter that meets nothing must
 * not outrank a further one that meets a need. The two cases worth guarding are
 * missing coordinates (must not read as "very close") and stability (the list
 * must not reshuffle between renders).
 *
 * RVTM §7 Tier 2.
 */
import {
  countMatches,
  distanceMetres,
  rankShelters,
} from './shelterAttributes';

type TShelter = {
  name: string;
  attributes: string[];
  coords?: { latitude: number; longitude: number } | null;
};

const shelter = (
  name: string,
  attributes: string[] = [],
  coords: TShelter['coords'] = null,
): TShelter => ({ name, attributes, coords });

// Rank with the wiring ReferralForm uses, so a change to the option names
// breaks here rather than only on the device.
const order = (
  shelters: TShelter[],
  desired: string[],
  origin?: TShelter['coords'],
) =>
  rankShelters(shelters, {
    attributesOf: (s) => s.attributes,
    desired,
    nameOf: (s) => s.name,
    coordsOf: (s) => s.coords,
    origin,
  }).map((s) => s.name);

describe('countMatches', () => {
  it('counts only the needs the shelter actually offers', () => {
    expect(countMatches(['Cats', 'Pet Area'], ['Cats', 'Exotics'])).toBe(1);
  });

  it('is zero when nothing is needed, however much is offered', () => {
    expect(countMatches(['Cats', 'Pet Area', 'Exotics'], [])).toBe(0);
  });

  it('counts a need once even when the shelter lists it twice', () => {
    // Shelter attributes are flattened from three independent lists, so a
    // repeat is cheap to guard against and would otherwise inflate the rank.
    expect(countMatches(['Cats', 'Cats'], ['Cats'])).toBe(1);
  });
});

describe('distanceMetres', () => {
  const origin = { latitude: 0, longitude: 0 };

  it('measures between two fully specified points', () => {
    // ~0.1° of longitude at the equator ≈ 11.1 km.
    const metres = distanceMetres(origin, { latitude: 0, longitude: 0.1 });
    expect(metres).toBeGreaterThan(11_000);
    expect(metres).toBeLessThan(11_200);
  });

  it.each([
    ['no origin', null, { latitude: 0, longitude: 0.1 }],
    ['no destination', origin, null],
    ['a null latitude', origin, { latitude: null, longitude: 0.1 }],
    ['a null longitude', origin, { latitude: 0, longitude: null }],
  ])('returns null given %s', (_case, a, b) => {
    // null rather than 0: a missing coordinate must never sort as "here".
    expect(distanceMetres(a, b)).toBeNull();
  });
});

describe('rankShelters', () => {
  it('puts the most matched needs first, whatever order the server sent', () => {
    const shelters = [
      shelter('None', []),
      shelter('Two', ['Cats', 'Exotics']),
      shelter('One', ['Cats']),
    ];

    expect(order(shelters, ['Cats', 'Exotics'])).toEqual([
      'Two',
      'One',
      'None',
    ]);
  });

  it('breaks a tie on match count by distance', () => {
    const near = shelter('Near', ['Cats'], { latitude: 0, longitude: 0.1 });
    const far = shelter('Far', ['Cats'], { latitude: 0, longitude: 0.2 });

    expect(order([far, near], ['Cats'], { latitude: 0, longitude: 0 })).toEqual(
      ['Near', 'Far'],
    );
  });

  it('never lets distance outrank a match', () => {
    // The whole point of the ordering: a shelter next door that meets nothing
    // still sits below one across town that meets a need.
    const nextDoor = shelter('Next Door', [], { latitude: 0, longitude: 0.01 });
    const acrossTown = shelter('Across Town', ['Cats'], {
      latitude: 0,
      longitude: 0.5,
    });

    expect(
      order([nextDoor, acrossTown], ['Cats'], { latitude: 0, longitude: 0 }),
    ).toEqual(['Across Town', 'Next Door']);
  });

  it('sorts a shelter with no coordinates after one with them', () => {
    const located = shelter('Located', ['Cats'], {
      latitude: 0,
      longitude: 0.9,
    });
    const unlocated = shelter('Absent', ['Cats'], null);

    // 'Absent' wins on name, and its distance is unknown rather than zero — so
    // the located shelter leads despite being most of a degree away.
    expect(
      order([unlocated, located], ['Cats'], { latitude: 0, longitude: 0 }),
    ).toEqual(['Located', 'Absent']);
  });

  it('falls back to name when distance cannot separate two shelters', () => {
    const shelters = [shelter('Beta', ['Cats']), shelter('Alpha', ['Cats'])];

    // No origin chosen — the default. Every distance is null, so name decides.
    expect(order(shelters, ['Cats'])).toEqual(['Alpha', 'Beta']);
  });

  it('ignores coordinates entirely when no origin is chosen', () => {
    const far = shelter('Alpha', ['Cats'], { latitude: 40, longitude: -70 });
    const near = shelter('Beta', ['Cats'], { latitude: 0, longitude: 0 });

    expect(order([near, far], ['Cats'])).toEqual(['Alpha', 'Beta']);
  });

  it('orders by name alone when the client stated no needs', () => {
    const shelters = [shelter('Charlie'), shelter('Alpha'), shelter('Beta')];

    expect(order(shelters, [])).toEqual(['Alpha', 'Beta', 'Charlie']);
  });

  it('leaves the input array untouched', () => {
    // Query results are frozen and shared with the Apollo cache; sorting in
    // place would mutate them and throw in strict mode.
    const shelters = Object.freeze([
      shelter('Beta', ['Cats']),
      shelter('Alpha', []),
    ]) as unknown as TShelter[];

    expect(order(shelters, ['Cats'])).toEqual(['Beta', 'Alpha']);
    expect(shelters.map((s) => s.name)).toEqual(['Beta', 'Alpha']);
  });

  it('returns an empty list unchanged', () => {
    expect(order([], ['Cats'])).toEqual([]);
  });
});

it.each([NaN, Infinity, 91, -91])(
  'does not rank an invalid latitude as a usable distance: %s',
  (latitude) => {
    expect(
      distanceMetres(
        { latitude: 34, longitude: -118 },
        { latitude, longitude: -118 },
      ),
    ).toBeNull();
  },
);
it('does not rank an out-of-range longitude as a usable distance', () => {
  expect(
    distanceMetres(
      { latitude: 34, longitude: -118 },
      { latitude: 34, longitude: 181 },
    ),
  ).toBeNull();
});
