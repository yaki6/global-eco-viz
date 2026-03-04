# Data Visualization Design Review
## Global Economic Visualization — JST Macrohistory Database

**Reviewer**: dataviz-expert
**Date**: 2026-03-04
**Documents reviewed**: `2026-03-04-global-eco-viz-design.md`, `2026-03-04-global-eco-viz-implementation.md`

---

## Executive Summary

The design demonstrates solid foundations in academic-style data visualization with thoughtful chart type selection for most chapters. However, there are significant gaps in interactive features, accessibility, and D3 code quality that need to be addressed before this can be considered production-ready. The scrollytelling architecture is sound, but the implementation plan reveals several critical missing features — particularly hover tooltips, animated transitions, and responsive behavior — that are deferred to Task 9 rather than integrated from the start.

**Overall rating**: 3.5 / 5 — Good foundation, needs significant polish on interactions and accessibility.

---

## 1. Chart Type Appropriateness

### Chapter 1: Credit Cycles & Financial Crises ✅ Strong

The credit-to-GDP line chart with crisis band overlays is the correct choice here. This is a canonical visualization from the JST literature itself, and the decision to use vertical red bands rather than point markers for crisis years is pedagogically sound — crises span multiple years and the bands correctly convey duration.

**Concerns:**
- The design calls for "hover tooltip: Crisis narrative from JST Crisis Chronology" but the implementation plan's LineChart component has no tooltip plumbing whatsoever. The `Tooltip.jsx` component exists but is never wired into `LineChart.jsx`. This is a critical gap.
- House prices (`hpnom`) are preprocessed into the JSON but never visualized in Chapter 1. This is a missed opportunity — the classic credit-housing boom nexus is central to the JST research narrative and would strengthen the story considerably.
- The `money` variable is also included in the data but unused. Either use it or remove it from the JSON to reduce payload.

### Chapter 2: Rate of Return on Everything ✅ Well-chosen

The three-chart suite (multi-line returns, average bar chart, cumulative growth) is excellent and directly mirrors the Jorda-Schularick-Taylor (2019) "Rate of Return on Everything" paper's core visualizations. The $1-invested-in-1870 compound growth chart is the single most compelling visualization in the entire project — it makes abstract return differences viscerally understandable.

**Concerns:**
- The nominal/real toggle is essential and correctly planned, but the implementation is deferred to Task 6 with only "Similar structure to Chapter 1" guidance. The real-return calculation (deflating by CPI) needs to be done correctly — compound deflation, not simple subtraction.
- With 4 asset classes (equity, bonds, housing, bills), the multi-line chart risks becoming a "spaghetti chart." Consider a default view with only 2 lines (risky vs safe) and optional expansion to all 4.
- The bar chart for average returns should use error bars (standard deviation or 95% CI) to convey the uncertainty around long-run averages. Raw averages without dispersion are misleading for asset returns.

### Chapter 3: Fiscal Policy & Debt Sustainability ⚠️ Partial mismatch

The area chart for debt-to-GDP is appropriate. However:

- The **scatter plot** of debt-to-GDP vs GDP growth rate is problematic as described. A scatter of contemporaneous debt and growth confounds correlation with causation and will produce the well-known Reinhart-Rogoff-style chart that has been extensively debated. For an academic-textbook audience, this needs careful framing or should be replaced with a time-lagged version (debt at t vs growth at t+1/t+5).
- The **stacked bar** for revenue/expenditure composition is a good choice but the design says "stacked bar: Revenue vs expenditure composition." With only two components (revenue and expenditure), a simple grouped bar or even a surplus/deficit area chart would be more informative and visually cleaner.
- War period highlighting is mentioned in interactions but has no corresponding data variable in the preprocessing. There is no `war` flag in the JST dataset columns used — this would need to be hardcoded as date ranges (WW1: 1914-1918, WW2: 1939-1945).

### Chapter 4: Inflation & Monetary Policy ✅ Good but needs care

The Phillips curve scatter is the right chart for this story. The decade-animation approach is exactly how economists teach the breakdown of the Phillips curve relationship post-1970s — this is pedagogically excellent.

**Concerns:**
- The dual-axis line chart (CPI inflation vs short-term interest rate) is a classic but **dual axes are a known perceptual trap** per Cairo and Few. Different scales on the same chart can visually imply false correlations or obscure real ones. Consider using a small-multiples approach (two separate panels sharing the x-axis) instead.
- The `unemployment` variable (`unemp`) has significant missing data for earlier decades in several countries. The scatter plot will be sparse pre-1950, which needs acknowledgment in the narrative or via visual treatment of data gaps.
- The inflation calculation in the preprocessing script uses `.pct_change()` which correctly computes YoY changes from the CPI index. This is correct.

---

## 2. Color Palette — Colorblind Accessibility Analysis

### Current palette
```
Navy:        #1a365d
Warm white:  #fafaf5
Gold:        #d69e2e
Crisis red:  #e53e3e
Muted blue:  #4a90b8
Muted green: #48a872
Muted purple: #7b61a8
```

### Colorblindness simulation analysis

**Deuteranopia (red-green, most common, ~6% of males)**:
- `#e53e3e` (crisis red) and `#48a872` (muted green) will be **nearly indistinguishable** for deuteranopes. This is a critical problem — if crisis markers and any "positive" indicators ever appear on the same chart, users with deuteranopia cannot distinguish them.
- `#4a90b8` (muted blue) and `#7b61a8` (muted purple) will appear very similar under protanopia.

**Recommended fixes:**
- Replace `#e53e3e` crisis red with `#d35f5f` or, better, use a **pattern fill** (diagonal hatching) for crisis bands rather than relying solely on color.
- For multi-line charts with 4 asset classes, use a colorblind-safe palette: `#0072B2` (blue), `#E69F00` (orange), `#009E73` (teal), `#CC79A7` (pink) — the Wong 8-color palette designed specifically for colorblindness.
- Add a text annotation or direct labeling alongside each line rather than relying solely on legend colors.

**Contrast ratios (WCAG AA requires 4.5:1 for normal text):**
- Navy `#1a365d` on warm white `#fafaf5`: ~12:1 ✅ Excellent
- Gold `#d69e2e` on warm white: ~2.8:1 ❌ Fails WCAG AA for body text. Reserve gold for decorative use only (chapter numbers, dividers), not for data labels or body text.
- Gray `#718096` used for axis labels in D3 code: ~4.6:1 on white ✅ Barely passes

---

## 3. D3 Code Quality & React Integration

### Critical issues

**Issue 1: Missing dependency array items in useEffect**

In `LineChart.jsx`:
```jsx
useEffect(() => { ... }, [data, width, height, lines, crisisYears, xKey, xDomain, yDomain, yLabel, showLegend]);
```

The `lines` array is passed as a prop — if the parent re-renders and creates a new array reference (even with same contents), this will trigger unnecessary D3 redraws. Lines should be memoized with `useMemo` in the parent component.

**Issue 2: No D3 transitions — abrupt chart updates**

Every `useEffect` calls `svg.selectAll('*').remove()` and rebuilds the entire chart. This is the "nuclear option" for React-D3 integration. It works but produces jarring visual jumps when country or scroll state changes. The design doc mentions "animated transitions" but these are deferred to Task 9 — they should be built in from the start.

Recommended pattern:
```jsx
// Instead of svg.selectAll('*').remove()
// Use enter/update/exit pattern:
const lines = g.selectAll('.line').data(lineConfigs);
lines.enter().append('path').attr('class', 'line')
  .merge(lines)
  .transition().duration(500)
  .attr('d', lineGenerator);
lines.exit().remove();
```

**Issue 3: No mouse interaction on SVG elements**

The `LineChart.jsx` renders paths and rects but attaches zero event listeners. There are no `.on('mouseover')`, `.on('mousemove')`, or `.on('mouseout')` handlers anywhere. The `Tooltip.jsx` component exists but is wired to nothing. This means the entire tooltip system is non-functional as designed.

Minimum viable tooltip pattern for LineChart:
```jsx
// Add a transparent overlay rect for mouse tracking
g.append('rect')
  .attr('width', w).attr('height', h)
  .attr('fill', 'none').attr('pointer-events', 'all')
  .on('mousemove', (event) => {
    const [mx] = d3.pointer(event);
    const year = Math.round(x.invert(mx));
    // find nearest data point and call onHover callback
  })
  .on('mouseout', () => onHover(null));
```

**Issue 4: Inconsistent MARGIN conventions**

`MARGIN` is hardcoded differently in each component:
- LineChart: `{ top: 20, right: 30, bottom: 40, left: 60 }`
- ScatterPlot: `{ top: 20, right: 30, bottom: 50, left: 60 }`
- BarChart: `{ top: 20, right: 20, bottom: 60, left: 60 }`

This will produce visually inconsistent chart proportions across chapters. Define a shared `DEFAULT_MARGIN` in a constants file and allow per-chart overrides.

**Issue 5: ScatterPlot uses legacy `.enter()` pattern**

```jsx
g.selectAll('circle').data(filtered).enter().append('circle')
```

This D3 v4 pattern fails to update existing circles on re-render (only handles the enter selection). Use `.join('circle')` (D3 v6+) which handles enter/update/exit in one call:
```jsx
g.selectAll('circle').data(filtered).join('circle')
  .attr('cx', d => x(d[xKey]))
  // ...
```

**Issue 6: ChartContainer aspect ratio is wrong for some charts**

```jsx
setDimensions({ width, height: Math.min(width * 0.65, 500) });
```

A 0.65 aspect ratio (roughly 3:2) is good for line charts but poor for the Phillips curve scatter plot, which should be closer to 1:1 (square) to avoid compressing the relationship. ChartContainer should accept an `aspectRatio` prop.

**Issue 7: BarChart ignores negative values**

```jsx
const y = d3.scaleLinear().domain([0, d3.max(allVals) * 1.1]).range([h, 0]);
```

The fiscal chapter will have negative values when `expenditure > revenue` (deficit). This hardcoded `0` minimum will clip negative bars entirely. The domain should be:
```jsx
.domain([Math.min(0, d3.min(allVals)), d3.max(allVals) * 1.1])
```

### React integration pattern assessment

The chosen pattern (D3 owns the SVG, React manages state) is one of three viable approaches and is appropriate for complex charts. However, the implementation is missing the standard guard against stale closures — all D3 effects should cleanup properly and the `svgRef.current` null-check should be explicit:

```jsx
useEffect(() => {
  if (!svgRef.current || !data?.length || !width) return;
  // ...
}, [dependencies]);
```

---

## 4. Scrollytelling Interaction Design

### What works well
- The split 40/60 layout (narrative left, sticky chart right) is the canonical scrollytelling pattern, validated by NYT, The Pudding, and Observable.
- Using `IntersectionObserver` rather than `window.scroll` events is the modern, performant approach.
- The `threshold: 0.3` on the observer means sections trigger at 30% visibility — reasonable for desktop.

### Critical gaps

**Gap 1: No scroll progress within a section**

The current design only fires when a section enters/exits (binary). For Chapter 4's Phillips curve animation, which needs to animate through decades, we need continuous scroll progress (0 to 1) within a section. The `useScrollProgress` hook as designed cannot drive animations.

Recommended addition:
```jsx
// Track progress within active section (0-1)
const [sectionProgress, setSectionProgress] = useState(0);
```
This requires either a separate scroll listener or an enhanced IntersectionObserver with multiple thresholds.

**Gap 2: Mobile layout not considered**

The `ScrollContainer` hardcodes `w-2/5` and `w-3/5` layout with no responsive breakpoints. On mobile (< 768px), this 2-column layout will produce unusably narrow columns. The mobile pattern for scrollytelling should stack: full-width chart at top (non-sticky), narrative text scrolls below.

Tailwind fix:
```jsx
<div className="flex flex-col md:flex-row min-h-screen">
  <div className="w-full md:w-2/5 ...">
  <div className="w-full md:w-3/5 ...">
    <div className="md:sticky top-14 ...">
```

**Gap 3: No section transition state**

When `activeSection` changes, the chart switches abruptly with no visual continuity cue. A brief fade or cross-fade between chart states would significantly improve perceived quality.

**Gap 4: Chapter 1 has 4 narrative sections but only 2 chart modes**

`chartMode: 'credit_line'` covers sections 0 and 1, `'credit_with_crisis'` covers 2 and 3. There is no visual differentiation between sections within the same chart mode — the chart looks identical for sections 0 and 1. Either add more chart modes or add animated callouts/annotations that highlight different aspects of the same chart.

---

## 5. Missing Features

### Critical missing features (must-have)

| Feature | Current status | Impact |
|---------|---------------|--------|
| Hover tooltips on data points | Tooltip.jsx exists but unwired | High — data exploration is impossible without |
| Touch/mobile interactions | Not designed | High — mobile users cannot interact |
| D3 transitions between states | Deferred to Task 9 | High — without transitions, updates look broken |
| Keyboard navigation | Not mentioned anywhere | Medium — accessibility requirement |
| Loading skeleton UI | Only "Loading data..." text | Low-Medium |

### Important missing features (should-have)

| Feature | Gap |
|---------|-----|
| Error boundaries | No error handling if JSON fetch fails |
| Zero-line annotation | Missing on credit/debt charts — the baseline matters |
| Period annotations | WW1/WW2/Great Depression markers planned but no data variable exists |
| Trend line for scatter | `showTrend` prop exists in ScatterPlot but unused in chapter code |
| Y-axis gridlines | Only bottom gridlines; horizontal gridlines for line charts are standard |
| Chart download/share | Common user expectation for data viz |

### Enhancement opportunities (nice-to-have)

- **Small multiples**: For country comparison in Chapters 1 and 3, a small-multiples grid of 18 sparklines would be more powerful than a dropdown selector
- **Brushing**: Time range selection via a brush on a minimap below the main chart
- **Annotation layer**: D3 annotation library (susielu/d3-annotation) for labeling specific historical events (1929 crash, 1971 Nixon shock, 2008 GFC)

---

## 6. Chart Annotation Opportunities

The following historical moments should have explicit text annotations on the charts:

### Chapter 1 (Credit/GDP)
- **1893**: Australian banking crisis (most dramatic pre-WWI credit bust)
- **1929-1933**: Great Depression (near-universal crisis across all 18 countries)
- **1990-1991**: Nordic banking crisis (Sweden/Finland — extreme credit-to-GDP peaks)
- **2007-2009**: Global Financial Crisis (largest post-WWII credit expansion + bust)

### Chapter 2 (Returns)
- **1914-1918**: WWI bond destruction (government defaults/inflation erased real returns)
- **1944**: Bretton Woods establishment (marks structural change in bond/currency regime)
- **1973**: Oil shock + stagflation (equity underperformance, housing outperforms)
- **1982**: Volcker disinflation (beginning of the "great bond bull market")
- **2000**: Dot-com peak (equity vs housing divergence becomes clear here)

### Chapter 3 (Fiscal/Debt)
- **1914-1918** and **1939-1945**: War financing peaks (debt-to-GDP spikes)
- **1945-1980**: The "great deleveraging" (most countries reduce debt from 100%+ to <50%)
- **2010**: European debt crisis (divergence between Germany and periphery)

### Chapter 4 (Inflation)
- **1971**: Nixon shock / end of gold standard (inflation regime change)
- **1973-1974**: First oil crisis (inflation spike visible across all countries)
- **1979-1983**: Volcker shock (interest rates spiked to 20% in the US — Phillips curve shift)
- **1990s-2000s**: "Great Moderation" (low inflation despite low unemployment — Phillips curve flattens)

Recommended implementation: Use the `susielu/d3-annotation` library rather than raw D3 text appends. It handles label collision avoidance and produces much cleaner academic-style annotations.

---

## 7. "Academic Textbook" Visual Style Assessment

### What is executed well
- **Color palette**: Navy + warm white + gold is a classic academic design choice, reminiscent of Princeton/Chicago Press economics textbook aesthetics. The warm white background avoids clinical sterility.
- **Typography choices**: Georgia for headings + Inter for body is an excellent pairing — readable, authoritative, not pretentious.
- **Minimal gridlines**: The design calls for "minimal gridlines, direct labeling" which aligns with Tufte's data-ink ratio principles.
- **Source attribution**: Footer attribution and per-chart source lines are good academic practice.
- **Chapter structure**: The numbered chapter with gold "Chapter N" label over navy heading is well-executed and clearly evokes textbook structure.

### What is missing to fully achieve the academic style
- **Equation callouts**: The design doc mentions "equation callouts where relevant" but there is zero implementation. For the Phillips curve (Chapter 4), a rendered equation `π = π^e - β(u - u*)` would be a significant enhancement. Use KaTeX or MathJax.
- **Footnotes**: Academic texts have footnotes. The design mentions them but they are absent from the implementation plan.
- **Figure captions**: Charts have titles and subtitles but no "Figure 1.1: Private credit to GDP ratio..." style academic captions with methodology notes.
- **Cross-references**: "As shown in Figure 3.2..." style narrative references that tie the text to specific chart states.
- **Data table option**: Academic papers always include the option to see the underlying data. A small "View data" toggle that shows a sortable table alongside the chart would reinforce the textbook feel.

---

## 8. Mobile & Responsive Considerations

### Current state: Effectively non-functional on mobile

The layout as specified will be severely broken on mobile:

1. **Fixed 40/60 column split** at all screen sizes: On a 375px wide iPhone, the left column would be ~150px wide — too narrow for readable text.
2. **Sticky chart panel** with `h-[calc(100vh-3.5rem)]`: On mobile, this means the chart takes up almost the full viewport height, leaving no room for the narrative below.
3. **Navigation overflow**: The tab nav with 4 long chapter names will overflow on mobile, though `overflow-x-auto` is used — this produces a horizontal scroll that is easy to miss.
4. **Touch tooltips**: Hover tooltips are inaccessible on touch devices. Touch should trigger tooltip on first tap, dismiss on second tap or tap elsewhere.

### Recommended responsive strategy

**Mobile (< 768px)**:
- Single column layout
- Chart appears at top, pinned/sticky for a short scroll range (not full chapter)
- Narrative text scrolls normally below
- Chapter nav becomes a hamburger menu or horizontal scroll pill tabs

**Tablet (768px - 1024px)**:
- 35/65 split (slightly wider chart panel)
- Reduce chart font sizes

**Desktop (> 1024px)**:
- Current 40/60 design as specified

**Implementation**: Add Tailwind responsive prefixes throughout `ScrollContainer.jsx` and consider a separate `MobileScrollContainer.jsx` component for the simplified mobile layout.

---

## 9. Specific D3 Code Improvements

### High priority fixes

```jsx
// 1. Add bisector-based hover tracking to LineChart
const bisect = d3.bisector(d => d.year).left;
const overlay = g.append('rect')
  .attr('width', w).attr('height', h)
  .attr('fill', 'transparent')
  .attr('cursor', 'crosshair');

overlay.on('mousemove', (event) => {
  const [mx] = d3.pointer(event);
  const year = x.invert(mx);
  const idx = bisect(data, year, 1);
  const d0 = data[idx - 1], d1 = data[idx];
  const d = year - d0?.year > d1?.year - year ? d1 : d0;
  if (d && onHover) onHover({ year: d.year, ...lines.reduce((acc, l) => ({ ...acc, [l.key]: d[l.key] }), {}) });
}).on('mouseout', () => onHover && onHover(null));

// 2. Replace enter-only pattern with join()
g.selectAll('circle').data(filtered)
  .join(
    enter => enter.append('circle').attr('opacity', 0).call(c => c.transition().attr('opacity', 0.6)),
    update => update.call(u => u.transition().duration(300).attr('cx', d => x(d[xKey])).attr('cy', d => y(d[yKey]))),
    exit => exit.call(e => e.transition().attr('opacity', 0).remove())
  );

// 3. Shared constants file
// src/utils/chartConstants.js
export const CHART_MARGIN = { top: 20, right: 30, bottom: 45, left: 65 };
export const TRANSITION_DURATION = 400;
export const CRISIS_COLOR = '#d35f5f';  // accessible crisis red
export const WONG_PALETTE = ['#0072B2', '#E69F00', '#009E73', '#CC79A7', '#56B4E9', '#D55E00', '#F0E442'];
```

### Medium priority improvements

```jsx
// 4. Area chart for debt (Chapter 3) — use d3.area() not line
const area = d3.area()
  .x(d => x(d.year))
  .y0(h)
  .y1(d => y(d.debt_gdp))
  .defined(d => d.debt_gdp != null)
  .curve(d3.curveMonotoneX);

g.append('path').datum(data)
  .attr('class', 'area')
  .attr('fill', '#4a90b8')
  .attr('opacity', 0.3)
  .attr('d', area);

// Then overlay the line on top for clarity
// This gives the "area under the curve" feel appropriate for debt accumulation

// 5. Cumulative return calculation for Chapter 2 (must handle nulls)
function cumulativeReturn(returns) {
  let cumulative = 1;
  return returns.map(r => {
    if (r == null) return null;
    cumulative *= (1 + r);
    return cumulative;
  });
}
// Note: this must restart after null gaps, not carry forward
```

---

## 10. Summary Recommendations by Priority

### Must fix before launch
1. Wire `Tooltip.jsx` into all chart components with bisector-based mouse tracking
2. Fix `BarChart` to handle negative values (fiscal deficits)
3. Add responsive breakpoints to `ScrollContainer.jsx` (mobile is broken)
4. Replace deprecated `.enter()` with `.join()` in `ScatterPlot.jsx`
5. Replace crisis red `#e53e3e` with a colorblind-accessible alternative or add pattern fills
6. Add D3 transitions to `LineChart` and `ScatterPlot` (currently jarring)
7. Memoize `lines` prop arrays in parent components to prevent unnecessary redraws

### Should add for quality
1. Historical period annotations (WW1, WW2, GFC, Volcker) using `d3-annotation`
2. Small-multiples view for country comparison
3. Touch tooltip interaction for mobile
4. Error boundary around each chapter component
5. Zero-line annotation on all charts where zero is meaningful
6. KaTeX equation rendering for Phillips curve and debt dynamics equation

### Nice to have for academic feel
1. Figure captions with methodology notes
2. Footnote system for sourcing specific data points
3. "View underlying data" table toggle
4. Chart download button (SVG or PNG via `canvas` export)
5. URL state management (country/chapter in hash) for shareability
