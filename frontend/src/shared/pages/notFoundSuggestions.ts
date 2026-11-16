// Only implemented, publicly reachable destinations belong in the recovery list.
export const recoveryRoutes = [
  { path: '/login', label: 'Đăng nhập' },
  { path: '/register', label: 'Đăng ký' },
] as const;

export function editDistance(left: string, right: string): number {
  let row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i++) {
    const next = [i];
    for (let j = 1; j <= right.length; j++) {
      next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return row[right.length];
}

export function getRecoverySuggestions(pathname: string) {
  const normalized = pathname.toLowerCase();
  return recoveryRoutes.map(route => {
    const distance = editDistance(normalized, route.path);
    return { ...route, distance, match: 1 - distance / Math.max(normalized.length, route.path.length, 1) };
  }).sort((a, b) => a.distance - b.distance || a.path.localeCompare(b.path));
}
