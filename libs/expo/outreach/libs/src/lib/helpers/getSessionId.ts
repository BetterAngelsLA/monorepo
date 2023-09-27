export default function getSessionId(text: string) {
  const cookies = text.split(', ');
  const sessionIdCookie = cookies.find((cookie) =>
    cookie.startsWith('sessionid=')
  );
  const sessionId = sessionIdCookie
    ? sessionIdCookie.split(';')[0].split('=')[1]
    : '';

  return {
    sessionId,
  };
}
