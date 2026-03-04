import { useState, useMemo } from 'react';
import { useChartData } from '../hooks/useChartData';
import ChartContainer from '../components/Charts/ChartContainer';
import LineChart from '../components/Charts/LineChart';
import ScatterPlot from '../components/Charts/ScatterPlot';
import CountrySelector from '../components/UI/CountrySelector';
import ChapterSection from '../components/Layout/ChapterSection';
import ScrollContainer from '../components/Layout/ScrollContainer';

const DECADES = [
  { label: '1950s-60s', start: 1950, end: 1970 },
  { label: '1970s-80s', start: 1970, end: 1990 },
  { label: '1990s-2000s', start: 1990, end: 2010 },
  { label: '2010s-20s', start: 2010, end: 2021 },
];

const NARRATIVE = [
  {
    title: "Inflation Through the Ages",
    text: `Inflation is one of the most politically charged economic phenomena. Over 150 years, the advanced economies have experienced everything from ruinous hyperinflation to prolonged deflation. The chart shows how inflation rates have evolved, with the most dramatic episodes clustered around the two World Wars and the 1970s oil shocks.`,
    chartMode: 'inflation_line',
  },
  {
    title: "The Phillips Curve",
    text: `In 1958, A.W. Phillips documented an inverse relationship between unemployment and wage inflation -- the famous Phillips Curve. When unemployment is low, workers have bargaining power and wages rise; when it's high, inflation moderates. But this relationship has shifted dramatically over time.`,
    chartMode: 'phillips',
  },
  {
    title: "Monetary Policy and Interest Rates",
    text: `Central banks use short-term interest rates as their primary policy tool. When inflation rises, they raise rates to cool the economy; when recession threatens, they cut rates to stimulate growth. The relationship between inflation and the short-term interest rate reveals how actively central banks manage the economy.`,
    chartMode: 'rates',
  },
  {
    title: "The Great Moderation and Beyond",
    text: `From the mid-1980s to 2007, advanced economies enjoyed a period known as the "Great Moderation" -- low, stable inflation and reduced economic volatility. Some attributed this to improved monetary policy; others to structural changes in the global economy. The 2008 crisis and COVID-19 pandemic have tested this stability.`,
    chartMode: 'inflation_line',
  },
];

export default function Chapter4() {
  const { data, loading } = useChartData('/data/chapter4.json');
  const [country, setCountry] = useState('USA');
  const [decadeIdx, setDecadeIdx] = useState(0);

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
    return chartData.filter(d =>
      d.year >= decade.start && d.year < decade.end &&
      d.unemployment != null && d.inflation != null
    );
  }, [chartData, decadeIdx]);

  if (loading) return <div className="py-20 text-center text-gray-400">Loading data...</div>;

  const narrativeSections = NARRATIVE.map((section, i) => (
    <div key={i}>
      <h3 className="font-heading text-xl text-navy mb-3">{section.title}</h3>
      <p className="text-gray-700 leading-relaxed text-lg">{section.text}</p>
    </div>
  ));

  const renderChart = (activeIndex) => {
    const mode = NARRATIVE[activeIndex]?.chartMode || 'inflation_line';

    if (mode === 'phillips') {
      return (
        <div className="w-full">
          <div className="mb-4 flex items-center gap-4">
            <CountrySelector selected={country} onChange={setCountry} />
            <div className="flex gap-1">
              {DECADES.map((d, i) => (
                <button
                  key={d.label}
                  onClick={() => setDecadeIdx(i)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    decadeIdx === i
                      ? 'bg-navy text-white border-navy'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-navy'
                  }`}
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
                showTrend={true}
              />
            )}
          </ChartContainer>
        </div>
      );
    }

    if (mode === 'rates') {
      return (
        <div className="w-full">
          <div className="mb-4">
            <CountrySelector selected={country} onChange={setCountry} />
          </div>
          <ChartContainer
            title={`Inflation & Interest Rates -- ${country}`}
            subtitle="Inflation rate vs short-term and long-term interest rates"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                data={chartData}
                lines={[
                  { key: 'inflation', label: 'Inflation', color: '#e53e3e', highlight: true },
                  { key: 'short_rate', label: 'Short Rate', color: '#4a90b8' },
                  { key: 'long_rate', label: 'Long Rate', color: '#7b61a8' },
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
        <div className="mb-4">
          <CountrySelector selected={country} onChange={setCountry} />
        </div>
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
                { key: 'inflation', label: 'Inflation (%)', color: '#e53e3e', highlight: true },
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
