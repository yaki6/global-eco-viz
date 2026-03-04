# Global Economic Visualization - Design Document

**Date**: 2026-03-04
**Dataset**: Jorda-Schularick-Taylor (JST) Macrohistory Database R6 (1870-2020, 18 countries)

## Overview

A single-page scrollytelling React application that guides users through 4 economic "storylines" using interactive D3.js charts. Designed for economics students and the general public, with a textbook/academic visual style.

## Architecture

### Layout
- **Left column (40%)**: Narrative text with educational explanations
- **Right column (60%)**: Sticky D3.js interactive charts that update as user scrolls
- **Top nav**: Chapter anchors for 4 storylines
- **Footer**: Data attribution (JST Database, CC BY-NC-SA 4.0)

### Tech Stack
- React 18 + Vite
- D3.js (wrapped as React components)
- Tailwind CSS (typography, layout, responsive)
- Intersection Observer API (scroll-triggered chart updates)
- Python preprocessing script (Excel -> JSON)

### Data Pipeline
1. Python script reads `JST Dataset R6.xlsx`
2. Outputs 4 lightweight JSON files (one per chapter)
3. Frontend fetches JSON at runtime (no backend needed)

## Chapter 1: Credit Cycles & Financial Crises

**Economic principle**: Credit expansion -> asset bubbles -> systemic banking crises

**Variables used**: `tloans`, `gdp` (credit-to-GDP), `crisisJST`, `hpnom`, `money`

**Visualizations**:
- Line chart: Credit-to-GDP ratio over time per country
- Crisis markers: Vertical bands for banking crisis years
- Hover tooltip: Crisis narrative from JST Crisis Chronology

**User interactions**:
- Select country (dropdown or map)
- Toggle between countries for comparison
- Hover crisis markers for historical context

## Chapter 2: The Rate of Return on Everything

**Economic principle**: Risk premium, long-run asset allocation, housing vs equity returns

**Variables used**: `eq_tr`, `bond_tr`, `housing_tr`, `bill_rate`, `capital_tr`, `risky_tr`, `safe_tr`

**Visualizations**:
- Multi-line chart: Asset class returns over time
- Bar chart: Average returns by asset class and country
- Cumulative return growth chart ($1 invested in 1870)

**User interactions**:
- Select country
- Toggle nominal vs real returns (adjust by CPI)
- Select time range
- Compare risky vs safe assets

## Chapter 3: Fiscal Policy & Debt Sustainability

**Economic principle**: Government debt dynamics, fiscal multipliers, wartime finance

**Variables used**: `debtgdp`, `revenue`, `expenditure`, `gdp`, `rgdpmad`, `stir`, `ltrate`

**Visualizations**:
- Area chart: Debt-to-GDP ratio over 150 years
- Stacked bar: Revenue vs expenditure composition
- Scatter: Debt-to-GDP vs GDP growth rate

**User interactions**:
- Select country
- Compare multiple countries
- Highlight war periods and crisis periods

## Chapter 4: Inflation & Monetary Policy

**Economic principle**: Phillips curve, monetary neutrality, interest rate policy

**Variables used**: `cpi`, `stir`, `ltrate`, `unemp`, `wage`, `narrowm`, `money`

**Visualizations**:
- Scatter plot: Unemployment vs inflation (Phillips curve)
- Dual-axis line: CPI inflation rate vs short-term interest rate
- Animated transitions across decades

**User interactions**:
- Select country and time period
- Animate through decades to see Phillips curve shift
- Toggle between different inflation measures

## Visual Design

- **Color palette**: Deep navy (#1a365d), warm white (#fafaf5), accent gold (#d69e2e), crisis red (#e53e3e)
- **Typography**: Serif for headings (Georgia/Charter), sans-serif for body (Inter)
- **Chart style**: Minimal gridlines, direct labeling, muted colors with one highlight
- **Academic feel**: Footnotes, source citations, equation callouts where relevant

## File Structure

```
global_eco_viz/
  Research/              # Existing data files
  src/
    main.jsx
    App.jsx
    components/
      Layout/
        Navigation.jsx
        ScrollContainer.jsx
        ChapterSection.jsx
      Charts/
        LineChart.jsx
        ScatterPlot.jsx
        BarChart.jsx
        CrisisMarkers.jsx
        ChartContainer.jsx
      UI/
        CountrySelector.jsx
        TimeRangeSlider.jsx
        Tooltip.jsx
    chapters/
      Chapter1_CreditCrisis.jsx
      Chapter2_ReturnsOnEverything.jsx
      Chapter3_FiscalDebt.jsx
      Chapter4_InflationMonetary.jsx
    hooks/
      useScrollProgress.js
      useChartData.js
    data/
      chapter1.json
      chapter2.json
      chapter3.json
      chapter4.json
    utils/
      dataProcessing.js
  scripts/
    preprocess_data.py    # Excel -> JSON conversion
  public/
  index.html
  package.json
  vite.config.js
  tailwind.config.js
```

## Implementation Order

1. Data preprocessing (Python script)
2. Project scaffolding (React + Vite + Tailwind)
3. Core chart components (D3 wrappers)
4. Scroll infrastructure (Intersection Observer + sticky layout)
5. Chapter 1: Credit Cycles (start with one chapter as proof of concept)
6. Chapter 2-4: Remaining chapters
7. Polish: Responsive design, animations, tooltips
8. Testing: Cross-browser, data accuracy verification
