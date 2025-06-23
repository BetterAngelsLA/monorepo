// config.ts
function loadConfig() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  const demoApiUrl = process.env.EXPO_PUBLIC_DEMO_API_URL;

  // Check if any of the environment variables are undefined
  if (!apiUrl || !demoApiUrl) {
    throw new Error('One or more environment variables are undefined.');
  }

  return { apiUrl, demoApiUrl };
}

const { apiUrl, demoApiUrl } = loadConfig();

const privacyPolicyUrl = `${apiUrl}/legal/privacy-policy`;
const termsOfServiceUrl = `${apiUrl}/legal/terms-of-service`;

export { apiUrl, demoApiUrl, privacyPolicyUrl, termsOfServiceUrl };
