export type DataSource = 'api' | 'mock';

export type FetchResult<T> = {
  data: T;
  source: DataSource;
};

export async function fetchWithFallback<T>(
  fetcher: () => Promise<T | null>,
  fallback: T,
): Promise<FetchResult<T>> {
  try {
    const data = await fetcher();
    if (data) return { data, source: 'api' };
  } catch {
    // fall through to mock
  }
  return { data: fallback, source: 'mock' };
}
