import { useState, useMemo } from 'react';
import { useChartData } from '../hooks/useChartData';
import ChartContainer from '../components/Charts/ChartContainer';
import LineChart from '../components/Charts/LineChart';
import BarChart from '../components/Charts/BarChart';
import CountrySelector from '../components/UI/CountrySelector';
import ChapterSection from '../components/Layout/ChapterSection';
import ScrollContainer from '../components/Layout/ScrollContainer';

const NARRATIVE = [
  {
    title: "The Rate of Return on Everything",
    text: `What if you had invested $1 in 1870? The answer depends enormously on the asset class you chose. Equities, housing, bonds, and bills have delivered vastly different returns over the past 150 years -- and the differences compound into staggering gaps over time.`,
    chartMode: 'multi_line',
  },
  {
    title: "Equities: The Long-Run Winner",
    text: `Equity markets have consistently delivered the highest long-run returns across all 18 countries in our dataset. Despite devastating crashes -- the Great Depression, the dot-com bust, the 2008 financial crisis -- stocks have always recovered and continued to grow over the long run.`,
    chartMode: 'multi_line',
  },
  {
    title: "Housing: The Overlooked Asset",
    text: `One of the most surprising findings from the JST dataset is that housing has delivered returns comparable to equities, but with significantly lower volatility. Residential real estate has been a remarkably stable wealth generator across countries and centuries.`,
    chartMode: 'multi_line',
  },
  {
    title: "The Risk Premium Puzzle",
    text: `The gap between risky asset returns (equities + housing) and safe asset returns (bonds + bills) is called the risk premium. Across 150 years and 18 countries, this premium has averaged 4-5% per year -- a consistent reward for bearing risk.`,
    chartMode: 'bar_compare',
  },
];

const ASSET_COLORS = {
  equity: '#e53e3e',
  housing: '#48a872',
  bonds: '#4a90b8',
  bills: '#d69e2e',
};

export default function Chapter2() {
  const { data, loading } = useChartData('/data/chapter2.json');
  const [country, setCountry] = useState('USA');

  const chartData = useMemo(() => {
    if (!data || !data[country]) return [];
    const c = data[country];
    return c.years.map((yr, i) => ({
      year: yr,
      equity: c.equity[i],
      housing: c.housing[i],
      bonds: c.bonds[i],
      bills: c.bills[i],
      risky: c.risky[i],
      safe: c.safe[i],
    }));
  }, [data, country]);

  const barData = useMemo(() => {
    if (!data) return [];
    // Compute average returns across all countries for each asset class
    const assets = ['equity', 'housing', 'bonds', 'bills'];
    return assets.map(asset => {
      const allVals = Object.values(data).flatMap(c =>
        c[asset === 'equity' ? 'equity' : asset === 'housing' ? 'housing' : asset === 'bonds' ? 'bonds' : 'bills']
          .filter(v => v != null)
      );
      const mean = allVals.reduce((s, v) => s + v, 0) / allVals.length;
      return {
        asset: asset.charAt(0).toUpperCase() + asset.slice(1),
        avgReturn: Math.round(mean * 10000) / 100,
      };
    });
  }, [data]);

  if (loading) return <div className="py-20 text-center text-gray-400">Loading data...</div>;

  const narrativeSections = NARRATIVE.map((section, i) => (
    <div key={i}>
      <h3 className="font-heading text-xl text-navy mb-3">{section.title}</h3>
      <p className="text-gray-700 leading-relaxed text-lg">{section.text}</p>
    </div>
  ));

  const renderChart = (activeIndex) => {
    const mode = NARRATIVE[activeIndex]?.chartMode || 'multi_line';

    if (mode === 'bar_compare') {
      return (
        <div className="w-full">
          <ChartContainer
            title="Average Annual Returns by Asset Class"
            subtitle="Mean across all 18 countries, 1870-2020"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <BarChart
                width={width}
                height={height}
                data={barData}
                categoryKey="asset"
                valueKeys={[
                  { key: 'avgReturn', label: 'Avg Return (%)', color: '#4a90b8' },
                ]}
                yLabel="Average Annual Return (%)"
              />
            )}
          </ChartContainer>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="mb-4">
          <CountrySelector selected={country} onChange={setCountry} />
        </div>
        <ChartContainer
          title={`Asset Returns -- ${country}`}
          subtitle="Annual total returns by asset class"
          source="JST Macrohistory Database R6"
        >
          {({ width, height }) => (
            <LineChart
              width={width}
              height={height}
              data={chartData}
              lines={[
                { key: 'equity', label: 'Equities', color: ASSET_COLORS.equity, highlight: true },
                { key: 'housing', label: 'Housing', color: ASSET_COLORS.housing },
                { key: 'bonds', label: 'Bonds', color: ASSET_COLORS.bonds },
                { key: 'bills', label: 'Bills', color: ASSET_COLORS.bills },
              ]}
              yLabel="Annual Return"
            />
          )}
        </ChartContainer>
      </div>
    );
  };

  return (
    <ChapterSection id="returns" number={2} title="The Rate of Return on Everything">
      <ScrollContainer
        narrativeSections={narrativeSections}
        chartRenderer={renderChart}
      />
    </ChapterSection>
  );
}
