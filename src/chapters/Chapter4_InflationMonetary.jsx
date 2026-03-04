import { useState, useMemo } from 'react';
import * as d3 from 'd3';
import { useChartData } from '../hooks/useChartData';
import ChartContainer from '../components/Charts/ChartContainer';
import LineChart from '../components/Charts/LineChart';
import ScatterPlot from '../components/Charts/ScatterPlot';
import CountrySelector from '../components/UI/CountrySelector';
import CompareControls, { getCompareColor } from '../components/UI/CompareControls';
import ChapterSection from '../components/Layout/ChapterSection';
import ScrollContainer from '../components/Layout/ScrollContainer';

const DECADES = [
  { label: '1950s-60s', start: 1950, end: 1970, color: '#0072B2' },
  { label: '1970s-80s', start: 1970, end: 1990, color: '#E69F00' },
  { label: '1990s-2000s', start: 1990, end: 2010, color: '#009E73' },
  { label: '2010s-20s', start: 2010, end: 2021, color: '#CC79A7' },
];

const NARRATIVE = [
  {
    title: "Inflation Through the Ages",
    text: `Inflation is one of the most politically charged economic phenomena. Over 150 years, the advanced economies have experienced everything from ruinous hyperinflation to prolonged deflation. The chart shows how inflation rates have evolved, with the most dramatic episodes clustered around the two World Wars and the 1970s oil shocks.`,
    chartMode: 'inflation_line',
  },
  {
    title: "The Phillips Curve Across Monetary Regimes",
    text: `In 1958, A.W. Phillips documented an inverse relationship between unemployment and wage inflation. But this relationship has shifted dramatically across monetary regimes -- from the gold standard, to Bretton Woods, to fiat money. Each dot is one year; colors represent different eras. The slope and position of the relationship changes as monetary policy frameworks evolve.`,
    chartMode: 'phillips',
  },
  {
    title: "Interest Rates: The Price of Money",
    text: `Central banks use short-term interest rates as their primary policy tool. When inflation rises, they raise rates to cool the economy; when recession threatens, they cut rates. The charts below show inflation alongside the short-term rate and long-term rate separately, revealing how policy transmission works.`,
    chartMode: 'rates_inflation',
  },
  {
    title: "The Great Moderation and Beyond",
    text: `From the mid-1980s to 2007, advanced economies enjoyed the "Great Moderation" -- low, stable inflation and reduced economic volatility. The 2008 crisis and COVID-19 pandemic have tested this stability, pushing central banks to adopt unconventional tools like zero rates and quantitative easing.`,
    chartMode: 'rates_long',
  },
];

export default function Chapter4() {
  const { data, loading } = useChartData('/data/chapter4.json');
  const [country, setCountry] = useState('USA');
  const [decadeIdx, setDecadeIdx] = useState(1);
  const [compareMode, setCompareMode] = useState(false);
  const [countries, setCountries] = useState([]);
  const [offsets, setOffsets] = useState({});

  const chartData = useMemo(() => {
    if (!data || !data[country]) return [];
    const c = data[country];
    return c.years.map((yr, i) => ({
      year: yr,
      inflation: c.inflation[i],
      short_rate: c.short_rate[i],
      long_rate: c.long_rate[i],
      unemployment: c.unemployment[i],
    }));
  }, [data, country]);

  const phillipsData = useMemo(() => {
    const decade = DECADES[decadeIdx];
    return chartData
      .filter(d =>
        d.year >= decade.start && d.year < decade.end &&
        d.unemployment != null && d.inflation != null
      )
      .map(d => ({ ...d, decadeColor: decade.color }));
  }, [chartData, decadeIdx]);

  const decadeColorScale = useMemo(() => {
    return d3.scaleOrdinal()
      .domain(DECADES.map(d => d.color))
      .range(DECADES.map(d => d.color));
  }, []);

  const buildCompareLines = (metricKey, metricLabel) => {
    if (!data || !compareMode || countries.length === 0) return null;
    return countries.map((c, i) => {
      const countryData = data[c];
      if (!countryData) return null;
      const offset = offsets[c] || 0;
      const shiftedData = countryData.years.map((yr, j) => ({
        year: yr + offset,
        [metricKey]: countryData[metricKey][j],
      }));
      return {
        key: metricKey,
        label: `${c} ${offset !== 0 ? `(${offset > 0 ? '+' : ''}${offset}yr)` : ''}`,
        color: getCompareColor(i),
        highlight: true,
        data: shiftedData,
      };
    }).filter(Boolean);
  };

  if (loading) return <div className="py-20 text-center text-gray-400">Loading data...</div>;

  const narrativeSections = NARRATIVE.map((section, i) => (
    <div key={i}>
      <h3 className="font-heading text-xl text-navy mb-3">{section.title}</h3>
      <p className="text-gray-700 leading-relaxed text-lg">{section.text}</p>
    </div>
  ));

  const renderChart = (activeIndex) => {
    const mode = NARRATIVE[activeIndex]?.chartMode || 'inflation_line';

    // Phillips curve doesn't support compare overlay
    if (mode === 'phillips') {
      return (
        <div className="w-full">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <CountrySelector selected={country} onChange={setCountry} />
            <div className="flex gap-1">
              {DECADES.map((d, i) => (
                <button
                  key={d.label}
                  onClick={() => setDecadeIdx(i)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    decadeIdx === i
                      ? 'text-white border-transparent'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-navy'
                  }`}
                  style={decadeIdx === i ? { backgroundColor: d.color } : {}}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <ChartContainer
            title={`Phillips Curve -- ${country} (${DECADES[decadeIdx].label})`}
            subtitle="Unemployment vs Inflation"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <ScatterPlot
                width={width}
                height={height}
                data={phillipsData}
                xKey="unemployment"
                yKey="inflation"
                xLabel="Unemployment Rate (%)"
                yLabel="Inflation Rate (%)"
                colorKey="decadeColor"
                colorScale={decadeColorScale}
                showTrend={true}
              />
            )}
          </ChartContainer>
          <p className="text-xs text-gray-500 mt-2 italic">
            Caveat: Pre-WWII unemployment data uses different methodology and definitions
            across countries. Cross-era comparisons should be interpreted with caution.
          </p>
        </div>
      );
    }

    // Compare mode for line chart modes
    if (compareMode && countries.length > 0) {
      let metricKey, title, yLabel;
      if (mode === 'rates_inflation') {
        metricKey = 'short_rate'; title = 'Short-Term Rate -- Compare'; yLabel = 'Rate (%)';
      } else if (mode === 'rates_long') {
        metricKey = 'long_rate'; title = 'Long-Term Rate -- Compare'; yLabel = 'Rate (%)';
      } else {
        metricKey = 'inflation'; title = 'Inflation Rate -- Compare'; yLabel = 'Inflation Rate (%)';
      }
      const compareLines = buildCompareLines(metricKey, title) || [];

      return (
        <div className="w-full">
          <CompareControls
            compareMode={compareMode}
            onToggleCompare={() => setCompareMode(false)}
            countries={countries}
            onCountriesChange={setCountries}
            offsets={offsets}
            onOffsetsChange={setOffsets}
            singleCountry={country}
            onSingleCountryChange={setCountry}
          />
          <ChartContainer
            title={title}
            subtitle="Overlay multiple countries (use offset to time-shift)"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                data={[]}
                lines={compareLines}
                yLabel={yLabel}
              />
            )}
          </ChartContainer>
        </div>
      );
    }

    // Single country modes
    if (mode === 'rates_inflation') {
      return (
        <div className="w-full">
          <CompareControls
            compareMode={compareMode}
            onToggleCompare={() => setCompareMode(true)}
            countries={countries}
            onCountriesChange={setCountries}
            offsets={offsets}
            onOffsetsChange={setOffsets}
            singleCountry={country}
            onSingleCountryChange={setCountry}
          />
          <ChartContainer
            title={`Inflation & Short-Term Rate -- ${country}`}
            subtitle="CPI inflation vs central bank policy rate"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                data={chartData}
                lines={[
                  { key: 'inflation', label: 'Inflation', color: '#d35f5f', highlight: true },
                  { key: 'short_rate', label: 'Short Rate', color: '#0072B2' },
                ]}
                yLabel="Rate (%)"
              />
            )}
          </ChartContainer>
        </div>
      );
    }

    if (mode === 'rates_long') {
      return (
        <div className="w-full">
          <CompareControls
            compareMode={compareMode}
            onToggleCompare={() => setCompareMode(true)}
            countries={countries}
            onCountriesChange={setCountries}
            offsets={offsets}
            onOffsetsChange={setOffsets}
            singleCountry={country}
            onSingleCountryChange={setCountry}
          />
          <ChartContainer
            title={`Long-Term Rate & Inflation -- ${country}`}
            subtitle="Government bond yield vs CPI inflation"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                data={chartData}
                lines={[
                  { key: 'inflation', label: 'Inflation', color: '#d35f5f', highlight: true },
                  { key: 'long_rate', label: 'Long Rate', color: '#E69F00' },
                ]}
                yLabel="Rate (%)"
              />
            )}
          </ChartContainer>
        </div>
      );
    }

    // inflation_line
    return (
      <div className="w-full">
        <CompareControls
          compareMode={compareMode}
          onToggleCompare={() => setCompareMode(true)}
          countries={countries}
          onCountriesChange={setCountries}
          offsets={offsets}
          onOffsetsChange={setOffsets}
          singleCountry={country}
          onSingleCountryChange={setCountry}
        />
        <ChartContainer
          title={`Inflation Rate -- ${country}`}
          subtitle="Year-over-year change in consumer prices"
          source="JST Macrohistory Database R6"
        >
          {({ width, height }) => (
            <LineChart
              width={width}
              height={height}
              data={chartData}
              lines={[
                { key: 'inflation', label: 'Inflation (%)', color: '#d35f5f', highlight: true },
              ]}
              yLabel="Inflation Rate (%)"
            />
          )}
        </ChartContainer>
      </div>
    );
  };

  return (
    <ChapterSection id="inflation" number={4} title="Inflation & Monetary Policy">
      <ScrollContainer
        narrativeSections={narrativeSections}
        chartRenderer={renderChart}
      />
    </ChapterSection>
  );
}
