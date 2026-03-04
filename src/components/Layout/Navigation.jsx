const CHAPTERS = [
  { id: 'credit', label: 'Credit Cycles & Crises' },
  { id: 'returns', label: 'Rate of Return on Everything' },
  { id: 'fiscal', label: 'Fiscal Policy & Debt' },
  { id: 'inflation', label: 'Inflation & Monetary Policy' },
];

export default function Navigation({ activeChapter }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-navy text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14">
        <span className="font-heading text-lg mr-8 whitespace-nowrap">Global Eco Viz</span>
        <div className="flex gap-1 overflow-x-auto">
          {CHAPTERS.map((ch, i) => (
            <a
              key={ch.id}
              href={`#${ch.id}`}
              className={`px-3 py-1.5 rounded text-sm whitespace-nowrap transition-colors ${
                activeChapter === i
                  ? 'bg-white/20 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {i + 1}. {ch.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
