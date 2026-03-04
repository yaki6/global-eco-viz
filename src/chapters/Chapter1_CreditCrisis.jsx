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
    text: `Throughout modern economic history, financial crises have followed a remarkably consistent pattern. Before nearly every major banking crisis, there is a period of rapid credit expansion -- banks lend aggressively, asset prices rise, and optimism pervades the economy.`,
    chartMode: 'credit_line',
  },
  {
    title: "When Credit Outpaces GDP",
    text: `The ratio of private credit to GDP is one of the most reliable early warning signals for financial crises. When this ratio rises sharply -- meaning bank lending grows much faster than the overall economy -- the risk of a subsequent crisis increases dramatically.`,
    chartMode: 'credit_line',
  },
  {
    title: "The Crisis Aftermath",
    text: `Banking crises are devastating. They typically result in sharp contractions in GDP, rising unemployment, and collapsing asset prices. The red bands on the chart mark years of systemic banking crises -- note how they cluster after periods of rapid credit growth.`,
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
          title={`Private Credit / GDP -- ${country}`}
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
