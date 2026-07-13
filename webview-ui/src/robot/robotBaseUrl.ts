export function normalizeRobotHttpBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) return window.location.origin;
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//iu.test(trimmed) ? trimmed : `http://${trimmed}`;
  return withProtocol.endsWith('/') ? withProtocol : `${withProtocol}/`;
}

export function normalizeRobotWsBaseUrl(baseUrl: string): string {
  const httpUrl = new URL(normalizeRobotHttpBaseUrl(baseUrl));
  httpUrl.protocol = httpUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  return httpUrl.toString();
}
