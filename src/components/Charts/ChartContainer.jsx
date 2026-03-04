import { useRef, useState, useEffect } from 'react';

export default function ChartContainer({ children, title, subtitle, source }) {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;
      setDimensions({ width, height: Math.min(width * 0.65, 500) });
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      {title && (
        <div className="mb-3">
          <h3 className="font-heading text-xl text-navy">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      {children(dimensions)}
      {source && (
        <p className="text-xs text-gray-400 mt-2 italic">Source: {source}</p>
      )}
    </div>
  );
}
