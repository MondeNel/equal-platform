import { useState, useEffect, useCallback } from 'react';
import { statsAPI } from '../services/api';

export function usePlayerStats(userId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const res = await statsAPI.get();
      setStats(res.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch player stats:', err);
      setError('Failed to load streak');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
