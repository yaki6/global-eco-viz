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
    text: `Throughout modern economic history, financial crises have followed a remarkably consistent pattern. Before nearly every major banking crisis, there is a period of rapid credit expansion -- banks lend aggressively, asset prices rise, and optimism pervades the economy. The ratio of private credit to GDP captures this dynamic.`,
    chartMode: 'credit_line',
  },
  {
    title: "Credit and House Prices",
    text: `Credit booms and housing booms are deeply intertwined. As banks extend more mortgage lending, house prices rise; rising house prices increase collateral values, enabling even more lending. This self-reinforcing cycle -- "The Great Mortgaging" -- has become the dominant feature of modern financial systems.`,
    chartMode: 'credit_house',
  },
  {
    title: "The Crisis Aftermath",
    text: `Banking crises are devastating. They typically result in sharp contractions in GDP, rising unemployment, and collapsing asset prices. The shaded bands on the chart mark years of systemic banking crises -- note how they cluster after periods of rapid credit growth, confirming the credit-boom-bust pattern.`,
    chartMode: 'credit_with_crisis',
  },
  {
    title: "Cross-Country Patterns",
    text: `This pattern is not unique to any single country. From Australia's 1893 crisis following a housing credit boom, to the 2008 Global Financial Crisis that swept across the developed world, the credit-boom-bust cycle appears across all 18 countries in our dataset spanning 150 years. Try switching countries to see the pattern repeat.`,
    chartMode: 'house_with_crisis',
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

    const linesMap = {
      credit_line: [
        { key: 'credit_gdp', label: 'Credit/GDP', color: '#0072B2', highlight: true },
      ],
      credit_house: [
        { key: 'credit_gdp', label: 'Credit/GDP', color: '#0072B2', highlight: true },
        { key: 'house_prices', label: 'House Prices', color: '#E69F00' },
      ],
      credit_with_crisis: [
        { key: 'credit_gdp', label: 'Credit/GDP', color: '#0072B2', highlight: true },
      ],
      house_with_crisis: [
        { key: 'credit_gdp', label: 'Credit/GDP', color: '#0072B2', highlight: true },
        { key: 'house_prices', label: 'House Prices', color: '#E69F00' },
      ],
    };

    const showCrisis = mode === 'credit_with_crisis' || mode === 'house_with_crisis';
    const lines = linesMap[mode] || linesMap.credit_line;

    const subtitle = mode === 'credit_house' || mode === 'house_with_crisis'
      ? 'Private credit ratio and nominal house price index'
      : 'Ratio of total loans to non-financial private sector to GDP';

    return (
      <div className="w-full">
        <div className="mb-4">
          <CountrySelector selected={country} onChange={setCountry} />
        </div>
        <ChartContainer
          title={`Private Credit & Housing -- ${country}`}
          subtitle={subtitle}
          source="JST Macrohistory Database R6"
        >
          {({ width, height }) => (
            <LineChart
              width={width}
              height={height}
              data={chartData}
              lines={lines}
              crisisYears={showCrisis ? crisisYears : []}
              yLabel="Credit / GDP Ratio"
            />
          )}
        </ChartContainer>
        {showCrisis && (
          <p className="text-xs text-crisis-red mt-2">
            Shaded bands = systemic banking crisis years (JST classification)
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
