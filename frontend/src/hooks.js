import { useCallback, useEffect, useState } from 'react';
import api from './api';

/** Ambil data paginasi Laravel; otomatis reload saat params berubah. */
export function useList(url, params) {
  const [res, setRes] = useState({ data: [], current_page: 1, last_page: 1, total: 0, from: 0, to: 0 });
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(params);

  const load = useCallback(() => {
    setLoading(true);
    return api.get(url, { params }).then((r) => setRes(r.data)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, key]);

  useEffect(() => { load(); }, [load]);

  return { ...res, loading, reload: load };
}

export function useDebounced(value, ms = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
