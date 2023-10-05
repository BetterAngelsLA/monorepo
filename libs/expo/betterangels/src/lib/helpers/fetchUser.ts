import { Platform } from 'react-native';

export default async function fetchUser(sessionId?: string) {
  const headers: HeadersInit = new Headers();

  // Set the Cookie header for mobile platforms
  if (Platform.OS !== 'web' && sessionId) {
    headers.append('Cookie', `sessionid=${sessionId}`);
  }

  try {
    const response = await fetch('http://127.0.0.1:8000/current-user/', {
      headers: headers,
      credentials: Platform.OS === 'web' ? 'include' : undefined,
    });

    const data = await response.json();
    console.log(data);
    if (response.ok) {
      const userData = await response.json();
      console.log('User Data:', userData);
      return userData;
    } else {
      console.log('Failed to fetch user data:', response.statusText);
    }
  } catch (e) {
    console.log('Error getting user:', e);
  }
}
