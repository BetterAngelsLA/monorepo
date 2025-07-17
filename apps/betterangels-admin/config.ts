function loadConfig() {
  const apiUrl = import.meta.env.VITE_SHELTER_API_URL;
  const demoApiUrl = import.meta.env.VITE_DEMO_API_URL;

  if (!apiUrl || !demoApiUrl) {
    throw new Error('One or more environment variables are undefined.');
  }

  return { apiUrl, demoApiUrl };
}

const { apiUrl, demoApiUrl } = loadConfig();

export { apiUrl, demoApiUrl };
