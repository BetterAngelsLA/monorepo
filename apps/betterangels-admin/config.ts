const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('VITE_API_URL is not defined in your environment variables.');
}

export { apiUrl };
