import { useEffect, useState } from 'react';
import { fetchWithFallback, type DataSource } from '../lib/demo-fetch';

type UseDemoResourceResult<T> = {
  data: T;
  source: DataSource;
  loading: boolean;
  reload: () => void;
};

export function useDemoResource<T>(
  fetcher: () => Promise<T | null>,
  fallback: T,
  deps: unknown[] = [],
): UseDemoResourceResult<T> {
  const [data, setData] = useState<T>(fallback);
  const [source, setSource] = useState<DataSource>('mock');
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void fetchWithFallback(fetcher, fallback).then((result) => {
      if (cancelled) return;
      setData(result.data);
      setSource(result.source);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return {
    data,
    source,
    loading,
    reload: () => setTick((value) => value + 1),
  };
}
