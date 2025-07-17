const apiUrl = import.meta.env.VITE_BETTERANGELS_ADMIN_API_URL;

if (!apiUrl) {
  throw new Error(
    'VITE_BETTERANGELS_ADMIN_API_URL is not defined in your environment variables.'
  );
}

export { apiUrl };
