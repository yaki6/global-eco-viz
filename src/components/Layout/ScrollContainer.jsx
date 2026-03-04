import { useRef } from 'react';
import { useScrollProgress } from '../../hooks/useScrollProgress';

export default function ScrollContainer({ narrativeSections, chartRenderer }) {
  const sectionRefs = useRef([]);
  const activeSection = useScrollProgress(sectionRefs);

  return (
    <div className="flex min-h-screen">
      {/* Left: narrative text */}
      <div className="w-2/5 pr-8">
        {narrativeSections.map((section, i) => (
          <div
            key={i}
            ref={(el) => (sectionRefs.current[i] = el)}
            className="min-h-screen flex items-center"
          >
            <div className="py-16">{section}</div>
          </div>
        ))}
      </div>
      {/* Right: sticky chart */}
      <div className="w-3/5 relative">
        <div className="sticky top-14 h-[calc(100vh-3.5rem)] flex items-center justify-center p-8">
          {chartRenderer(activeSection)}
        </div>
      </div>
    </div>
  );
}
