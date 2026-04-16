import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { setupEnvAndFingerprint } from './eas-utils';

// Mock execSync (used by `run`) to return a fake fingerprint
jest.mock('child_process', () => ({
  execSync: jest.fn(() => JSON.stringify({ hash: 'abc123' })),
}));

describe('setupEnvAndFingerprint', () => {
  let tmpDir: string;
  const savedEnv: Record<string, string | undefined> = {};

  // Keys we need to clean up from process.env after each test
  const envKeysToClean = [
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_DEMO_API_URL',
    'EXPO_PUBLIC_APP_ENV',
    'EXPO_PUBLIC_NEW_RELIC_LOG_LEVEL',
    'EAS_NO_FROZEN_LOCKFILE',
    'APP_VARIANT',
    'RUNTIME_VERSION',
    'EXPO_PUBLIC_OVERRIDE',
    'EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY',
    'MAESTRO_APP_ID',
  ];

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'eas-test-'));

    // Save and clear relevant env vars
    for (const key of envKeysToClean) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    // Restore env vars
    for (const key of envKeysToClean) {
      if (savedEnv[key] !== undefined) {
        process.env[key] = savedEnv[key];
      } else {
        delete process.env[key];
      }
    }

    // Clean up tmp dir
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeEasJson(config: object) {
    fs.writeFileSync(
      path.join(tmpDir, 'eas.json'),
      JSON.stringify(config, null, 2)
    );
  }

  it('writes eas.json env vars to .env and propagates to process.env', () => {
    writeEasJson({
      build: {
        production: {
          env: {
            EXPO_PUBLIC_API_URL: 'https://api.prod.example.com',
            EXPO_PUBLIC_DEMO_API_URL: 'https://api.dev.example.com',
            EXPO_PUBLIC_APP_ENV: 'production',
          },
        },
      },
    });

    setupEnvAndFingerprint(tmpDir, 'production');

    // Verify process.env was set
    expect(process.env.EXPO_PUBLIC_API_URL).toBe(
      'https://api.prod.example.com'
    );
    expect(process.env.EXPO_PUBLIC_DEMO_API_URL).toBe(
      'https://api.dev.example.com'
    );
    expect(process.env.EXPO_PUBLIC_APP_ENV).toBe('production');
    expect(process.env.RUNTIME_VERSION).toBe('abc123');

    // Verify .env file contents
    const envContent = fs.readFileSync(path.join(tmpDir, '.env'), 'utf-8');
    expect(envContent).toContain(
      'EXPO_PUBLIC_API_URL=https://api.prod.example.com'
    );
    expect(envContent).toContain(
      'EXPO_PUBLIC_DEMO_API_URL=https://api.dev.example.com'
    );
    expect(envContent).toContain('RUNTIME_VERSION=abc123');
  });

  it('eas.json profile values take precedence over pre-existing process.env', () => {
    writeEasJson({
      build: {
        production: {
          env: {
            EXPO_PUBLIC_API_URL: 'https://api.prod.example.com',
          },
        },
      },
    });

    // Simulate NX loading the committed .env (dev values) into process.env
    process.env.EXPO_PUBLIC_API_URL = 'https://api.dev.example.com';

    setupEnvAndFingerprint(tmpDir, 'production');

    // eas.json profile value should win
    expect(process.env.EXPO_PUBLIC_API_URL).toBe(
      'https://api.prod.example.com'
    );

    const envContent = fs.readFileSync(path.join(tmpDir, '.env'), 'utf-8');
    expect(envContent).toContain(
      'EXPO_PUBLIC_API_URL=https://api.prod.example.com'
    );
  });

  it('adds CI secrets not defined in eas.json profile', () => {
    writeEasJson({
      build: {
        production: {
          env: {
            EXPO_PUBLIC_API_URL: 'https://api.prod.example.com',
          },
        },
      },
    });

    // CI secret not in eas.json (e.g., Google Maps API key)
    process.env.EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY = 'secret-key-123';

    setupEnvAndFingerprint(tmpDir, 'production');

    // eas.json value preserved, CI secret added
    expect(process.env.EXPO_PUBLIC_API_URL).toBe(
      'https://api.prod.example.com'
    );
    expect(process.env.EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY).toBe(
      'secret-key-123'
    );

    const envContent = fs.readFileSync(path.join(tmpDir, '.env'), 'utf-8');
    expect(envContent).toContain(
      'EXPO_PUBLIC_API_URL=https://api.prod.example.com'
    );
    expect(envContent).toContain(
      'EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY=secret-key-123'
    );
  });

  it('collects MAESTRO_* vars from process.env', () => {
    writeEasJson({ build: { test: { env: {} } } });

    process.env.MAESTRO_APP_ID = 'com.test.app';

    setupEnvAndFingerprint(tmpDir, 'test');

    expect(process.env.MAESTRO_APP_ID).toBe('com.test.app');

    const envContent = fs.readFileSync(path.join(tmpDir, '.env'), 'utf-8');
    expect(envContent).toContain('MAESTRO_APP_ID=com.test.app');
  });

  it('works when eas.json does not exist', () => {
    // No eas.json written — should not throw
    process.env.EXPO_PUBLIC_OVERRIDE = 'value';

    const hash = setupEnvAndFingerprint(tmpDir, 'production');

    expect(hash).toBe('abc123');
    expect(process.env.EXPO_PUBLIC_OVERRIDE).toBe('value');
    expect(process.env.RUNTIME_VERSION).toBe('abc123');
  });

  it('propagates env vars so child processes (e.g. Metro) can inherit them', () => {
    writeEasJson({
      build: {
        production: {
          env: {
            EXPO_PUBLIC_API_URL: 'https://api.prod.example.com',
            EXPO_PUBLIC_DEMO_API_URL: 'https://api.dev.example.com',
          },
        },
      },
    });

    // Before: env vars not in process.env
    expect(process.env.EXPO_PUBLIC_API_URL).toBeUndefined();
    expect(process.env.EXPO_PUBLIC_DEMO_API_URL).toBeUndefined();

    setupEnvAndFingerprint(tmpDir, 'production');

    // After: env vars are in process.env — child processes inherit process.env by default
    expect(process.env.EXPO_PUBLIC_API_URL).toBe(
      'https://api.prod.example.com'
    );
    expect(process.env.EXPO_PUBLIC_DEMO_API_URL).toBe(
      'https://api.dev.example.com'
    );
    expect(process.env.RUNTIME_VERSION).toBe('abc123');
  });
});
