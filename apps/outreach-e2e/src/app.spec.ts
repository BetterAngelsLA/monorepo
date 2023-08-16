import { by, device, element, expect } from 'detox';

describe('Outreach', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display welcome message', async () => {
    await expect(element(by.id('heading'))).toHaveText('Welcome Outreach 👋');
  });
});
