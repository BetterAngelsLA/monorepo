import { Platform } from 'react-native';

export default async function fetchUser(sessionId?: string) {
  const headers: HeadersInit = new Headers();

  // Set the Cookie header for mobile platforms
  if (Platform.OS !== 'web' && sessionId) {
    headers.append('Cookie', `sessionid=${sessionId}`);
  }

  try {
    const response = await fetch('http://localhost:8000/current-user/', {
      headers: headers,
      credentials: Platform.OS === 'web' ? 'include' : undefined,
    });

    const data = await response.json();
    if (response.ok) {
      return data;
    } else {
      console.log('Failed to fetch user data:', response.statusText);
    }
  } catch (e) {
    console.log('Error getting user:', e);
  }
}
