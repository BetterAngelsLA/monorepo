/**
 * TEMPORARY code — but it handles PII and it is the only thing standing between
 * the intake fields and total loss, so it is tested while it exists.
 *
 * Two properties matter most:
 *   1. a malformed sidecar must NEVER destroy the human notes
 *   2. PII must be grouped under its own parent and masked in any human render
 *
 * Delete this file together with referralIntakeSidecar.ts (see
 * commit-inventory-and-submission-plan.md). RVTM §7 Tier 1.
 */
import {
  PII_KEYS,
  decodeReferralNotes,
  encodeReferralNotes,
  stripSidecar,
  summarizeIntake,
} from './referralIntakeSidecar';

const HUMAN = 'Prefers westside; needs bottom bunk';

describe('encodeReferralNotes', () => {
  it('leaves notes untouched when there is nothing to stash', () => {
    expect(encodeReferralNotes(HUMAN, {})).toBe(HUMAN);
  });

  it('drops empty values rather than storing them', () => {
    // '' / null / false / [] are "unanswered", not answers.
    const encoded = encodeReferralNotes(HUMAN, {
      storage: '',
      pets: null,
      consent: false,
      tags: [],
    });

    expect(encoded).toBe(HUMAN);
  });

  it('appends a fenced JSON sidecar after the human notes', () => {
    const encoded = encodeReferralNotes(HUMAN, { storage: 'Yes' });

    expect(encoded.startsWith(HUMAN)).toBe(true);
    expect(encoded).toContain('<<<referral-intake:v1>>>');
    expect(encoded).toContain('<<<end-referral-intake>>>');
  });

  it('groups PII under its own parent, separate from ordinary fields', () => {
    const encoded = encodeReferralNotes(HUMAN, {
      storage: 'Yes',
      substances: '30 days',
    });
    const payload = JSON.parse(
      encoded.split('<<<referral-intake:v1>>>\n')[1].split('\n<<<end')[0],
    );

    expect(payload.fields).toEqual({ storage: 'Yes' });
    expect(payload.PII).toEqual({ substances: '30 days' });
    expect(payload.v).toBe(1);
  });

  it('writes a sidecar even when the human notes are empty', () => {
    const encoded = encodeReferralNotes('', { storage: 'Yes' });

    expect(encoded).toContain('<<<referral-intake:v1>>>');
    expect(decodeReferralNotes(encoded).humanNotes).toBe('');
  });
});

describe('decodeReferralNotes', () => {
  it('round-trips human notes and intake values', () => {
    const intake = { storage: 'Yes', pets: 'No', substances: '30 days' };

    const { humanNotes, intake: decoded } = decodeReferralNotes(
      encodeReferralNotes(HUMAN, intake),
    );

    expect(humanNotes).toBe(HUMAN);
    expect(decoded).toEqual(intake); // PII is flattened back in
  });

  it('treats plain notes with no sidecar as entirely human', () => {
    const { humanNotes, intake } = decodeReferralNotes(HUMAN);

    expect(humanNotes).toBe(HUMAN);
    expect(intake).toEqual({});
  });

  it('handles null / undefined notes', () => {
    expect(decodeReferralNotes(null)).toEqual({ humanNotes: '', intake: {} });
    expect(decodeReferralNotes(undefined)).toEqual({
      humanNotes: '',
      intake: {},
    });
  });

  // The two data-loss guards — these are the reason this file exists.
  it('preserves the human notes when the JSON payload is malformed', () => {
    const broken = `${HUMAN}\n\n<<<referral-intake:v1>>>\n{not json{\n<<<end-referral-intake>>>`;

    const { humanNotes, intake } = decodeReferralNotes(broken);

    expect(humanNotes).toBe(HUMAN);
    expect(intake).toEqual({});
  });

  it('preserves the human notes when the closing sentinel is missing', () => {
    const truncated = `${HUMAN}\n\n<<<referral-intake:v1>>>\n{"v":1,"fields":{}}`;

    const { humanNotes, intake } = decodeReferralNotes(truncated);

    expect(humanNotes).toBe(HUMAN);
    expect(intake).toEqual({});
  });
});

describe('stripSidecar', () => {
  it('returns only the human notes — the sidecar must never leak', () => {
    // Every human-facing path (display / email / export) relies on this.
    const encoded = encodeReferralNotes(HUMAN, { substances: '30 days' });

    const stripped = stripSidecar(encoded);

    expect(stripped).toBe(HUMAN);
    expect(stripped).not.toContain('referral-intake');
    expect(stripped).not.toContain('30 days');
  });
});

describe('summarizeIntake', () => {
  it('masks PII values by default', () => {
    const summary = summarizeIntake({ storage: 'Yes', substances: '30 days' });

    expect(summary).toContain('storage: Yes');
    expect(summary).toContain('substances: ••••');
    expect(summary).not.toContain('30 days');
  });

  it('reveals PII only when explicitly asked', () => {
    const summary = summarizeIntake(
      { substances: '30 days' },
      { maskPII: false },
    );

    expect(summary).toContain('substances: 30 days');
  });

  it('does NOT mask consent — a yes/no acknowledgement is not identifying', () => {
    // GAP-21: consent was removed from PII_KEYS.
    expect(PII_KEYS).not.toContain('consent');
    expect(summarizeIntake({ consent: true })).toBe('consent: true');
  });

  it('omits empty values from the summary', () => {
    expect(summarizeIntake({ storage: 'Yes', pets: '', consent: false })).toBe(
      'storage: Yes',
    );
  });

  it('joins array values readably', () => {
    expect(summarizeIntake({ tags: ['a', 'b'] })).toBe('tags: a, b');
  });

  it('returns an empty string for an empty intake', () => {
    expect(summarizeIntake({})).toBe('');
  });
});
