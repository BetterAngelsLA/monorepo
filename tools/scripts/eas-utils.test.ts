import * as fs from 'fs';
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
    'MAESTRO_APP_ID',
  ];

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(require('os').tmpdir(), 'eas-test-'));

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
    expect(envContent).toContain('EXPO_PUBLIC_API_URL=https://api.prod.example.com');
    expect(envContent).toContain('EXPO_PUBLIC_DEMO_API_URL=https://api.dev.example.com');
    expect(envContent).toContain('RUNTIME_VERSION=abc123');
  });

  it('CI env vars override eas.json profile defaults', () => {
    writeEasJson({
      build: {
        production: {
          env: {
            EXPO_PUBLIC_API_URL: 'https://from-eas-json.com',
          },
        },
      },
    });

    // Simulate CI secret overriding the eas.json default
    process.env.EXPO_PUBLIC_API_URL = 'https://from-ci-secret.com';

    setupEnvAndFingerprint(tmpDir, 'production');

    expect(process.env.EXPO_PUBLIC_API_URL).toBe('https://from-ci-secret.com');

    const envContent = fs.readFileSync(path.join(tmpDir, '.env'), 'utf-8');
    expect(envContent).toContain('EXPO_PUBLIC_API_URL=https://from-ci-secret.com');
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

  it('returns the fingerprint hash', () => {
    writeEasJson({ build: { dev: { env: {} } } });

    const hash = setupEnvAndFingerprint(tmpDir, 'dev');

    expect(hash).toBe('abc123');
  });
});
