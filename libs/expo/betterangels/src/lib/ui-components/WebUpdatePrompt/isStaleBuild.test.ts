import { isStaleBuild } from './useWebUpdateCheck';

describe('isStaleBuild', () => {
  it('reports a reload when the deployment has moved on', () => {
    expect(isStaleBuild('abc123', 'def456')).toBe(true);
  });

  it('stays quiet when the ids match', () => {
    expect(isStaleBuild('abc123', 'abc123')).toBe(false);
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
