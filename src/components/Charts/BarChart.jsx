import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const MARGIN = { top: 20, right: 20, bottom: 60, left: 60 };

export default function BarChart({
  width, height, data, categoryKey, valueKeys, yLabel,
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
