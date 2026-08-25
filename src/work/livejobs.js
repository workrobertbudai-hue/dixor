/**
 * LIVEJOBS - eleo allasok a szerverrol (/api/jobs).
 * Ha nincs szerver/adat, null-t ad vissza -> a UI mock-ra esik vissza.
 */

let cache = { at: 0, data: null };

export async function fetchLiveJobs(force = false) {
  const now = Date.now();
  if (!force && cache.data && now - cache.at < 5 * 60 * 1000) return cache.data;
  try {
    const base = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
      ? 'http://localhost:3001' : '';
    const res = await fetch(base + '/api/jobs', { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (json && Array.isArray(json.jobs) && json.jobs.length > 0) {
      cache = { at: now, data: json };
      return json;
    }
    return cache.data || null;
  } catch {
    return cache.data || null;
  }
}