export default async function fetchUser(sessionId?: string) {
  const headers: HeadersInit = new Headers();

  if (sessionId) {
    headers.append('Cookie', `sessionid=${sessionId}`);
  }

  try {
    const response = await fetch('http://localhost:8000/user', {
      headers: headers,
    });

    if (response.ok) {
      const userData = await response.json();
      return userData;
    } else {
      console.log('Failed to fetch user data:', response.statusText);
    }
  } catch (e) {
    console.log('Error getting user:', e);
  }
}
