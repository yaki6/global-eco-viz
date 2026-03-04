import { useState, useRef, useEffect } from 'react';
import Navigation from './components/Layout/Navigation';
import Chapter1 from './chapters/Chapter1_CreditCrisis';
import Chapter2 from './chapters/Chapter2_ReturnsOnEverything';
import Chapter3 from './chapters/Chapter3_FiscalDebt';
import Chapter4 from './chapters/Chapter4_InflationMonetary';

const CHAPTER_IDS = ['credit', 'returns', 'fiscal', 'inflation'];

export default function App() {
  const [activeChapter, setActiveChapter] = useState(0);
  const chapterRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = chapterRefs.current.indexOf(entry.target);
            if (index !== -1) setActiveChapter(index);
          }
        });
      },
      { threshold: 0.1 }
    );

    chapterRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-warm-white">
      <Navigation activeChapter={activeChapter} />
      {/* Hero */}
      <header className="pt-14">
        <div className="bg-navy text-white py-20 px-8 text-center">
          <h1 className="font-heading text-5xl mb-4">
            Global Economic Visualization
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Explore 150 years of macroeconomic history across 18 countries.
            Scroll through interactive storylines to discover the patterns
            that shape our economies.
          </p>
          <p className="text-sm text-gray-400 mt-6">
            Data: Jorda-Schularick-Taylor Macrohistory Database (Release 6, 1870-2020)
          </p>
        </div>
      </header>
      {/* Chapters */}
      <main className="max-w-7xl mx-auto px-4">
        <div ref={(el) => (chapterRefs.current[0] = el)}>
          <Chapter1 />
        </div>
        <div ref={(el) => (chapterRefs.current[1] = el)}>
          <Chapter2 />
        </div>
        <div ref={(el) => (chapterRefs.current[2] = el)}>
          <Chapter3 />
        </div>
        <div ref={(el) => (chapterRefs.current[3] = el)}>
          <Chapter4 />
        </div>
      </main>
      {/* Footer */}
      <footer className="bg-navy text-gray-400 text-sm py-8 px-8 text-center mt-20">
        <p>
          Data source: Oscar Jorda, Moritz Schularick, and Alan M. Taylor. 2017.
          &ldquo;Macrofinancial History and the New Business Cycle Facts.&rdquo;
        </p>
        <p className="mt-1">Licensed under CC BY-NC-SA 4.0</p>
      </footer>
    </div>
  );
}
