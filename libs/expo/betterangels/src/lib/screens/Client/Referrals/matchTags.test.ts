/**
 * FE-16-pick — client-need vs shelter-attribute match tags.
 *
 * The colour rule is the whole requirement, and it is easy to invert by accident:
 *   green solid  = the shelter offers something the client needs
 *   red solid    = the client needs it and the shelter, having reported that
 *                  CATEGORY of attribute, does NOT offer it — a confirmed gap
 *   red outline  = the client needs it but the shelter never reported that
 *                  category, so the mismatch is unknown rather than confirmed
 *   gray         = the shelter offers something the client has no stated need for
 *
 * The gap/unknown split is decided per category (pets, demographics,
 * accessibility), because shelters report those three lists independently.
 *
 * RVTM §7 Tier 1.
 */
import { Colors } from '@monorepo/expo/shared/static';
import { type TTag, matchTags } from './shelterAttributes';

const labels = (tags: { label: string }[]) => tags.map((t) => t.label);
const colorOf = (tags: TTag[], label: string) =>
  tags.find((t) => t.label === label)?.color;
const kindOf = (tags: TTag[], label: string) =>
  tags.find((t) => t.label === label)?.kind;

describe('matchTags', () => {
  it('marks an offered + needed attribute green', () => {
    const tags = matchTags(['Cats'], ['Cats']);

    expect(tags).toHaveLength(1);
    expect(colorOf(tags, 'Cats')).toBe(Colors.SUCCESS);
  });

  it('marks a needed but NOT offered attribute red', () => {
    // same category (pets): the shelter reported its pet policy and cats
    // aren't in it, so the omission is a real gap
    const tags = matchTags(['Service Animals'], ['Cats']);

    expect(colorOf(tags, 'Cats')).toBe(Colors.ERROR);
    expect(kindOf(tags, 'Cats')).toBe('gap');
  });

  it('marks an offered but not-needed attribute gray', () => {
    const tags = matchTags(['Pet Area'], []);

    expect(tags).toHaveLength(1);
    expect(colorOf(tags, 'Pet Area')).toBe(Colors.NEUTRAL);
  });

  it('classifies a mixed set into all three buckets at once', () => {
    const offered = ['Cats', 'Pet Area'];
    const needed = ['Cats', 'Wheelchair Accessible'];

    const tags = matchTags(offered, needed);

    expect(colorOf(tags, 'Cats')).toBe(Colors.SUCCESS); // offered ∩ needed
    expect(colorOf(tags, 'Wheelchair Accessible')).toBe(Colors.ERROR); // needed ∖ offered
    expect(colorOf(tags, 'Pet Area')).toBe(Colors.NEUTRAL); // offered ∖ needed
    expect(tags).toHaveLength(3);
  });

  it('tags each bucket with a kind independent of its colour', () => {
    // ShelterCard partitions on `kind`, not on Colors.* — so a palette change
    // must not be able to silently move a tag between buckets.
    const tags = matchTags(
      ['Cats', 'Pet Area'],
      ['Cats', 'Service Animals', 'Wheelchair Accessible'],
    );

    expect(kindOf(tags, 'Cats')).toBe('match');
    // pets was reported, so a missing pet attribute is a confirmed gap
    expect(kindOf(tags, 'Service Animals')).toBe('gap');
    // accessibility was never reported, so this one is unknowable
    expect(kindOf(tags, 'Wheelchair Accessible')).toBe('unknown');
    expect(kindOf(tags, 'Pet Area')).toBe('other');
  });

  it('keeps kind and colour in agreement across every bucket', () => {
    const tags = matchTags(
      ['Cats', 'Pet Area'],
      ['Cats', 'Service Animals', 'Wheelchair Accessible'],
    );
    const expected = {
      match: Colors.SUCCESS,
      gap: Colors.ERROR,
      unknown: Colors.ERROR,
      other: Colors.NEUTRAL,
    };

    tags.forEach((tag) => {
      expect(tag.kind).toBeDefined();
      expect(tag.color).toBe(expected[tag.kind as keyof typeof expected]);
    });
  });

  it('orders tags green, then red, then gray', () => {
    const tags = matchTags(
      ['Pet Area', 'Cats'],
      ['Cats', 'ADA Rooms Available'],
    );

    expect(labels(tags)).toEqual([
      'Cats', // green
      'ADA Rooms Available', // red
      'Pet Area', // gray
    ]);
  });

  it('degrades to an all-gray row when no client needs are supplied', () => {
    // Callers without client context (a plain shelter list) pass nothing —
    // this must not throw and must not invent red "unmet need" tags.
    const tags = matchTags(['Cats', 'Pet Area']);

    expect(tags.every((t) => t.color === Colors.NEUTRAL)).toBe(true);
    expect(tags).toHaveLength(2);
  });

  describe('unreported attributes are unknown, per category', () => {
    // Absence of data is not evidence of absence, and coverage is patchy PER
    // CATEGORY (pets 33, demographics 32, accessibility 24 of 206 records) — so
    // this cannot be decided for the shelter as a whole.
    it('treats every need as unknown when the shelter reported nothing', () => {
      const tags = matchTags([], ['Cats', 'Wheelchair Accessible']);

      expect(tags).toHaveLength(2);
      expect(tags.every((t) => t.color === Colors.ERROR)).toBe(true);
      expect(tags.every((t) => t.kind === 'unknown')).toBe(true);
    });

    it('decides gap-vs-unknown independently for each category', () => {
      // pets reported (Cats), accessibility and demographics not
      const tags = matchTags(
        ['Cats'],
        ['Service Animals', 'Wheelchair Accessible', 'Single Women'],
      );

      expect(kindOf(tags, 'Service Animals')).toBe('gap'); // pets: asked
      expect(kindOf(tags, 'Wheelchair Accessible')).toBe('unknown'); // not asked
      expect(kindOf(tags, 'Single Women')).toBe('unknown'); // not asked
    });

    it('reporting one category does not vouch for another', () => {
      // the regression this guards: a shelter listing only pets used to make
      // an unmet accessibility need look like a confirmed mismatch
      expect(
        kindOf(
          matchTags(['Cats'], ['Wheelchair Accessible']),
          'Wheelchair Accessible',
        ),
      ).toBe('unknown');
    });

    it('promotes a need to gap once its own category is reported', () => {
      expect(kindOf(matchTags([], ['Cats']), 'Cats')).toBe('unknown');
      expect(kindOf(matchTags(['Pet Area'], ['Cats']), 'Cats')).toBe('gap');
    });

    it('draws unknown as outline and a confirmed gap as solid', () => {
      const unknown = matchTags([], ['Wheelchair Accessible']);
      const gap = matchTags(['Pet Area'], ['Cats']);

      expect(unknown[0].variant).toBe('outline');
      expect(gap.find((t) => t.kind === 'gap')?.variant).toBe('solid');
    });

    it('cannot confirm a need outside the known vocabulary', () => {
      // an unrecognised label belongs to no category, so nothing can vouch for it
      const tags = matchTags(['Cats'], ['Some Bespoke Need']);

      expect(kindOf(tags, 'Some Bespoke Need')).toBe('unknown');
    });
  });

  it('returns an empty list when there is nothing to compare', () => {
    expect(matchTags([], [])).toEqual([]);
  });

  it('never drops or duplicates a label across the three buckets', () => {
    const offered = ['Cats', 'Pet Area', 'Exotics'];
    const needed = ['Cats', 'Wheelchair Accessible'];

    const tags = matchTags(offered, needed);
    const seen = labels(tags);

    // every input label appears exactly once
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen.sort()).toEqual([...new Set([...offered, ...needed])].sort());
  });
});
