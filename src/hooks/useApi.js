import { useState, useEffect } from 'react';
import { ApiClient } from '../services/api.js';

export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await ApiClient.get(url, options);
        
        if (response.success && response.data) {
          setData(response.data);
        } else {
          setData(response.data || []);
        }
      } catch (err) {
        console.error('useApi error:', err);
        setError(err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
};
