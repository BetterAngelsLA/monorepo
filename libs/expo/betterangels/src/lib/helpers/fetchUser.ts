type TApiUrl = string | undefined;

export default async function fetchUser(apiUrl: TApiUrl) {
  try {
    const response = await fetch(`${apiUrl}/current-user/`, {
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok) {
      return data;
    }
  } catch (e) {
    console.log('Error getting user:', e);
  }
}
