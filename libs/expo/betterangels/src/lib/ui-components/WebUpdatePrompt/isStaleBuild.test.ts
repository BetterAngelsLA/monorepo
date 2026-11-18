import { isStaleBuild } from './useWebUpdateCheck';

const FULL_SHA = 'abc123def4567890abc123def4567890abc123de';
const SHORT_SHA = FULL_SHA.slice(0, 12);

describe('isStaleBuild', () => {
  it('reports a reload when the deployment has moved on', () => {
    expect(isStaleBuild(SHORT_SHA, 'def456abc123')).toBe(true);
  });

  it('stays quiet when the ids match', () => {
    expect(isStaleBuild(SHORT_SHA, SHORT_SHA)).toBe(false);
  });

  it('treats a full sha and its short form as the same build', () => {
    // The bundle inlines what the export saw (a full sha in CI); version.json is
    // written by the deploy, which may fall back to a 12-character git sha. If
    // those were compared verbatim the prompt would never stop.
    expect(isStaleBuild(FULL_SHA, SHORT_SHA)).toBe(false);
    expect(isStaleBuild(SHORT_SHA, FULL_SHA)).toBe(false);
  });

  it('ignores case and surrounding whitespace', () => {
    expect(isStaleBuild(`  ${FULL_SHA.toUpperCase()}  `, SHORT_SHA)).toBe(false);
  });

  it('stays quiet when this bundle has no id', () => {
    // A dev server, or a deployment predating version.json. Comparing against
    // nothing must not prompt.
    expect(isStaleBuild(undefined, 'def456')).toBe(false);
  });

  it('stays quiet when the deployment publishes no id', () => {
    expect(isStaleBuild('abc123', null)).toBe(false);
  });
});
