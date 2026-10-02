/**
 * The submit-time notes assembly — the last thing that runs before a referral is
 * written, and the place where two failures would be invisible until someone
 * complained:
 *
 *   • the staff notes getting swallowed into the machine-readable sidecar
 *     (stored twice, and shown to humans as JSON), or
 *   • the sidecar leaking into what a human reads.
 *
 * Extracted from ReferralsTab's submit handler so it can be tested at all.
 * Retires with the sidecar. RVTM §7 Tier 1.
 */
import {
  buildReferralNotes,
  decodeReferralNotes,
  stripSidecar,
  summarizeIntake,
} from './referralIntakeSidecar';

const STAFF_NOTES = 'Prefers westside; needs bottom bunk';

describe('buildReferralNotes', () => {
  it('returns undefined when the draft is empty', () => {
    // The caller omits `notes` entirely rather than sending an empty string.
    expect(buildReferralNotes({})).toBeUndefined();
  });

  it('treats the intake notes field as human text, not sidecar data', () => {
    const notes = buildReferralNotes({ notes: STAFF_NOTES });

    expect(notes).toBe(STAFF_NOTES);
    expect(notes).not.toContain('referral-intake'); // no sidecar at all
  });

  // The bug this function exists to prevent.
  it('never stores the notes field inside the sidecar as well', () => {
    const notes = buildReferralNotes({
      notes: STAFF_NOTES,
      storage: 'Yes',
    }) as string;

    const { humanNotes, intake } = decodeReferralNotes(notes);

    expect(humanNotes).toBe(STAFF_NOTES);
    expect(intake).toEqual({ storage: 'Yes' });
    expect(intake).not.toHaveProperty('notes'); // not duplicated
  });

  it('puts every non-notes field into the sidecar', () => {
    const notes = buildReferralNotes({
      storage: 'Yes',
      pets: 'No',
      substances: '30 days',
    }) as string;

    expect(decodeReferralNotes(notes).intake).toEqual({
      storage: 'Yes',
      pets: 'No',
      substances: '30 days',
    });
  });

  it('leaves the human portion empty when only sidecar fields are present', () => {
    const notes = buildReferralNotes({ storage: 'Yes' }) as string;

    expect(decodeReferralNotes(notes).humanNotes).toBe('');
  });

  it('appends the picker notes to the intake notes on their own line', () => {
    const notes = buildReferralNotes(
      { notes: STAFF_NOTES },
      'Arriving after 8pm',
    ) as string;

    expect(decodeReferralNotes(notes).humanNotes).toBe(
      `${STAFF_NOTES}\nArriving after 8pm`,
    );
  });

  it('uses the picker notes alone when the intake notes are empty', () => {
    const notes = buildReferralNotes({}, 'Arriving after 8pm');

    expect(notes).toBe('Arriving after 8pm');
  });

  it('does not leave a stray separator when one side is blank', () => {
    expect(buildReferralNotes({ notes: STAFF_NOTES }, '   ')).toBe(STAFF_NOTES);
    expect(buildReferralNotes({ notes: '   ' }, 'Late arrival')).toBe(
      'Late arrival',
    );
  });

  it('trims surrounding whitespace from both sources', () => {
    expect(buildReferralNotes({ notes: '  padded  ' })).toBe('padded');
  });

  it('ignores a non-string notes value rather than crashing', () => {
    // Defensive: the draft store is untyped at the value level.
    const notes = buildReferralNotes({
      notes: 42 as unknown as string,
      storage: 'Yes',
    }) as string;

    expect(decodeReferralNotes(notes).humanNotes).toBe('');
  });

  it('does not mutate the caller’s draft values', () => {
    const draft = { notes: STAFF_NOTES, storage: 'Yes' };

    buildReferralNotes(draft);

    expect(draft).toEqual({ notes: STAFF_NOTES, storage: 'Yes' });
  });

  it('produces notes a human can read with the sidecar stripped', () => {
    const notes = buildReferralNotes({
      notes: STAFF_NOTES,
      substances: '30 days',
    }) as string;

    // What display / email / export would show
    expect(stripSidecar(notes)).toBe(STAFF_NOTES);
    expect(stripSidecar(notes)).not.toContain('30 days');
  });

  it('keeps sensitive values masked in the summary rendered on the card', () => {
    const notes = buildReferralNotes({
      notes: STAFF_NOTES,
      storage: 'Yes',
      substances: '30 days',
    }) as string;

    const summary = summarizeIntake(decodeReferralNotes(notes).intake);

    expect(summary).toContain('storage: Yes');
    expect(summary).toContain('substances: ••••');
    expect(summary).not.toContain('30 days');
  });
});
