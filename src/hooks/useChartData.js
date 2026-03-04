import { useState, useEffect } from 'react';

const cache = {};

export function useChartData(chapterFile) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cache[chapterFile]) {
      setData(cache[chapterFile]);
      setLoading(false);
      return;
    }
    fetch(chapterFile)
      .then(r => r.json())
      .then(d => {
        cache[chapterFile] = d;
        setData(d);
        setLoading(false);
      });
  }, [chapterFile]);

  return { data, loading };
}
