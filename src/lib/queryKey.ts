export function generateQueryKey(params: Record<string, unknown>): string {
  const sortedEntries = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b));

  return JSON.stringify(sortedEntries);
}
