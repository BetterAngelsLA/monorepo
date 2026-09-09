import path from 'node:path';
import { CALENDAR_TEST_DATE, TIME_ZONES } from './constants';
import { runInTZ } from './utils/runInTZ';

const isWindows = process.platform === 'win32';
const it_unixOnly = isWindows ? it.skip : it;

describe('toLocalCalendarDate — multi-TZ smoke test', () => {
  const scriptPath = path.resolve(__dirname, './utils/roundTripLocal.cjs');

  TIME_ZONES.forEach((tz) => {
    it_unixOnly(`renders the same calendar day in ${tz}`, () => {
      const out = runInTZ({
        tz,
        absScriptPath: scriptPath,
        extraEnv: {
          CALENDAR_TEST_DATE,
        },
      });

      expect(out).toBe(CALENDAR_TEST_DATE);
    });
  });
});
