import { isStaleBuild } from './useWebUpdateCheck';

const FULL_SHA = 'abc123def4567890abc123def4567890abc123de';
const SHORT_SHA = FULL_SHA.slice(0, 12);
const OTHER_SHA = '0123456789abcdef0123456789abcdef01234567';

describe('isStaleBuild', () => {
  it('reports a reload when the deployment has moved on', () => {
    expect(isStaleBuild(SHORT_SHA, OTHER_SHA)).toBe(true);
  });

  it('stays quiet when the ids match', () => {
    expect(isStaleBuild(SHORT_SHA, SHORT_SHA)).toBe(false);
  });

  it('treats a full sha and its short form as the same build', () => {
    // The bundle inlines what the export saw; version.json is written by the
    // deploy. If those were compared verbatim the prompt would never stop.
    expect(isStaleBuild(FULL_SHA, SHORT_SHA)).toBe(false);
    expect(isStaleBuild(SHORT_SHA, FULL_SHA)).toBe(false);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(isStaleBuild(`  ${FULL_SHA.toUpperCase()}  `, SHORT_SHA)).toBe(false);
  });

  it('stays quiet when this bundle has no id', () => {
    expect(isStaleBuild(undefined, OTHER_SHA)).toBe(false);
  });

  it('stays quiet when the deployment publishes no id', () => {
    expect(isStaleBuild(FULL_SHA, null)).toBe(false);
  });

  it('refuses to compare values that are not commit shas', () => {
    // A deployment that published a date or a branch name would compare equal to
    // itself forever (silently disabling the check), and a typo would prompt
    // forever. "Cannot tell" is the safe answer for both.
    expect(isStaleBuild('2026.11.17', '2026.11.17')).toBe(false);
    expect(isStaleBuild(FULL_SHA, 'release-candidate')).toBe(false);
    expect(isStaleBuild('abc', OTHER_SHA)).toBe(false);
  });
});
