type TApiUrl = string | undefined;

export default async function fetchUser(apiUrl: TApiUrl) {
  try {
    const response = await fetch(`${apiUrl}/current-user/`, {
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok) {
      return data;
    } else {
      console.log('Failed to fetch user data:', response);
    }
  } catch (e) {
    console.log('Error getting user:', e);
  }
}
