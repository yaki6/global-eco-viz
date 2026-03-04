# Global Economic Visualization - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a scrollytelling React SPA that guides users through 4 economic storylines using JST Macrohistory Database (1870-2020, 18 countries) with interactive D3.js charts.

**Architecture:** Single-page app with left-column narrative text and right-column sticky D3 charts. Intersection Observer triggers chart updates on scroll. Data preprocessed from Excel to JSON via Python. No backend needed.

**Tech Stack:** React 18, Vite, D3.js, Tailwind CSS, Python (openpyxl/pandas for data preprocessing)

---

## Task 1: Data Preprocessing Script

**Files:**
- Create: `scripts/preprocess_data.py`
- Create: `scripts/test_preprocess.py`
- Input: `Research /JST Dataset R6.xlsx`
- Output: `src/data/chapter1.json`, `src/data/chapter2.json`, `src/data/chapter3.json`, `src/data/chapter4.json`

**Step 1: Install dependencies**

Run:
```bash
uv init --no-workspace scripts && cd scripts && uv add pandas openpyxl pytest
```

**Step 2: Write the preprocessing script**

```python
# scripts/preprocess_data.py
"""Convert JST Dataset R6.xlsx into per-chapter JSON files for the frontend."""
import json
import math
import sys
from pathlib import Path

import pandas as pd

EXCEL_PATH = Path(__file__).parent.parent / "Research " / "JST Dataset R6.xlsx"
OUTPUT_DIR = Path(__file__).parent.parent / "src" / "data"

COUNTRIES_18 = [
    "Australia", "Belgium", "Canada", "Switzerland", "Germany", "Denmark",
    "Spain", "Finland", "France", "United Kingdom", "Ireland", "Italy",
    "Japan", "Netherlands", "Norway", "Portugal", "Sweden", "USA"
]

def clean_val(v):
    """Convert NaN/inf to None for JSON serialization."""
    if v is None:
        return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return round(v, 6) if isinstance(v, float) else v

def load_dataframe() -> pd.DataFrame:
    df = pd.read_excel(EXCEL_PATH, sheet_name=0)
    df = df[df["country"].isin(COUNTRIES_18)]
    return df

def build_chapter1(df: pd.DataFrame) -> dict:
    """Credit Cycles & Financial Crises."""
    cols = ["year", "country", "iso", "tloans", "gdp", "crisisJST", "hpnom", "money"]
    subset = df[cols].copy()
    subset["credit_gdp"] = subset["tloans"] / subset["gdp"]

    result = {}
    for country in COUNTRIES_18:
        cdf = subset[subset["country"] == country].sort_values("year")
        result[country] = {
            "years": cdf["year"].tolist(),
            "credit_gdp": [clean_val(v) for v in cdf["credit_gdp"]],
            "crisis": [int(v) if not math.isnan(v) else 0 for v in cdf["crisisJST"]],
            "house_prices": [clean_val(v) for v in cdf["hpnom"]],
            "iso": cdf["iso"].iloc[0] if len(cdf) > 0 else "",
        }
    return result

def build_chapter2(df: pd.DataFrame) -> dict:
    """Rate of Return on Everything."""
    cols = ["year", "country", "iso", "eq_tr", "bond_tr", "housing_tr", "bill_rate",
            "capital_tr", "risky_tr", "safe_tr", "cpi"]
    subset = df[cols].copy()

    result = {}
    for country in COUNTRIES_18:
        cdf = subset[subset["country"] == country].sort_values("year")
        result[country] = {
            "years": cdf["year"].tolist(),
            "equity": [clean_val(v) for v in cdf["eq_tr"]],
            "bonds": [clean_val(v) for v in cdf["bond_tr"]],
            "housing": [clean_val(v) for v in cdf["housing_tr"]],
            "bills": [clean_val(v) for v in cdf["bill_rate"]],
            "capital": [clean_val(v) for v in cdf["capital_tr"]],
            "risky": [clean_val(v) for v in cdf["risky_tr"]],
            "safe": [clean_val(v) for v in cdf["safe_tr"]],
            "cpi": [clean_val(v) for v in cdf["cpi"]],
            "iso": cdf["iso"].iloc[0] if len(cdf) > 0 else "",
        }
    return result

def build_chapter3(df: pd.DataFrame) -> dict:
    """Fiscal Policy & Debt Sustainability."""
    cols = ["year", "country", "iso", "debtgdp", "revenue", "expenditure",
            "gdp", "rgdpmad", "stir", "ltrate", "crisisJST"]
    subset = df[cols].copy()
    subset["rev_gdp"] = subset["revenue"] / subset["gdp"]
    subset["exp_gdp"] = subset["expenditure"] / subset["gdp"]

    result = {}
    for country in COUNTRIES_18:
        cdf = subset[subset["country"] == country].sort_values("year")
        result[country] = {
            "years": cdf["year"].tolist(),
            "debt_gdp": [clean_val(v) for v in cdf["debtgdp"]],
            "revenue_gdp": [clean_val(v) for v in cdf["rev_gdp"]],
            "expenditure_gdp": [clean_val(v) for v in cdf["exp_gdp"]],
            "real_gdp_pc": [clean_val(v) for v in cdf["rgdpmad"]],
            "crisis": [int(v) if not math.isnan(v) else 0 for v in cdf["crisisJST"]],
            "iso": cdf["iso"].iloc[0] if len(cdf) > 0 else "",
        }
    return result

def build_chapter4(df: pd.DataFrame) -> dict:
    """Inflation & Monetary Policy."""
    cols = ["year", "country", "iso", "cpi", "stir", "ltrate",
            "unemp", "wage", "narrowm", "money"]
    subset = df[cols].copy()
    # Compute YoY inflation rate from CPI index
    inflation_series = []
    for country in COUNTRIES_18:
        mask = subset["country"] == country
        cdf = subset[mask].sort_values("year")
        inf = cdf["cpi"].pct_change() * 100
        inflation_series.append(inf)
    subset["inflation"] = pd.concat(inflation_series)

    result = {}
    for country in COUNTRIES_18:
        cdf = subset[subset["country"] == country].sort_values("year")
        result[country] = {
            "years": cdf["year"].tolist(),
            "inflation": [clean_val(v) for v in cdf["inflation"]],
            "short_rate": [clean_val(v) for v in cdf["stir"]],
            "long_rate": [clean_val(v) for v in cdf["ltrate"]],
            "unemployment": [clean_val(v) for v in cdf["unemp"]],
            "wages": [clean_val(v) for v in cdf["wage"]],
            "narrow_money": [clean_val(v) for v in cdf["narrowm"]],
            "broad_money": [clean_val(v) for v in cdf["money"]],
            "iso": cdf["iso"].iloc[0] if len(cdf) > 0 else "",
        }
    return result

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    df = load_dataframe()

    builders = [
        ("chapter1.json", build_chapter1),
        ("chapter2.json", build_chapter2),
        ("chapter3.json", build_chapter3),
        ("chapter4.json", build_chapter4),
    ]

    for filename, builder in builders:
        data = builder(df)
        out_path = OUTPUT_DIR / filename
        with open(out_path, "w") as f:
            json.dump(data, f, separators=(",", ":"))
        size_kb = out_path.stat().st_size / 1024
        print(f"Wrote {filename}: {size_kb:.0f} KB, {len(data)} countries")

if __name__ == "__main__":
    main()
```

**Step 3: Run the script**

Run: `cd /Users/yaqi/Downloads/global_eco_viz && uv run scripts/preprocess_data.py`
Expected: 4 JSON files created in `src/data/`, each containing 18 countries

**Step 4: Verify output**

Run: `ls -la src/data/*.json && python3 -c "import json; d=json.load(open('src/data/chapter1.json')); print(list(d.keys())[:5])"`
Expected: 4 files exist, country names printed

**Step 5: Commit**

```bash
git init && git add scripts/ src/data/ && git commit -m "feat: add data preprocessing script, generate chapter JSON files"
```

---

## Task 2: React + Vite + Tailwind Scaffolding

**Files:**
- Create: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`
- Create: `index.html`, `src/main.jsx`, `src/App.jsx`, `src/index.css`

**Step 1: Initialize project**

Run:
```bash
cd /Users/yaqi/Downloads/global_eco_viz
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss @tailwindcss/vite
npm install d3
```

**Step 2: Configure Tailwind with Vite plugin**

`vite.config.js`:
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

`src/index.css`:
```css
@import "tailwindcss";

@theme {
  --color-navy: #1a365d;
  --color-navy-light: #2a4a7f;
  --color-warm-white: #fafaf5;
  --color-gold: #d69e2e;
  --color-crisis-red: #e53e3e;
  --color-muted-blue: #4a90b8;
  --color-muted-green: #48a872;
  --color-muted-purple: #7b61a8;
  --font-heading: Georgia, Charter, "Times New Roman", serif;
  --font-body: Inter, system-ui, -apple-system, sans-serif;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-warm-white);
  color: #1a202c;
}
```

**Step 3: Create minimal App.jsx**

```jsx
// src/App.jsx
export default function App() {
  return (
    <div className="min-h-screen bg-warm-white">
      <header className="bg-navy text-white py-6 px-8">
        <h1 className="font-heading text-3xl">Global Economic Visualization</h1>
        <p className="text-gray-300 mt-1">150 Years of Macroeconomic History</p>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-lg">Chapters loading...</p>
      </main>
    </div>
  );
}
```

**Step 4: Verify dev server**

Run: `npm run dev`
Expected: App visible at localhost:5173 with navy header

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: scaffold React + Vite + Tailwind project"
```

---

## Task 3: Scroll Infrastructure & Layout

**Files:**
- Create: `src/hooks/useScrollProgress.js`
- Create: `src/components/Layout/Navigation.jsx`
- Create: `src/components/Layout/ScrollContainer.jsx`
- Create: `src/components/Layout/ChapterSection.jsx`
- Modify: `src/App.jsx`

**Step 1: Build useScrollProgress hook**

```jsx
// src/hooks/useScrollProgress.js
import { useState, useEffect, useRef } from 'react';

export function useScrollProgress(sectionRefs) {
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.indexOf(entry.target);
            if (index !== -1) setActiveSection(index);
          }
        });
      },
      { threshold: 0.3 }
    );

    sectionRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [sectionRefs]);

  return activeSection;
}
```

**Step 2: Build Navigation**

```jsx
// src/components/Layout/Navigation.jsx
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
```

**Step 3: Build ScrollContainer (split layout)**

```jsx
// src/components/Layout/ScrollContainer.jsx
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
```

**Step 4: Build ChapterSection wrapper**

```jsx
// src/components/Layout/ChapterSection.jsx
export default function ChapterSection({ id, number, title, children }) {
  return (
    <section id={id} className="border-t border-gray-200 mt-8 pt-8">
      <div className="mb-8">
        <span className="text-gold font-heading text-sm uppercase tracking-wider">
          Chapter {number}
        </span>
        <h2 className="font-heading text-3xl text-navy mt-1">{title}</h2>
      </div>
      {children}
    </section>
  );
}
```

**Step 5: Update App.jsx with layout skeleton**

```jsx
// src/App.jsx
import { useState } from 'react';
import Navigation from './components/Layout/Navigation';
import ChapterSection from './components/Layout/ChapterSection';

const CHAPTERS = [
  { id: 'credit', number: 1, title: 'Credit Cycles & Financial Crises' },
  { id: 'returns', number: 2, title: 'The Rate of Return on Everything' },
  { id: 'fiscal', number: 3, title: 'Fiscal Policy & Debt Sustainability' },
  { id: 'inflation', number: 4, title: 'Inflation & Monetary Policy' },
];

export default function App() {
  const [activeChapter, setActiveChapter] = useState(0);

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
      {/* Chapter stubs */}
      <main className="max-w-7xl mx-auto px-4">
        {CHAPTERS.map((ch) => (
          <ChapterSection key={ch.id} {...ch}>
            <p className="text-gray-500 italic">Content coming soon...</p>
          </ChapterSection>
        ))}
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
```

**Step 6: Verify layout**

Run: `npm run dev`
Expected: Hero + 4 chapter stubs visible, nav sticky at top

**Step 7: Commit**

```bash
git add src/ && git commit -m "feat: add scroll infrastructure, navigation, and chapter layout"
```

---

## Task 4: Core Chart Components (D3 wrappers)

**Files:**
- Create: `src/components/Charts/ChartContainer.jsx`
- Create: `src/components/Charts/LineChart.jsx`
- Create: `src/components/Charts/ScatterPlot.jsx`
- Create: `src/components/Charts/BarChart.jsx`
- Create: `src/components/Charts/CrisisMarkers.jsx`
- Create: `src/components/UI/Tooltip.jsx`
- Create: `src/components/UI/CountrySelector.jsx`
- Create: `src/components/UI/TimeRangeSlider.jsx`

**Step 1: ChartContainer (responsive SVG wrapper)**

```jsx
// src/components/Charts/ChartContainer.jsx
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
```

**Step 2: LineChart component**

```jsx
// src/components/Charts/LineChart.jsx
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const MARGIN = { top: 20, right: 30, bottom: 40, left: 60 };

export default function LineChart({
  width, height, data, xKey = 'year', lines, crisisYears,
  xDomain, yDomain, yLabel, colorScale, showLegend = true,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !data.length || !width) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const w = width - MARGIN.left - MARGIN.right;
    const h = height - MARGIN.top - MARGIN.bottom;
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const x = d3.scaleLinear()
      .domain(xDomain || d3.extent(data, d => d[xKey]))
      .range([0, w]);

    const allVals = lines.flatMap(l => data.map(d => d[l.key]).filter(v => v != null));
    const y = d3.scaleLinear()
      .domain(yDomain || [Math.min(0, d3.min(allVals)), d3.max(allVals) * 1.1])
      .range([h, 0]);

    // Crisis bands
    if (crisisYears) {
      crisisYears.forEach(yr => {
        g.append('rect')
          .attr('x', x(yr) - 1).attr('y', 0)
          .attr('width', Math.max(2, x(yr + 1) - x(yr)))
          .attr('height', h)
          .attr('fill', '#e53e3e').attr('opacity', 0.15);
      });
    }

    // Gridlines
    g.append('g').attr('class', 'grid')
      .attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickSize(-h).tickFormat(''))
      .selectAll('line').attr('stroke', '#e2e8f0');

    // Axes
    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).tickFormat(d3.format('d')));
    g.append('g').call(d3.axisLeft(y).ticks(6));

    if (yLabel) {
      g.append('text').attr('transform', 'rotate(-90)')
        .attr('y', -45).attr('x', -h / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#718096').attr('font-size', '12px')
        .text(yLabel);
    }

    // Lines
    lines.forEach((lineConfig) => {
      const lineData = data.filter(d => d[lineConfig.key] != null);
      const line = d3.line()
        .x(d => x(d[xKey]))
        .y(d => y(d[lineConfig.key]))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(lineData)
        .attr('fill', 'none')
        .attr('stroke', lineConfig.color || '#4a90b8')
        .attr('stroke-width', lineConfig.highlight ? 2.5 : 1.5)
        .attr('opacity', lineConfig.highlight ? 1 : 0.7)
        .attr('d', line);
    });

    // Legend
    if (showLegend && lines.length > 1) {
      const legend = g.append('g').attr('transform', `translate(${w - 150}, 0)`);
      lines.forEach((l, i) => {
        const row = legend.append('g').attr('transform', `translate(0, ${i * 18})`);
        row.append('line').attr('x1', 0).attr('x2', 20)
          .attr('stroke', l.color).attr('stroke-width', 2);
        row.append('text').attr('x', 25).attr('y', 4)
          .attr('font-size', '11px').attr('fill', '#4a5568')
          .text(l.label);
      });
    }
  }, [data, width, height, lines, crisisYears, xKey, xDomain, yDomain, yLabel, showLegend]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

**Step 3: ScatterPlot component**

```jsx
// src/components/Charts/ScatterPlot.jsx
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const MARGIN = { top: 20, right: 30, bottom: 50, left: 60 };

export default function ScatterPlot({
  width, height, data, xKey, yKey, xLabel, yLabel,
  colorKey, colorScale, radiusKey, showTrend = false,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !data.length || !width) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const w = width - MARGIN.left - MARGIN.right;
    const h = height - MARGIN.top - MARGIN.bottom;
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const filtered = data.filter(d => d[xKey] != null && d[yKey] != null);

    const x = d3.scaleLinear()
      .domain(d3.extent(filtered, d => d[xKey])).nice()
      .range([0, w]);
    const y = d3.scaleLinear()
      .domain(d3.extent(filtered, d => d[yKey])).nice()
      .range([h, 0]);

    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(8));
    g.append('g').call(d3.axisLeft(y).ticks(6));

    if (xLabel) {
      g.append('text').attr('x', w / 2).attr('y', h + 40)
        .attr('text-anchor', 'middle').attr('fill', '#718096')
        .attr('font-size', '12px').text(xLabel);
    }
    if (yLabel) {
      g.append('text').attr('transform', 'rotate(-90)')
        .attr('y', -45).attr('x', -h / 2)
        .attr('text-anchor', 'middle').attr('fill', '#718096')
        .attr('font-size', '12px').text(yLabel);
    }

    // Dots
    g.selectAll('circle').data(filtered).enter()
      .append('circle')
      .attr('cx', d => x(d[xKey]))
      .attr('cy', d => y(d[yKey]))
      .attr('r', d => radiusKey ? Math.max(2, Math.sqrt(d[radiusKey]) * 2) : 4)
      .attr('fill', d => colorKey && colorScale ? colorScale(d[colorKey]) : '#4a90b8')
      .attr('opacity', 0.6)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5);

    // Trend line
    if (showTrend && filtered.length > 5) {
      const xMean = d3.mean(filtered, d => d[xKey]);
      const yMean = d3.mean(filtered, d => d[yKey]);
      const num = d3.sum(filtered, d => (d[xKey] - xMean) * (d[yKey] - yMean));
      const den = d3.sum(filtered, d => (d[xKey] - xMean) ** 2);
      const slope = num / den;
      const intercept = yMean - slope * xMean;
      const xExt = d3.extent(filtered, d => d[xKey]);

      g.append('line')
        .attr('x1', x(xExt[0])).attr('y1', y(intercept + slope * xExt[0]))
        .attr('x2', x(xExt[1])).attr('y2', y(intercept + slope * xExt[1]))
        .attr('stroke', '#e53e3e').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6,3').attr('opacity', 0.7);
    }
  }, [data, width, height, xKey, yKey, xLabel, yLabel, colorKey, colorScale, radiusKey, showTrend]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

**Step 4: BarChart component**

```jsx
// src/components/Charts/BarChart.jsx
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const MARGIN = { top: 20, right: 20, bottom: 60, left: 60 };

export default function BarChart({
  width, height, data, categoryKey, valueKeys, colors, yLabel,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !data.length || !width) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const w = width - MARGIN.left - MARGIN.right;
    const h = height - MARGIN.top - MARGIN.bottom;
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const categories = data.map(d => d[categoryKey]);
    const x0 = d3.scaleBand().domain(categories).range([0, w]).padding(0.2);
    const x1 = d3.scaleBand().domain(valueKeys.map(v => v.key)).range([0, x0.bandwidth()]).padding(0.05);

    const allVals = valueKeys.flatMap(v => data.map(d => d[v.key]).filter(Boolean));
    const y = d3.scaleLinear().domain([0, d3.max(allVals) * 1.1]).range([h, 0]);

    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x0))
      .selectAll('text').attr('transform', 'rotate(-40)').style('text-anchor', 'end');
    g.append('g').call(d3.axisLeft(y).ticks(6));

    if (yLabel) {
      g.append('text').attr('transform', 'rotate(-90)')
        .attr('y', -45).attr('x', -h / 2)
        .attr('text-anchor', 'middle').attr('fill', '#718096')
        .attr('font-size', '12px').text(yLabel);
    }

    data.forEach(d => {
      valueKeys.forEach(v => {
        if (d[v.key] == null) return;
        g.append('rect')
          .attr('x', x0(d[categoryKey]) + x1(v.key))
          .attr('y', y(d[v.key]))
          .attr('width', x1.bandwidth())
          .attr('height', h - y(d[v.key]))
          .attr('fill', v.color);
      });
    });

    // Legend
    const legend = g.append('g').attr('transform', `translate(${w - 120}, 0)`);
    valueKeys.forEach((v, i) => {
      const row = legend.append('g').attr('transform', `translate(0, ${i * 18})`);
      row.append('rect').attr('width', 12).attr('height', 12).attr('fill', v.color);
      row.append('text').attr('x', 16).attr('y', 10)
        .attr('font-size', '11px').attr('fill', '#4a5568').text(v.label);
    });
  }, [data, width, height, categoryKey, valueKeys, yLabel]);

  return <svg ref={svgRef} width={width} height={height} />;
}
```

**Step 5: UI Components**

```jsx
// src/components/UI/CountrySelector.jsx
const COUNTRIES = [
  { name: 'Australia', iso: 'AUS' }, { name: 'Belgium', iso: 'BEL' },
  { name: 'Canada', iso: 'CAN' }, { name: 'Switzerland', iso: 'CHE' },
  { name: 'Germany', iso: 'DEU' }, { name: 'Denmark', iso: 'DNK' },
  { name: 'Spain', iso: 'ESP' }, { name: 'Finland', iso: 'FIN' },
  { name: 'France', iso: 'FRA' }, { name: 'United Kingdom', iso: 'GBR' },
  { name: 'Ireland', iso: 'IRL' }, { name: 'Italy', iso: 'ITA' },
  { name: 'Japan', iso: 'JPN' }, { name: 'Netherlands', iso: 'NLD' },
  { name: 'Norway', iso: 'NOR' }, { name: 'Portugal', iso: 'PRT' },
  { name: 'Sweden', iso: 'SWE' }, { name: 'USA', iso: 'USA' },
];

export default function CountrySelector({ selected, onChange, multi = false }) {
  if (multi) {
    return (
      <div className="flex flex-wrap gap-1.5 my-3">
        {COUNTRIES.map(c => (
          <button
            key={c.name}
            onClick={() => {
              const next = selected.includes(c.name)
                ? selected.filter(s => s !== c.name)
                : [...selected, c.name];
              onChange(next);
            }}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              selected.includes(c.name)
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-gray-600 border-gray-300 hover:border-navy'
            }`}
          >
            {c.iso}
          </button>
        ))}
      </div>
    );
  }

  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:border-navy focus:outline-none"
    >
      {COUNTRIES.map(c => (
        <option key={c.name} value={c.name}>{c.name}</option>
      ))}
    </select>
  );
}

export { COUNTRIES };
```

```jsx
// src/components/UI/Tooltip.jsx
export default function Tooltip({ x, y, visible, children }) {
  if (!visible) return null;
  return (
    <div
      className="absolute pointer-events-none bg-white border border-gray-200 rounded shadow-lg px-3 py-2 text-sm z-50"
      style={{ left: x + 10, top: y - 10 }}
    >
      {children}
    </div>
  );
}
```

**Step 6: Verify chart renders**

Add a test chart to App.jsx temporarily, check it renders in dev server.

**Step 7: Commit**

```bash
git add src/components/ src/hooks/ && git commit -m "feat: add D3 chart components and UI controls"
```

---

## Task 5: Chapter 1 - Credit Cycles & Financial Crises

**Files:**
- Create: `src/chapters/Chapter1_CreditCrisis.jsx`
- Create: `src/hooks/useChartData.js`
- Modify: `src/App.jsx`

**Step 1: Data loading hook**

```jsx
// src/hooks/useChartData.js
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
```

**Step 2: Build Chapter 1**

```jsx
// src/chapters/Chapter1_CreditCrisis.jsx
import { useState, useMemo } from 'react';
import { useChartData } from '../hooks/useChartData';
import ChartContainer from '../components/Charts/ChartContainer';
import LineChart from '../components/Charts/LineChart';
import CountrySelector from '../components/UI/CountrySelector';
import ChapterSection from '../components/Layout/ChapterSection';
import ScrollContainer from '../components/Layout/ScrollContainer';

const NARRATIVE = [
  {
    title: "The Credit Boom Pattern",
    text: `Throughout modern economic history, financial crises have followed a remarkably consistent pattern. Before nearly every major banking crisis, there is a period of rapid credit expansion — banks lend aggressively, asset prices rise, and optimism pervades the economy.`,
    chartMode: 'credit_line',
  },
  {
    title: "When Credit Outpaces GDP",
    text: `The ratio of private credit to GDP is one of the most reliable early warning signals for financial crises. When this ratio rises sharply — meaning bank lending grows much faster than the overall economy — the risk of a subsequent crisis increases dramatically.`,
    chartMode: 'credit_line',
  },
  {
    title: "The Crisis Aftermath",
    text: `Banking crises are devastating. They typically result in sharp contractions in GDP, rising unemployment, and collapsing asset prices. The red bands on the chart mark years of systemic banking crises — note how they cluster after periods of rapid credit growth.`,
    chartMode: 'credit_with_crisis',
  },
  {
    title: "Cross-Country Patterns",
    text: `This pattern is not unique to any single country. From Australia's 1893 crisis following a housing credit boom, to the 2008 Global Financial Crisis that swept across the developed world, the credit-boom-bust cycle appears across all 18 countries in our dataset spanning 150 years.`,
    chartMode: 'credit_with_crisis',
  },
];

export default function Chapter1() {
  const { data, loading } = useChartData('/data/chapter1.json');
  const [country, setCountry] = useState('USA');

  const chartData = useMemo(() => {
    if (!data || !data[country]) return [];
    const c = data[country];
    return c.years.map((yr, i) => ({
      year: yr,
      credit_gdp: c.credit_gdp[i],
      crisis: c.crisis[i],
      house_prices: c.house_prices[i],
    }));
  }, [data, country]);

  const crisisYears = useMemo(() => {
    return chartData.filter(d => d.crisis === 1).map(d => d.year);
  }, [chartData]);

  if (loading) return <div className="py-20 text-center text-gray-400">Loading data...</div>;

  const narrativeSections = NARRATIVE.map((section, i) => (
    <div key={i}>
      <h3 className="font-heading text-xl text-navy mb-3">{section.title}</h3>
      <p className="text-gray-700 leading-relaxed text-lg">{section.text}</p>
    </div>
  ));

  const renderChart = (activeIndex) => {
    const mode = NARRATIVE[activeIndex]?.chartMode || 'credit_line';
    const showCrisis = mode === 'credit_with_crisis';

    return (
      <div className="w-full">
        <div className="mb-4">
          <CountrySelector selected={country} onChange={setCountry} />
        </div>
        <ChartContainer
          title={`Private Credit / GDP — ${country}`}
          subtitle="Ratio of total loans to non-financial private sector to GDP"
          source="JST Macrohistory Database R6"
        >
          {({ width, height }) => (
            <LineChart
              width={width}
              height={height}
              data={chartData}
              lines={[
                { key: 'credit_gdp', label: 'Credit/GDP', color: '#4a90b8', highlight: true },
              ]}
              crisisYears={showCrisis ? crisisYears : []}
              yLabel="Credit / GDP Ratio"
            />
          )}
        </ChartContainer>
        {showCrisis && (
          <p className="text-xs text-crisis-red mt-2">
            Red bands = systemic banking crisis years
          </p>
        )}
      </div>
    );
  };

  return (
    <ChapterSection id="credit" number={1} title="Credit Cycles & Financial Crises">
      <ScrollContainer
        narrativeSections={narrativeSections}
        chartRenderer={renderChart}
      />
    </ChapterSection>
  );
}
```

**Step 3: Wire into App.jsx**

Import Chapter1 and replace the stub.

**Step 4: Copy JSON data to public dir**

Run: `cp src/data/chapter*.json public/data/`

**Step 5: Verify in browser**

Run: `npm run dev`
Expected: Chapter 1 renders with scrolling text + updating chart, country selector works

**Step 6: Commit**

```bash
git add src/ public/ && git commit -m "feat: implement Chapter 1 - Credit Cycles & Financial Crises"
```

---

## Task 6: Chapter 2 - The Rate of Return on Everything

**Files:**
- Create: `src/chapters/Chapter2_ReturnsOnEverything.jsx`

**Step 1: Build Chapter 2**

Similar structure to Chapter 1 but with:
- Multi-line chart comparing equity, bonds, housing, bills returns
- Bar chart showing average returns by asset class
- Country selector + nominal/real toggle
- Narrative about risk premium and long-run asset allocation

**Key chart**: Cumulative $1 growth chart showing how $1 invested in 1870 in each asset class would have grown.

**Step 2: Verify and commit**

---

## Task 7: Chapter 3 - Fiscal Policy & Debt Sustainability

**Files:**
- Create: `src/chapters/Chapter3_FiscalDebt.jsx`

**Step 1: Build Chapter 3**

- Area chart: Debt-to-GDP ratio over 150 years
- Line chart: Revenue/GDP vs Expenditure/GDP
- Narrative about wartime debt accumulation, peacetime consolidation
- Multi-country comparison mode

**Step 2: Verify and commit**

---

## Task 8: Chapter 4 - Inflation & Monetary Policy

**Files:**
- Create: `src/chapters/Chapter4_InflationMonetary.jsx`

**Step 1: Build Chapter 4**

- Scatter plot: Unemployment vs Inflation (Phillips curve)
- Dual-line chart: Inflation rate vs short-term interest rate
- Decade selector to animate Phillips curve shifts
- Narrative about monetary policy transmission

**Step 2: Verify and commit**

---

## Task 9: Polish & Responsive Design

**Files:**
- Modify: All chapter and component files
- Modify: `src/index.css`

**Steps:**
1. Add mobile responsive breakpoints (stack layout on small screens)
2. Add smooth chart transitions with D3 `.transition()`
3. Add hover tooltips on all data points
4. Add equation callouts in narrative text (e.g., Phillips curve equation)
5. Add loading states and error boundaries
6. Verify all 4 chapters work end-to-end
7. Commit

---

## Task 10: End-to-End Testing with Playwright

**Files:**
- Create: `tests/e2e/chapters.spec.js`

**Steps:**
1. Install Playwright: `npm init playwright@latest`
2. Write tests for:
   - Page loads with hero and 4 chapter sections
   - Navigation links scroll to correct chapters
   - Country selector changes chart data
   - Charts render SVG elements
   - Responsive layout works on mobile viewport
3. Run: `npx playwright test`
4. Commit

---

## Summary

| Task | Description | Est. Complexity |
|------|-------------|-----------------|
| 1 | Data preprocessing (Python) | Medium |
| 2 | React + Vite + Tailwind scaffolding | Low |
| 3 | Scroll infrastructure & layout | Medium |
| 4 | Core D3 chart components | High |
| 5 | Chapter 1: Credit Cycles | High |
| 6 | Chapter 2: Returns on Everything | High |
| 7 | Chapter 3: Fiscal & Debt | Medium |
| 8 | Chapter 4: Inflation & Monetary | High |
| 9 | Polish & responsive | Medium |
| 10 | E2E testing | Medium |
