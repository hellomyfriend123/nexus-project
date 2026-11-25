/** Collect every backend page before client-side filtering or table rendering. */
export async function loadAllAdminPages<T>(
  fetchPage: (params: { page: number; size: number }) => Promise<{ content: T[]; totalPages?: number; last?: boolean }>,
  isCurrent: () => boolean = () => true,
): Promise<{ content: T[] }> {
  const content: T[] = [];
  for (let page = 0; ; page += 1) {
    if (!isCurrent()) return { content: [] };
    const result = await fetchPage({ page, size: 100 });
    if (!isCurrent()) return { content: [] };
    if (!result || !Array.isArray(result.content)) throw new Error('Invalid admin page response');
    content.push(...result.content);
    // Prefer explicit metadata: servers may cap the requested page size.
    if (result.last === true || result.content.length === 0) break;
    if (typeof result.totalPages === 'number') {
      if (page + 1 >= result.totalPages) break;
    } else if (result.last !== false && result.content.length < 100) break;
  }
  return { content };
}
