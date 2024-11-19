import { by, device, element, expect } from 'detox';

describe('BetterAngels', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('when signed out', () => {
    it('should navigate to the login screen when the Get Started button is tapped', async () => {
      await waitFor(element(by.text('Get Started')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('Get Started')).tap();

      await expect(element(by.text('Welcome!'))).toBeVisible();
    });
  });
});
